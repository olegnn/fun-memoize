// @flow
/* eslint-disable prefer-spread */
import WeakMap from 'es6-weak-map';
import mimic from 'mimic-fn';

export const DEFAULT_STORAGE_COUNT = 1e3;
const NO_VALUE = {};
const MAP_IMPLEMENTED = typeof Map === 'function' && typeof Map.prototype.entries === 'function';

type NoValueType = typeof NO_VALUE;
type NonPrimitive = Object | Function;
type Primitive = boolean | string | number | Symbol | null | void;

declare function IsPrimitiveValue(value: NonPrimitive): false;
// eslint-disable-next-line no-redeclare
declare function IsPrimitiveValue(value: Primitive): true;

const isPrimitiveValue: IsPrimitiveValue = value => {
  const type = typeof value;
  return value == null || (type !== 'object' && type !== 'function');
};

type Assoc<K, V> = (
  keyValue: K,
  value: mixed | Storage<V>
) => mixed | Storage<V>;
type Extract<K, V> = (keyValue: K) => mixed | Storage<V>;
type Drop<K> = (keyValue: K) => boolean;

interface StorageInterface<K, V> {
  extract: Extract<K, V>;
  assoc: Assoc<K, V>;
  drop: Drop<K>;
}

type RootInfo = {|
  root: Storage<*> | PrimitiveCacheStorage<*> | WeakCacheStorage<*> | CacheStorage<*>,
  key: mixed
|};

type ContextParams = {| ...Params, storages: Array<RootInfo> |};

class CacheStorage<V> {
  constructor(
    { storageCount = DEFAULT_STORAGE_COUNT, storages }: ContextParams = {},
    rootInfo: RootInfo,
  ) {
    if (rootInfo) {
      if (storages.length >= storageCount) {
        const storageToRemove = storages.shift();
        const { root, key } = storageToRemove;
        root.drop(key);
      }
      storages.push(rootInfo);
    }
  }

  /**
   * @virtual
   *
   */
  drop(...args) {
    throw new Error('Not implemented');
  }

  /**
   * @virtual
   *
   */
  extract(...args) {
    throw new Error('Not implemented');
  }

  /**
   * @virtual
   *
   */
  assoc(...args) {
    throw new Error('Not implemented');
  }

  extractPath(path: Array<Primitive | NonPrimitive>): mixed {
    const { length } = path;
    if (length === 1) {
      return this.extract(path[0]);
    } else {
      let i = 0,
        log = true,
        res = this;
      do {
        res = res.extract(path[i++]);
        log = i < length;
      } while (log && res !== NO_VALUE);
      return log ? NO_VALUE : res;
    }
  }

  setPath(path: Array<Primitive | NonPrimitive>, value: mixed, params: ContextParams): mixed {
    const { length } = path;
    if (length === 1) {
      return this.assoc(path[0], value);
    } else {
      let i = 0,
        cache = this,
        next = void 0;
      do {
        const current = path[i++];
        next = cache.extract(current);
        if (next instanceof CacheStorage) {
          cache = next;
        } else {
          if (isPrimitiveValue(current))
            next = new Storage(params, { root: cache, key: current });
          else
            next = new Storage(params);

          cache.assoc(current, next);
          cache = next;
        }
      } while (i < length - 1);
      return cache.assoc(path[length - 1], value);
    }
  }
}

function createPrimitiveStorage() {
  if (MAP_IMPLEMENTED) this.map = new Map();
  else this.cache = Object.create(null);
}

class PrimitiveCacheStorage<V> extends CacheStorage<V>
  implements StorageInterface<Primitive, V> {
  map: Map<Primitive, V | Storage<V>>;
  cache: ?{ [key: string]: V | Storage<V> | mixed };

  constructor(...args) {
    super(...args);
    createPrimitiveStorage.call(this);
  }

  extract(keyValue) {
    return this.map.has(keyValue) ? this.map.get(keyValue) : NO_VALUE;
  }

  drop(keyValue) {
    return this.map.delete(keyValue);
  }

  assoc(keyValue, value) {
    this.map.set(keyValue, value);
    return value;
  }
}

void function replaceMapByObjectForPrimitiveCacheIfMapIsntImplemented() {
  const generateKey = (keyValue: mixed): string => `${String(keyValue)}@@${typeof keyValue}`;

  function extractFromObject(keyValue) {
    const key = generateKey(keyValue);
    return key in this.cache ? this.cache[key]: NO_VALUE;
  }

  function dropFromObject(keyValue) {
    return delete this.cache[generateKey(keyValue)];
  }

  function assocInObject(keyValue, value) {
    return this.cache[generateKey(keyValue)] = value;
  }

  if (!MAP_IMPLEMENTED) {
    PrimitiveCacheStorage.prototype.extract = extractFromObject;
    PrimitiveCacheStorage.prototype.drop = dropFromObject;
    PrimitiveCacheStorage.prototype.assoc = assocInObject;
  }
}();

class WeakCacheStorage<V> extends CacheStorage<V>
  implements StorageInterface<NonPrimitive, V> {
  weakMap: WeakMap<NonPrimitive, V | Storage<V>>;

  constructor(...args) {
    super(...args);
    this.weakMap = new WeakMap();
  }

  extract(keyValue) {
    return this.weakMap.has(keyValue) ? this.weakMap.get(keyValue) : NO_VALUE;
  }

  drop(keyValue) {
    return this.weakMap.delete(keyValue);
  }

  assoc(keyValue, value) {
    this.weakMap.set(keyValue, value);
    return value;
  }
}

class Storage<V> extends CacheStorage<V>
  implements StorageInterface<Primitive | NonPrimitive, V> {
  map: ?Map<Primitive, V | Storage<V>>;
  cache: ?{ [key: string]: V | Storage<V> | mixed };
  weakMap: WeakMap<NonPrimitive, V | Storage<V>>;
  assocPrimitive: Assoc<Primitive, V>;
  assocWeak: Assoc<NonPrimitive, V>;
  extractPrimitive: Extract<Primitive, V>;
  extractWeak: Extract<NonPrimitive, V>;
  dropPrimitive: Drop<Primitive>;

  constructor(...args) {
    super(...args);
    createPrimitiveStorage.call(this);
    this.weakMap = new WeakMap();
    this.extractPrimitive = PrimitiveCacheStorage.prototype.extract;
    this.extractWeak = WeakCacheStorage.prototype.extract;
    this.assocPrimitive = PrimitiveCacheStorage.prototype.assoc;
    this.assocWeak = WeakCacheStorage.prototype.assoc;
    this.dropPrimitive = PrimitiveCacheStorage.prototype.drop;
  }

  extract(keyValue) {
    if (isPrimitiveValue(keyValue)) return this.extractPrimitive(keyValue);
    else return this.extractWeak(keyValue);
  }

  drop(keyValue) {
    if (isPrimitiveValue(keyValue)) return this.dropPrimitive(keyValue);
    return false;
  }

  assoc(keyValue, value) {
    if (isPrimitiveValue(keyValue)) return this.assocPrimitive(keyValue, value);
    else return this.assocWeak(keyValue, value);
  }
}

export type Params = {|
  storageCount: number,
  checkLast: boolean
|};

const { slice } = Array.prototype;

export default function memoize<A, R>(
  func: (...args: A[]) => R,
  { storageCount, checkLast = true }: Params = {},
): (...args: A[]) => R {
  const storage: Storage<R> = new Storage();
  const storages: Array<RootInfo> = [];
  const params: ContextParams = {
    storageCount: storageCount || DEFAULT_STORAGE_COUNT,
    checkLast,
    storages,
  };
  const { length } = func;

  let lastCache: R | NoValueType = NO_VALUE,
    lastArgs: A[] = [];

  /* eslint-disable prefer-rest-params */
  const resultFunction = checkLast ? function cachedFunction(): R {
    const { length: argsLength } = arguments;
    let { length: i } = arguments;
    if (i === lastArgs.length)
      if (i === 1) {
        if (arguments[0] === lastArgs[0] && lastCache !== NO_VALUE) return lastCache;
      } else {
        while (i-- && arguments[i] === lastArgs[i]);
        if (i === -1 && lastCache !== NO_VALUE) return lastCache;
      }
    let res = void 0;
    // Check arguments length to prevent calling function with various arguments count
    if (argsLength === length) {
      const extractedCache = storage.extractPath(arguments);
      res = extractedCache !== NO_VALUE
        ? extractedCache
        : storage.setPath(arguments, func.apply(null, arguments), params);
      // If we have more arguments that we need, just slice it
    } else if (argsLength > length) {
      const slicedArgs = slice.call(arguments, 0, length);
      const extractedCache = storage.extractPath(slicedArgs);
      res = extractedCache !== NO_VALUE
        ? extractedCache
        : storage.setPath(slicedArgs, func.apply(null, arguments), params);
      // If we have less, don't use cache
    } else {
      res = func.apply(null, arguments);
    }
    lastArgs = arguments;
    return lastCache = res;
  }: function cachedFunction(): R {
    const { length: argsLength } = arguments;
    // Check arguments length to prevent calling function with various arguments count
    if (argsLength === length) {
      const extractedCache = storage.extractPath(arguments);
      return extractedCache !== NO_VALUE
        ? extractedCache
        : storage.setPath(arguments, func.apply(null, arguments), params);
      // If we have more arguments that we need, just slice it
    } else if (argsLength > length) {
      const slicedArgs = slice.call(arguments, 0, length);
      const extractedCache = storage.extractPath(slicedArgs);
      return extractedCache !== NO_VALUE
        ? extractedCache
        : storage.setPath(slicedArgs, func.apply(null, arguments), params);
      // If we have less, don't use cache
    } else {
      return func.apply(null, arguments);
    }
  };
  try {
    void mimic(
      resultFunction, func,
    );
  } finally {
    return resultFunction;
  }
  /* eslint-enable prefer-rest-params */
}

declare function CreateObjectSelector(
  selectorFuncs: Function[],
  calculate: Function
): Function;

// eslint-disable-next-line no-redeclare
declare function CreateObjectSelector(...funcs: Function[]): Function;

export const createObjectSelector: CreateObjectSelector = (...funcs) => {
  const params = funcs.slice(-1)[0];
  const haveParams = typeof params === 'object';
  const calculate = haveParams
    ? funcs.slice(-2)[0]
    : params;

  let selectorFuncs = funcs.slice(0, -1);
  if (Array.isArray(selectorFuncs[0])) [selectorFuncs] = selectorFuncs;
  const memoized = memoize(calculate, haveParams? params: void 0);

  let lastRes = void 0,
    lastObj: ?Object = void 0;
  return (obj: Object): mixed => {
    if (obj === lastObj && lastObj !== void 0) return lastRes;
    let { length } = selectorFuncs;
    const args = Array(length);
    while (length--) args[length] = selectorFuncs[length](obj);
    lastObj = obj;
    return lastRes = memoized.apply(null, args);
  };
};
