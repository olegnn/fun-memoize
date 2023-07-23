import { CacheStrategy } from "../base/CacheStrategy";
import { MultiKeyQueue, Single, SingleKeyQueue } from "../collections";
import { AbsentValue, NO_VALUE } from "../value";
import { Result } from "../utils";
import { once } from "../iterables";
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
  write(value: V): Result<V> {
    if (!this.has(value)) {
      const res = this.reservePlace();
      const head = this.queue.peekItemFront();

      if (head !== NO_VALUE) {
        const isFirstLevel =
          (head as ListNode<LevelEntry<V>>).value.level === 1;

        if (isFirstLevel) {
          const addedHead = this.queue.addKeyBack(
            value,
            head as ListNode<LevelEntry<V>>
          );
          if (!addedHead) {
            throw new Error(`\`LFU\`: failed to modify cache head`);
          }

          return res.chain(Result.added(once(value)));
        }
      }
      const pushed = this.queue.pushFront(new LevelEntry(1, value));

      return res.chain(Result.added(once(value)));
    } else {
      return this.read(value);
    }
  }

  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  read(value: V): Result<V> {
    const maybeNoValueListNode = this.queue.get(value);

    if (maybeNoValueListNode === NO_VALUE) {
      throw new Error("`LFU`: cache entry doesn't exist");
    }
    const listNode = maybeNoValueListNode as ListNode<LevelEntry<V>>;
    const { next } = listNode;
    if (!this.queue.dropKey(value)) {
      throw new Error(
        `\`LFU\`: failed to drop a key in the current cache level`
      );
    }

    const newLevel = listNode.value.level + 1;

    if (next) {
      if (next.value.level === newLevel) {
        const added = this.queue.addKeyBack(value, next);
        if (!added) {
          throw new Error(
            `\`LFU\`: failed to move cache value to the next cache level`
          );
        }
      } else {
        const inserted = this.queue.insertBefore(
          next,
          new LevelEntry(newLevel, value)
        );
        if (inserted === NO_VALUE) {
          throw new Error(`\`LFU\`: failed to insert a new level of cache`);
        }
      }
    } else {
      this.queue.pushBack(new LevelEntry(newLevel, value));
    }

    return Result.empty();
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
    return this.queue.dropKey(value);
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
