/** Represents an absent value */
export const NO_VALUE: symbol = Symbol.for("@@fun-memoize@@/NO_VALUE");

/** Checks given values to be equal according to the `Same-value-zero` equality algorithm */
export const equals = <V>(v1: V, v2: V): boolean =>
  v1 === v2 || (v2 !== v2 && v1 !== v1);

/** Absent value placeholder */
export type AbsentValue = typeof NO_VALUE;
/** Type of the non-primitive value - either object or function */
export type NonPrimitive = Object | Function;
/** Type of the primitive value - boolean, string, number, null, void, symbol or bigint */
export type Primitive =
  | boolean
  | string
  | number
  | symbol
  | null
  | void
  | bigint;

/**
 * Checks whether a value is primitive or not. Returns `true` if provided value is an object or a function.
 * @param value
 */
export function isPrimitiveValue(value: NonPrimitive | Primitive): boolean {
  if (value == null) {
    return true;
  } else {
    const type = typeof value;

    return type !== "object" && type !== "function";
  }
}
