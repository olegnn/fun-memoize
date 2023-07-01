/**
 * An iterable with a fixed size.
 */
interface SizedIterable<V> extends Iterable<V> {
  size(): number;
}

/**
 * Contains removed/added entities.
 */
declare class Result<V> {
  removed: SizedIterable<V>;
  added: SizedIterable<V>;
  static EMPTY_RESULT: Result<unknown>;
  private constructor();
  static added<V>(added: SizedIterable<V>): Result<V>;
  static removed<V>(removed: SizedIterable<V>): Result<V>;
  static removedAdded<V>(
    removed: SizedIterable<V>,
    added: SizedIterable<V>
  ): Result<V>;
  static empty<V>(): Result<V>;
  /**
   * Appends remove/added items from the supplied result to the current result.
   * @param result
   */
  chain(result: Result<V>): Result<V>;
  /**
   * Returns difference between added and removed item counts.
   *
   */
  counter(): number;
  /**
   * Executes given function for each added item.
   * @param fn
   *
   */
  forEachAdded(fn: (added: V) => void): this;
  forEachRemoved(fn: (removed: V) => void): this;
  map<R>(fn: (value: V) => R): Result<R>;
}

/**
 * Describes a container having a length.
 */
declare abstract class HasLength {
  constructor();
  /**
   * Returns length of the underlying container.
   */
  abstract len(): number;
  /**
   * Returns `true` if the underlying container is empty (has zero length).
   */
  isEmpty(): boolean;
}
/**
 * Describes a container having both capacity and length.
 */
declare abstract class HasCapacity extends HasLength {
  _capacity: number;
  /**
   * Creates a new container with supplied capacity.
   * In case capacity is equal to zero, an error will be thrown.
   * @param capacity
   */
  constructor(capacity: number);
  /**
   * Returns capacity of the underlying container.
   *
   *
   */
  capacity(): number;
  /**
   * Returns `true` if the length of the underlying container reached its capacity.
   *
   *
   */
  isFull(): boolean;
  /**
   * Returns `true` if the length of the underlying container will reach (or already reached) its capacity.
   *
   *
   */
  willBeFull(): boolean;
}
/**
 * Destructable entity.
 */
interface Destroyable {
  /**
   * Destroys given entity (unlinks all references to it).
   */
  destroy(): void;
  /**
   * Clears unerlying storage of the entity.
   */
  clear(): void;
}
/**
 * Parent able to drop an item with the supplied key.
 */
interface Parent<K> {
  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   */
  drop(key: K): void;
}

/** Represents an absent value */
declare const NO_VALUE: {};
/** Absent value placeholder */
type AbsentValue = typeof NO_VALUE;

/**
 * `CacheStrategy` with implemented abstract methods.
 */
type CacheStrategyClass<V> = new (...args: any[]) => CacheStrategy<V> & {
  len(): number;
  drop(value: V): boolean;
  take(): V | AbsentValue;
  peek(): V | AbsentValue;
  has(value: V): boolean;
};
/**
 * Describes some strategy holding up to `capacity` items at the same moment.
 */
declare abstract class CacheStrategy<V>
  extends HasCapacity
  implements Destroyable, Parent<V> {
  _parents: Iterable<Parent<CacheStrategy<V>>>;
  constructor(capacity: number, roots?: Iterable<Parent<CacheStrategy<V>>>);
  /**
   * Records read access of the supplied item.
   * @param value
   *
   */
  read(value: V): Result<V>;
  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  write(value: V): Result<V>;
  /**
   * Calls a `destroy` implementation that will unlink given storage from all entities
   * referencing it.
   *
   */
  destroy(): void;
  /**
   * Removes all items from the storage.
   *
   */
  clear(): void;
  /**
   * Removes supplied item from the queue.
   * @param value
   *
   */
  abstract drop(value: V): boolean;
  /**
   * Removes an item from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  abstract take(): V | AbsentValue;
  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  abstract peek(): V | AbsentValue;
  /**
   * Returns `true` if given item exists in the queue.
   * @param node
   *
   */
  abstract has(value: V): boolean;
  /**
   * Reserves place for an item.
   * @param value
   */
  protected reservePlace(value: V): Result<V>;
}

/**
 * The path from the parent to the child.
 */
declare class ChildPath<K> {
  /**
   * Parent.
   */
  parent: Parent<K>;
  /**
   * The key under which the child is stored.
   * If it's a `NO_VALUE`, then the child is stored under the key equal to itself.
   */
  key: K | AbsentValue;
  constructor(parent: Parent<K>, key: K | AbsentValue);
}
/**
 * Storage callbacks.
 */
interface StorageParams<K, V> {
  /**
   * Callback to be called on the storage creation.
   * @param storage
   */
  onCreateStorage?: (storage: Storage<K, V>) => void;
  /**
   * Callback to be called on the storage removal.
   * @param storage
   */
  onRemoveStorage?: (storage: Storage<K, V>) => void;
}
/**
 * Key-value storage.
 */
declare abstract class Storage<K, V>
  extends HasLength
  implements Destroyable, Parent<K> {
  /**
   * Paths from parents to the given storage.
   */
  parentPaths: Iterable<ChildPath<K | Storage<K, V>>>;
  /**
   * Parameters.
   */
  params: StorageParams<K, V>;
  destroyed: boolean;
  constructor(
    params?: StorageParams<K, V>,
    parentPaths?: Iterable<ChildPath<K | Storage<K, V>>>
  );
  /**
   * Calls a `destroy` implementation that will unlink given storage from all entities
   * referencing it.
   *
   */
  destroy(): void;
  /**
   * Returns `true` if supplied is weak, and thus won't be stored directly.
   * @param key
   */
  isWeak(_key: K): boolean;
  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(key: K): boolean;
  /**
   * Retrieves an item corresponding to the supplied key.
   * @param key
   *
   */
  abstract get(key: K): V | AbsentValue;
  /**
   * Associates supplied item with the key.
   * @param key
   * @param value
   *
   */
  abstract set(key: K, value: V): void;
  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   *
   */
  abstract drop(key: K): V | AbsentValue;
  /**
   * Removes all items from the storage.
   *
   */
  abstract clear(): void;
  /**
   * Returns an iterator over the entries.
   *
   */
  abstract entries(): SizedIterable<{
    key: K;
    value: V;
  }>;
}

/**
 * Leaf storage callbacks.
 */
interface LeafStorageParams<K, V> extends StorageParams<K, V> {
  /** Callback to be called on the leaf creation */
  onCreateLeaf?: (leafStorage: K) => void;
  /** Callback to be called on the leaf removal */
  onRemoveLeaf?: (leafStorage: K) => void;
}
/**
 * Stores leaf key -> value pairs.
 */
declare class LeafStorage<K, V> extends Storage<K, V> implements Destroyable {
  params: LeafStorageParams<K, V>;
  storage: Storage<K, V>;
  strategy: CacheStrategy<K>;
  dropStorageValue: (key: K) => boolean;
  constructor(
    storage: Storage<K, V>,
    strategy: CacheStrategy<K>,
    params: LeafStorageParams<K, V>,
    rootPath?: Iterable<ChildPath<K>>
  );
  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number;
  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   *
   */
  drop(key: K): V | AbsentValue;
  /**
   * Retrieves an item corresponding to the supplied key.
   * @param key
   *
   */
  get(key: K): V | AbsentValue;
  /**
   * Associates supplied item with the key.
   * @param key
   * @param value
   *
   */
  set(key: K, value: V): void;
  /**
   * Removes an item from the beginning of the queue.
   *
   */
  take(): K | AbsentValue;
  2: any;
  /**
   * Calls a `destroy` implementations that will unlink given storage from all entities
   * referencing it for both storage and cache strategy.
   *
   */
  destroy(): void;
  /**
   * Removes all items from the storage and cache strategy.
   *
   */
  clear(): void;
  /**
   * Returns an iterator over the entries.
   *
   */
  entries(): SizedIterable<{
    key: K;
    value: V;
  }>;
  /**
   * Executes callbacks for each added/removed item.
   * @param result
   */
  private handleResult;
}

/** Parameters for the `UnifiedStorage` */
interface UnifiedStorageParams<K, V> extends StorageParams<K, V> {
  /** Denotes if the object storage must be used for values with primitive keys */
  useObjectStorage: boolean;
  /** Denotes if the weak storage must be used for values with non-primitive keys */
  useWeakStorage: boolean;
}

/**
 * Either leaf storage or nested storage containing either nested storages or leaf storages.
 */
type NestedStorage<K, V> =
  | LeafStorage<K, V>
  | Storage<K, NestedStorage<K, V> | LeafStorage<K, V> | V>;
/**
 * Params for the storage context.
 */
interface Params<K, V>
  extends UnifiedStorageParams<K, V>,
    LeafStorageParams<K, V>,
    StorageParams<K, V> {
  /**
   * Total limit for the storages (cache nodes).
   */
  totalStoragesLimit?: number;
  /**
   * Total limit for the leaves (cache entries). Default is 10000.
   */
  totalLeavesLimit?: number;
  /**
   * Limit of the leaves per a single leaf storage.
   */
  leavesPerStorageLimit?: number;
  /**
   * Total limit of the leaf storages.
   */
  totalLeafStoragesLimit?: number;
  /**
   * Either strategy class or different strategy classes for leaves and storage nodes.
   */
  strategy?: StrategyConfig<K, V> | CacheStrategyClass<unknown>;
}
/**
 * Config for the leaf and storage cache strategies.
 */
type StrategyConfig<K, V> = {
  leafStrategyClass: CacheStrategyClass<K | LeafStorage<K, V>>;
  storageStrategyClass: CacheStrategyClass<NestedStorage<K, V>>;
};

/** Params interface extended with optional length and checkLast flag */
interface ParamsWithLength<K, V> extends Params<K, V> {
  /** Overrides function length */
  length?: number;
  /** Check last arguments or not (default to `true`) */
  checkLast?: boolean;
}
/**
 * Memoizes provided function returning wrapped version of the provided function.
 * Returned function will return the calculated value if it's present in the cache for the arguments according to `Same-value-zero` algorithm.
 * If no value is found, the underlying function will be called with provided arguments.
 * @param func
 * @param params
 */
declare function memoize<K, V>(
  func: (...args: K[]) => V,
  { length, checkLast, ...params }?: ParamsWithLength<K, V>
): typeof func;

/**
 * Creates memoized selector.
 */
declare const createMemoizedSelector: (
  ...params: any[]
) => {
  (): any;
  recomputations(): any;
  dependencies: any[];
  resultFunction: any;
};

/**
 * @abstract
 * An ordered collection of items which can be walked in two directions.
 */
declare abstract class OrderedCollection<
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
declare abstract class IndexedCollectionWithOrderedKeys<
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
declare abstract class OrderedIndexedCollection<
    K,
    V,
    E = V,
    Absent = AbsentValue
  >
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
 * A node of the double-ended linked list.
 */
declare class ListNode<T> {
  root: LinkedList<T> | null;
  next: ListNode<T> | null;
  prev: ListNode<T> | null;
  value: T;
  constructor(
    value: T,
    root: LinkedList<T>,
    prev?: ListNode<T> | null,
    next?: ListNode<T> | null
  );
  /**
   * Inserts supplied value before the current node.
   * @param value
   *
   */
  insertPrev(value: T): ListNode<T>;
  /**
   * Inserts supplied value after the current node.
   * @param value
   *
   */
  insertNext(value: T): ListNode<T>;
  /**
   * Disconnects current node from its predecessor and successor.
   *
   */
  disconnect(): void;
}
/**
 * Double-ended linked list.
 */
declare class LinkedList<T> extends OrderedCollection<T, ListNode<T>, null> {
  length: number;
  head: ListNode<T> | null;
  tail: ListNode<T> | null;
  constructor(values?: Iterable<T>);
  /**
   * Pushes an element to the back of the list.
   * @param element
   *
   */
  pushBack(element: T): ListNode<T>;
  /**
   * Pushes an element to the front of the list.
   * @param element
   *
   */
  pushFront(element: T): ListNode<T>;
  /**
   * Moves node to the front of the queue.
   * Returns `false` if element doesn't belong to the given list.
   * @param node
   *
   */
  moveFront(node: ListNode<T>): boolean;
  /**
   * Moves node to the back of the queue.
   * Returns `false` if element doesn't belong to the given list.
   * @param node
   *
   */
  moveBack(node: ListNode<T>): boolean;
  /**
   * Peeks a value from the front of the queue.
   * Returns either item or `null` if queue is empty.
   *
   */
  peekFront(): T | null;
  /**
   * Peeks a value from the back of the queue.
   * Returns either item or `null` if queue is empty.
   *
   */
  peekBack(): T | null;
  /**
   * Takes a value from the back of the queue.
   * Returns either item or `null` if queue is empty.
   *
   */
  takeBack(): T | null;
  /**
   * Takes front node from the list.
   * Returns `null` if list has no elements.
   *
   */
  takeFront(): T | null;
  /**
   * Inserts given value after the supplied raw linked list node.
   * @param node
   * @param value
   *
   */
  insertAfter(node: ListNode<T>, value: T): ListNode<T>;
  /**
   * Inserts given value before the supplied raw linked list node.
   * @param node
   * @param value
   *
   */
  insertBefore(node: ListNode<T>, value: T): ListNode<T>;
  /**
   * Removes given node from the list.
   * Returns `false` if element doesn't belong to the given list.
   * @param element
   */
  remove(element: ListNode<T>): boolean;
  /**
   * Returns amount of items stored in the list.
   *
   */
  len(): number;
  /**
   * Returns an iterator over collection values starting from the end.
   */
  valuesBack(): SizedIterable<T>;
  /**
   * Returns an iterator over collection values starting from the beginning.
   */
  valuesFront(): SizedIterable<T>;
}

/**
 * An indexed queue where each item is an indexed queue of keys.
 * An item itself should implement `OrderedIndexedCollection`.
 */
declare class MultiKeyQueue<
  K,
  V extends OrderedIndexedCollection<K, K, E>,
  E = K
> extends OrderedIndexedCollection<K, V, ListNode<V>> {
  list: LinkedList<V>;
  map: Storage<K, ListNode<V>>;
  constructor(values?: Iterable<V>);
  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number;
  /**
   * Drops an item ass3ociated with the supplied key.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  drop(key: K): V | AbsentValue;
  /**
   * Moves node to the front of the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  moveFront(listNode: ListNode<V>): boolean;
  /**
   * Moves node to the back of the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  moveBack(listNode: ListNode<V>): boolean;
  /**
   * Removes an item from the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  remove(listNode: ListNode<V>): boolean;
  /**
   * Drops supplied key from the map.
   * Item belonging to this key will be deleted only if it has no more references in the map.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  dropKey(key: K): V | AbsentValue;
  /**
   * Inserts given value after the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertAfter(node: ListNode<V>, value: V): ListNode<V>;
  /**
   * Inserts given value before the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertBefore(node: ListNode<V>, value: V): ListNode<V>;
  /**
   * Returns value associated with the given key or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  get(key: K): ListNode<V> | AbsentValue;
  /**
   * Adds a key for the supplied element to the beginning of its queue.
   * @param key
   * @param listNode
   *
   */
  addKeyFront(key: K, item: ListNode<V>): ListNode<V>;
  /**
   * Adds a key for the supplied element to the end of its queue.
   * @param key
   * @param listNode
   *
   */
  addKeyBack(key: K, item: ListNode<V>): ListNode<V>;
  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(node: K): boolean;
  /**
   * Takes a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeFront(): V | AbsentValue;
  /**
   * Takes a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeBack(): V | AbsentValue;
  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekFront(): V | AbsentValue;
  /**
   * Peeks a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekBack(): V | AbsentValue;
  /**
   * Peeks a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyFront(): K | AbsentValue;
  /**
   * Peeks a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyBack(): K | AbsentValue;
  /**
   * Takes a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyFront(): K | AbsentValue;
  /**
   * Takes a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyBack(): K | AbsentValue;
  /**
   * Returns an iterator over values.
   *
   */
  valuesFront(): SizedIterable<V>;
  /**
   * Returns an iterator over values.
   *
   */
  valuesBack(): SizedIterable<V>;
  /**
   * Returns an iterator over keys starting from the beginning.
   *
   */
  keysFront(): Iterable<K>;
  /**
   * Returns an iterator over keys starting from the end.
   *
   */
  keysBack(): Iterable<K>;
  /**
   * Pushes an item to the end of the queue.
   * @param value
   *
   */
  pushBack(value: V): ListNode<V>;
  /**
   * Pushes an item to the beginning of the queue.
   * @param value
   *
   */
  pushFront(value: V): ListNode<V>;
  /**
   * Associates keys of the provided value with the supplied raw linked list node.
   * @param value
   * @param node
   *
   */
  private assocKeys;
  /**
   * Dissociates keys of the provided value.
   * @param value
   * @param node
   *
   */
  private dissocKeys;
}

/**
 * Wrapper class which represents ordered indexed collection with a single item.
 */
declare class Single<V> extends OrderedIndexedCollection<V, V, V> {
  value: V | AbsentValue;
  constructor(value: V);
  pushFront(value: V): V;
  pushBack(value: V): V;
  takeKeyFront(): V | AbsentValue;
  takeKeyBack(): V | AbsentValue;
  peekKeyFront(): V | AbsentValue;
  peekKeyBack(): V | AbsentValue;
  addKeyFront(_: V, item: V): V;
  addKeyBack(_: V, item: V): V;
  dropKey(value: V): V | AbsentValue;
  get(value: V): V | AbsentValue;
  keysFront(): Iterable<V>;
  keysBack(): Iterable<V>;
  takeFront(): {} | V;
  takeBack(): {} | V;
  has(value: V): boolean;
  drop(value: V): {};
  peekFront(): {} | V;
  peekBack(): {} | V;
  moveFront(element: V): boolean;
  moveBack(element: V): boolean;
  remove(element: V): boolean;
  valuesFront(): SizedIterable<V>;
  valuesBack(): SizedIterable<V>;
  len(): number;
}

/**
 * `L`east `R`ecently `U`sed cache schema.
 */
declare class LRU<V> extends CacheStrategy<V> {
  queue: MultiKeyQueue<V, Single<V>>;
  constructor(capacity: number, roots?: Iterable<CacheStrategy<LRU<V>>>);
  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number;
  /**
   * Returns `true` if given item exists in the queue.
   * @param node
   *
   */
  has(node: V): boolean;
  /**
   * Removes supplied item from the queue.
   * @param node
   *
   */
  drop(node: V): boolean;
  /**
   * Records read access of the supplied item.
   * @param value
   *
   */
  read(value: V): Result<V>;
  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  write(value: V): Result<V>;
  private touch;
  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peek(): V | AbsentValue;
  /**
   * Removes an item from the beginning of the queue.
   *
   */
  take(): V | AbsentValue;
}

/** Describes a cache entry containing ordered values and its level. */
declare class LevelEntry<
  V,
  E,
  S extends OrderedIndexedCollection<V, Single<V>, E>
> extends OrderedIndexedCollection<V, V, E> {
  level: number;
  entry: S;
  constructor(level: number, entry: S);
  pushFront(value: V): E;
  pushBack(value: V): E;
  takeFront(): {} | Single<V>;
  takeBack(): {} | Single<V>;
  peekFront(): {} | Single<V>;
  peekBack(): {} | Single<V>;
  takeKeyFront(): {} | V;
  takeKeyBack(): {} | V;
  get(key: V): {} | E;
  dropKey(key: V): {} | E;
  has(value: V): boolean;
  addKeyFront(key: V, item: E): E;
  addKeyBack(key: V, item: E): E;
  peekKeyFront(): {} | V;
  peekKeyBack(): {} | V;
  moveBack(element: E): boolean;
  moveFront(element: E): boolean;
  remove(element: E): boolean;
  valuesFront(): SizedIterable<V>;
  valuesBack(): SizedIterable<V>;
  keysFront(): Iterable<V>;
  keysBack(): Iterable<V>;
  len(): number;
  drop(value: V): {} | E;
}
type Entry<V> = LevelEntry<V, ListNode<Single<V>>, MultiKeyQueue<V, Single<V>>>;
/**
 * `L`east `F`requently `U`used cache schema.
 */
declare class LFU<V> extends CacheStrategy<V> {
  queue: MultiKeyQueue<V, Entry<V>, ListNode<Single<V>>>;
  constructor(capacity: number, root?: CacheStrategy<LFU<V>>);
  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number;
  /**
   * Records read access of the supplied item.
   * @param value
   *
   */
  read(value: V): Result<V>;
  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  write(value: V): Result<V>;
  private touch;
  /**
   * Returns `true` if given item exists in the queue.
   * @param node
   *
   */
  has(node: V): boolean;
  /**
   * Removes supplied item from the queue.
   * @param node
   *
   */
  drop(node: V): boolean;
  /**
   * Takes a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  take(): V | AbsentValue;
  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peek(): V | AbsentValue;
  private buildLevelEntry;
}

/**
 * `F`irst in - `F`irst out cache strategy.
 */
declare class FIFO<V> extends CacheStrategy<V> {
  queue: MultiKeyQueue<V, Single<V>>;
  constructor(capacity: number, roots?: Iterable<CacheStrategy<FIFO<V>>>);
  /**
   * Returns amount of stored items.
   *
   */
  len(): number;
  /**
   * Returns `true` if given item exists in the queue.
   * @param node
   *
   */
  has(node: V): boolean;
  /**
   * Removes supplied item from the queue.
   * @param node
   *
   */
  drop(node: V): boolean;
  /**
   * Records read access of the supplied item.
   * @param value
   *
   */
  read(value: V): Result<V>;
  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  write(value: V): Result<V>;
  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peek(): V | AbsentValue;
  /**
   * Removes an item from the beginning of the queue.
   *
   */
  take(): V | AbsentValue;
}

/** Default limit for the cache entries (leaf values) */
declare const DEFAULT_MAX_ENTRIES_COUNT = 10000;

export {
  DEFAULT_MAX_ENTRIES_COUNT,
  FIFO,
  LFU,
  LRU,
  createMemoizedSelector,
  memoize as default,
  memoize,
};
