/** Represents an absent value */
declare const NO_VALUE: symbol;
/** Absent value placeholder */
type AbsentValue = typeof NO_VALUE;

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
   * Drops all references to the supplied entity.
   */
  destroy(): void;
}
/**
 * Clearable entity.
 */
interface Clearable {
  /**
   * Removes all entities from the underlying storage.
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
/**
 * The path from the parent to the child.
 * If the key is a `NO_VALUE`, then the child is stored under the key equal to itself.
 */
declare class ParentPath<K> {
  /**
   * Parent.
   */
  parent: Parent<K>;
  /**
   * The key under which the child is stored.
   * If it's a `NO_VALUE`, then the child is stored under the key identical to itself.
   */
  key: K | AbsentValue;
  constructor(parent: Parent<K>, key: K | AbsentValue);
  drop(child: K): void;
}
/**
 * Contains removed/added entities.
 */
declare class Result<V> {
  removed: Iterable<V>;
  added: Iterable<V>;
  static EMPTY_RESULT: Result<unknown>;
  private constructor();
  /** Creates a result containing added entities */
  static added<V>(added: Iterable<V>): Result<V>;
  /** Creates a result containing removed entities */
  static removed<V>(removed: Iterable<V>): Result<V>;
  /**
   * Creates a result containing removed and added entities.
   * @param removed
   * @param added
   */
  static removedAdded<V>(removed: Iterable<V>, added: Iterable<V>): Result<V>;
  /**
   * Creates an empty result.
   */
  static empty<V>(): Result<V>;
  /**
   * Appends remove/added items from the supplied result to the current result.
   * @param result
   */
  chain(result: Result<V>): Result<V>;
  /**
   * Executes given function for each added item.
   * @param fn
   *
   */
  forEachAdded(fn: (added: V) => void): this;
  /**
   * Executes given function for each removed item.
   * @param fn
   *
   */
  forEachRemoved(fn: (removed: V) => void): this;
}

/**
 * Describes some strategy holding up to `capacity` items at the same moment.
 */
declare abstract class CacheStrategy<V>
  extends HasCapacity
  implements Clearable, Parent<V>
{
  constructor(capacity: number);
  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  abstract write(value: V): Result<V>;
  /**
   * Records read access of the supplied item. Throws an error if an item doesn't exist.
   * @param value
   *
   */
  abstract read(value: V): Result<V>;
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
   * @param value
   *
   */
  abstract has(value: V): boolean;
  /**
   * Removes all items from the strategy.
   *
   */
  clear(): void;
  /**
   * Reserves place for a new item.
   * @param value
   */
  protected reservePlace(): Result<V>;
}
/**
 * `CacheStrategy` with implemented abstract methods.
 */
type CacheStrategyClass<V> = new (...args: any[]) => CacheStrategy<V> & {
  len(): number;
  write(value: V): Result<V>;
  read(value: V): Result<V>;
  drop(value: V): boolean;
  take(): V | AbsentValue;
  peek(): V | AbsentValue;
  has(value: V): boolean;
};

/**
 * Key-value storage.
 */
declare abstract class Storage<K, V>
  extends HasLength
  implements Destroyable, Clearable, Parent<K>
{
  /**
   * Paths from parents to the given storage.
   */
  parentPaths: Iterable<ParentPath<K | Storage<K, V>>>;
  /**
   * Parameters.
   */
  params: StorageParams<K, V>;
  destroyed: boolean;
  constructor(
    params?: StorageParams<K, V>,
    parentPaths?: Iterable<ParentPath<K | Storage<K, V>>>
  );
  /**
   * Calls a `destroy` implementation that will unlink given storage from all entities
   * referencing it.
   *
   */
  destroy(): void;
  /**
   * Returns `true` if supplied key is weak, and thus won't be stored directly.
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
  abstract entries(): Iterable<{
    key: K;
    value: V;
  }>;
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
declare class LeafStorage<K, V> extends Storage<K, V> {
  params: LeafStorageParams<K, V>;
  storage: Storage<K, V>;
  strategy: CacheStrategy<K>;
  dropStorageValue: (key: K) => boolean;
  constructor(
    storage: Storage<K, V>,
    strategy: CacheStrategy<K>,
    params: LeafStorageParams<K, V>,
    parentPaths?: Iterable<ParentPath<K | LeafStorage<K, V>>>
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
  /**
   * Removes all items from the storage and cache strategy.
   *
   */
  clear(): void;
  /**
   * Returns an iterator over the entries.
   *
   */
  entries(): Iterable<{
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
  useObjectStorage?: boolean;
  /** Denotes if the weak storage must be used for values with non-primitive keys */
  useWeakStorage?: boolean;
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
  strategy?:
    | StrategyConfig<K, V>
    | CacheStrategyClass<K | LeafStorage<K, V> | NestedStorage<K, V>>;
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
 * Memoizes provided function returning wrapped version of it.
 * Result function will return value without calling the supplied function if it's present in the cache for the supplied arguments according to `Same-value-zero` algorithm.
 * If no value is found, the underlying function will be called with provided arguments.
 * @param func
 * @param params
 */
declare function memoize<V>(
  func: (...args: any[]) => V,
  { length: depth, checkLast, ...params }?: ParamsWithLength<any, V>
): typeof func & {
  recomputations: number;
};

/**
 * Creates memoized selector. If last argument is an object, it will be treated as configuration.
 */
declare const createMemoizedSelector: (...params: any[]) => Function;

/**
 * @abstract
 * An ordered collection of items which can be walked in two directions.
 */
declare abstract class OrderedCollection<
  Value,
  Item,
  Absent = AbsentValue
> extends HasLength {
  /**
   * Adds an item to the end of the collection.
   * Returns either created item or absent value in case value can't be added.
   * @param value
   *
   */
  abstract pushBack(value: Value): Item | Absent;
  /**
   * Pushes an item to the beginning of the collection.
   * Returns either created item or absent value in case value can't be added.
   * @param value
   *
   */
  abstract pushFront(value: Value): Item | Absent;
  /**
   * Moves an item to the beginning of the collection.
   * Returns `true` in case of success.
   * @param item
   *
   */
  abstract moveFront(item: Item): boolean;
  /**
   * Moves an item to the back.
   * Returns `true` in case of success.
   * @param item
   *
   */
  abstract moveBack(item: Item): boolean;
  /**
   * Removes an item from the collection.
   * Returns `true` in case of success.
   */
  abstract remove(item: Item): boolean;
  /**
   * Returns `true` if supplied item belongs to the collection.
   */
  abstract contains(item: Item): boolean;
  /**
   * Takes a value from the end of the collection.
   */
  abstract takeBack(): Value | Absent;
  /**
   * Takes a value from the beginning of the collection.
   */
  abstract takeFront(): Value | Absent;
  /**
   * Inserts given value after the supplied item returning new item.
   * Returns `Absent` in case supplied item doesn't belong to this list.
   */
  abstract insertAfter(item: Item, value: Value): Item | Absent;
  /**
   * Inserts given value before the supplied item returning new item.
   * Returns `Absent` in case supplied item doesn't belong to this list.
   *
   */
  abstract insertBefore(item: Item, value: Value): Item | Absent;
  /**
   * Peeks a value from the end of the collection.
   */
  abstract peekBack(): Value | Absent;
  /**
   * Peeks a value from the beginning of the collection.
   */
  abstract peekFront(): Value | Absent;
  /**
   * Peeks an item from the beginning of the collection.
   * Returns either item or `NO_VALUE` if collection is empty.
   */
  abstract peekItemFront(): Item | Absent;
  /**
   * Peeks an item from the end of the collection.
   * Returns either item or `NO_VALUE` if collection is empty.
   */
  abstract peekItemBack(): Item | Absent;
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
declare abstract class IndexedOrderedCollection<
  Key,
  Value,
  Item,
  Absent = AbsentValue
> extends OrderedCollection<Value, Item, Absent> {
  /**
   * Retrieves an item associated with the provided key returning it.
   * Returns `NO_VALUE` if the item with the given key didn't exist.
   */
  abstract get(key: Key): Item | Absent;
  /**
   * Returns `true` if collection has an item associated with the provided key.
   */
  abstract has(key: Key): boolean;
  /**
   * Drops an item associated with the provided key returning it.
   * Returns `NO_VALUE` if the item with the given key didn't exist.
   */
  abstract drop(key: Key): Value | Absent;
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
declare abstract class IndexedOrderedCollectionWithOrderedKeys<
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
  keys(): Iterable<Key>;
}

/**
 * A node of the double-ended linked list.
 */
declare class ListNode<T> implements Destroyable {
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
  unlink(): void;
  /**
   * Disconnects current node from its predecessor, successor and root.
   *
   */
  destroy(): void;
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
   * Pushes an node to the back of the list.
   * @param node
   *
   */
  pushBack(node: T): ListNode<T>;
  /**
   * Pushes an node to the front of the list.
   * @param node
   *
   */
  pushFront(node: T): ListNode<T>;
  /**
   * Moves node to the front of the queue.
   * Returns `false` if node doesn't belong to the given list.
   * @param node
   *
   */
  moveFront(node: ListNode<T>): boolean;
  /**
   * Moves node to the back of the queue.
   * Returns `false` if node doesn't belong to the given list.
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
   * Peeks an item from the front of the queue.
   * Returns either item or `null` if queue is empty.
   *
   */
  peekItemFront(): ListNode<T> | null;
  /**
   * Peeks an item from the end of the queue.
   * Returns either item or `null` if queue is empty.
   *
   */
  peekItemBack(): ListNode<T> | null;
  /**
   * Takes a value from the back of the queue.
   * Returns either item or `null` if queue is empty.
   *
   */
  takeBack(): T | null;
  /**
   * Takes front node from the list.
   * Returns `null` if list has no nodes.
   *
   */
  takeFront(): T | null;
  /**
   * Inserts given value after the supplied raw linked list node.
   * Returns `null` in case supplied node doesn't belong to this list.
   * @param node
   * @param value
   *
   */
  insertAfter(node: ListNode<T>, value: T): ListNode<T> | null;
  /**
   * Inserts given value before the supplied raw linked list node.
   * Returns `null` in case supplied node doesn't belong to this list.
   * @param node
   * @param value
   *
   */
  insertBefore(node: ListNode<T>, value: T): ListNode<T>;
  /**
   * Returns `true` if supplied node belongs to the list.
   * @param node
   */
  contains(node: ListNode<T>): boolean;
  /**
   * Removes given node from the list.
   * Returns `false` if node doesn't belong to the given list.
   * @param node
   */
  remove(node: ListNode<T>): boolean;
  /**
   * Returns amount of items stored in the list.
   *
   */
  len(): number;
  /**
   * Returns an iterator over collection values starting from the end.
   */
  valuesBack(): Iterable<T>;
  /**
   * Returns an iterator over collection values starting from the beginning.
   */
  valuesFront(): Iterable<T>;
}

/**
 * An indexed queue where each item is an indexed queue of keys.
 * A value itself should implement `IndexedOrderedCollection`.
 */
declare class MultiKeyQueue<
  Key,
  Value extends IndexedOrderedCollection<Key, Key, InnerItem>,
  InnerItem = Key
> extends IndexedOrderedCollectionWithOrderedKeys<Key, Value, ListNode<Value>> {
  list: LinkedList<Value>;
  map: Storage<Key, ListNode<Value>>;
  constructor(values?: Iterable<Value>);
  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number;
  /**
   * Drops an item associated with the supplied key.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  drop(key: Key): Value | AbsentValue;
  /**
   * Moves node to the front of the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  moveFront(listNode: ListNode<Value>): boolean;
  /**
   * Moves node to the back of the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  moveBack(listNode: ListNode<Value>): boolean;
  /**
   * Removes an item from the queue.
   * Returns `true` in case of success.
   * @param listNode
   *
   */
  remove(listNode: ListNode<Value>): boolean;
  /**
   * Returns `true` if supplied item belongs to the collection.
   */
  contains(listNode: ListNode<Value>): boolean;
  /**
   * Drops supplied key from the map.
   * Item belonging to this key will be deleted only if it has no more references in the map.
   * Returns `true` in case of a successful removal or `false` if the value wasn't found.
   * @param key
   *
   */
  dropKey(key: Key): boolean;
  /**
   * Inserts given value after the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertAfter(
    node: ListNode<Value>,
    value: Value
  ): ListNode<Value> | AbsentValue;
  /**
   * Inserts given value before the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertBefore(
    node: ListNode<Value>,
    value: Value
  ): ListNode<Value> | AbsentValue;
  /**
   * Returns value associated with the given key or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  get(key: Key): ListNode<Value> | AbsentValue;
  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(node: Key): boolean;
  /**
   * Adds a key for the supplied item to the beginning of its queue.
   * @param key
   * @param listNode
   *
   */
  addKeyFront(key: Key, item: ListNode<Value>): boolean;
  /**
   * Adds a key for the supplied item to the end of its queue.
   * @param key
   * @param listNode
   *
   */
  addKeyBack(key: Key, item: ListNode<Value>): boolean;
  /**
   * Takes a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeFront(): Value | AbsentValue;
  /**
   * Takes a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeBack(): Value | AbsentValue;
  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekFront(): Value | AbsentValue;
  /**
   * Peeks a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekBack(): Value | AbsentValue;
  /**
   * Peeks an item from the beginning of the collection.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  peekItemFront(): AbsentValue | ListNode<Value>;
  /**
   * Peeks an item from the end of the collection.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  peekItemBack(): AbsentValue | ListNode<Value>;
  /**
   * Peeks a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyFront(): Key | AbsentValue;
  /**
   * Peeks a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyBack(): Key | AbsentValue;
  /**
   * Takes a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyFront(): Key | AbsentValue;
  /**
   * Takes a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyBack(): Key | AbsentValue;
  /**
   * Returns an iterator over values.
   *
   */
  valuesFront(): Iterable<Value>;
  /**
   * Returns an iterator over values.
   *
   */
  valuesBack(): Iterable<Value>;
  /**
   * Returns an iterator over keys starting from the beginning.
   *
   */
  keysFront(): Iterable<Key>;
  /**
   * Returns an iterator over keys starting from the end.
   *
   */
  keysBack(): Iterable<Key>;
  /**
   * Pushes an item to the end of the queue.
   * @param value
   *
   */
  pushBack(value: Value): ListNode<Value>;
  /**
   * Pushes an item to the beginning of the queue.
   * @param value
   *
   */
  pushFront(value: Value): ListNode<Value>;
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
declare class Single<V> extends IndexedOrderedCollectionWithOrderedKeys<
  V,
  V,
  V
> {
  value: V | AbsentValue;
  constructor(value: V);
  pushFront(value: V): V | AbsentValue;
  pushBack(value: V): V | AbsentValue;
  takeKeyFront(): V | AbsentValue;
  takeKeyBack(): V | AbsentValue;
  peekKeyFront(): V | AbsentValue;
  peekKeyBack(): V | AbsentValue;
  peekItemFront(): V | AbsentValue;
  peekItemBack(): V | AbsentValue;
  addKeyFront(_key: V, _item: V): boolean;
  addKeyBack(_key: V, _item: V): boolean;
  dropKey(value: V): boolean;
  get(value: V): V | AbsentValue;
  keysFront(): Iterable<V>;
  keysBack(): Iterable<V>;
  takeFront(): V | AbsentValue;
  takeBack(): V | AbsentValue;
  insertAfter(_item: V, _value: V): V | AbsentValue;
  insertBefore(_item: V, _value: V): V | AbsentValue;
  contains(item: V): boolean;
  has(value: V): boolean;
  drop(value: V): V | AbsentValue;
  peekFront(): V | AbsentValue;
  peekBack(): V | AbsentValue;
  moveFront(item: V): boolean;
  moveBack(item: V): boolean;
  remove(item: V): boolean;
  valuesFront(): Iterable<V>;
  valuesBack(): Iterable<V>;
  len(): number;
}

/**
 * An indexed queue of items where each item has a single key.
 */
declare class SingleKeyQueue<V> extends IndexedOrderedCollectionWithOrderedKeys<
  V,
  V,
  ListNode<Single<V>>
> {
  inner: MultiKeyQueue<V, Single<V>>;
  constructor(values?: Iterable<V>);
  /**
   * Pushes an item to the end of the queue.
   * @param value
   *
   */
  pushBack(value: V): ListNode<Single<V>> | AbsentValue;
  /**
   * Pushes an item to the beginning of the queue.
   * @param value
   *
   */
  pushFront(value: V): ListNode<Single<V>> | AbsentValue;
  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number;
  /**
   * Drops an item associated with the supplied key.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  drop(key: V): V | AbsentValue;
  /**
   * Moves node to the front of the queue.
   * Returns `true` in case of success.
   * @param item
   *
   */
  moveFront(item: ListNode<Single<V>>): boolean;
  /**
   * Moves node to the back of the queue.
   * Returns `true` in case of success.
   * @param item
   *
   */
  moveBack(item: ListNode<Single<V>>): boolean;
  /**
   * Removes an item from the queue.
   * Returns `true` in case of success.
   */
  remove(item: ListNode<Single<V>>): boolean;
  /**
   * Returns `true` if supplied item belongs to the collection.
   */
  contains(item: ListNode<Single<V>>): boolean;
  /**
   * Drops supplied key from the map.
   * Item belonging to this key will be deleted only if it has no more references in the map.
   * Returns dropped value in case of a successful drop or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  dropKey(key: V): boolean;
  /**
   * Inserts given value after the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertAfter(
    node: ListNode<Single<V>>,
    value: V
  ): ListNode<Single<V>> | AbsentValue;
  /**
   * Inserts given value before the supplied raw linked list node.
   * @param node
   * @param key
   *
   */
  insertBefore(
    node: ListNode<Single<V>>,
    value: V
  ): ListNode<Single<V>> | AbsentValue;
  /**
   * Returns value associated with the given key or `NO_VALUE` if the value wasn't found.
   * @param key
   *
   */
  get(key: V): AbsentValue | ListNode<Single<V>>;
  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(key: V): boolean;
  /**
   * Adds a key for the supplied item to the beginning of its queue.
   * @param key
   * @param item
   *
   */
  addKeyFront(key: V, item: ListNode<Single<V>>): boolean;
  /**
   * Adds a key for the supplied item to the end of its queue.
   * @param key
   * @param item
   *
   */
  addKeyBack(key: V, item: ListNode<Single<V>>): boolean;
  /**
   * Takes a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeFront(): AbsentValue | V;
  /**
   * Takes a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  takeBack(): AbsentValue | V;
  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekFront(): AbsentValue | V;
  /**
   * Peeks a value from the end of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  peekBack(): AbsentValue | V;
  /**
   * Peeks an item from the beginning of the collection.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  peekItemFront(): AbsentValue | ListNode<Single<V>>;
  /**
   * Peeks an item from the end of the collection.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  peekItemBack(): AbsentValue | ListNode<Single<V>>;
  /**
   * Peeks a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyFront(): AbsentValue | V;
  /**
   * Peeks a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  peekKeyBack(): AbsentValue | V;
  /**
   * Takes a key of the item from the beginning of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyFront(): AbsentValue | V;
  /**
   * Takes a key of the item from the end of the queue.
   * Returns either key or `NO_VALUE` if queue is empty.
   *
   */
  takeKeyBack(): AbsentValue | V;
  /**
   * Returns an iterator over values.
   *
   */
  valuesFront(): Iterable<V>;
  /**
   * Returns an iterator over values.
   *
   */
  valuesBack(): Iterable<V>;
  /**
   * Returns an iterator over keys starting from the beginning.
   *
   */
  keysFront(): Iterable<V>;
  /**
   * Returns an iterator over keys starting from the end.
   *
   */
  keysBack(): Iterable<V>;
}

/**
 * `L`east `R`ecently `U`sed cache replacement policy.
 */
declare class LRU<V> extends CacheStrategy<V> {
  queue: SingleKeyQueue<V>;
  constructor(capacity: number);
  /**
   * Returns amount of keys (references) stored in a map.
   *
   */
  len(): number;
  /**
   * Returns `true` if given item exists in the queue.
   * @param value
   *
   */
  has(value: V): boolean;
  /**
   * Removes supplied item from the queue.
   * @param value
   *
   */
  drop(value: V): boolean;
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

/**
 * `L`east `F`requently `U`used cache replacement policy.
 */
declare class LFU<V> extends CacheStrategy<V> {
  queue: MultiKeyQueue<V, LevelEntry<V>, ListNode<Single<V>>>;
  constructor(capacity: number);
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
  write(value: V): Result<V>;
  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  read(value: V): Result<V>;
  /**
   * Returns `true` if given item exists in the queue.
   * @param value
   *
   */
  has(value: V): boolean;
  /**
   * Removes supplied item from the queue.
   * @param value
   *
   */
  drop(value: V): boolean;
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
}
/** Describes a cache entry containing ordered values and its level. */
declare class LevelEntry<V> extends SingleKeyQueue<V> {
  level: number;
  constructor(level: number, value: V);
}

/**
 * `FIFO` - `F`irst `I`n - `F`irst `O`ut cache replacement policy.
 */
declare class FIFO<V> extends CacheStrategy<V> {
  queue: SingleKeyQueue<V>;
  constructor(capacity: number);
  /**
   * Returns amount of stored items.
   *
   */
  len(): number;
  /**
   * Returns `true` if given item exists in the queue.
   * @param value
   *
   */
  has(value: V): boolean;
  /**
   * Removes supplied item from the queue.
   * @param value
   *
   */
  drop(value: V): boolean;
  /**
   * Records read access of the supplied item.
   * @param value
   *
   */
  read(_value: V): Result<V>;
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
  CacheStrategy,
  DEFAULT_MAX_ENTRIES_COUNT,
  FIFO,
  LFU,
  LRU,
  createMemoizedSelector,
  memoize as default,
  memoize,
};
