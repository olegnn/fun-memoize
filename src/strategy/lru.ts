import { CacheStrategy } from "../base/CacheStrategy";
import { EMPTY_ITER } from "../iterators";
import { ListNode } from "../collections/LinkedList";
import { MultiKeyQueue, Single } from "../collections";
import { AbsentValue, NO_VALUE } from "../value";
import { Result } from "./types";

/**
 * `L`east `R`ecently `U`sed cache schema.
 */
export class LRU<V> extends CacheStrategy<V> {
  queue: MultiKeyQueue<V, Single<V>>;

  constructor(
    capacity: number,
    roots: Iterable<CacheStrategy<LRU<V>>> = EMPTY_ITER
  ) {
    super(capacity, roots);
    this.queue = new MultiKeyQueue();
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
      this.queue.moveBack(item as ListNode<Single<V>>);

      return Result.empty();
    } else {
      const added = new Single(value);
      this.queue.pushBack(added);

      return Result.added(added.valuesFront());
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
    const node = this.queue.takeKeyFront();

    if (node !== NO_VALUE) {
      if (this.isEmpty()) {
        this.destroy();
      }
    }

    return node;
  }
}
