import { once } from "../iterators";
import { Result } from "../utils";
import { Destroyable, Parent, HasCapacity, Clearable } from "../utils";
import { AbsentValue, NO_VALUE } from "../value";

/**
 * Describes some strategy holding up to `capacity` items at the same moment.
 */
export abstract class CacheStrategy<V>
  extends HasCapacity
  implements Clearable, Parent<V>
{
  constructor(capacity: number) {
    super(capacity);
  }

  /**
   * Records read access of the supplied item.
   * @param value
   *
   */
  public read(value: V): Result<V> {
    return this.reservePlace(value);
  }

  /**
   * Records write access of the supplied item.
   * @param value
   *
   */
  public write(value: V): Result<V> {
    return this.reservePlace(value);
  }

  /**
   * Removes all items from the strategy.
   *
   */
  public clear(): void {
    while (!this.isEmpty()) {
      this.take();
    }
  }

  /**
   * Removes supplied item from the queue.
   * @param value
   *
   */
  public abstract drop(value: V): boolean;

  /**
   * Removes an item from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   */
  public abstract take(): V | AbsentValue;

  /**
   * Peeks a value from the beginning of the queue.
   * Returns either item or `NO_VALUE` if queue is empty.
   *
   */
  public abstract peek(): V | AbsentValue;

  /**
   * Returns `true` if given item exists in the queue.
   * @param node
   *
   */
  public abstract has(value: V): boolean;

  /**
   * Reserves place for an item.
   * @param value
   */
  protected reservePlace(value: V): Result<V> {
    if (this.isFull() || (this.willBeFull() && !this.has(value))) {
      const removedItem = this.take();

      if (removedItem !== NO_VALUE) {
        return Result.removed(once(removedItem as V));
      }
    }

    return Result.empty();
  }
}

/**
 * `CacheStrategy` with implemented abstract methods.
 */
export type CacheStrategyClass<V> = new (...args: any[]) => CacheStrategy<V> & {
  len(): number;
  drop(value: V): boolean;
  take(): V | AbsentValue;
  peek(): V | AbsentValue;
  has(value: V): boolean;
};

/**
 * Forces provided strategy class to call `.destroy` on removed entities.
 */
export function withDestroyable<V extends Destroyable>(
  strategy: CacheStrategyClass<V>
): CacheStrategyClass<V> {
  class WithDestroyable extends strategy {
    constructor(...args: any[]) {
      super(...args);
    }

    drop(value: V) {
      const dropped = super.drop(value);

      if (dropped) {
        value.destroy();
      }

      return dropped;
    }

    take() {
      const item = super.take();

      if (item !== NO_VALUE) {
        (item as V).destroy();
      }

      return item;
    }
  }

  return WithDestroyable;
}
