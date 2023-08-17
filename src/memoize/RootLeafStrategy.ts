import { CacheStrategy } from "../base/CacheStrategy";
import { forEach, once } from "../iterables";
import { Result } from "../utils";
import { AbsentValue, NO_VALUE } from "../value";
import { LeafStorage } from "./LeafStorage";

/**
 * Root cache strategy for leaf values.
 */
export class RootLeafStrategy<K, V> extends CacheStrategy<LeafStorage<K, V>> {
  leafStorageStrategy: CacheStrategy<LeafStorage<K, V>>;
  leaves: number;

  constructor(
    leafCapacity: number,
    strategy: CacheStrategy<LeafStorage<K, V>>
  ) {
    super(leafCapacity);
    this.leafStorageStrategy = strategy;
    this.leaves = 0;
  }

  /**
   * Records a read access of the supplied value.
   */
  read(value: LeafStorage<K, V>): Result<LeafStorage<K, V>> {
    return this.handleInnerStrategyResult(this.leafStorageStrategy.read(value));
  }

  /**
   * Records a write access of the supplied value.
   */
  write(value: LeafStorage<K, V>): Result<LeafStorage<K, V>> {
    const res = !this.has(value)
      ? this.reservePlace()
      : (Result.empty() as Result<LeafStorage<K, V>>);
    this.leaves++;

    return res.chain(
      this.handleInnerStrategyResult(this.leafStorageStrategy.write(value))
    );
  }

  /**
   * Removes supplied value from the cache.
   */
  drop(value: LeafStorage<K, V>): boolean {
    const dropped = this.leafStorageStrategy.drop(value);
    if (dropped) {
      this.leaves -= value.len();
    }

    return dropped;
  }

  /**
   * Returns underlying amount of tracked cache entries.
   */
  len(): number {
    return this.leaves;
  }

  /**
   * Returns `true` if supplied node exists in cache.
   */
  has(node: LeafStorage<K, V>) {
    return this.leafStorageStrategy.has(node);
  }

  /**
   * Peeks an item from the beginning of the queue.
   */
  peek() {
    return this.leafStorageStrategy.peek();
  }

  /**
   * Removes an item from the beginning of the queue.
   *
   */
  take(): LeafStorage<K, V> | AbsentValue {
    const maybeStorage = this.peek();

    if (maybeStorage !== NO_VALUE) {
      const storage = maybeStorage as LeafStorage<K, V>;
      const removed = storage.take();
      if (removed !== NO_VALUE) {
        this.leaves--;
      }

      if (storage.isEmpty()) {
        this.drop(storage);

        return storage;
      }
    }

    return NO_VALUE;
  }

  /**
   * Handles a result produced by calling one of the inner strategy methods.
   */
  private handleInnerStrategyResult(result: Result<LeafStorage<K, V>>) {
    forEach((removed) => (this.leaves -= removed.len()), result.removed);

    return result;
  }
}
