
import memoize from './memoize'

/**
 * Creates memoized selector.
 */
const createMemoizedSelector = (...params: any[]) => {
  const paramsOrFunc = params.slice(-1)[0];
  let selectorFuncs = params.slice(0, -1);
  if (Array.isArray(selectorFuncs[0])) [selectorFuncs] = selectorFuncs;

  if (!params.length) {
    throw new Error("Must have at least one argument");
  } else if (params.length === 1) {
    if (typeof paramsOrFunc === "object")
      throw new Error("Structured selectors aren't currently supported");
  } else {
    selectorFuncs.forEach((param) => {
      if (typeof param !== "function")
        throw new Error(
          `Invalid type of param passed to memoization function: ${param} with type: ${typeof param}`
        );
    });
  }

  const haveParams = typeof paramsOrFunc === "object";
  const calculate = haveParams ? params.slice(-2)[0] : paramsOrFunc;
  const memoized = memoize(calculate, haveParams ? paramsOrFunc : void 0);

  function selector(): any {
    let { length } = selectorFuncs;
    const args = Array(length);
    while (length--)
      args[length] = selectorFuncs[length].apply(null, arguments);

    return memoized.apply(null, args);
  }

  selector.recomputations = () => (memoized as any).recomputations;
  selector.dependencies = selectorFuncs;
  selector.resultFunction = calculate;

  return selector;
};

export default createMemoizedSelector