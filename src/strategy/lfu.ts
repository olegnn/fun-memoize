import { CacheStrategy } from "../base/CacheStrategy";
import {
  MultiKeyQueue,
  Single,
  OrderedIndexedCollection,
} from "../collections";
import { AbsentValue, NO_VALUE } from "../value";
import { Result } from "./types";
import { once, withSize, SizedIterable } from "../iterators";
import { ListNode } from "../collections/LinkedList";

/** Describes a cache entry containing ordered values and its level. */
class LevelEntry<
  V,
  E,
  S extends OrderedIndexedCollection<V, Single<V>, E>
> extends OrderedIndexedCollection<V, V, E> {
  level: number;
  entry: S;

  constructor(level: number, entry: S) {
    super();
    this.level = level;
    this.entry = entry;
  }

  pushFront(value: V): E {
    return this.entry.pushFront(new Single(value));
  }

  pushBack(value: V): E {
    return this.entry.pushBack(new Single(value));
  }

  takeFront() {
    return this.entry.takeFront();
  }

  takeBack() {
    return this.entry.takeBack();
  }

  peekFront() {
    return this.entry.peekFront();
  }

  peekBack() {
    return this.entry.peekBack();
  }

  takeKeyFront() {
    return this.entry.takeKeyFront();
  }

  takeKeyBack() {
    return this.entry.takeKeyBack();
  }

  get(key: V) {
    return this.entry.get(key);
  }

  dropKey(key: V) {
    return this.entry.dropKey(key);
  }

  has(value: V) {
    return this.entry.has(value);
  }

  addKeyFront(key: V, item: E) {
    return this.entry.addKeyFront(key, item);
  }

  addKeyBack(key: V, item: E) {
    return this.entry.addKeyBack(key, item);
  }

  peekKeyFront() {
    return this.entry.peekKeyFront();
  }

  peekKeyBack() {
    return this.entry.peekKeyBack();
  }

  moveBack(element: E) {
    return this.entry.moveBack(element);
  }

  moveFront(element: E) {
    return this.entry.moveFront(element);
  }

  remove(element: E): boolean {
    return this.entry.remove(element);
  }

  valuesFront(): SizedIterable<V> {
    return withSize(this.entry.keysFront(), this.len());
  }

  valuesBack(): SizedIterable<V> {
    return withSize(this.entry.keysBack(), this.len());
  }

  keysFront(): Iterable<V> {
    return this.entry.keysFront();
  }

  keysBack(): Iterable<V> {
    return this.entry.keysBack();
  }

  len(): number {
    return this.entry.len();
  }

  drop(value: V) {
    return this.entry.drop(value);
  }
}

type Entry<V> = LevelEntry<V, ListNode<Single<V>>, MultiKeyQueue<V, Single<V>>>;

/**
 * `L`east `F`requently `U`used cache schema.
 */
export class LFU<V> extends CacheStrategy<V> {
  queue: MultiKeyQueue<V, Entry<V>, ListNode<Single<V>>>;

  constructor(capacity: number, root?: CacheStrategy<LFU<V>>) {
    super(capacity, root as any);
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
      const listNode = maybeNoValueListNode as ListNode<Entry<V>>;
      const { next } = listNode;
      this.queue.dropKey(node);

      const newLevel = listNode.value.level + 1;

      if (next) {
        if (next.value.level === newLevel) {
          this.queue.addKeyBack(node, next);
        } else {
          this.queue.insertBefore(next, this.buildLevelEntry(newLevel, node));
        }
      } else {
        this.queue.pushBack(this.buildLevelEntry(newLevel, node));
      }

      return Result.empty();
    } else {
      const added = Result.added(once(node));
      const headKey = this.queue.peekKeyFront();

      if (headKey !== NO_VALUE) {
        const head = this.queue.get(headKey as V);
        if (head === NO_VALUE) {
          throw new Error("Inconsistency");
        }

        const isFirstLevel = (head as ListNode<Entry<V>>).value.level === 1;

        if (isFirstLevel) {
          this.queue.addKeyBack(node, head as ListNode<Entry<V>>);

          return added;
        }
      }
      this.queue.pushFront(this.buildLevelEntry(1, node));

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

  private buildLevelEntry(
    level: number,
    value: V
  ): LevelEntry<V, ListNode<Single<V>>, MultiKeyQueue<V, Single<V>>> {
    return new LevelEntry(level, new MultiKeyQueue(once(new Single(value))));
  }
}
