const mimic = require("mimic-fn");
const { default: memoize } = require("../build");
const { LRU, LFU, FIFO } = require("../build/strategy");

const { describe, test, expect } = global;

const createFunctionForTests = (func) => {
  const calledWith = new Set();
  const newFunc = (...args) =>
    calledWith.has(String(args))
      ? void 0
      : (calledWith.add(String(args)), func(...args));
  mimic(newFunc, func);
  return newFunc;
};

describe("Basic function memoize tests", () => {
  test("Memoize simple function", () => {
    const func = (a) => a * 125;
    const memo = memoize(func);
    expect(memo(2)).toBe(250);
    expect(memo(2)).toBe(250);
  });

  test("different limits", () => {
    for (const property of [
      "totalLeavesLimit",
      "totalStoragesLimit",
      "leavesPerStorageLimit",
      "totalLeafStoragesLimit",
    ])
      for (const invalidValue of [
        -1,
        -Infinity,
        0,
        123456789123456789,
        1.231231,
        NaN,
      ]) {
        expect(() =>
          memoize((a) => a * 1e9, {
            [property]: invalidValue,
          })
        ).toThrowErrorMatchingSnapshot();
      }
  });

  test("Memoize unary function", () => {
    const f = (n) => n * 15;
    const func = createFunctionForTests(f);

    const memoized = memoize(func, { length: 1 });
    const testNumbers = [3, 4, 5, 6, 7, 8, 9];
    for (let i = 1e2; i--; )
      expect(testNumbers.map(memoized)).toEqual(testNumbers.map(f));
  });

  test("Memoize 2ary function", () => {
    const f = (a, b) => a + b;
    const func = createFunctionForTests(f);

    const memoized = memoize(func);
    const testArgs = [
      [1, 2],
      [6, 9],
      [1, 2],
      [10, 12],
      [20, 22],
    ];
    for (let i = 1e2; i--; )
      expect(testArgs.map((arr) => memoized(...arr))).toEqual(
        testArgs.map((arr) => f(...arr))
      );
  });

  const config = {
    /**
     * Total limit for the storages (cache nodes).
     */
    totalStoragesLimit: 20,
    /**
     * Total limit for the leaves (cache entries). Default is 10000.
     */
    totalLeavesLimit: 4,
    /**
     * Limit of the leaves per a single leaf storage.
     */
    leavesPerStorageLimit: 2,
    /**
     * Total limit of the leaf storages.
     */
    totalLeafStoragesLimit: 4,
  };

  for (const leafStrategyClass of [LRU, LFU, FIFO])
    for (const storageStrategyClass of [LRU, LFU, FIFO])
      for (const useWeakStorage of [false, true])
        for (const useObjectStorage of [false, true]) {
          const name = `Memoize 5ary function${
            ((useWeakStorage || useObjectStorage) && " with") || ""
          }${(useWeakStorage && " weak storage") || ""}${
            (useWeakStorage && useObjectStorage && ",") || ""
          }${(useObjectStorage && " object storage") || ""}} using ${
            leafStrategyClass.name
          }/${storageStrategyClass.name}`;

          test(name, () => {
            const f = (a, b, c, d, e) => `${a}-${b}-${c}-${d}-${e}`;
            const func = createFunctionForTests(f);

            const memoized = memoize(func, {
              ...config,
              strategy: { leafStrategyClass, storageStrategyClass },
              useWeakStorage,
              useObjectStorage,
            });
            const testArgs = [
              [1, 2, "hello world", 18, 22],
              [6, "evil", "hello", "typeof", 0],
              [[], { length: 2e2 }, [], {}, null],
              [() => {}, { length: 1 }, [1111], {}, null],
            ];

            for (let i = 1e2; i--; ) {
              expect(testArgs.map((arr) => memoized(...arr))).toEqual(
                testArgs.map((arr) => f(...arr))
              );
            }
          });
        }
});
