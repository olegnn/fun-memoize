import { LinkedList, ListNode } from "./LinkedList";
import { OrderedIndexedCollection } from "./types";
import { AbsentValue, NO_VALUE } from "../value";
import { EMPTY_ITER, flatMap, SizedIterable } from "../iterators";
import { SafeMapStorage } from "../storage";
import { Storage, StorageClass } from "../base";

/**
 * An indexed queue where each item is an indexed queue of keys.
 * An item itself should implement `OrderedIndexedCollection`.
 */
export class MultiKeyQueue<
  K,
  V extends OrderedIndexedCollection<K, K, E>,
  E = K
> extends OrderedIndexedCollection<K, V, ListNode<V>> {
  list: LinkedList<V>;
  map: Storage<K, ListNode<V>>;

  constructor(values: Iterable<V> = EMPTY_ITER as Iterable<V>) {
    super();
    this.list = new LinkedList();
    this.map = new (SafeMapStorage as StorageClass<K, ListNode<V>>)();

    for (const value of values) {
      this.pushBack(value);
    }
  }

  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number {
    return this.map.len();
  }

  /**
   * Drops an item ass3ociated with the supplied key.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  drop(key: K): V | AbsentValue {
    const maybeNoValueListNode = this.map.get(key);
    if (maybeNoValueListNode === NO_VALUE) {
      return NO_VALUE;
    }
    const listNode = maybeNoValueListNode as ListNode<V>;

    if (!this.remove(listNode as ListNode<V>)) {
      throw new Error("Inconsistency");
    }

    return (listNode as ListNode<V>).value;
  }

  /**
   * Moves node to the front of the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  moveFront(listNode: ListNode<V>): boolean {
    return this.list.moveFront(listNode);
  }

  /**
   * Moves node to the back of the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  moveBack(listNode: ListNode<V>): boolean {
    return this.list.moveBack(listNode);
  }

  /**
   * Removes an item from the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  remove(listNode: ListNode<V>): boolean {
    const removed = this.list.remove(listNode);

    if (removed) {
      this.dissocKeys(listNode.value);
    }

    return removed;
  }

  /**
   * Drops supplied key from the map.
   * Item belonging to this key will be deleted only if it has no more references in the map.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  dropKey(key: K): V | AbsentValue {
    const maybeNoValueListNode = this.map.get(key);
    if (maybeNoValueListNode === NO_VALUE) {
      return NO_VALUE;
    }
    const listNode = maybeNoValueListNode as ListNode<V>;

    this.map.drop(key);
    if (listNode.value.dropKey(key) === NO_VALUE) {
      throw new Error("Inconsistency");
    }

    if (listNode.value.isEmpty()) {
      this.list.remove(listNode);
    }

    return listNode.value;
  }

  /**
   * Inserts given value after the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertAfter(node: ListNode<V>, value: V): ListNode<V> {
    const listNode = this.list.insertAfter(node, value);
    this.assocKeys(value, listNode);

    return listNode;
  }

  /**
   * Inserts given value before the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertBefore(node: ListNode<V>, value: V): ListNode<V> {
    const listNode = this.list.insertBefore(node, value);
    this.assocKeys(value, listNode);

    return listNode;
  }

  /**
   * Returns value associated with the given key or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  get(key: K): ListNode<V> | AbsentValue {
    return this.map.get(key);
  }

  /**
   * Adds a key for the supplied element to the beginning of its queue.
   * @param key
   * @param listNode
   *
   */
  addKeyFront(key: K, item: ListNode<V>): ListNode<V> {
    if (this.map.has(key)) {
      throw new Error("Key already exists");
    }

    this.map.set(key, item);
    item.value.pushFront(key);

    return item;
  }

  /**
   * Adds a key for the supplied element to the end of its queue.
   * @param key
   * @param listNode
   *
   */
  addKeyBack(key: K, item: ListNode<V>): ListNode<V> {
    if (this.map.has(key)) {
      throw new Error("Key already exists");
    }

    this.map.set(key, item);
    item.value.pushBack(key);

    return item;
  }

  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(node: K): boolean {
    return this.map.has(node);
  }

  /**
   * Takes a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeFront(): V | AbsentValue {
    const item = this.list.takeFront();

    if (item != null) {
      this.dissocKeys(item);
    }

    return item == null ? NO_VALUE : item;
  }

  /**
   * Takes a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeBack(): V | AbsentValue {
    const item = this.list.takeBack();

    if (item != null) {
      this.dissocKeys(item);
    }

    return item == null ? NO_VALUE : item;
  }

  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekFront(): V | AbsentValue {
    const item = this.list.peekFront();

    return item == null ? NO_VALUE : item;
  }

  /**
   * Peeks a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekBack(): V | AbsentValue {
    const item = this.list.peekBack();

    return item == null ? NO_VALUE : item;
  }

  /**
   * Peeks a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyFront(): K | AbsentValue {
    const first = this.list.peekFront();

    if (first != null) {
      return first.peekKeyFront();
    } else {
      return NO_VALUE;
    }
  }

  /**
   * Peeks a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyBack(): K | AbsentValue {
    const first = this.list.peekBack();

    if (first != null) {
      return first.peekKeyBack();
    } else {
      return NO_VALUE;
    }
  }

  /**
   * Takes a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyFront(): K | AbsentValue {
    while (!this.isEmpty()) {
      const first = this.list.peekFront();

      if (first != null) {
        const key = first.takeKeyFront();
        if (first.isEmpty()) {
          this.list.takeFront();
        }

        if (key !== NO_VALUE) {
          this.map.drop(key as K);

          return key;
        }
      } else {
        break;
      }
    }

    return NO_VALUE;
  }

  /**
   * Takes a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyBack(): K | AbsentValue {
    while (!this.isEmpty()) {
      const last = this.list.peekBack();

      if (last != null) {
        const key = last.takeKeyBack();
        if (last.isEmpty()) {
          this.list.takeBack();
        }

        if (key !== NO_VALUE) {
          this.map.drop(key as K);

          return key;
        }
      } else {
        break;
      }
    }

    return NO_VALUE;
  }

  /**
   * Returns an iterator over values.
   *
   */
  valuesFront(): SizedIterable<V> {
    return this.list.valuesFront();
  }

  /**
   * Returns an iterator over values.
   *
   */
  valuesBack(): SizedIterable<V> {
    return this.list.valuesBack();
  }

  /**
   * Returns an iterator over keys starting from the beginning.
   *
   */
  keysFront(): Iterable<K> {
    return flatMap(this.list.valuesFront(), (iter) => iter.keysFront());
  }

  /**
   * Returns an iterator over keys starting from the end.
   *
   */
  keysBack(): Iterable<K> {
    return flatMap(this.list.valuesBack(), (iter) => iter.keysBack());
  }

  /**
   * Pushes an item to the end of the queue.
   * @param value
   *
   */
  pushBack(value: V): ListNode<V> {
    const listNode = this.list.pushBack(value);
    this.assocKeys(value, listNode);

    return listNode;
  }

  /**
   * Pushes an item to the beginning of the queue.
   * @param value
   *
   */
  pushFront(value: V): ListNode<V> {
    const listNode = this.list.pushFront(value);
    this.assocKeys(value, listNode);

    return listNode;
  }

  /**
   * Associates keys of the provided value with the supplied raw linked list node.
   * @param value
   * @param node
   *
   */
  private assocKeys(value: V, node: ListNode<V>): void {
    for (const key of value.keysFront()) {
      if (this.map.has(key)) {
        throw new Error("Key already exists");
      }

      this.map.set(key, node);
    }
  }

  /**
   * Dissociates keys of the provided value.
   * @param value
   * @param node
   *
   */
  private dissocKeys(value: V): void {
    for (const key of value.keysFront()) {
      if (!this.map.drop(key)) {
        throw new Error("Key doesn't exist");
      }
    }
  }
}
