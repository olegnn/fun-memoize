import { CacheStrategy } from "../base/CacheStrategy";
import { ListNode } from "../collections/LinkedList";
import { MultiKeyQueue, Single } from "../collections";
import { AbsentValue, NO_VALUE } from "../value";
import { Result } from "./types";

/**
 * `FIFO` - `F`irst `I`n - `F`irst `O`ut cache replacement policy.
 */
export class FIFO<V> extends CacheStrategy<V> {
  queue: MultiKeyQueue<V, Single<V>>;

  constructor(capacity: number) {
    super(capacity);
    this.queue = new MultiKeyQueue();
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
  read(value: V): Result<V> {
    return super.read(value).chain(Result.empty());
  }

  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  write(value: V): Result<V> {
    const res = super.write(value);
    const item = this.queue.get(value);
    if (item !== NO_VALUE) {
      this.queue.moveBack(item as ListNode<Single<V>>);

      return res;
    } else {
      const item = new Single(value);
      this.queue.pushBack(item);

      return res.chain(Result.added(item.valuesFront()));
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
