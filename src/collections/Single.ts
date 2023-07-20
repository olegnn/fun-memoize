import { empty, once } from "../iterables";
import { AbsentValue, NO_VALUE, equals } from "../value";
import { IndexedOrderedCollectionWithOrderedKeys } from "./types";

/**
 * Wrapper class which represents ordered indexed collection with a single item.
 */
export class Single<V> extends IndexedOrderedCollectionWithOrderedKeys<
  V,
  V,
  V
> {
  value: V | AbsentValue;

  constructor(value: V) {
    super();
    this.value = value;
  }

  pushFront(value: V): V | AbsentValue {
    if (this.isEmpty()) {
      return (this.value = value);
    } else {
      return NO_VALUE;
    }
  }

  pushBack(value: V): V | AbsentValue {
    return this.pushFront(value);
  }

  takeKeyFront(): V | AbsentValue {
    return this.takeFront();
  }

  takeKeyBack(): V | AbsentValue {
    return this.takeFront();
  }

  peekKeyFront(): V | AbsentValue {
    return this.peekFront();
  }

  peekKeyBack(): V | AbsentValue {
    return this.peekBack();
  }

  peekItemFront(): V | AbsentValue {
    return this.peekFront();
  }

  peekItemBack(): V | AbsentValue {
    return this.peekBack();
  }

  addKeyFront(_key: V, _item: V): boolean {
    return false;
  }

  addKeyBack(_key: V, _item: V): boolean {
    return false;
  }

  dropKey(value: V): boolean {
    if (this.has(value)) {
      this.takeFront();

      return true;
    } else {
      return false;
    }
  }

  get(value: V): V | AbsentValue {
    return this.has(value) ? this.value : NO_VALUE;
  }

  keysFront(): Iterable<V> {
    return this.valuesFront();
  }

  keysBack(): Iterable<V> {
    return this.valuesBack();
  }

  takeFront() {
    const value = this.value;
    this.value = NO_VALUE;
    return value;
  }

  takeBack() {
    return this.takeFront();
  }

  insertAfter(_item: V, _value: V): V | AbsentValue {
    return NO_VALUE;
  }

  insertBefore(_item: V, _value: V): V | AbsentValue {
    return NO_VALUE;
  }

  contains(item: V): boolean {
    return equals(item, this.value);
  }

  has(value: V): boolean {
    return equals(value, this.value);
  }

  drop(value: V): V | AbsentValue {
    return this.has(value) ? this.takeFront() : NO_VALUE;
  }

  peekFront() {
    return this.value;
  }

  peekBack() {
    return this.value;
  }

  moveFront(item: V): boolean {
    return this.contains(item);
  }

  moveBack(item: V): boolean {
    return this.contains(item);
  }

  remove(item: V) {
    return this.drop(item) !== NO_VALUE;
  }

  valuesFront(): Iterable<V> {
    return this.value === NO_VALUE ? empty() : once(this.value as V);
  }

  valuesBack(): Iterable<V> {
    return this.valuesFront();
  }

  len(): number {
    return Number(this.value !== NO_VALUE);
  }
}
