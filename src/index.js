// @flow
// eslint-disable prefer-spread
import WeakMap from "es6-weak-map";
import mimic from "mimic-fn";

export const DEFAULT_STORAGE_COUNT = 1e3;
const NO_VALUE = {};
const MAP_IMPLEMENTED =
  typeof Map === "function" && typeof Map.prototype.entries === "function";
const isSameValue =
  Object.is ||
  ((v1, v2) =>
    v1 === 0 && v2 === 0
      ? 1 / v1 === 1 / v2
      : // eslint-disable-next-line no-self-compare
        (v2 !== v2 && v1 !== v1) || v1 === v2);

type NoValueType = typeof NO_VALUE;
type NonPrimitive = Object | Function;
type Primitive = boolean | string | number | Symbol | null | void;

declare function IsPrimitiveValue(value: NonPrimitive): false;
// eslint-disable-next-line no-redeclare
declare function IsPrimitiveValue(value: Primitive): true;

const isPrimitiveValue: IsPrimitiveValue = (value) => {
  const type = typeof value;
  return value == null || (type !== "object" && type !== "function");
};

type Assoc<K, V> = (keyValue: K, value: V | Storage<*>) => V | Storage<*>;
type Extract<K, V> = (keyValue: K) => V | Storage<*> | NoValueType;
type Drop<K> = (keyValue: K) => boolean;

interface StorageInterface<K, V> {
  +extract: Extract<K, V>;
  +assoc: Assoc<K, V>;
  +drop: Drop<K>;
}

type RootInfo<V> = {|
  root: CacheStorage<*>,
  key: mixed,
|};

type ContextParams = {| ...Params, storages: Array<RootInfo<*>> |};

class CacheStorage<V> implements StorageInterface<*, V> {
  constructor(
    { storageCount = DEFAULT_STORAGE_COUNT, storages = [] }: ContextParams,
    rootInfo: ?RootInfo<*>
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
    throw new Error("Not implemented");
  }

  /**
   * @virtual
   *
   */
  extract(...args): V | NoValueType | Storage<*> {
    throw new Error("Not implemented");
  }

  /**
   * @virtual
   *
   */
  assoc(...args): V {
    throw new Error("Not implemented");
  }

  extractPath(
    path: Array<Primitive | NonPrimitive>
  ): V | NoValueType | Storage<*> | void {
    const { length } = path;
    if (length === 1) {
      return this.extract(path[0]);
    } else {
      let i = 0,
        lessThanPath = true,
        res = this;
      do {
        // `instanceof` check is very expensive, so omit it
        // flow-disable-line
        res = res.extract(path[i++]);
        lessThanPath = i < length;
      } while (lessThanPath && res !== NO_VALUE);
      return lessThanPath ? NO_VALUE : res;
    }
  }

  setPath(
    path: Array<Primitive | NonPrimitive>,
    value: V,
    params: ContextParams
  ): V {
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
          else next = new Storage(params);

          cache.assoc(current, next);
          cache = next;
        }
      } while (i < length - 1);
      return cache.assoc(path[length - 1], value);
    }
  }
}

const PrimitiveCacheStorage = MAP_IMPLEMENTED
  ? class PrimitiveCacheStorage<V>
      extends CacheStorage<V>
      implements StorageInterface<Primitive, V> {
      // Cannot instantiate `PrimitiveCacheStorage` because  statics of `Map` [1] is not a polymorphic type.
      // flow-disable-line
      map: Map<Primitive, V | Storage<*>>;

      constructor(params: ContextParams, rootInfo: ?RootInfo<*>) {
        super(params, rootInfo);
        // flow-disable-line
        this.map = new Map();
      }

      extract(keyValue) {
        // flow-disable-line
        return this.map.has(keyValue) ? this.map.get(keyValue) : NO_VALUE;
      }

      drop(keyValue) {
        // flow-disable-line
        return this.map.delete(keyValue);
      }

      assoc(keyValue, value) {
        this.map.set(keyValue, value);
        // flow-disable-line
        return value;
      }
    }
  : class PrimitiveCacheStorage<V>
      extends CacheStorage<V>
      implements StorageInterface<Primitive, V> {
      cache: { [key: string]: V | Storage<*>, __proto__: null };

      constructor(params: ContextParams, rootInfo: ?RootInfo<*>) {
        super(params, rootInfo);
        this.cache = Object.create(null);
      }

      generateKey(keyValue: mixed): string {
        return `${String(keyValue)}@@${typeof keyValue}`;
      }

      extract(keyValue) {
        const key = this.generateKey(keyValue);
        // flow-disable-line
        return key in this.cache ? this.cache[key] : NO_VALUE;
      }

      drop(keyValue) {
        return delete this.cache[this.generateKey(keyValue)];
      }

      assoc(keyValue, value) {
        // flow-disable-line
        return (this.cache[this.generateKey(keyValue)] = value);
      }
    };

class WeakCacheStorage<V>
  extends CacheStorage<V>
  implements StorageInterface<NonPrimitive, V> {
  weakMap: WeakMap<NonPrimitive, V | Storage<*>>;

  constructor(params: ContextParams, rootInfo: ?RootInfo<*>) {
    super(params, rootInfo);
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
    // flow-disable-line
    return value;
  }
}

class Storage<V>
  extends CacheStorage<V>
  implements StorageInterface<Primitive | NonPrimitive, V> {
  weakStorage: WeakCacheStorage<V>;
  // `PrimitiveCacheStorage` [1] is incompatible with  `PrimitiveCacheStorage`
  // flow-disable-line
  primitiveStorage: PrimitiveCacheStorage<V>;

  constructor(params: ContextParams, rootInfo: ?RootInfo<*>) {
    super(params, rootInfo);
    this.weakStorage = new WeakCacheStorage(params);
    this.primitiveStorage = new PrimitiveCacheStorage(params);
  }

  extract(keyValue) {
    if (isPrimitiveValue(keyValue))
      // flow-disable-line
      return this.primitiveStorage.extract(keyValue);
    else return this.weakStorage.extract(keyValue);
  }

  drop(keyValue) {
    if (isPrimitiveValue(keyValue)) return this.primitiveStorage.drop(keyValue);
    return false;
  }

  assoc(keyValue, value) {
    if (isPrimitiveValue(keyValue))
      // flow-disable-line
      return this.primitiveStorage.assoc(keyValue, value);
    // Cannot extend  `CacheStorage` [1] with `Storage` because  `V` [2] is incompatible with  `V`
    // flow-disable-line
    else return this.weakStorage.assoc(keyValue, value);
  }
}

export type Params = {|
  storageCount: number,
  checkLast: boolean,
|};

const { slice } = Array.prototype;

/* eslint-disable prefer-rest-params */
export default function memoize<R>(
  func: (...args: *[]) => R,
  { storageCount, checkLast = true }: Params = {}
): (...args: *[]) => R {
  const storages: Array<RootInfo<*>> = [];
  const params: ContextParams = {
    storageCount: storageCount || DEFAULT_STORAGE_COUNT,
    checkLast,
    storages,
  };
  const storage: Storage<R> = new Storage(params);
  const { length } = func;

  let lastCache: R | NoValueType = NO_VALUE,
    lastArgs: *[] = [];

  const recomputate = function () {
    ++resultFunction.recomputations;
    return this.apply(this, arguments);
  };

  const resultFunction = checkLast
    ? function cachedFunction(): R {
        let i = arguments.length;
        if (i === lastArgs.length)
          if (i === 1) {
            if (
              isSameValue(arguments[0], lastArgs[0]) &&
              lastCache !== NO_VALUE
            )
              // Cannot return `lastCache` because  `NoValueType` [1] is incompatible with  `R`
              // flow-disable-line
              return lastCache;
          } else {
            while (i-- && isSameValue(arguments[i], lastArgs[i]));
            if (i === -1 && lastCache !== NO_VALUE)
              // Cannot return `lastCache` because  `NoValueType` [1] is incompatible with  `R`
              // flow-disable-line
              return lastCache;
          }
        const argsLength = arguments.length;

        let result;
        // Check arguments length to prevent calling function with various arguments count
        if (argsLength === length) {
          const extractedCache = storage.extractPath(arguments);
          result =
            extractedCache !== NO_VALUE
              ? extractedCache
              : storage.setPath(
                  arguments,
                  recomputate.apply(func, arguments),
                  params
                );
          // If we have more arguments that we need, just slice it
        } else if (argsLength > length) {
          const slicedArgs = slice.call(arguments, 0, length);
          const extractedCache = storage.extractPath(slicedArgs);
          result =
            extractedCache !== NO_VALUE
              ? extractedCache
              : storage.setPath(
                  slicedArgs,
                  recomputate.apply(func, arguments),
                  params
                );
          // If we have less, don't use cache
        } else {
          result = recomputate.apply(func, arguments);
        }

        if (result instanceof CacheStorage)
          result = recomputate.apply(func, arguments);

        lastArgs = arguments;
        // Cannot return `lastCache = result` because  `NoValueType` [1] is incompatible with  `R`
        // flow-disable-line
        return (lastCache = result);
      }
    : function cachedFunction(): R {
        const argsLength = arguments.length;
        let result;
        // Check arguments length to prevent calling function with various arguments count
        if (argsLength === length) {
          const extractedCache = storage.extractPath(arguments);
          result =
            extractedCache !== NO_VALUE
              ? extractedCache
              : storage.setPath(
                  arguments,
                  recomputate.apply(func, arguments),
                  params
                );
          // If we have more arguments that we need, just slice it
        } else if (argsLength > length) {
          const slicedArgs = slice.call(arguments, 0, length);
          const extractedCache = storage.extractPath(slicedArgs);
          result =
            extractedCache !== NO_VALUE
              ? extractedCache
              : storage.setPath(
                  slicedArgs,
                  recomputate.apply(func, arguments),
                  params
                );
          // If we have less, don't use cache
        } else {
          return recomputate.apply(func, arguments);
        }

        if (result instanceof CacheStorage)
          result = recomputate.apply(func, arguments);

        // Cannot return `lastCache = result` because  `NoValueType` [1] is incompatible with  `R`
        // flow-disable-line
        return result;
      };

  try {
    void mimic(resultFunction, func);
  } finally {
    resultFunction.recomputations = 0;
    return resultFunction;
  }
}

declare function CreateMemoizedSelector(
  selectorFuncs: Function[],
  calculate: Function
): Function;

// eslint-disable-next-line no-redeclare
declare function CreateMemoizedSelector(
  ...args: (Function | Object)[]
): {|
  ...Function,
  recomputations: number,
  dependencies: Function[],
  resultFunction: Function,
|};

export const createMemoizedSelector: CreateMemoizedSelector = (...params) => {
  const paramsOrFunc = params.slice(-1)[0];
  let selectorFuncs = params.slice(0, -1);
  if (Array.isArray(selectorFuncs[0])) [selectorFuncs] = selectorFuncs;

  if (!params.length) {
    throw new Error("Must have at least one argument");
  } else if (params.length === 1) {
    if (typeof paramsOrFunc === "object")
      throw new Error("Structured selectors arent currently supported");
  } else {
    selectorFuncs.forEach((param) => {
      if (typeof param !== "function")
        throw new Error(
          `Invalid type of param passed to memoization function: ${param} with type: ${typeof param}`
        );
    });
  }

  const haveParams = typeof paramsOrFunc === "object";
  const calculate = haveParams ? params.slice(-2)[0] : paramsOrFunc;
  const memoized = memoize(calculate, haveParams ? paramsOrFunc : void 0);

  function selector(): mixed {
    let { length } = selectorFuncs;
    const args = Array(length);
    while (length--)
      args[length] = selectorFuncs[length].apply(null, arguments);

    return memoized(...args);
  }

  selector.recomputations = () => memoized.recomputations;
  selector.dependencies = selectorFuncs;
  selector.resultFunction = calculate;

  return selector;
};

/* eslint-enable prefer-rest-params prefer-spread */
