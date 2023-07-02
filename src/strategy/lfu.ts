import { CacheStrategy } from "../base/CacheStrategy";
import { MultiKeyQueue, Single, SingleKeyQueue } from "../collections";
import { AbsentValue, NO_VALUE } from "../value";
import { Result } from "./types";
import { once } from "../iterators";
import { ListNode } from "../collections/LinkedList";

/**
 * `L`east `F`requently `U`used cache replacement policy.
 */
export class LFU<V> extends CacheStrategy<V> {
  queue: MultiKeyQueue<V, LevelEntry<V>, ListNode<Single<V>>>;

  constructor(capacity: number) {
    super(capacity);
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

  private touch(node: V): Result<V> {
    const maybeNoValueListNode = this.queue.get(node);

    if (maybeNoValueListNode !== NO_VALUE) {
      const listNode = maybeNoValueListNode as ListNode<LevelEntry<V>>;
      const { next } = listNode;
      this.queue.dropKey(node);

      const newLevel = listNode.value.level + 1;

      if (next) {
        if (next.value.level === newLevel) {
          this.queue.addKeyBack(node, next);
        } else {
          this.queue.insertBefore(next, new LevelEntry(newLevel, node));
        }
      } else {
        this.queue.pushBack(new LevelEntry(newLevel, node));
      }

      return Result.empty();
    } else {
      const added = Result.added(once(node));
      const headKey = this.queue.peekKeyFront();

      if (headKey !== NO_VALUE) {
        const head = this.queue.get(headKey as V);
        if (head === NO_VALUE) {
          console.log(headKey, [...this.queue.keysFront()]);
          throw new Error("Inconsistency");
        }

        const isFirstLevel =
          (head as ListNode<LevelEntry<V>>).value.level === 1;

        if (isFirstLevel) {
          this.queue.addKeyBack(node, head as ListNode<LevelEntry<V>>);

          return added;
        }
      }
      this.queue.pushFront(new LevelEntry(1, node));

      return added;
    }
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
    return this.queue.dropKey(node) !== NO_VALUE;
  }

  /**
   * Takes a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  take(): V | AbsentValue {
    return this.queue.takeKeyFront();
  }

  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peek(): V | AbsentValue {
    return this.queue.peekKeyFront();
  }
}

/** Describes a cache entry containing ordered values and its level. */
class LevelEntry<V> extends SingleKeyQueue<V> {
  level: number;

  constructor(level: number, value: V) {
    super(once(value));
    this.level = level;
  }
}
