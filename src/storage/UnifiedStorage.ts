import { isPrimitiveValue } from "../value";
import {
  ChildPath,
  Storage,
  StorageClass,
  StorageParams,
} from "../base/Storage";
import { WeakStorage } from "./WeakStorage";
import { ObjectStorage } from "./ObjectStorage";
import { MapStorage } from "./MapStorage";
import type { AbsentValue, NonPrimitive, Primitive } from "../value";
import { chain, SizedIterable } from "../iterators";

/** Parameters for the `UnifiedStorage` */
export interface UnifiedStorageParams<K, V> extends StorageParams<K, V> {
  /** Denotes if the object storage must be used for values with primitive keys */
  useObjectStorage: boolean;
  /** Denotes if the weak storage must be used for values with non-primitive keys */
  useWeakStorage: boolean;
}

/**
 * Storage for both primitive and non-primitives.
 */
export class UnifiedStorage<
  K extends Primitive | NonPrimitive,
  V
> extends Storage<K, V> {
  objectStorage: Storage<NonPrimitive, V>;
  primitiveStorage: Storage<Primitive, V>;
  droppedChilrenMask: number;

  constructor(
    params?: UnifiedStorageParams<K, V>,
    rootPath?: Iterable<ChildPath<K>>
  ) {
    super(params, rootPath);
    const PrimitiveStorage = params?.useObjectStorage
      ? ObjectStorage
      : MapStorage;
    const NonPrimitiveStorage = params?.useWeakStorage
      ? (WeakStorage as StorageClass<NonPrimitive, V>)
      : (MapStorage as StorageClass<NonPrimitive, V>);

    this.objectStorage = new NonPrimitiveStorage();
    this.primitiveStorage = new PrimitiveStorage();
  }

  /**
   * Returns `true` if supplied is weak, and thus won't be stored directly.
   * @param key
   */
  isWeak(key: K): boolean {
    return !isPrimitiveValue(key);
  }

  /**
   * Returns amount of items stored in a map.
   *
   */
  len(): number {
    return this.primitiveStorage.len() + this.objectStorage.len();
  }

  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(key: K): boolean {
    return isPrimitiveValue(key)
      ? this.primitiveStorage.has(key as Primitive)
      : this.objectStorage.has(key as NonPrimitive);
  }

  /**
   * Retrieves an item corresponding to the supplied key.
   * @param key
   *
   */
  get(key: Primitive | NonPrimitive): V | AbsentValue {
    return isPrimitiveValue(key)
      ? this.primitiveStorage.get(key as Primitive)
      : this.objectStorage.get(key as NonPrimitive);
  }

  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   *
   */
  drop(key: Primitive | NonPrimitive): V | AbsentValue {
    return isPrimitiveValue(key)
      ? this.primitiveStorage.drop(key as Primitive)
      : this.objectStorage.drop(key as NonPrimitive);
  }

  /**
   * Associates supplied item with the key.
   * @param key
   * @param value
   *
   */
  set(key: Primitive | NonPrimitive, value: V): void {
    if (isPrimitiveValue(key)) {
      this.primitiveStorage.set(key as Primitive, value);
    } else {
      this.objectStorage.set(key as NonPrimitive, value);
    }
  }

  /**
   * Removes all items from the storage.
   *
   */
  clear(): void {
    this.primitiveStorage.clear();
    this.objectStorage.clear();
  }

  /**
   * Returns an iterator over the entries.
   *
   */
  entries(): SizedIterable<{ key: K; value: V }> {
    return chain(
      this.primitiveStorage.entries() as SizedIterable<{ key: K; value: V }>,
      this.objectStorage.entries() as SizedIterable<{ key: K; value: V }>
    );
  }
}
