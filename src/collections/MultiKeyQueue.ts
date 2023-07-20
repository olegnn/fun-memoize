import { LinkedList, ListNode } from "./LinkedList";
import {
  IndexedOrderedCollection,
  IndexedOrderedCollectionWithOrderedKeys,
} from "./types";
import { AbsentValue, NO_VALUE } from "../value";
import { EMPTY_ITERABLE, flatMap, forEach } from "../iterables";
import { SafeMapStorage } from "../storage";
import { Storage, StorageClass } from "../base";

/**
 * An indexed queue where each item is an indexed queue of keys.
 * A value itself should implement `IndexedOrderedCollection`.
 */
export class MultiKeyQueue<
  Key,
  Value extends IndexedOrderedCollection<Key, Key, InnerItem>,
  InnerItem = Key
> extends IndexedOrderedCollectionWithOrderedKeys<Key, Value, ListNode<Value>> {
  list: LinkedList<Value>;
  map: Storage<Key, ListNode<Value>>;

  constructor(values: Iterable<Value> = EMPTY_ITERABLE as Iterable<Value>) {
    super();
    this.list = new LinkedList();
    this.map = new (SafeMapStorage as StorageClass<Key, ListNode<Value>>)();

    forEach((value) => this.pushBack(value), values);
  }

  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number {
    return this.map.len();
  }

  /**
   * Drops an item associated with the supplied key.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  drop(key: Key): Value | AbsentValue {
    const maybeNoValueListNode = this.map.get(key);
    if (maybeNoValueListNode === NO_VALUE) {
      return NO_VALUE;
    }
    const listNode = maybeNoValueListNode as ListNode<Value>;

    if (!this.remove(listNode)) {
      throw new Error("Inconsistency");
    }

    return listNode.value;
  }

  /**
   * Moves node to the front of the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  moveFront(listNode: ListNode<Value>): boolean {
    return this.list.moveFront(listNode);
  }

  /**
   * Moves node to the back of the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  moveBack(listNode: ListNode<Value>): boolean {
    return this.list.moveBack(listNode);
  }

  /**
   * Removes an item from the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  remove(listNode: ListNode<Value>): boolean {
    const removed = this.list.remove(listNode);

    if (removed) {
      this.dissocKeys(listNode.value);
    }

    return removed;
  }

  /**
   * Returns `true` if supplied item belongs to the collection.
   */
  contains(listNode: ListNode<Value>): boolean {
    return this.list.contains(listNode);
  }

  /**
   * Drops supplied key from the map.
   * Item belonging to this key will be deleted only if it has no more references in the map.
   * Returns `true` in case of a successful removal or `false` if the value wasn't found.
   * @param key
   *
   */
  dropKey(key: Key): boolean {
    const maybeNoValueListNode = this.map.get(key);
    if (maybeNoValueListNode === NO_VALUE) {
      return false;
    }
    const listNode = maybeNoValueListNode as ListNode<Value>;

    this.map.drop(key);
    if (!listNode.value.dropKey(key)) {
      throw new Error("Inconsistency");
    }

    if (listNode.value.isEmpty()) {
      this.list.remove(listNode);
    }

    return true;
  }

  /**
   * Inserts given value after the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertAfter(
    node: ListNode<Value>,
    value: Value
  ): ListNode<Value> | AbsentValue {
    const listNode = this.list.insertAfter(node, value);
    if (listNode == null) {
      return NO_VALUE;
    }
    this.assocKeys(value, listNode);

    return listNode;
  }

  /**
   * Inserts given value before the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertBefore(
    node: ListNode<Value>,
    value: Value
  ): ListNode<Value> | AbsentValue {
    const listNode = this.list.insertBefore(node, value);
    if (listNode == null) {
      return NO_VALUE;
    }
    this.assocKeys(value, listNode);

    return listNode;
  }

  /**
   * Returns value associated with the given key or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  get(key: Key): ListNode<Value> | AbsentValue {
    return this.map.get(key);
  }

  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(node: Key): boolean {
    return this.map.has(node);
  }

  /**
   * Adds a key for the supplied item to the beginning of its queue.
   * @param key
   * @param listNode
   *
   */
  addKeyFront(key: Key, item: ListNode<Value>): boolean {
    if (this.map.has(key)) {
      throw new Error("Key already exists");
    } else if (!this.contains(item)) {
      return false;
    }

    const added = item.value.pushFront(key);
    if (added !== NO_VALUE) {
      this.map.set(key, item);

      return true;
    }

    return false;
  }

  /**
   * Adds a key for the supplied item to the end of its queue.
   * @param key
   * @param listNode
   *
   */
  addKeyBack(key: Key, item: ListNode<Value>): boolean {
    if (this.map.has(key)) {
      throw new Error("Key already exists");
    } else if (!this.contains(item)) {
      return false;
    }

    const added = item.value.pushBack(key);
    if (added !== NO_VALUE) {
      this.map.set(key, item);

      return true;
    }

    return false;
  }

  /**
   * Takes a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeFront(): Value | AbsentValue {
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
  takeBack(): Value | AbsentValue {
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
  peekFront(): Value | AbsentValue {
    const item = this.list.peekFront();

    return item == null ? NO_VALUE : item;
  }

  /**
   * Peeks a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekBack(): Value | AbsentValue {
    const item = this.list.peekBack();

    return item == null ? NO_VALUE : item;
  }

  /**
   * Peeks an item from the beginning of the collection.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  peekItemFront(): AbsentValue | ListNode<Value> {
    const item = this.list.peekItemFront();

    return item == null ? NO_VALUE : item;
  }

  /**
   * Peeks an item from the end of the collection.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  peekItemBack(): AbsentValue | ListNode<Value> {
    const item = this.list.peekItemBack();

    return item == null ? NO_VALUE : item;
  }

  /**
   * Peeks a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyFront(): Key | AbsentValue {
    const first = this.list.peekFront();

    if (first != null) {
      return first.peekFront();
    } else {
      return NO_VALUE;
    }
  }

  /**
   * Peeks a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyBack(): Key | AbsentValue {
    const first = this.list.peekBack();

    if (first != null) {
      return first.peekBack();
    } else {
      return NO_VALUE;
    }
  }

  /**
   * Takes a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyFront(): Key | AbsentValue {
    const first = this.list.peekFront();

    if (first != null) {
      const key = first.takeFront();
      if (first.isEmpty()) {
        this.list.takeFront();
      }

      if (key !== NO_VALUE) {
        this.map.drop(key as Key);

        return key;
      }
    }

    return NO_VALUE;
  }

  /**
   * Takes a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyBack(): Key | AbsentValue {
    const last = this.list.peekBack();

    if (last != null) {
      const key = last.takeBack();
      if (last.isEmpty()) {
        this.list.takeBack();
      }

      if (key !== NO_VALUE) {
        this.map.drop(key as Key);

        return key;
      }
    }

    return NO_VALUE;
  }

  /**
   * Returns an iterator over values.
   *
   */
  valuesFront(): Iterable<Value> {
    return this.list.valuesFront();
  }

  /**
   * Returns an iterator over values.
   *
   */
  valuesBack(): Iterable<Value> {
    return this.list.valuesBack();
  }

  /**
   * Returns an iterator over keys starting from the beginning.
   *
   */
  keysFront(): Iterable<Key> {
    return flatMap((item) => item.keys(), this.list.valuesFront());
  }

  /**
   * Returns an iterator over keys starting from the end.
   *
   */
  keysBack(): Iterable<Key> {
    return flatMap(
      (item) => [...item.keys()].reverse(),
      this.list.valuesBack()
    );
  }

  /**
   * Pushes an item to the end of the queue.
   * @param value
   *
   */
  pushBack(value: Value): ListNode<Value> {
    const listNode = this.list.pushBack(value);
    this.assocKeys(value, listNode);

    return listNode;
  }

  /**
   * Pushes an item to the beginning of the queue.
   * @param value
   *
   */
  pushFront(value: Value): ListNode<Value> {
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
  private assocKeys(value: Value, node: ListNode<Value>): void {
    forEach((key) => {
      if (this.map.has(key)) {
        throw new Error("Key already exists");
      }

      this.map.set(key, node);
    }, value.keys());
  }

  /**
   * Dissociates keys of the provided value.
   * @param value
   * @param node
   *
   */
  private dissocKeys(value: Value): void {
    forEach((key) => {
      if (!this.map.drop(key)) {
        throw new Error("Key doesn't exist");
      }
    }, value.keys());
  }
}
