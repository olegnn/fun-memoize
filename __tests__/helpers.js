const { NO_VALUE, isPrimitiveValue } = require("../build/value");
const { zip, once } = require("../build/iterables");
const { default: memoize } = require("../build/index");
const { ParentPath } = require("../build/utils");

const FALSY_VALUES = [0, false, 0n, "", NaN, undefined, null].filter(
  (value) => !(process.env.OMIT_BIGINT && value?.constructor === BigInt)
);

const TEST_VALUES = [
  Infinity,
  -Infinity,
  12e7,
  2.23123123,
  2.23123123123123123123123123,
  123125345423423424n,
  123123435n,
  Symbol.for("123"),
  Symbol("12345"),
  "12345",
  Symbol("12345"),
  ...FALSY_VALUES,
].filter(
  (value) => !(process.env.OMIT_BIGINT && value?.constructor === BigInt)
);

const assertWithTrickyValues = (fn, assert) =>
  assertWithNTrickyValues(([value]) => fn(value), 1, assert);

const assertWithNTrickyValues = (fn, n, assert, args = []) =>
  n > 0
    ? TEST_VALUES.forEach((value) =>
        assertWithNTrickyValues(fn, n - 1, assert, [...args, value])
      )
    : assert(fn(args));

const extractNMapKeys = (maps) =>
  maps.flatMap((storage) => [...storage.entries()].map(({ key }) => key));

const expectResult = (result, removed, added) => {
  if (removed !== void 0) {
    expect([...result.removed]).toEqual([...removed]);
  }
  if (added !== void 0) {
    expect([...result.added]).toEqual([...added]);
  }
};

const createBasicStorageTests = (
  StorageType,
  keys,
  createParams = () => [{}],
  weak = false
) => {
  it("Checks basic workflow", () => {
    const storage = new StorageType(...createParams());
    const baseMap = new Map();

    const values = keys.map(() => Math.random());

    expect(storage.isEmpty()).toBe(true);

    for (const { left: key, right: value } of zip(keys, values)) {
      expect(storage.len()).toBe(baseMap.size);
      storage.set(key, value);
      baseMap.set(key, value);
      expect(storage.isEmpty()).toBe(false);
    }

    const sortBy = (a, b) => a.value - b.value;

    for (const { left: key, right: value } of zip(keys, values)) {
      expect(storage.len()).toBe(baseMap.size);
      expect(storage.isEmpty()).toBe(false);
      expect(storage.get(key)).toBe(value);
      expect(storage.drop(key)).toBe(value);
      baseMap.delete(key);
      expect(storage.get(key)).toBe(NO_VALUE);
      expect(storage.drop(key)).toBe(NO_VALUE);

      expect([...storage.entries()].sort(sortBy)).toEqual(
        [...baseMap.entries()]
          .filter(([key]) => (weak ? isPrimitiveValue(key) : true))
          .map(([key, value]) => ({ key, value }))
          .sort(sortBy)
      );
    }

    expect(storage.len()).toBe(0);
    expect(storage.isEmpty()).toBe(true);
  });

  if (!weak)
    it("Checks `Clearable` implementation", () => {
      const storage = new StorageType(...createParams());
      const baseMap = new Map();

      let value = 1;
      for (const key of keys) {
        baseMap.set(key, value);
        storage.set(key, value);
        expect(storage.get(key)).toBe(value);
        value++;
      }

      expect(storage.len()).toBe(baseMap.size);
      storage.clear();
      expect(storage.isEmpty()).toBe(true);
    });

  it("Checks `Destroyable` implementation", () => {
    const dropped = [];
    let rs = new ParentPath(
      {
        drop(key) {
          dropped.push(key);
        },
      },
      "abc"
    );
    let storage = new StorageType(...[...createParams(), once(rs)]);

    storage.set("1", 2);
    storage.destroy();
    expect(dropped).toEqual(["abc"]);

    for (let i = 0; i < 5; i++) {
      rs = new ParentPath(
        {
          drop(key) {
            dropped.push(key);
          },
        },
        i
      );
      storage = new StorageType(...[...createParams(), once(rs)]);
      rs.key = i;

      storage.destroy();

      expect(dropped).toEqual([
        "abc",
        ...Array.from({ length: i + 1 }, (_, i) => i),
      ]);
    }
  });
};

const memoryOverflow = (strategy, config, keygen) => {
  return () => {
    const fn = memoize((a, b, c) => Array(1e6).fill(Math.random()), {
      strategy,
      checkLast: false,
      length: keygen().length,
      ...config,
    });

    for (let i = 0; i < 2e3; i++) {
      fn(...keygen());
    }
  };
};

const memoryOverflowTests = (strategy) => {
  it(
    "memoization: `totalLeavesLimit` memory overflow",
    memoryOverflow(strategy, { totalLeavesLimit: 1 }, () => [
      Math.random(),
      Math.random(),
      Math.random(),
    ])
  );

  it(
    "memoization: `leavesPerStorageLimit` memory overflow",
    memoryOverflow(strategy, { leavesPerStorageLimit: 1 }, () => [
      0,
      0,
      Math.random(),
    ])
  );

  it(
    "memoization: `totalStoragesLimit` memory overflow",
    memoryOverflow(strategy, { totalStoragesLimit: 3 }, () => [
      Math.random(),
      Math.random(),
      Math.random(),
    ])
  );

  it(
    "memoization: `totalLeafStoragesLimit` weak storage memory overflow",
    memoryOverflow(
      strategy,
      { totalLeafStoragesLimit: 1, useWeakStorage: true },
      () => [{}, {}, {}]
    )
  );

  it(
    "memoization: no limit weak storage memory overflow",
    memoryOverflow(
      strategy,
      {
        totalLeafStoragesLimit: Infinity,
        totalStoragesLimit: Infinity,
        leavesPerStorageLimit: Infinity,
        totalLeavesLimit: Infinity,
        useWeakStorage: true,
      },
      () => [{}, {}, {}, 1, {}, "232", {}]
    )
  );
};

class Destroyable {
  constructor(value, destroyed = []) {
    this.value = value;
    this.destroyed = destroyed;
  }

  destroy() {
    if (typeof this.value?.destroy === "function") {
      this.value.destroy();
    }

    this.destroyed.push(this.value);
  }
}

module.exports = {
  Destroyable,
  FALSY_VALUES,
  TEST_VALUES: TEST_VALUES,
  extractNMapKeys,
  expectResult,
  memoryOverflow,
  memoryOverflowTests,
  assertWithTrickyValues,
  assertWithNTrickyValues,
  createBasicStorageTests,
};
