import { ListNode } from "../collections/LinkedList";
import { MultiKeyQueue } from "../collections/MultiKeyQueue";
import { Single } from "../collections/Single";
import { IndexedOrderedCollectionWithOrderedKeys } from "../collections/types";
import { EMPTY_ITERABLE, map } from "../iterables";
import { AbsentValue } from "../value";

/**
 * An indexed queue of items where each item has a single key.
 */
export class SingleKeyQueue<V> extends IndexedOrderedCollectionWithOrderedKeys<
  V,
  V,
  ListNode<Single<V>>
> {
  inner: MultiKeyQueue<V, Single<V>>;

  constructor(values: Iterable<V> = EMPTY_ITERABLE as Iterable<V>) {
    super();

    this.inner = new MultiKeyQueue<V, Single<V>>(
      map((value) => new Single(value), values)
    );
  }

  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number {
    return this.inner.len();
  }

  /**
   * Drops an item associated with the supplied key.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  drop(key: V): V | AbsentValue {
    return this.inner.drop(key);
  }

  /**
   * Moves node to the front of the queue.
   * Returns `true` in case of success.
   * @param item
   *
   */
  moveFront(item: ListNode<Single<V>>): boolean {
    return this.inner.moveFront(item);
  }

  /**
   * Moves node to the back of the queue.
   * Returns `true` in case of success.
   * @param item
   *
   */
  moveBack(item: ListNode<Single<V>>): boolean {
    return this.inner.moveBack(item);
  }

  /**
   * Removes an item from the queue.
   * Returns `true` in case of success.
   */
  remove(item: ListNode<Single<V>>): boolean {
    return this.inner.remove(item);
  }

  /**
   * Returns `true` if supplied item belongs to the collection.
   */
  contains(item: ListNode<Single<V>>): boolean {
    return this.inner.contains(item);
  }

  /**
   * Drops supplied key from the map.
   * Item belonging to this key will be deleted only if it has no more references in the map.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  dropKey(key: V): boolean {
    return this.inner.dropKey(key);
  }

  /**
   * Inserts given value after the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertAfter(
    node: ListNode<Single<V>>,
    value: V
  ): ListNode<Single<V>> | AbsentValue {
    return this.inner.insertAfter(node, new Single(value));
  }

  /**
   * Inserts given value before the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertBefore(
    node: ListNode<Single<V>>,
    value: V
  ): ListNode<Single<V>> | AbsentValue {
    return this.inner.insertBefore(node, new Single(value));
  }

  /**
   * Returns value associated with the given key or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  get(key: V): AbsentValue | ListNode<Single<V>> {
    return this.inner.get(key);
  }

  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(key: V): boolean {
    return this.inner.has(key);
  }

  /**
   * Adds a key for the supplied item to the beginning of its queue.
   * @param key
   * @param item
   *
   */
  addKeyFront(key: V, item: ListNode<Single<V>>): boolean {
    return this.inner.addKeyFront(key, item);
  }

  /**
   * Adds a key for the supplied item to the end of its queue.
   * @param key
   * @param item
   *
   */
  addKeyBack(key: V, item: ListNode<Single<V>>): boolean {
    return this.inner.addKeyBack(key, item);
  }

  /**
   * Takes a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeFront(): AbsentValue | V {
    return this.inner.takeKeyFront();
  }

  /**
   * Takes a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeBack(): AbsentValue | V {
    return this.inner.takeKeyBack();
  }

  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekFront(): AbsentValue | V {
    return this.inner.peekKeyFront();
  }

  /**
   * Peeks a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekBack(): AbsentValue | V {
    return this.inner.peekKeyBack();
  }

  /**
   * Peeks an item from the beginning of the collection.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  peekItemFront(): {} | ListNode<Single<V>> {
    return this.inner.peekItemFront();
  }

  /**
   * Peeks an item from the end of the collection.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  peekItemBack(): {} | ListNode<Single<V>> {
    return this.inner.peekItemBack();
  }

  /**
   * Peeks a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyFront(): AbsentValue | V {
    return this.inner.peekKeyFront();
  }

  /**
   * Peeks a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyBack(): AbsentValue | V {
    return this.inner.peekKeyBack();
  }

  /**
   * Takes a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyFront(): AbsentValue | V {
    return this.inner.takeKeyFront();
  }

  /**
   * Takes a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyBack(): AbsentValue | V {
    return this.inner.takeKeyBack();
  }

  /**
   * Returns an iterator over values.
   *
   */
  valuesFront(): Iterable<V> {
    return this.inner.keysFront();
  }

  /**
   * Returns an iterator over values.
   *
   */
  valuesBack(): Iterable<V> {
    return this.inner.keysBack();
  }

  /**
   * Returns an iterator over keys starting from the beginning.
   *
   */
  keysFront(): Iterable<V> {
    return this.inner.keysFront();
  }

  /**
   * Returns an iterator over keys starting from the end.
   *
   */
  keysBack(): Iterable<V> {
    return this.inner.keysBack();
  }

  /**
   * Pushes an item to the end of the queue.
   * @param value
   *
   */
  pushBack(value: V): ListNode<Single<V>> | AbsentValue {
    return this.inner.pushBack(new Single(value));
  }

  /**
   * Pushes an item to the beginning of the queue.
   * @param value
   *
   */
  pushFront(value: V): ListNode<Single<V>> | AbsentValue {
    return this.inner.pushFront(new Single(value));
  }
}
