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
   * Destroys given entity (unlinks all references to it).
   */
  destroy(): void;
  /**
   * Clears unerlying storage of the entity.
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
