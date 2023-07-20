import type { NonPrimitive, AbsentValue } from "../value";

import "weakmap-polyfill";
import { Storage, StorageParams } from "../base/Storage";
import { ParentPath } from "../utils";
import { NO_VALUE } from "../value";
import { empty } from "../iterables";

/**
 * Weak storage for values with non-primitive keys.
 */
export class WeakStorage<K extends NonPrimitive, V> extends Storage<K, V> {
  weakMap: WeakMap<NonPrimitive, V>;
  addedEntries: number;

  constructor(
    params?: StorageParams<K, V>,
    rootPath?: Iterable<ParentPath<K>>
  ) {
    super(params, rootPath);
    this.weakMap = new WeakMap<NonPrimitive, V>();
    this.addedEntries = 0;
  }

  /**
   * Returns `true` if supplied is weak, and thus won't be stored directly.
   * @param key
   */
  isWeak(_key: K): boolean {
    return true;
  }

  /**
   * Returns amount of items added to the storage.
   *
   */
  len(): number {
    return this.addedEntries;
  }

  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(key: K): boolean {
    return this.weakMap.has(key);
  }

  /**
   * Retrieves an item corresponding to the supplied key.
   * @param key
   *
   */
  get(key: K): V | AbsentValue {
    if (this.weakMap.has(key)) {
      return this.weakMap.get(key)!;
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
    const removed = this.weakMap.delete(key);
    if (removed) {
      this.addedEntries--;
    }

    return value;
  }

  /**
   * Associates supplied item with the key.
   * @param key
   * @param value
   *
   */
  set(key: K, value: V): void {
    if (!this.weakMap.has(key)) {
      this.addedEntries++;
    }
    this.weakMap.set(key, value);
  }

  /**
   * Does nothing.
   *
   */
  clear(): void {}

  /**
   * Returns an iterator over the entries.
   *
   */
  entries(): Iterable<{ key: K; value: V }> {
    return empty();
  }
}
