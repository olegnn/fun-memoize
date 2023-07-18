import { AbsentValue } from "../value";

import { HasCapacity, HasLength } from "../utils";

/**
 * @abstract
 * An ordered collection of items which can be walked in two directions.
 */
export abstract class OrderedCollection<
  Value,
  Item,
  Absent = AbsentValue
> extends HasLength {
  /**
   * Adds an item to the end of the collection.
   * Returns either created element or absent value in case value can't be added.
   * @param value
   *
   */
  abstract pushBack(value: Value): Item | Absent;

  /**
   * Pushes an item to the beginning of the collection.
   * Returns either created element or absent value in case value can't be added.
   * @param value
   *
   */
  abstract pushFront(value: Value): Item | Absent;

  /**
   * Moves an element to the beginning of the collection.
   * Returns `true` in case of success.
   * @param element
   *
   */
  abstract moveFront(element: Item): boolean;

  /**
   * Moves an element to the back.
   * Returns `true` in case of success.
   * @param element
   *
   */
  abstract moveBack(element: Item): boolean;

  /**
   * Removes an element from the collection.
   * Returns `true` in case of success.
   */
  abstract remove(element: Item): boolean;

  /**
   * Returns `true` if supplied element belongs to the collection.
   */
  abstract contains(element: Item): boolean;

  /**
   * Takes an element from the end of the collection.
   */
  abstract takeBack(): Value | Absent;

  /**
   * Takes an element from the beginning of the collection.
   */
  abstract takeFront(): Value | Absent;

  /**
   * Inserts given value after the supplied element returning new element.
   * Returns `Absent` in case supplied element doesn't belong to this list.
   */
  abstract insertAfter(element: Item, value: Value): Item | Absent;

  /**
   * Inserts given value before the supplied element returning new element.
   * Returns `Absent` in case supplied element doesn't belong to this list.
   *
   */
  abstract insertBefore(element: Item, value: Value): Item | Absent;

  /**
   * Peeks an element from the end of the collection.
   */
  abstract peekBack(): Value | Absent;

  /**
   * Peeks an element from the beginning of the collection.
   */
  abstract peekFront(): Value | Absent;

  /**
   * Returns an iterator over collection values starting from the end.
   */
  abstract valuesBack(): Iterable<Value>;

  /**
   * Returns an iterator over collection values starting from the beginning.
   */
  abstract valuesFront(): Iterable<Value>;
}

/**
 * @abstract
 * An indexed ordered collection of items.
 *
 * **Item `->` Key** relation can be either one-to-one or one-to-many.
 */
export abstract class IndexedOrderedCollection<
  Key,
  Value,
  Item,
  Absent = AbsentValue
> extends OrderedCollection<Value, Item, Absent> {
  /**
   * Retrieves an item associated with the provided key returning it.
   */
  abstract get(key: Key): Item | Absent;

  /**
   * Returns `true` if collection has an item associated with the provided key.
   */
  abstract has(key: Key): boolean;

  /**
   * Drops an item associated with the provided key returning it.
   */
  abstract drop(key: Key): Item | Absent;

  /**
   * Drops an item's key from the collection. If referenced item has no more keys, it will be dropped as well.
   * Returns `true` in case of a successful removal or `false` if the value wasn't found.
   */
  abstract dropKey(key: Key): boolean;

  /**
   * An iterator over keys.
   */
  abstract keys(): Iterable<Key>;
}

/**
 * @abstract
 * An indexed collection of items with ordered keys.
 *
 * **Item `->` Key** relation can be either one-to-one or one-to-many.
 */
export abstract class IndexedOrderedCollectionWithOrderedKeys<
  Key,
  Value,
  Item,
  Absent = AbsentValue
> extends IndexedOrderedCollection<Key, Value, Item, Absent> {
  /**
   * Takes an item's key from the beginning of the collection. If referenced item has no more keys, it will be dropped.
   */
  abstract takeKeyFront(): Key | Absent;

  /**
   * Takes an item's key from the end of the collection. If referenced item has no more keys, it will be dropped.
   */
  abstract takeKeyBack(): Key | Absent;

  /**
   * Peeks a key from the beginning if the collection.
   */
  abstract peekKeyFront(): Key | Absent;

  /**
   * Peeks a key from the end of the collection.
   */
  abstract peekKeyBack(): Key | Absent;

  /**
   * Associates supplied key with the provided value.
   * Key will be added to the beginning of the queue.
   */
  abstract addKeyFront(key: Key, item: Item): boolean;

  /**
   * Associates supplied key with the provided value.
   * Key will be added to the end of the queue.
   */
  abstract addKeyBack(key: Key, item: Item): boolean;

  /**
   * Returns an iterator over underlying keys.
   */
  abstract keysFront(): Iterable<Key>;

  /**
   * Returns an iterator over underlying keys.
   */
  abstract keysBack(): Iterable<Key>;

  keys() {
    return this.keysFront();
  }
}

export { HasCapacity, HasLength };
