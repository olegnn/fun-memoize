import { EMPTY_ITER, chain, map } from "./iterators";
import { AbsentValue, NO_VALUE } from "./value";

/**
 * Does nothing.
 */
export const noop = () => {};

/**
 * `true` if `Map` is implemented.
 */
export const mapImplemented = () =>
  Boolean(Map && Map.prototype && typeof Map.prototype.entries === "function");

/**
 * An empty array. MUST NOT BE MODIFIED.
 */
export const EMPTY_ARRAY = [];

/**
 * An empty object. MUST NOT BE MODIFIED.
 */
export const EMPTY_OBJECT = {};

/**
 * Describes a container having a length.
 */
export abstract class HasLength {
  constructor() {}

  /**
   * Returns length of the underlying container.
   */
  abstract len(): number;

  /**
   * Returns `true` if the underlying container is empty (has zero length).
   */
  isEmpty(): boolean {
    return this.len() === 0;
  }
}

/**
 * Describes a container having both capacity and length.
 */
export abstract class HasCapacity extends HasLength {
  _capacity: number;

  /**
   * Creates a new container with supplied capacity.
   * In case capacity is equal to zero, an error will be thrown.
   * @param capacity
   */
  constructor(capacity: number) {
    super();
    if (capacity === 0) {
      throw new Error("Capacity can't be equal to zero");
    }

    this._capacity = capacity;
  }

  /**
   * Returns capacity of the underlying container.
   *
   *
   */
  capacity(): number {
    return this._capacity;
  }

  /**
   * Returns `true` if the length of the underlying container reached its capacity.
   *
   *
   */
  isFull(): boolean {
    return this.capacity() < this.len();
  }

  /**
   * Returns `true` if the length of the underlying container will reach (or already reached) its capacity.
   *
   *
   */
  willBeFull(): boolean {
    return this.capacity() < this.len() + 1;
  }
}

/**
 * Destructable entity.
 */
export interface Destroyable {
  /**
   * Drops all references to the supplied entity.
   */
  destroy(): void;
}

/**
 * Clearable entity.
 */
export interface Clearable {
  /**
   * Removes all entities from the underlying storage.
   */
  clear(): void;
}

/**
 * Parent able to drop an item with the supplied key.
 */
export interface Parent<K> {
  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   */
  drop(key: K): void;
}

/**
 * The path from the parent to the child.
 * If the key is a `NO_VALUE`, then the child is stored under the key equal to itself.
 */
export class ParentPath<K> {
  /**
   * Parent.
   */
  parent: Parent<K>;
  /**
   * The key under which the child is stored.
   * If it's a `NO_VALUE`, then the child is stored under the key identical to itself.
   */
  key: K | AbsentValue;

  constructor(parent: Parent<K>, key: K | AbsentValue) {
    this.parent = parent;
    this.key = key;
  }

  /// Enforces parent to drop the supplied child. Its value will be used only in case if key is absent.
  drop<C>(child: K | C) {
    this.parent.drop(this.key === NO_VALUE ? (child as K) : (this.key as K));
  }
}

/**
 * Contains removed/added entities.
 */
export class Result<V> {
  removed: Iterable<V>;
  added: Iterable<V>;

  static EMPTY_RESULT = new Result();

  private constructor(
    removed: Iterable<V> = EMPTY_ITER,
    added: Iterable<V> = EMPTY_ITER
  ) {
    this.removed = removed;
    this.added = added;
  }

  /** Creates a result containing added entities */
  static added<V>(added: Iterable<V>): Result<V> {
    return new Result(void 0, added);
  }

  /** Creates a result containing removed entities */
  static removed<V>(removed: Iterable<V>): Result<V> {
    return new Result(removed);
  }

  /**
   * Creates a result containing removed and added entities.
   * @param removed
   * @param added
   */
  static removedAdded<V>(removed: Iterable<V>, added: Iterable<V>): Result<V> {
    return new Result(removed, added);
  }

  /**
   * Creates an empty result.
   */
  static empty<V>(): Result<V> {
    return Result.EMPTY_RESULT as Result<V>;
  }

  /**
   * Appends remove/added items from the supplied result to the current result.
   * @param result
   */
  chain(result: Result<V>): Result<V> {
    if (result === Result.EMPTY_RESULT) {
      return this;
    } else if (this === Result.EMPTY_RESULT) {
      return result;
    }

    return new Result(
      chain(this.removed, result.removed),
      chain(this.added, result.added)
    );
  }

  /**
   * Executes given function for each added item.
   * @param fn
   *
   */
  forEachAdded(fn: (added: V) => void): this {
    for (const added of this.added) fn(added);

    return this;
  }

  /**
   * Executes given function for each removed item.
   * @param fn
   *
   */
  forEachRemoved(fn: (removed: V) => void): this {
    for (const removed of this.removed) fn(removed);

    return this;
  }

  /**
   * Maps given result over removed and added items.
   * @param fn
   */
  map<R>(fn: (value: V) => R): Result<R> {
    return new Result(map(fn, this.removed), map(fn, this.added));
  }
}
