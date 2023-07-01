import { equals, AbsentValue, NO_VALUE } from "../value";
import { ChildPath, Storage } from "../base/Storage";
import { append, double, once } from "../iterators";
import { EMPTY_ARRAY } from "../utils";
import { LeafStorage } from "./LeafStorage";
import { StorageContext, NestedStorage } from "./StorageContext";

/**
 * Contains either a value or a pointer.
 */
class ResultOrPointer<R, P> {
  result: R | AbsentValue;
  ptr: P | undefined;

  private constructor() {
    this.result = NO_VALUE;
    this.ptr = void 0;
  }

  /**
   * Produces a result.
   * @param result
   */
  static fromResult<R>(result: R | AbsentValue): ResultOrPointer<R, unknown> {
    const that = new ResultOrPointer();
    that.result = result;

    return that;
  }

  /**
   * Produces a pointer.
   * @param ptr
   */
  static fromPointer<P>(ptr: P): ResultOrPointer<unknown, P> {
    const that = new ResultOrPointer();
    that.ptr = ptr;

    return that as ResultOrPointer<unknown, P>;
  }
}

/**
 * Weakly or strongly linked value.
 */
class LinkedValue<V> {
  /** Underlying value. */
  value: V;
  /** Is value a weekly linked? */
  weak: boolean;

  constructor(value: V, weak: boolean) {
    this.value = value;
    this.weak = weak;
  }
}

/**
 * Stores last path to value including storage nodes.
 * Used to reduce the number of access operations in case the prefix has some elements in common.
 */
class Last<K, V> {
  /**
   * Last storage path.
   */
  storages: Array<LinkedValue<NestedStorage<K, V>>>;
  /**
   * Last key path.
   */
  path: Array<K>;
  /**
   * Last extracted value.
   */
  value: V | AbsentValue;

  constructor(length: number, root: NestedStorage<K, V>) {
    this.storages = Array(length);
    this.storages[0] = new LinkedValue(root, false);
    this.path = EMPTY_ARRAY;
    this.value = NO_VALUE;
  }

  /**
   * Associates storage with the provided index.
   * @param idx
   * @param storage
   */
  setStorage(idx: number, storage: LinkedValue<NestedStorage<K, V>>) {
    this.storages[idx] = storage;
  }

  /**
   * Retrieves storage using supplied index.
   * @param idx
   */
  storage(idx: number): LinkedValue<NestedStorage<K, V>> {
    return this.storages[idx];
  }

  /**
   * Returns a value in case the path is the same as the previous one.
   * Otherwise returns an index of the greatest common node for provided and stored paths.
   * @param path
   */
  get(path: K[]): ResultOrPointer<V, number> {
    const length = this.path.length;
    if (length === path.length) {
      let idx = -1;
      for (let i = 0; i < length && equals(this.path[i], path[i]); i++) {
        idx = i;
      }

      if (idx === length - 1) {
        return ResultOrPointer.fromResult(this.value) as ResultOrPointer<
          V,
          number
        >;
      }

      return ResultOrPointer.fromPointer(idx === -1 ? 0 : idx);
    } else {
      return ResultOrPointer.fromPointer(0);
    }
  }

  /**
   * Updates path and stored value.
   * @param path
   * @param value
   */
  update(path: K[], value: V) {
    this.path = path;
    this.value = value;
  }
}

export class Root<K, V> {
  /**
   * Cache depth.
   */
  length: number;
  /**
   * Root node.
   */
  root: NestedStorage<K, V>;
  /**
   * Storage context used to create new storages.
   */
  ctx: StorageContext<K, V>;

  /**
   * Root storage strategy child path to pass to newly created nodes.
   */
  rootPath: ChildPath<AbsentValue>;
  /**
   * Root leaf storage strategy child path to pass to newly created leaf nodes.
   */
  leafPath: ChildPath<AbsentValue>;

  /**
   * Last path, storage path, and value are stored to reduce the amount of access operations for keys having common prefixes.
   */
  last: Last<K, V>;

  constructor(length: number, ctx: StorageContext<K, V>) {
    this.length = length;
    this.ctx = ctx;
    this.root = (
      length > 1 ? ctx.createStorage() : ctx.createLeafStorage()
    ) as NestedStorage<K, V>;
    this.last = new Last(length, this.root);

    this.rootPath = new ChildPath(this.ctx.rootStorageStrategy, NO_VALUE);
    this.leafPath = new ChildPath(this.ctx.rootLeafStrategy, NO_VALUE);
  }

  /**
   * Retrieves cached value if already calculated, otherwise calls the supplied function with provided arguments and
   * saves the result.
   * @param path
   * @param calculate
   */
  getOrInsertWith(path: K[], calculate: (args: K[]) => V): V {
    const length = this.length;
    if (path.length !== length) throw new Error("Invalid path length");

    let { result, ptr } = this.last.get(path);
    if (result !== NO_VALUE) {
      this.readCache();

      return result as V;
    }

    ({ result, ptr } = this.extractPath(path, ptr));
    if (result !== NO_VALUE) {
      this.last.update(path, result as V);
      this.readCache();

      return result as V;
    }

    result = calculate.apply(null, path);
    const value = this.setPath(path, result as V, ptr);
    this.last.update(path, value);
    this.writeCache();

    return value;
  }

  private extractPath(path: K[], from: number = 0): ResultOrPointer<V, number> {
    const length = this.length;
    const node = this.last.storage(from);
    let idx = from,
      lessThanPath = true,
      res: V | AbsentValue | NestedStorage<K, V> = node.value,
      isLastWeak = node.weak;

    do {
      this.last.setStorage(
        idx,
        new LinkedValue(res as NestedStorage<K, V>, isLastWeak)
      );

      isLastWeak = (res as Storage<K, V>).isWeak(path[idx]);
      res = (res as Storage<K, V>).get(path[idx]);

      lessThanPath = ++idx < length;
    } while (lessThanPath && res !== NO_VALUE);

    if (lessThanPath || res === NO_VALUE) {
      return ResultOrPointer.fromPointer(Math.max(0, idx - 1));
    }

    return ResultOrPointer.fromResult(res) as ResultOrPointer<V, number>;
  }

  private setPath(path: Array<K>, value: V, from: number = 0) {
    const length = this.length;
    let idx = from,
      cache: NestedStorage<K, V> = this.last.storage(from).value;

    while (idx < length - 1) {
      const current = path[idx];
      let next = cache.get(current);
      const isWeak = cache.isWeak(current);

      if (next === NO_VALUE) {
        const rootPath = isWeak
          ? once(this.rootPath)
          : double(this.rootPath, new ChildPath(cache, current));
        next =
          idx < length - 2
            ? this.ctx.createStorage(rootPath)
            : this.ctx.createLeafStorage(append(rootPath, this.leafPath));

        cache.set(current, next as unknown as V);
      }

      cache = next as NestedStorage<K, V>;
      this.last.setStorage(++idx, new LinkedValue(cache, isWeak));
    }

    cache.set(path[length - 1], value);

    return value;
  }

  private readCache() {
    for (let i = this.length; i-- > 0; ) {
      const node = this.last.storage(i);
      if (!node.weak) this.ctx.rootStorageStrategy.read(node.value);
    }

    const leafNode = this.last.storage(this.length - 1);
    if (!leafNode.weak) {
      this.ctx.rootLeafStrategy.read(leafNode.value as LeafStorage<K, V>);
    }
  }

  private writeCache() {
    for (let i = this.length; i-- > 0; ) {
      const node = this.last.storage(i);
      if (!node.weak) this.ctx.rootStorageStrategy.write(node.value);
    }

    const leafNode = this.last.storage(this.length - 1);
    if (!leafNode.weak) {
      this.ctx.rootLeafStrategy.write(leafNode.value as LeafStorage<K, V>);
    }
  }
}
