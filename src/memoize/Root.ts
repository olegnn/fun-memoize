import { equals, AbsentValue, NO_VALUE } from "../value";
import { Storage } from "../base/Storage";
import { values } from "../iterables";
import { DestroyableParentPath, EMPTY_ARRAY, ParentPath } from "../utils";
import { LeafStorage } from "./LeafStorage";
import { Context, NestedStorage } from "./Context";

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
  static fromResult<R>(result: R): ResultOrPointer<R, unknown> {
    const that = new ResultOrPointer<R, unknown>();
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

      return ResultOrPointer.fromPointer(
        idx === -1 ? 0 : idx
      ) as ResultOrPointer<V, number>;
    } else {
      return ResultOrPointer.fromPointer(0) as ResultOrPointer<V, number>;
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

  /**
   * Resets all underlying values.
   */
  reset() {
    const length = this.storages.length;
    this.storages.length = 1;
    this.storages.length = length;
    this.value = NO_VALUE;
    this.path = EMPTY_ARRAY;
  }
}

/** Cache depth and `checkLast` flag */
export interface RootParams {
  /** Cache depth */
  depth: number;
  /** Store last arguments and check for equality */
  checkLast: boolean;
}

export class Root<K, V> {
  /**
   * Cache depth.
   */
  depth: number;
  /**
   * Root node.
   */
  root: NestedStorage<K, V>;
  /**
   * Storage context used to create new storages.
   */
  ctx: Context<K, V>;
  /**
   * Last path, storage path, and value are stored to reduce the amount of access operations for keys having common prefixes.
   */
  last: Last<K, V>;

  /**
   * Root storage strategy child path to be passed to newly created storage nodes.
   */
  rootStoragesStrategyPath: ParentPath<NestedStorage<K, V>>;
  /**
   * Root leaf storage strategy child path to be passed to newly created leaf storage nodes.
   */
  rootLeafStoragesStrategyPath: ParentPath<LeafStorage<K, V>>;

  constructor(params: RootParams, ctx: Context<K, V>) {
    this.depth = params.depth;
    this.ctx = ctx;
    this.root = (
      params.depth > 1 ? ctx.createStorage() : ctx.createLeafStorage()
    ) as NestedStorage<K, V>;
    this.last = new Last(params.depth, this.root);

    this.rootStoragesStrategyPath = new ParentPath(
      this.ctx.rootStoragesStrategy,
      NO_VALUE
    );
    this.rootLeafStoragesStrategyPath = new ParentPath(
      this.ctx.rootLeafStoragesStrategy,
      NO_VALUE
    );

    this.getOrInsertWith = params.checkLast
      ? this.checkLastThenGetOrInsertWith
      : this.getOrInsertWith;
  }

  /**
   * Retrieves cached value if already calculated, otherwise calls the supplied function with provided arguments and
   * saves the result.
   * @param path
   * @param calculate
   */
  getOrInsertWith(path: K[], calculate: (args: K[]) => V): V {
    if (path.length !== this.depth) throw new Error("Invalid path length");

    const result = this.extractOrSetPath(path, calculate);
    this.last.reset();

    return result as V;
  }

  /**
   * - First, checks last arguments to be the same as the provided, and if so, returns cached value.
   * - Second, attempts to retrieve the cached value, otherwise calls the supplied function with provided arguments and
   * saves the result.
   * @param path
   * @param calculate
   */
  private checkLastThenGetOrInsertWith(
    path: K[],
    calculate: (args: K[]) => V
  ): V {
    if (path.length !== this.depth) throw new Error("Invalid path length");
    let result: V | AbsentValue = NO_VALUE,
      ptr = 0;

    ({ result, ptr } = this.last.get(path));
    if (result !== NO_VALUE) {
      this.readCache();
    } else {
      result = this.extractOrSetPath(path, calculate, ptr);
    }

    return result as V;
  }

  private extractOrSetPath(
    path: K[],
    calculate: (args: K[]) => V,
    from: number = 0
  ): V {
    let { result, ptr } = this.extractPath(path, from);
    if (result !== NO_VALUE) {
      this.last.update(path, result as V);
      this.readCache();

      return result as V;
    }

    try {
      result = calculate.apply(null, path);
    } catch (err) {
      this.last.reset();

      throw err;
    }
    this.setPath(path, result as V, ptr);
    this.last.update(path, result as V);
    this.writeCache();

    return result as V;
  }

  private extractPath(path: K[], from: number = 0): ResultOrPointer<V, number> {
    const length = this.depth;
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
      return ResultOrPointer.fromPointer(
        Math.max(0, idx - 1)
      ) as ResultOrPointer<V, number>;
    }

    return ResultOrPointer.fromResult(res) as ResultOrPointer<V, number>;
  }

  private setPath(path: Array<K>, value: V, from: number = 0) {
    const length = this.depth;
    let idx = from,
      cache: NestedStorage<K, V> = this.last.storage(from).value;

    while (idx < length - 1) {
      const current = path[idx];
      let next = cache.get(current);
      const isWeak = cache.isWeak(current);

      if (next === NO_VALUE) {
        const isLeafStorage = idx > length - 3;
        const parentPaths = isWeak
          ? void 0
          : isLeafStorage
          ? values(
              new DestroyableParentPath(cache, current),
              this.rootStoragesStrategyPath as ParentPath<
                K | LeafStorage<K, V>
              >,
              this.rootLeafStoragesStrategyPath
            )
          : values(
              new DestroyableParentPath(cache, current),
              this.rootStoragesStrategyPath as ParentPath<
                K | NestedStorage<K, V>
              >
            );

        next = isLeafStorage
          ? this.ctx.createLeafStorage(
              parentPaths as Iterable<ParentPath<K | LeafStorage<K, V>>>
            )
          : this.ctx.createStorage(
              parentPaths as Iterable<ParentPath<K | NestedStorage<K, V>>>
            );

        cache.set(current, next as V);
      }

      cache = next as NestedStorage<K, V>;
      this.last.setStorage(++idx, new LinkedValue(cache, isWeak));
    }

    cache.set(path[length - 1], value);
  }

  private readCache() {
    for (let i = this.depth; --i; ) {
      const node = this.last.storage(i);
      if (!node.weak) this.ctx.rootStoragesStrategy.read(node.value);
    }

    if (this.depth > 1) {
      const leafNode = this.last.storage(this.depth - 1);
      if (!leafNode.weak) {
        this.ctx.rootLeafStoragesStrategy.read(
          leafNode.value as LeafStorage<K, V>
        );
      }
    }
  }

  private writeCache() {
    for (let i = this.depth; --i; ) {
      const node = this.last.storage(i);
      if (!node.weak) this.ctx.rootStoragesStrategy.write(node.value);
    }

    if (this.depth > 1) {
      const leafNode = this.last.storage(this.depth - 1);
      if (!leafNode.weak) {
        this.ctx.rootLeafStoragesStrategy.write(
          leafNode.value as LeafStorage<K, V>
        );
      }
    }
  }
}
