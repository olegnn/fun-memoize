/**
 * Does nothing.
 */
export const noop = () => {};

/**
 * An empty array. MUST NOT BE MODIFIED.
 */
export const EMPTY_ARRAY = [];

/**
 * An empty object. MUST NOT BE MODIFIED.
 */
export const EMPTY_OBJECT = {};

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
