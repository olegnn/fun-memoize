/**
 * Chains two iterables.
 * @param firstIterable
 * @param secondIterable
 * @returns {Iterable<V>}
 */
export function chain<V>(
  firstIterable: Iterable<V>,
  secondIterable: Iterable<V>
): Iterable<V> {
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
  };
}

/**
 * Creates an iterable that then iterates over supplied iterable and then emits one item.
 * @param value
 * @param iterable
 * @returns {Iterable<V>}
 */
export function append<V>(iterable: Iterable<V>, value: V): Iterable<V> {
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
  };
}

/**
 * Zips two iterables together.
 * @param leftIterable
 * @param rightIterable
 * @returns {Iterable<{ left: L; right: R }>}
 */
export function zip<L, R>(
  leftIterable: Iterable<L>,
  rightIterable: Iterable<R>
): Iterable<{ left: L; right: R }> {
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
  };
}

/**
 * Maps supplied iterable using given function.
 * @param fn
 * @param iterable
 * @returns {Iterable<R>}
 */
export function map<V, R>(
  fn: (item: V) => R,
  iterable: Iterable<V>
): Iterable<R> {
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
  };
}

/**
 * Flattens iterable mapped with supplied function.
 * @param iterable
 * @param map
 * @returns {Iterable<R>}
 */
export function flatMap<V, R>(
  map: (item: V) => Iterable<R>,
  iterable: Iterable<V>
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
 * @returns {Iterable<V>}
 */
export function empty<V>(): Iterable<V> {
  return EMPTY_ITER;
}

/**
 * Creates an iterable which emits one item.
 * @param value
 * @returns {Iterable<V>}
 */
export function once<V>(value: V): Iterable<V> {
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
  };
}

/**
 * Creates an iterable that endlessly repeats supplied iterable.
 * @param iter
 * @returns {Iterable<V>}
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
 * Creates an iterable which emits two items.
 * @param first
 * @param second
 * @returns {Iterable<V>}
 */
export function double<V>(first: V, second: V): Iterable<V> {
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
};
