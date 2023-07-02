import { empty, once } from "../iterators";
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

  pushFront(value: V): V {
    this.value = value;
    return value;
  }

  pushBack(value: V): V {
    this.value = value;
    return value;
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

  addKeyFront(_: V, item: V): V {
    this.value = item;
    return item;
  }

  addKeyBack(_: V, item: V): V {
    this.value = item;
    return item;
  }

  dropKey(value: V): V | AbsentValue {
    return equals(value, this.value) ? this.takeKeyFront() : NO_VALUE;
  }

  get(value: V): V | AbsentValue {
    return equals(value, this.value) ? this.value : NO_VALUE;
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
    const value = this.value;
    this.value = NO_VALUE;
    return value;
  }

  insertAfter(node: V, value: V): V | AbsentValue {
    return equals(node, this.value) ? (this.value = value) : NO_VALUE;
  }
  insertBefore(node: V, value: V): V | AbsentValue {
    return equals(node, this.value) ? (this.value = value) : NO_VALUE;
  }

  has(value: V) {
    return equals(this.value, value);
  }

  drop(value: V) {
    return equals(this.value, value) ? this.takeFront() : NO_VALUE;
  }

  peekFront() {
    return this.value;
  }

  peekBack() {
    return this.value;
  }

  moveFront(element: V): boolean {
    return equals(element, this.value);
  }

  moveBack(element: V): boolean {
    return equals(element, this.value);
  }

  remove(element: V) {
    return this.drop(element) !== NO_VALUE;
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
