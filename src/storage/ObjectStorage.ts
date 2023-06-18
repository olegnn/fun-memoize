import type { ChildPath, StorageParams } from "../base/Storage";
import { isPrimitiveValue, AbsentValue } from "../value";

import { NO_VALUE } from "../value";
import { Storage } from "../base/Storage";
import { map, withSize, SizedIterable } from "../iterators";

/**
 * A key for the `ObjectStorage`.
 */
export class Key<K> {
  type: number;
  value: K;

  constructor(value: K) {
    if (!isPrimitiveValue(value)) {
      throw new TypeError(`Invalid value: ${value}, expected primitive`);
    }
    const type = Key.valueType(value);

    this.type = type;
    this.value = value;
  }

  /**
   * Returns type index for the provided value.
   */
  static valueType<K>(value: K): number {
    const type = typeof value;

    switch (type) {
      case "number":
        switch (value) {
          case Infinity:
            return 7;
          case -Infinity:
            return 8;
          default:
            return 0;
        }
      case "bigint":
        return 1;
      case "string":
        return 2;
      case "undefined":
        return 3;
      case "symbol":
        return 4;
      case "boolean":
        return 5;
      default:
        if (value == null) return 6;
    }

    throw new TypeError(
      `Invalid value ${value} with type ${type}, expected primitive`
    );
  }

  /**
   * Creates new value using the provided type index and stringified representation.
   */
  static valueFromStringified(type: number, value: string) {
    switch (type) {
      case 0:
        return new Key(Number.parseInt(value, 10));
      case 1:
        return new Key(BigInt(value));
      case 2:
        return new Key(value);
      case 3:
        return new Key(undefined);
      case 4:
        return new Key(Symbol(value));
      case 5:
        return new Key(value === "true");
      case 6:
        return new Key(null);
      case 7:
        return new Key(Infinity);
      case 8:
        return new Key(-Infinity);
    }

    throw new TypeError(`Invalid type ${type} of value ${value}`);
  }

  toString() {
    return `${this.type}${this.value}`;
  }

  /**
   * Instantiates value from string.
   */
  static fromString(stringified: string) {
    const type = +stringified[0];

    return Key.valueFromStringified(type, stringified.slice(1));
  }
}

/**
 * Key-value storage for values with primitive keys based on an `Object`.
 */
export class ObjectStorage<K, V> extends Storage<K, V> {
  map: { [key: string]: V };
  length: number;

  constructor(params?: StorageParams<K, V>, rootPath?: Iterable<ChildPath<K>>) {
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
    const keyStr = new Key(rawKey).toString();

    return keyStr in this.map;
  }

  /**
   * Retrieves an item corresponding to the supplied key.
   * @param rawKey
   *
   */
  get(rawKey: K): V | AbsentValue {
    const keyStr = new Key(rawKey).toString();

    if (keyStr in this.map) {
      return this.map[keyStr];
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
    const keyStr = new Key(rawKey).toString();
    let value = NO_VALUE;

    if (keyStr in this.map) {
      this.length--;
      value = this.map[keyStr];
      delete this.map[keyStr];
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
    const keyStr = new Key(rawKey).toString();
    const has = keyStr in this.map;

    if (!has) {
      this.length++;
      this.map[keyStr.toString()] = value;
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
  entries(): SizedIterable<{ key: K; value: V }> {
    return map(
      ([key, value]) => ({
        key: Key.fromString(key).value,
        value,
      }),
      withSize(Object.entries(this.map), this.len())
    );
  }
}
