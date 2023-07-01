import mimic from "mimic-fn";
import { Params, StorageContext } from "./StorageContext";
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
export default function memoize<K, V>(
  func: (...args: K[]) => V,
  {
    length = func.length,
    checkLast = true,
    ...params
  }: ParamsWithLength<K, V> = EMPTY_OBJECT as ParamsWithLength<K, V>
): typeof func {
  const recomputate = function () {
    ++(resultFunction as any).recomputations;
    return func.apply(func, arguments);
  };

  let resultFunction: typeof func;
  if (length === 0) {
    let value = NO_VALUE;

    resultFunction = function cachedFunction() {
      if (value !== NO_VALUE) {
        return value as V;
      } else {
        return (value = recomputate.apply(this, arguments));
      }
    };
  } else {
    const ctx = new StorageContext(params);
    const root = new Root(length, ctx);

    resultFunction = function cachedFunction() {
      const argsLength = arguments.length;
      let output: V;

      if (argsLength === length) {
        output = root.getOrInsertWith(arguments as unknown as K[], recomputate);
        // If we received a greater amount of arguments, slice it
      } else if (argsLength > length) {
        output = root.getOrInsertWith(
          slice.call(arguments, 0, length) as K[],
          recomputate
        );
        // Otherwise don't use cache
      } else {
        output = recomputate.apply(func, arguments);
      }

      return output;
    };
  }

  if (checkLast) {
    const fn = resultFunction;
    let lastCache: V | AbsentValue = NO_VALUE;
    let lastArgs: IArguments = [] as unknown as IArguments;

    resultFunction = function cachedFunction(): V {
      let i = arguments.length;
      if (i === lastArgs.length)
        if (i === 1) {
          if (equals(arguments[0], lastArgs[0]) && lastCache !== NO_VALUE)
            return lastCache as V;
        } else {
          while (i-- && equals(arguments[i], lastArgs[i]));
          if (i === -1 && lastCache !== NO_VALUE) return lastCache as V;
        }
      lastArgs = arguments;

      return (lastCache = fn.apply(null, arguments));
    };
  }

  try {
    void mimic(resultFunction, func);
  } finally {
    (resultFunction as any).recomputations = 0;
    return resultFunction;
  }
}
