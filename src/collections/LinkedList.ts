import { OrderedCollection } from "./types";
import { equals } from "../value";
import { EMPTY_ITER, ITER_DONE_VALUE } from "../iterators";

/**
 * A node of the double-ended linked list.
 */
export class ListNode<T> {
  root: LinkedList<T> | null;
  next: ListNode<T> | null;
  prev: ListNode<T> | null;
  value: T;

  constructor(
    value: T,
    root: LinkedList<T>,
    prev: ListNode<T> | null = null,
    next: ListNode<T> | null = null
  ) {
    this.value = value;
    this.root = root;
    this.next = next;
    this.prev = prev;
  }

  /**
   * Inserts supplied value before the current node.
   * @param value
   *
   */
  insertPrev(value: T): ListNode<T> {
    const node = new ListNode(value, this.root, this.prev, this);
    if (this.prev !== null) this.prev.next = node;
    return (this.prev = node);
  }

  /**
   * Inserts supplied value after the current node.
   * @param value
   *
   */
  insertNext(value: T): ListNode<T> {
    const node = new ListNode(value, this.root, this, this.next);
    if (this.next !== null) this.next.prev = node;
    return (this.next = node);
  }

  /**
   * Disconnects current node from its predecessor and successor.
   *
   */
  disconnect(): void {
    if (this.next !== null) this.next.prev = this.prev;
    if (this.prev !== null) this.prev.next = this.next;

    this.prev = this.next = null;
  }
}

/**
 * Double-ended linked list.
 */
export class LinkedList<T> extends OrderedCollection<T, ListNode<T>, null> {
  length: number;
  head: ListNode<T> | null;
  tail: ListNode<T> | null;

  constructor(values: Iterable<T> = EMPTY_ITER) {
    super();
    this.length = 0;
    this.head = null;
    this.tail = null;

    for (const value of values) {
      this.pushBack(value);
    }
  }

  /**
   * Pushes an element to the back of the list.
   * @param element
   *
   */
  pushBack(element: T): ListNode<T> {
    this.length += 1;

    if (this.tail !== null) {
      this.tail = this.tail.insertNext(element);
    } else {
      this.head = this.tail = new ListNode(element, this);
    }

    return this.tail;
  }

  /**
   * Pushes an element to the front of the list.
   * @param element
   *
   */
  pushFront(element: T): ListNode<T> {
    this.length += 1;

    if (this.head !== null) {
      this.head = this.head.insertPrev(element);
    } else {
      this.head = this.tail = new ListNode(element, this);
    }

    return this.head;
  }

  /**
   * Moves node to the front of the queue.
   * Returns `false` if element doesn't belong to the given list.
   * @param node
   *
   */
  moveFront(node: ListNode<T>): boolean {
    if (node.root !== this) {
      return false;
    } else if (node === this.head) {
      return true;
    } else if (node === this.tail) {
      this.tail = this.tail.prev;
    }
    node.disconnect();

    node.next = this.head;
    this.head.prev = node;
    this.head = node;

    return true;
  }

  /**
   * Moves node to the back of the queue.
   * Returns `false` if element doesn't belong to the given list.
   * @param node
   *
   */
  moveBack(node: ListNode<T>): boolean {
    if (node.root !== this) {
      return false;
    } else if (node === this.tail) {
      return true;
    } else if (node === this.head) {
      this.head = this.head.next;
    }
    node.disconnect();

    node.prev = this.tail;
    this.tail.next = node;
    this.tail = node;

    return true;
  }

  /**
   * Peeks a value from the front of the queue.
   * Returns either item or `null` if queue is empty.
   *
   */
  peekFront(): T | null {
    return this.head && this.head.value;
  }

  /**
   * Peeks a value from the back of the queue.
   * Returns either item or `null` if queue is empty.
   *
   */
  peekBack(): T | null {
    return this.tail && this.tail.value;
  }

  /**
   * Takes a value from the back of the queue.
   * Returns either item or `null` if queue is empty.
   *
   */
  takeBack(): T | null {
    if (this.tail === null) return null;

    this.length--;

    const element = this.tail;

    if (element === this.head) {
      this.head = null;
    }

    if (element !== null) {
      this.tail = this.tail.prev;
      element.disconnect();

      return element.value;
    }

    return null;
  }

  /**
   * Takes front node from the list.
   * Returns `null` if list has no elements.
   *
   */
  takeFront(): T | null {
    if (this.head === null) return null;

    this.length--;

    const element = this.head;

    if (element === this.tail) {
      this.tail = null;
    }

    if (element !== null) {
      this.head = this.head.next;
      element.disconnect();

      return element.value;
    }

    return null;
  }

  /**
   * Inserts given value after the supplied raw linked list node.
   * @param node
   * @param value
   *
   */
  insertAfter(node: ListNode<T>, value: T): ListNode<T> {
    this.length++;
    const inserted = node.insertNext(value);

    if (node === this.tail) {
      this.tail = inserted;
    }

    return inserted;
  }

  /**
   * Inserts given value before the supplied raw linked list node.
   * @param node
   * @param value
   *
   */
  insertBefore(node: ListNode<T>, value: T): ListNode<T> {
    this.length++;
    const inserted = node.insertPrev(value);

    if (node === this.head) {
      this.head = inserted;
    }

    return inserted;
  }

  /**
   * Removes given node from the list.
   * Returns `false` if element doesn't belong to the given list.
   * @param element
   */
  remove(element: ListNode<T>): boolean {
    if (element.root !== this) {
      return false;
    }
    this.length--;

    if (element === this.head && this.head !== null) {
      this.head = this.head.next;
    }

    if (element === this.tail && this.tail !== null) {
      this.tail = this.tail.prev;
    }

    element.disconnect();

    return true;
  }

  /**
   * Returns amount of items stored in the list.
   *
   */
  len(): number {
    return this.length;
  }

  /**
   * Returns an iterator over collection values starting from the end.
   */
  valuesBack(): Iterable<T> {
    const that = this;

    return {
      [Symbol.iterator]() {
        let tail = that.tail;

        return {
          next() {
            if (tail !== null) {
              const value = tail.value;
              tail = tail.prev;

              return { value, done: false };
            } else {
              return ITER_DONE_VALUE;
            }
          },
        };
      },
    };
  }

  /**
   * Returns an iterator over collection values starting from the beginning.
   */
  valuesFront(): Iterable<T> {
    const that = this;

    return {
      [Symbol.iterator]() {
        let head = that.head;

        return {
          next() {
            if (head !== null) {
              const value = head.value;
              head = head.next;

              return { value, done: false };
            } else {
              return ITER_DONE_VALUE;
            }
          },
        };
      },
    };
  }
}
