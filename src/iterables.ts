/**
 * Creates an iterable which emits no items.
 */
export function empty<V>(): Iterable<V> {
  return EMPTY_ITERABLE;
}

/**
 * Creates an iterable which emits one item.
 * @param value
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
 * Creates an iterable which emits supplied arguments
 */
export function values<V>(...args: V[]): Iterable<V> {
  return {
    [Symbol.iterator]() {
      let idx = 0;

      return {
        next() {
          if (idx < args.length) {
            return { value: args[idx++], done: false };
          } else {
            return ITER_DONE_VALUE;
          }
        },
      };
    },
  };
}

/**
 * Executes supplied `fn` on each item produced by the iterable.
 * @param fn
 * @param iterable
 */
export function forEach<V>(fn: (value: V) => void, iterable: Iterable<V>) {
  if (iterable === EMPTY_ITERABLE) return;

  const iter = iterable[Symbol.iterator]();
  for (let item = iter.next(); !item.done; fn(item.value), item = iter.next());
}

/**
 * Maps supplied iterable using given function.
 * @param fn
 * @param iterable
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
 * @param map
 * @param iterable
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
 * Chains two iterables.
 * @param firstIterable
 * @param secondIterable
 */
export function chain<V>(
  firstIterable: Iterable<V>,
  secondIterable: Iterable<V>
): Iterable<V> {
  if (firstIterable === EMPTY_ITERABLE) {
    return secondIterable;
  } else if (secondIterable === EMPTY_ITERABLE) {
    return firstIterable;
  }

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
 * Zips two iterables together.
 * @param leftIterable
 * @param rightIterable
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
          const left = leftIter.next();
          const right = rightIter.next();

          return left.done || right.done
            ? ITER_DONE_VALUE
            : {
                value: { left: left.value, right: right.value },
                done: false,
              };
        },
      };
    },
  };
}

/**
 * Creates an iterable that endlessly repeats supplied iterable.
 * @param iter
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
 * Ending value of an iterator.
 * MUST NOT BE MODIFIED.
 */
export const ITER_DONE_VALUE = { value: undefined, done: true };

/**
 * An iterator producing no values.
 * MUST NOT BE MODIFIED.
 */
export const EMPTY_ITERATOR = {
  next() {
    return ITER_DONE_VALUE;
  },
};

/**
 * An iteratable producing no values.
 * MUST NOT BE MODIFIED.
 */
export const EMPTY_ITERABLE = {
  [Symbol.iterator]() {
    return EMPTY_ITERATOR;
  },
};
