const { withDestroyable } = require("../build/base/CacheStrategy");
const { LRU } = require("../build/strategy/lru");
const {
  Destroyable,
  extractNMapKeys,
  expectResult,
  memoryOverflowTests,
} = require("./helpers");
const { default: memoize } = require("../build/index");
const { NO_VALUE } = require("../build/value");

const DLRU = withDestroyable(LRU);

describe("Least recently used:", () => {
  it("basic workflow", () => {
    let removed = [];
    const lru = new DLRU(10);

    const values = Array.from(
      { length: 100 },
      (_, i) => new Destroyable(i, removed)
    );

    for (let i = 0; i < 10; i++) {
      expectResult(lru.write(values[i]), [], [values[i]]);
      expect(lru.len()).toBe(i + 1);
      expect(lru.isFull()).toBe(false);
    }

    for (let i = 0; i < 10; i++) {
      expectResult(lru.write(values[i]), [], []);
      expect(lru.len()).toBe(10);
      expect(lru.isFull()).toBe(false);
    }

    expect(lru.willBeFull()).toBe(true);
    expectResult(lru.write(values[10]), [values[0]], [values[10]]);
    expect(lru.len()).toBe(10);
    expect(lru.has(values[0])).toBe(false);

    for (let i = 1; i < 11; i++) {
      expect(lru.drop(values[i])).toBe(true);
      expect(lru.len()).toBe(10 - i);
      expect(lru.isFull()).toBe(false);
    }

    expect(removed).toMatchSnapshot();
  });

  it("Least recently updated", () => {
    let removed = [];
    const lru = new DLRU(10);
    class Destroyable {
      constructor(value) {
        this.value = value;
      }

      destroy() {
        removed.push(this.value);
      }
    }
    const values = Array.from({ length: 100 }, (_, i) => new Destroyable(i));

    for (let i = 0; i < 10; i++) {
      expectResult(lru.write(values[i]), void 0, [values[i]]);
      expect(lru.len()).toBe(i + 1);
      expect(lru.isFull()).toBe(false);
    }

    for (let i = 50; i < 55; i++) {
      expectResult(lru.write(values[i]), [values[i - 50]], [values[i]]);
      expect(lru.len()).toBe(10);
    }

    for (let i = 5; i < 10; i++) {
      expectResult(lru.write(values[i]), [], []);
      expect(lru.len()).toBe(10);
    }

    for (let i = 25; i < 50; i++) {
      expectResult(lru.write(values[i]), undefined, [values[i]]);
      expect(lru.len()).toBe(10);
    }

    expect(removed).toMatchSnapshot();
  });

  it("Zero cap", () => {
    expect(() => new DLRU(0)).toThrowErrorMatchingSnapshot();
  });

  it("memoization: `totalLeavesLimit = 2`", () => {
    const removed = [];
    const fn = memoize((_a, _b, _c, _d, _e) => Math.random(), {
      strategy: LRU,
      totalLeavesLimit: 2,
      onRemoveStorage: (storage) => {
        const key = [...storage.parentPaths]
          .map(({ key }) => key)
          .find((key) => key !== NO_VALUE);
        removed.push(key);
      },
      onRemoveLeaf: (key) => {
        removed.push(key);
      },
    });

    const args = Array.from({ length: 100 }, (_, i) => [
      `root`,
      `${(i / 2) | 0}-0`,
      `${(i / 2) | 0}-1`,
      `${i}-2`,
      `${i}-3`,
    ]);

    for (let i = 0; i < 10; i++) {
      fn(...args[i]);
      expect(removed).toMatchSnapshot();
    }
  });

  it("memoization: `totalLeavesLimit`", () => {
    const fn = memoize((_a, _b) => Math.random(), {
      strategy: LRU,
      totalLeavesLimit: 10,
      onRemoveLeaf: (key) => {
        removed.push(key);
      },
    });
    const removed = [];

    const args = Array.from({ length: 100 }, (_, i) => [String(i), i]);

    for (let i = 0; i < 10; i++) {
      fn(...args[i]);
    }

    expect(removed).toMatchSnapshot();

    for (let i = 10; i > -1; --i) {
      fn(...args[i]);
    }

    expect(removed).toMatchSnapshot();

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(removed).toMatchSnapshot();
  });

  it("memoization: `totalStoragesLimit`", () => {
    const fn = memoize((_a, _b) => Math.random(), {
      strategy: LRU,
      totalStoragesLimit: 10,
      checkLast: false,
      onRemoveStorage: (storage) => {
        removed.push(storage);
      },
    });
    const removed = [];

    const args = Array.from({ length: 100 }, (_, i) => [String(i), i]);

    for (let i = 0; i < 10; i++) {
      fn(...args[i]);
    }

    expect(extractNMapKeys(removed)).toMatchSnapshot();

    for (let i = 10; i > -1; --i) {
      fn(...args[i]);
    }

    expect(extractNMapKeys(removed)).toMatchSnapshot();

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(extractNMapKeys(removed)).toMatchSnapshot();
  });

  it("memoization: `leavesPerStorageLimit`", () => {
    const fn = memoize((_a, _b) => Math.random(), {
      strategy: LRU,
      leavesPerStorageLimit: 10,
      onRemoveLeaf: (key) => {
        removed.push(key);
      },
    });
    const removed = [];

    const args = Array.from({ length: 100 }, (_, i) => [0, i]);

    for (let i = 0; i < 10; i++) {
      fn(...args[i]);
    }

    expect(removed).toMatchSnapshot();

    for (let i = 10; i > -1; --i) {
      fn(...args[i]);
    }

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(removed).toMatchSnapshot();
  });

  memoryOverflowTests(LRU);
});
