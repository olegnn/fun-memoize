import { isPrimitiveValue } from "../value";
import { Storage, StorageClass, StorageParams } from "../base/Storage";
import { WeakStorage } from "./WeakStorage";
import { ObjectStorage } from "./ObjectStorage";
import { MapStorage } from "./MapStorage";
import type { AbsentValue, NonPrimitive, Primitive } from "../value";
import { chain } from "../iterators";
import { mapImplemented, ChildPath } from "../utils";

/** Parameters for the `UnifiedStorage` */
export interface UnifiedStorageParams<K, V> extends StorageParams<K, V> {
  /** Denotes if the object storage must be used for values with primitive keys */
  useObjectStorage?: boolean;
  /** Denotes if the weak storage must be used for values with non-primitive keys */
  useWeakStorage?: boolean;
}

/**
 * Storage for both primitive and non-primitives.
 */
export class UnifiedStorage<
  K extends Primitive | NonPrimitive,
  V
> extends Storage<K, V> {
  nonPrimitiveStorage: Storage<NonPrimitive, V>;
  primitiveStorage: Storage<Primitive, V>;
  droppedChilrenMask: number;

  constructor(
    params?: UnifiedStorageParams<K, V>,
    rootPath?: Iterable<ChildPath<K>>
  ) {
    super(params, rootPath);
    const isMapImplemented = mapImplemented();
    const PrimitiveStorage =
      params?.useObjectStorage || !isMapImplemented
        ? (ObjectStorage as StorageClass<Primitive, V>)
        : (MapStorage as StorageClass<Primitive, V>);
    const NonPrimitiveStorage =
      params?.useWeakStorage || !isMapImplemented
        ? (WeakStorage as StorageClass<NonPrimitive, V>)
        : (MapStorage as StorageClass<NonPrimitive, V>);

    this.nonPrimitiveStorage = new NonPrimitiveStorage();
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
    return this.primitiveStorage.len() + this.nonPrimitiveStorage.len();
  }

  /**
   * Returns `true` if value associated with the given key exists.
   * @param key
   *
   */
  has(key: K): boolean {
    return isPrimitiveValue(key)
      ? this.primitiveStorage.has(key as Primitive)
      : this.nonPrimitiveStorage.has(key as NonPrimitive);
  }

  /**
   * Retrieves an item corresponding to the supplied key.
   * @param key
   *
   */
  get(key: Primitive | NonPrimitive): V | AbsentValue {
    return isPrimitiveValue(key)
      ? this.primitiveStorage.get(key as Primitive)
      : this.nonPrimitiveStorage.get(key as NonPrimitive);
  }

  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   *
   */
  drop(key: Primitive | NonPrimitive): V | AbsentValue {
    return isPrimitiveValue(key)
      ? this.primitiveStorage.drop(key as Primitive)
      : this.nonPrimitiveStorage.drop(key as NonPrimitive);
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
      this.nonPrimitiveStorage.set(key as NonPrimitive, value);
    }
  }

  /**
   * Removes all items from the storage.
   *
   */
  clear(): void {
    this.primitiveStorage.clear();
    this.nonPrimitiveStorage.clear();
  }

  /**
   * Returns an iterator over the entries.
   *
   */
  entries(): Iterable<{ key: K; value: V }> {
    return chain(
      this.primitiveStorage.entries() as Iterable<{ key: K; value: V }>,
      this.nonPrimitiveStorage.entries() as Iterable<{ key: K; value: V }>
    );
  }
}
