import { AbsentValue } from "../value";

import { HasCapacity, HasLength } from "../utils";

/**
 * @abstract
 * An ordered collection of items which can be walked in two directions.
 */
export abstract class OrderedCollection<
  V,
  E,
  Absent = AbsentValue
> extends HasLength {
  /**
   * Adds an item to the end of the collection.
   * @param value
   *
   */
  abstract pushBack(value: V): E;

  /**
   * Pushes an item to the beginning of the collection.
   * @param value
   *
   */
  abstract pushFront(value: V): E;

  /**
   * Moves an element to the beginning of the collection.
   * Returns `true` in case of success.
   * @param element
   *
   */
  abstract moveFront(element: E): boolean;

  /**
   * Moves an element to the back.
   * Returns `true` in case of success.
   * @param element
   *
   */
  abstract moveBack(element: E): boolean;

  /**
   * Removes an element from the collection.
   * Returns `true` in case of success.
   * @param element
   */
  abstract remove(element: E): boolean;

  /**
   * Takes an element from the end of the collection.
   */
  abstract takeBack(): V | Absent;

  /**
   * Takes an element from the beginning of the collection.
   */
  abstract takeFront(): V | Absent;

  /**
   * Inserts given value after the supplied element returning new element.
   * Returns `Absent` in case supplied element doesn't belong to this list.
   * @param element
   * @param value
   */
  abstract insertAfter(element: E, value: V): E | Absent;

  /**
   * Inserts given value before the supplied element returning new element.
   * Returns `Absent` in case supplied element doesn't belong to this list.
   * @param element
   * @param value
   *
   */
  abstract insertBefore(element: E, value: V): E | Absent;

  /**
   * Peeks an element from the end of the collection.
   */
  abstract peekBack(): V | Absent;

  /**
   * Peeks an element from the beginning of the collection.
   */
  abstract peekFront(): V | Absent;

  /**
   * Returns an iterator over collection values starting from the end.
   */
  abstract valuesBack(): Iterable<V>;

  /**
   * Returns an iterator over collection values starting from the beginning.
   */
  abstract valuesFront(): Iterable<V>;
}

/**
 * @abstract
 * An indexed ordered collection of items.
 *
 * **Item `->` Key** relation may be either one-to-one or one-to-many
 * while **Key `->` Item** relation always holds one-to-one.
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
   */
  abstract dropKey(key: Key): Item | Absent;

  /**
   * An iterator over keys.
   */
  abstract keys(): Iterable<Key>;
}

/**
 * @abstract
 * An indexed collection of items with ordered keys.
 *
 * **Item `->` Key** relation may be either one-to-one or one-to-many
 * while **Key `->` Item** relation always holds one-to-one.
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
  abstract addKeyFront(key: Key, item: Item): Item;

  /**
   * Associates supplied key with the provided value.
   * Key will be added to the end of the queue.
   */
  abstract addKeyBack(key: Key, item: Item): Item;

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
