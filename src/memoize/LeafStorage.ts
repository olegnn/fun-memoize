import { AbsentValue, NO_VALUE } from "../value";
import { ChildPath, Storage, StorageParams } from "../base/Storage";
import { CacheStrategy } from "../base/CacheStrategy";
import { Result } from "../strategy";
import { SizedIterable } from "../iterators";
import { Destroyable } from "../utils";

/**
 * Leaf storage callbacks.
 */
export interface LeafStorageParams<K, V> extends StorageParams<K, V> {
  /** Callback to be called on the leaf creation */
  onCreateLeaf?: (leafStorage: K) => void;
  /** Callback to be called on the leaf removal */
  onRemoveLeaf?: (leafStorage: K) => void;
}

/**
 * Stores leaf key -> value pairs.
 */
export class LeafStorage<K, V> extends Storage<K, V> implements Destroyable {
  declare params: LeafStorageParams<K, V>;
  storage: Storage<K, V>;
  strategy: CacheStrategy<K>;
  dropStorageValue: (key: K) => boolean;

  constructor(
    storage: Storage<K, V>,
    strategy: CacheStrategy<K>,
    params: LeafStorageParams<K, V>,
    rootPath?: Iterable<ChildPath<K>>
  ) {
    super(params, rootPath);
    this.storage = storage;
    this.strategy = strategy;
    this.params = params;
    this.dropStorageValue = this.storage.drop.bind(this.storage);
  }

  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number {
    return this.storage.len();
  }

  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   *
   */
  drop(key: K): V | AbsentValue {
    const isWeak = this.storage.isWeak(key);
    if (!isWeak) {
      const dropped = this.strategy.drop(key);

      if (dropped && this.params.onRemoveLeaf != null)
        this.params.onRemoveLeaf(key);
    }
    const removedFromStorage = this.storage.drop(key);
    if (isWeak) {
      if (removedFromStorage !== NO_VALUE && this.params.onRemoveLeaf != null)
        this.params.onRemoveLeaf(key);
    }

    return removedFromStorage;
  }

  /**
   * Retrieves an item corresponding to the supplied key.
   * @param key
   *
   */
  get(key: K): V | AbsentValue {
    const isWeak = this.storage.isWeak(key);
    const extracted = this.storage.get(key);
    if (!isWeak && extracted !== NO_VALUE) {
      this.handleResult(this.strategy.read(key));
    }

    return extracted;
  }

  /**
   * Associates supplied item with the key.
   * @param key
   * @param value
   *
   */
  set(key: K, value: V): void {
    const isWeak = this.storage.isWeak(key);
    if (!isWeak) this.handleResult(this.strategy.write(key));

    this.storage.set(key, value);
  }

  /**
   * Removes an item from the beginning of the queue.
   *
   */
  remove(): K | AbsentValue {
    const key = this.strategy.remove();
    if (key !== NO_VALUE) {
      this.storage.drop(key as K);

      if (this.params.onRemoveLeaf != null) this.params.onRemoveLeaf(key as K);
    }

    return key;
  }

  /**
   * Calls a `destroy` implementations that will unlink given storage from all entities
   * referencing it for both storage and cache strategy.
   *
   */
  destroy(): void {
    super.destroy();
    this.strategy.destroy();
  }

  /**
   * Removes all items from the storage and cache strategy.
   *
   */
  clear(): void {
    this.storage.clear();
    this.strategy.clear();
  }

  /**
   * Returns an iterator over the entries.
   *
   */
  entries(): SizedIterable<{ key: K; value: V }> {
    return this.storage.entries();
  }

  /**
   * Executes callbacks for each added/removed item.
   * @param result
   */
  private handleResult(result: Result<K>) {
    result.forEachRemoved(this.dropStorageValue);

    if (this.params.onCreateLeaf != null) {
      result.forEachAdded(this.params.onCreateLeaf);
    }

    if (this.params.onRemoveLeaf != null) {
      result.forEachRemoved(this.params.onRemoveLeaf);
    }
  }
}
