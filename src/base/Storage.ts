import { NO_VALUE } from "../value";
import type { AbsentValue } from "../value";
import {
  Destroyable,
  EMPTY_OBJECT,
  Parent,
  HasLength,
  Clearable,
  ParentPath,
} from "../utils";
import { EMPTY_ITERABLE, forEach } from "../iterators";

/**
 * Key-value storage.
 */
export abstract class Storage<K, V>
  extends HasLength
  implements Destroyable, Clearable, Parent<K>
{
  /**
   * Paths from parents to the given storage.
   */
  parentPaths: Iterable<ParentPath<K | Storage<K, V>>>;
  /**
   * Parameters.
   */
  params: StorageParams<K, V>;
  destroyed: boolean;

  constructor(
    params: StorageParams<K, V> = EMPTY_OBJECT as StorageParams<K, V>,
    parentPaths: Iterable<ParentPath<K | Storage<K, V>>> = EMPTY_ITERABLE
  ) {
    super();
    this.params = params;
    this.parentPaths = parentPaths;
    this.destroyed = false;

    if (this.params.onCreateStorage != null) this.params.onCreateStorage(this);
  }

  /**
   * Calls a `destroy` implementation that will unlink given storage from all entities
   * referencing it.
   *
   */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    forEach((path) => path.drop(this), this.parentPaths);

    if (this.params.onRemoveStorage != null) this.params.onRemoveStorage(this);
  }

  /**
   * Returns `true` if supplied is weak, and thus won't be stored directly.
   * @param key
   */
  isWeak(_key: K): boolean {
    return false;
  }

  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(key: K): boolean {
    return this.get(key) !== NO_VALUE;
  }

  /**
   * Retrieves an item corresponding to the supplied key.
   * @param key
   *
   */
  abstract get(key: K): V | AbsentValue;

  /**
   * Associates supplied item with the key.
   * @param key
   * @param value
   *
   */
  abstract set(key: K, value: V): void;

  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   *
   */
  abstract drop(key: K): V | AbsentValue;

  /**
   * Removes all items from the storage.
   *
   */
  abstract clear(): void;

  /**
   * Returns an iterator over the entries.
   *
   */
  abstract entries(): Iterable<{ key: K; value: V }>;
}

/**
 * Extended storage class with implemented abstract methods.
 */
export type StorageClass<K, V> = new (...args: any[]) => Storage<K, V> & {
  get(key: K): V | AbsentValue;
  set(key: K, value: V): void;
  drop(key: K): V | AbsentValue;
  len(): number;
  clear(): void;
  entries(): Iterable<{ key: K; value: V }>;
};

/**
 * Storage callbacks.
 */
export interface StorageParams<K, V> {
  /**
   * Callback to be called on the storage creation.
   * @param storage
   */
  onCreateStorage?: (storage: Storage<K, V>) => void;
  /**
   * Callback to be called on the storage removal.
   * @param storage
   */
  onRemoveStorage?: (storage: Storage<K, V>) => void;
}
