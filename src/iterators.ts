/**
 * An iterable with a fixed size.
 */
export interface SizedIterable<V> extends Iterable<V> {
  size(): number;
}

/**
 * Chains two iterables.
 * @param firstIterable
 * @param secondIterable
 * @returns {SizedIterable<V>}
 */
export function chain<V>(
  firstIterable: SizedIterable<V>,
  secondIterable: SizedIterable<V>
): SizedIterable<V> {
  return {
    [Symbol.iterator]() {
      let iter = firstIterable[Symbol.iterator]();
      let firstDone = false;

      return {
        next() {
          for (;;) {
            const { value, done } = iter.next();

            if (done) {
              if (!firstDone) {
                iter = secondIterable[Symbol.iterator]();
                firstDone = true;
              } else {
                return ITER_DONE_VALUE;
              }
            } else {
              return { value, done: false };
            }
          }
        },
      };
    },
    size() {
      return firstIterable.size() + secondIterable.size();
    },
  };
}

/**
 * Creates an iterable that emits one item and then iterates over supplied iterable.
 * @param value
 * @param iterable
 * @returns {SizedIterable<V>}
 */
export function prepend<V>(
  value: V,
  iterable: SizedIterable<V>
): SizedIterable<V> {
  return {
    [Symbol.iterator]() {
      let state = 0;
      const iter = iterable[Symbol.iterator]();

      return {
        next() {
          if (state === 0) {
            state = 1;

            return { value, done: false };
          } else if (state === 1) {
            const item = iter.next();

            if (!item.done) {
              return item;
            }
          }

          return ITER_DONE_VALUE;
        },
      };
    },
    size() {
      return 1 + iterable.size();
    },
  };
}

/**
 * Creates an iterable that then iterates over supplied iterable and then emits one item.
 * @param value
 * @param iterable
 * @returns {SizedIterable<V>}
 */
export function append<V>(
  iterable: SizedIterable<V>,
  value: V
): SizedIterable<V> {
  return {
    [Symbol.iterator]() {
      let state = 0;
      const iter = iterable[Symbol.iterator]();

      return {
        next() {
          if (state === 0) {
            const item = iter.next();

            if (item.done) {
              state = 1;
            } else {
              return item;
            }
          }
          if (state === 1) {
            state = 2;

            return { value, done: false };
          }

          return ITER_DONE_VALUE;
        },
      };
    },
    size() {
      return 1 + iterable.size();
    },
  };
}

/**
 * Zips two iterables together.
 * @param leftIterable
 * @param rightIterable
 * @returns {SizedIterable<{ left: L; right: R }>}
 */
export function zip<L, R>(
  leftIterable: SizedIterable<L>,
  rightIterable: SizedIterable<R>
): SizedIterable<{ left: L; right: R }> {
  return {
    [Symbol.iterator]() {
      let leftIter = leftIterable[Symbol.iterator]();
      let rightIter = rightIterable[Symbol.iterator]();

      return {
        next() {
          for (;;) {
            const left = leftIter.next();
            const right = rightIter.next();

            if (left.done || right.done) {
              return ITER_DONE_VALUE;
            } else {
              return {
                value: { left: left.value, right: right.value },
                done: false,
              };
            }
          }
        },
      };
    },
    size() {
      return Math.min(leftIterable.size(), rightIterable.size());
    },
  };
}

/**
 * Maps supplied iterable using given function.
 * @param fn
 * @param iterable
 * @returns {SizedIterable<R>}
 */
export function map<V, R>(
  fn: (item: V) => R,
  iterable: SizedIterable<V>
): SizedIterable<R> {
  return {
    [Symbol.iterator]() {
      const iter = iterable[Symbol.iterator]();

      return {
        next() {
          const { value, done } = iter.next();

          return done ? ITER_DONE_VALUE : { value: fn(value), done };
        },
      };
    },
    size() {
      return iterable.size();
    },
  };
}

/**
 * Flattens iterable mapped with supplied function.
 * @param iterable
 * @param map
 * @returns {Iterable<R>}
 */
export function flatMap<V, R>(
  iterable: Iterable<V>,
  map: (item: V) => Iterable<R>
): Iterable<R> {
  return {
    [Symbol.iterator]() {
      const rootIter = iterable[Symbol.iterator]();
      let lastIter = null;

      return {
        next() {
          for (;;) {
            if (lastIter == null) {
              const { value: nextIter, done } = rootIter.next();

              if (!done) {
                lastIter = map(nextIter)[Symbol.iterator]();
              } else {
                return ITER_DONE_VALUE;
              }
            }

            if (lastIter) {
              const item = lastIter.next();

              if (item.done) {
                lastIter = null;
              } else {
                return { value: item.value, done: false };
              }
            }
          }
        },
      };
    },
  };
}

/**
 * Creates an iterable which emits no items.
 * @returns {SizedIterable<V>}
 */
export function empty<V>(): SizedIterable<V> {
  return EMPTY_ITER;
}

/**
 * Creates an iterable which emits one item.
 * @param value
 * @returns {SizedIterable<V>}
 */
export function once<V>(value: V): SizedIterable<V> {
  return {
    [Symbol.iterator]() {
      let taken = false;

      return {
        next() {
          if (!taken) {
            taken = true;

            return { value, done: false };
          } else {
            return ITER_DONE_VALUE;
          }
        },
      };
    },
    size() {
      return 1;
    },
  };
}

/**
 * Creates an iterable that endlessly repeats supplied iterable.
 * @param iter
 * @returns {SizedIterable<V>}
 */
export function cycle<V>(iter: Iterable<V>): Iterable<V> {
  return {
    [Symbol.iterator]() {
      let lastIter = iter[Symbol.iterator]();

      return {
        next() {
          for (let i = 0; i++ < 2; ) {
            const item = lastIter.next();

            if (item.done) {
              lastIter = iter[Symbol.iterator]();
            } else {
              return item;
            }
          }

          return ITER_DONE_VALUE;
        },
      };
    },
  };
}

/**
 * Adds supplied size to the given iterable.
 * @param iterable
 * @param size
 * @returns
 */
export function withSize<V>(
  iterable: Iterable<V>,
  size: number
): SizedIterable<V> {
  return {
    [Symbol.iterator]() {
      return iterable[Symbol.iterator]();
    },
    size() {
      return size;
    },
  };
}

/**
 * Creates an iterable which emits two items.
 * @param first
 * @param second
 * @returns {SizedIterable<V>}
 */
export function double<V>(first: V, second: V): SizedIterable<V> {
  return {
    [Symbol.iterator]() {
      let state = 0;

      return {
        next() {
          if (state === 0) {
            state = 1;

            return { value: first, done: false };
          }
          if (state === 1) {
            state = 2;

            return { value: second, done: false };
          }

          return ITER_DONE_VALUE;
        },
      };
    },
    size() {
      return 2;
    },
  };
}

export const ITER_DONE_VALUE = { value: undefined, done: true };

export const EMPTY_ITER_NEXT = {
  next() {
    return ITER_DONE_VALUE;
  },
};

/**
 * An iterator producing no values.
 */
export const EMPTY_ITER = {
  [Symbol.iterator]() {
    return EMPTY_ITER_NEXT;
  },
  size() {
    return 0;
  },
};
