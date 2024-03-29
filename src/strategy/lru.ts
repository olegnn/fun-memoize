import { CacheStrategy } from "../base/CacheStrategy";
import { ListNode } from "../collections/LinkedList";
import { Single, SingleKeyQueue } from "../collections";
import { AbsentValue, NO_VALUE } from "../value";
import { Result } from "../utils";
import { once } from "../iterables";

/**
 * `L`east `R`ecently `U`sed cache replacement policy.
 */
export class LRU<V> extends CacheStrategy<V> {
  queue: SingleKeyQueue<V>;

  constructor(capacity: number) {
    super(capacity);
    this.queue = new SingleKeyQueue();
  }

  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number {
    return this.queue.len();
  }

  /**
   * Returns `true` if given item exists in the queue.
   * @param value
   *
   */
  has(value: V): boolean {
    return this.queue.has(value);
  }

  /**
   * Removes supplied item from the queue.
   * @param value
   *
   */
  drop(value: V): boolean {
    return this.queue.drop(value) !== NO_VALUE;
  }

  /**
   * Records read access of the supplied item.
   * @param value
   *
   */
  read(value: V): Result<V> {
    const item = this.queue.get(value);
    if (item === NO_VALUE) {
      throw new Error("`LRU`: cache entry doesn't exist");
    }

    const moved = this.queue.moveBack(item as ListNode<Single<V>>);
    if (!moved) {
      throw new Error("`LRU`: failed to move the cache entry");
    }

    return Result.empty();
  }

  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  write(value: V): Result<V> {
    if (this.has(value)) {
      return this.read(value);
    }

    const res = this.reservePlace();
    const pushed = this.queue.pushBack(value);
    if (pushed === NO_VALUE) {
      throw new Error("`LRU`: failed to push a new cache entry");
    }

    return res.chain(Result.added(once(value)));
  }

  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peek(): V | AbsentValue {
    return this.queue.peekKeyFront();
  }

  /**
   * Removes an item from the beginning of the queue.
   *
   */
  take(): V | AbsentValue {
    return this.queue.takeKeyFront();
  }
}
