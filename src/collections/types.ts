import { AbsentValue } from '../value'
import { SizedIterable } from '../iterators'

/**
 * Describes a container having a length.
 */
export abstract class HasLength {
  constructor() {}

  /**
   * Returns length of the underlying container.
   */
  abstract len(): number;

  /**
   * Returns `true` if the underlying container is empty (has zero length).
   */
  isEmpty(): boolean {
    return this.len() === 0;
  }
}

/**
 * Describes a container having both capacity and length.
 */
export abstract class HasCapacity extends HasLength {
  _capacity: number;

  /**
   * Creates a new container with supplied capacity.
   * In case capacity is equal to zero, an error will be thrown.
   * @param capacity
   */
  constructor(capacity: number) {
    super();
    if (capacity === 0) {
      throw new Error("Capacity can't be equal to zero");
    }

    this._capacity = capacity;
  }

  /**
   * Returns capacity of the underlying container.
   *
   *
   */
  capacity(): number {
    return this._capacity;
  }

  /**
   * Returns `true` if the length of the underlying container reached its capacity.
   *
   *
   */
  isFull(): boolean {
    return this.capacity() < this.len();
  }

  /**
   * Returns `true` if the length of the underlying container will reach (or already reached) its capacity.
   *
   *
   */
  willBeFull(): boolean {
    return this.capacity() < this.len() + 1;
  }
}


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
   * @param element
   *
   */
  abstract moveFront(element: E): void;

  /**
   * Moves an element to the back.
   * @param element
   *
   */
  abstract moveBack(element: E): void;

  /**
   * Takes an element from the end of the collection.
   */
  abstract takeBack(): V | Absent;

  /**
   * Takes an element from the beginning of the collection.
   */
  abstract takeFront(): V | Absent;

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
  abstract valuesBack(): SizedIterable<V>;

  /**
   * Returns an iterator over collection values starting from the beginning.
   */
  abstract valuesFront(): SizedIterable<V>;
}

/**
 * @abstract
 * An indexed collection of items with ordered keys.
 *
 * **Item `->` Key** relation may be either one-to-one or one-to-many
 * while **Key `->` Item** relation always holds one-to-one.
 */
export abstract class IndexedCollectionWithOrderedKeys<
  Key,
  Item,
  Absent = AbsentValue
> extends HasLength {
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
   * Returns `true` if collection has an item associated with the provided key.
   */
  abstract has(key: Key): boolean;

  /**
   * Drops an item associated with the provided key returning it.
   */
  abstract drop(key: Key): Item | Absent;

  /**
   * Retrieves an item associated with the provided key returning it.
   */
  abstract get(key: Key): Item | Absent;

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
   * Drops an item's key from the collection. If referenced item has no more keys, it will be dropped as well.
   */
  abstract dropKey(key: Key): Item | Absent;

  /**
   * Returns an iterator over underlying keys.
   */
  abstract keysFront(): Iterable<Key>;

  /**
   * Returns an iterator over underlying keys.
   */
  abstract keysBack(): Iterable<Key>;
}


/**
 * @abstract
 * An indexed ordered collection of items. In addition to methods inherited from `OrderedCollection`, this type
 * of collection introduces keys used to access items.
 * 
 * **Item `->` Key** relation may be either one-to-one or one-to-many
 * while **Key `->` Item** relation always holds one-to-one.
 */
export abstract class OrderedIndexedCollection<K, V, E = V, Absent = AbsentValue>
  extends IndexedCollectionWithOrderedKeys<K, E, Absent>
  implements OrderedCollection<V, E> {
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
   * @param element
   *
   */
  abstract moveFront(element: E): void;

  /**
   * Moves an element to the back.
   * @param element
   *
   */
  abstract moveBack(element: E): void;

  /**
   * Takes an element from the end of the collection.
   */
  abstract takeBack(): V | Absent;

  /**
   * Takes an element from the beginning of the collection.
   */
  abstract takeFront(): V | Absent;

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
  abstract valuesBack(): SizedIterable<V>;

  /**
   * Returns an iterator over collection values starting from the beginning.
   */
  abstract valuesFront(): SizedIterable<V>;
}