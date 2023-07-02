import { CacheStrategy } from "../base/CacheStrategy";
import { ListNode } from "../collections/LinkedList";
import { Single, SingleKeyQueue } from "../collections";
import { AbsentValue, NO_VALUE } from "../value";
import { Result } from "../utils";
import { once } from "../iterators";

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
   * @param node
   *
   */
  has(node: V): boolean {
    return this.queue.has(node);
  }

  /**
   * Removes supplied item from the queue.
   * @param node
   *
   */
  drop(node: V): boolean {
    return this.queue.drop(node) !== NO_VALUE;
  }

  /**
   * Records read access of the supplied item.
   * @param value
   *
   */
  read(value: V): Result<V> {
    return super.read(value).chain(this.touch(value));
  }

  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  write(value: V): Result<V> {
    return super.write(value).chain(this.touch(value));
  }

  private touch(value: V): Result<V> {
    const item = this.queue.get(value);
    if (item !== NO_VALUE) {
      const moved = this.queue.moveBack(item as ListNode<Single<V>>);
      if (!moved) {
        throw new Error(`\`LRU\`: failed to move the cache entry`);
      }

      return Result.empty();
    } else {
      const pushed = this.queue.pushBack(value);
      if (pushed === NO_VALUE) {
        throw new Error(`\`LRU\`: failed to push a new cache entry`);
      }

      return Result.added(once(value));
    }
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
