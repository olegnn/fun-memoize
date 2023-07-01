import { chain, EMPTY_ITER, map } from "../iterators";

/**
 * Contains removed/added entities.
 */
export class Result<V> {
  removed: Iterable<V>;
  added: Iterable<V>;

  static EMPTY_RESULT = new Result();

  private constructor(
    removed: Iterable<V> = EMPTY_ITER,
    added: Iterable<V> = EMPTY_ITER
  ) {
    this.removed = removed;
    this.added = added;
  }

  static added<V>(added: Iterable<V>): Result<V> {
    return new Result(void 0, added);
  }

  static removed<V>(removed: Iterable<V>): Result<V> {
    return new Result(removed);
  }

  static removedAdded<V>(removed: Iterable<V>, added: Iterable<V>): Result<V> {
    return new Result(removed, added);
  }

  static empty<V>(): Result<V> {
    return Result.EMPTY_RESULT as Result<V>;
  }

  /**
   * Appends remove/added items from the supplied result to the current result.
   * @param result
   */
  chain(result: Result<V>): Result<V> {
    return new Result(
      chain(this.removed, result.removed),
      chain(this.added, result.added)
    );
  }

  /**
   * Executes given function for each added item.
   * @param fn
   *
   */
  forEachAdded(fn: (added: V) => void): this {
    for (const added of this.added) fn(added);

    return this;
  }

  forEachRemoved(fn: (removed: V) => void): this {
    for (const removed of this.removed) fn(removed);

    return this;
  }

  map<R>(fn: (value: V) => R): Result<R> {
    return new Result(map(fn, this.removed), map(fn, this.added));
  }
}
