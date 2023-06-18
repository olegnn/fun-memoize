import { CacheStrategy } from "../base/CacheStrategy";
import { once } from "../iterators";
import { Result } from "../strategy/types";
import { AbsentValue, NO_VALUE } from "../value";
import { LeafStorage } from "./LeafStorage";

/**
 * Cache strategy for leaf values.
 */
export class RootLeafStrategy<K, V> extends CacheStrategy<LeafStorage<K, V>> {
  _strategy: CacheStrategy<LeafStorage<K, V>>;
  _children: number;

  constructor(
    leafCapacity: number,
    strategy: CacheStrategy<LeafStorage<K, V>>
  ) {
    super(leafCapacity);
    this._strategy = strategy;
    this._children = 0;
  }

  /**
   * Records a read access of the supplied value.
   */
  read(value: LeafStorage<K, V>): Result<LeafStorage<K, V>> {
    return super
      .read(value)
      .chain(this.handleInnerStrategyResult(this._strategy.read(value)));
  }

  /**
   * Records a write access of the supplied value.
   */
  write(value: LeafStorage<K, V>): Result<LeafStorage<K, V>> {
    this._children++;

    return super
      .write(value)
      .chain(this.handleInnerStrategyResult(this._strategy.write(value)));
  }

  /**
   * Reserves place for an item.
   * @param value
   */
  protected reservePlace(_: LeafStorage<K, V>): Result<LeafStorage<K, V>> {
    if (this.isFull()) {
      const removedItem = this.remove();

      if (removedItem !== NO_VALUE) {
        return Result.removed(once(removedItem as LeafStorage<K, V>));
      }
    }

    return Result.empty();
  }

  /**
   * Removes supplied value from the cache.
   */
  drop(value: LeafStorage<K, V>): boolean {
    const dropped = this._strategy.drop(value);
    if (dropped) {
      this._children -= (value as LeafStorage<K, V>).len();
    }

    return dropped;
  }

  /**
   * Returns underlying amount of tracked cache entries.
   */
  len(): number {
    return this._children;
  }

  /**
   * Returns `true` if supplied node exists in cache.
   */
  has(node: LeafStorage<K, V>) {
    return this._strategy.has(node);
  }

  /**
   * Peeks an item from the beginning of the queue.
   */
  peek() {
    return this._strategy.peek();
  }

  /**
   * Removes an item from the beginning of the queue.
   *
   */
  remove(): LeafStorage<K, V> | AbsentValue {
    const maybeStorage = this.peek();

    if (maybeStorage !== NO_VALUE) {
      const storage = maybeStorage as LeafStorage<K, V>;
      const removed = storage.remove();
      if (removed !== NO_VALUE) {
        this._children--;
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
    for (const removed of result.removed) {
      this._children -= removed.len();
    }

    return result;
  }
}
