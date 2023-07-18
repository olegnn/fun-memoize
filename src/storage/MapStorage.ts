import type { StorageParams } from "../base/Storage";
import type { AbsentValue } from "../value";
import type { ParentPath } from "../utils";

import { NO_VALUE } from "../value";
import { Storage } from "../base/Storage";
import { map } from "../iterators";

/**
 * Key-value storage based on a `Map`.
 */
export class MapStorage<K, V> extends Storage<K, V> {
  map: Map<K, V>;

  constructor(
    params?: StorageParams<K, V>,
    rootPath?: Iterable<ParentPath<K>>
  ) {
    super(params, rootPath);
    this.map = new Map();
  }

  /**
   * Returns amount of items stored in a map.
   *
   */
  len(): number {
    return this.map.size;
  }

  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /**
   * Retrieves an item corresponding to the supplied key.
   * @param key
   *
   */
  get(key: K): V | AbsentValue {
    if (this.map.has(key)) {
      return this.map.get(key)!;
    } else {
      return NO_VALUE;
    }
  }

  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   *
   */
  drop(key: K): V | AbsentValue {
    const value = this.get(key);
    this.map.delete(key);

    return value;
  }

  /**
   * Associates supplied item with the key.
   * @param key
   * @param value
   *
   */
  set(key: K, value: V): void {
    this.map.set(key, value);
  }

  /**
   * Removes all items from the storage.
   *
   */
  clear(): void {
    this.map.clear();
  }

  /**
   * Returns an iterator over the entries.
   *
   */
  entries(): Iterable<{ key: K; value: V }> {
    return map(([key, value]) => ({ key, value }), this.map.entries());
  }
}
