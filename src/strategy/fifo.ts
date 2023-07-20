import { CacheStrategy } from "../base/CacheStrategy";
import { ListNode } from "../collections/LinkedList";
import { Single, SingleKeyQueue } from "../collections";
import { AbsentValue, NO_VALUE } from "../value";
import { Result } from "../utils";
import { once } from "../iterables";

/**
 * `FIFO` - `F`irst `I`n - `F`irst `O`ut cache replacement policy.
 */
export class FIFO<V> extends CacheStrategy<V> {
  queue: SingleKeyQueue<V>;

  constructor(capacity: number) {
    super(capacity);
    this.queue = new SingleKeyQueue();
  }

  /**
   * Returns amount of stored items.
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
    const has = this.queue.has(node);
    if (has) {
      this.queue.drop(node);
    }

    return has;
  }

  /**
   * Records read access of the supplied item.
   * @param value
   *
   */
  read(_value: V): Result<V> {
    return Result.empty();
  }

  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  write(value: V): Result<V> {
    if (!this.has(value)) {
      const res = this.reservePlace();

      const pushed = this.queue.pushBack(value);
      if (pushed === NO_VALUE) {
        throw new Error(`\`FIFO\`: failed to push a new cache entry`);
      }

      return res.chain(Result.added(once(value)));
    } else {
      const item = this.queue.get(value);
      if (item === NO_VALUE) {
        throw new Error(`\`FIFO\`: cache entry doesn't exist`);
      }

      const moved = this.queue.moveBack(item as ListNode<Single<V>>);
      if (!moved) {
        throw new Error(`\`FIFO\`: failed to move the cache entry`);
      }

      return Result.empty();
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
