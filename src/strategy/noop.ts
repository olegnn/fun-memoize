import { CacheStrategy } from "../base/CacheStrategy";
import { Result } from "../strategy/types";
import { AbsentValue, NO_VALUE } from "../value";

/**
 * Placeholder strategy which is used when no limit specified.
 */
export class Noop<V> extends CacheStrategy<V> {
  constructor(capacity: number) {
    super(capacity);
  }

  /**
   * Does nothing and always returns empty result.
   * @param value
   *
   */
  read(_: V): Result<V> {
    return Result.empty();
  }

  /**
   * Does nothing and always returns empty result.
   * @param value
   *
   */
  write(_: V): Result<V> {
    return Result.empty();
  }

  /**
   * Does nothing and always returns empty result.
   * @param node
   *
   */
  drop(_: V): boolean {
    return false;
  }

  /**
   * Always returns zero.
   *
   */
  len(): number {
    return 0;
  }

  /**
   * Always returns `false`.
   * @param node
   *
   */
  has(_: V): boolean {
    return false;
  }

  /**
   * Peeks a value from the beginning of the queue.
   * Always returns `NO_VALUE`.
   *
   */
  peek(): V | AbsentValue {
    return NO_VALUE;
  }

  /**
   * Removes an item from the beginning of the queue.
   * Always returns `NO_VALUE`.
   *
   */
  take(): V | AbsentValue {
    return NO_VALUE;
  }
}
