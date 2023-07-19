import type { StorageParams } from "../base/Storage";
import { AbsentValue, Primitive } from "../value";

import { NO_VALUE } from "../value";
import { Storage } from "../base/Storage";
import { map } from "../iterators";
import type { ParentPath } from "../utils";

/**
 * Key-value storage for values with primitive keys based on an `Object`.
 */
export class ObjectStorage<K extends Primitive, V> extends Storage<K, V> {
  map: { [key: string | symbol]: V };
  length: number;

  constructor(
    params?: StorageParams<K, V>,
    rootPath?: Iterable<ParentPath<K>>
  ) {
    super(params, rootPath);
    this.length = 0;
    this.map = Object.create(null);
  }

  /**
   * Returns amount of items stored in a map.
   *
   */
  len(): number {
    return this.length;
  }

  /**
   * Returns `true` if value associated with the given key exists.
   * @param rawKey
   *
   */
  has(rawKey: K): boolean {
    const objKey = this.objectKeyFromRawKey(rawKey);

    return objKey in this.map;
  }

  /**
   * Retrieves an item corresponding to the supplied key.
   * @param rawKey
   *
   */
  get(rawKey: K): V | AbsentValue {
    const objKey = this.objectKeyFromRawKey(rawKey);

    if (objKey in this.map) {
      return this.map[objKey];
    } else {
      return NO_VALUE;
    }
  }

  /**
   * Drops an item corresponding to the supplied key.
   * @param key
   *
   */
  drop(rawKey: K): V | AbsentValue {
    const objKey = this.objectKeyFromRawKey(rawKey);
    let value = NO_VALUE;

    if (objKey in this.map) {
      this.length--;
      value = this.map[objKey];
      delete this.map[objKey];
    }

    return value;
  }

  /**
   * Associates supplied item with the key.
   * @param rawKey
   * @param value
   *
   */
  set(rawKey: K, value: V): void {
    const objKey = this.objectKeyFromRawKey(rawKey);
    const has = objKey in this.map;

    if (!has) {
      this.length++;
      this.map[objKey] = value;
    }
  }

  /**
   * Removes all items from the storage.
   *
   */
  clear(): void {
    this.length = 0;
    this.map = Object.create(null);
  }

  /**
   * Returns an iterator over the entries.
   *
   */
  entries(): Iterable<{ key: K; value: V }> {
    return map(
      (key) => ({
        key: this.rawKeyFromObjectKey(key),
        value: this.map[key],
      }),
      Reflect.ownKeys(this.map)
    );
  }

  /**
   * Converts provided raw key to the object key.
   * @param key
   */
  private objectKeyFromRawKey(key: K): string | symbol {
    const type = typeof key;

    switch (type) {
      case "number":
        return `0${key as number}`;
      case "string":
        return `1${key as string}`;
      case "boolean":
        return `2${key as boolean}`;
      case "bigint":
        return `3${key as bigint}`;
      case "undefined":
        return "4";
      case "symbol":
        return key as symbol;
      default:
        if (key === null) return "5";

        throw new TypeError(
          `Invalid value ${String(key)} with type ${type}, expected primitive`
        );
    }
  }

  /**
   * Instantiates a raw key from the provided object key.
   */
  private rawKeyFromObjectKey(key: string | symbol): K {
    switch (typeof key) {
      case "symbol":
        return key as K;
      case "string":
        const type = +key[0];

        switch (type) {
          case 0:
            return Number(key.slice(1)) as K;
          case 1:
            return key.slice(1) as K;
          case 2:
            return (key.slice(1) === "true") as K;
          case 3:
            return BigInt(key.slice(1) as string) as K;
          case 4:
            return undefined;
          case 5:
            return null;
          default:
            throw new TypeError(`Invalid type ${type} of key ${key}`);
        }
      default:
        throw new TypeError(`Invalid key ${key}, expected string or symbol`);
    }
  }
}
