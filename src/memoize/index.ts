import mimic from "mimic-fn";
import { Params, Context } from "./Context";
import { Root } from "./Root";
import { equals, AbsentValue, NO_VALUE } from "../value";
import { EMPTY_OBJECT } from "../utils";

/** Params interface extended with optional length and checkLast flag */
export interface ParamsWithLength<K, V> extends Params<K, V> {
  /** Overrides function length */
  length?: number;
  /** Check last arguments or not (default to `true`) */
  checkLast?: boolean;
}

const { slice } = Array.prototype;

/**
 * Memoizes provided function returning wrapped version of it.
 * Result function will return value without calling the supplied function if it's present in the cache for the supplied arguments according to `Same-value-zero` algorithm.
 * If no value is found, the underlying function will be called with provided arguments.
 * @param func
 * @param params
 */
export default function memoize<V>(
  func: (...args: any[]) => V,
  {
    length: depth = func.length,
    checkLast = true,
    ...params
  }: ParamsWithLength<any, V> = EMPTY_OBJECT as ParamsWithLength<any, V>
): typeof func & { recomputations: number } {
  const recomputate = function () {
    ++resultFunction.recomputations;
    return func.apply(func, arguments);
  };

  let resultFunction: typeof func & { recomputations?: number };
  if (depth === 0) {
    let value = NO_VALUE;

    resultFunction = function cachedFunction() {
      if (value !== NO_VALUE) {
        return value as V;
      } else {
        return (value = recomputate.apply(this, arguments));
      }
    };
  } else {
    const ctx = new Context({ ...params, depth });
    const root = new Root({ depth, checkLast }, ctx);

    resultFunction = function cachedFunction() {
      const argsLength = arguments.length;
      let output: V;

      if (argsLength === depth) {
        output = root.getOrInsertWith(
          arguments as unknown as any[],
          recomputate
        );
        // If we received a greater amount of arguments, slice it
      } else if (argsLength > depth) {
        output = root.getOrInsertWith(
          slice.call(arguments, 0, depth) as any[],
          recomputate
        );
        // Otherwise don't use cache
      } else {
        output = recomputate.apply(func, arguments);
      }

      return output;
    };
  }

  try {
    void mimic(resultFunction, func);
  } finally {
    resultFunction.recomputations = 0;

    return resultFunction as typeof func & { recomputations: number };
  }
}
