const { withDestroyable } = require("../build/base/CacheStrategy");
const { LRU } = require("../build/strategy/lru");
const {
  Destroyable,
  extractNMapKeys,
  expectResult,
  memoryOverflowTests,
} = require("./helpers");
const { default: memoize } = require("../build/index");

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

    expect(removed).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
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

    expect(removed).toEqual([
      0,
      1,
      2,
      3,
      4,
      50,
      51,
      52,
      53,
      54,
      5,
      6,
      7,
      8,
      9,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
    ]);
  });

  it("Zero cap", () => {
    expect(() => new DLRU(0)).toThrowErrorMatchingSnapshot();
  });

  it("memoization: `totalLeavesLimit`", () => {
    const fn = memoize((a, b) => Math.random(), {
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

    expect(removed).toEqual([]);

    for (let i = 10; i > -1; --i) {
      fn(...args[i]);
    }

    expect(removed).toEqual([0, 10]);

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(removed).toEqual([0, 10, 4, 3, 2, 1, 0]);
  });

  it("memoization: `totalStoragesLimit`", () => {
    const fn = memoize((a, b) => Math.random(), {
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

    expect(extractNMapKeys(removed)).toEqual([0]);

    for (let i = 10; i > -1; --i) {
      fn(...args[i]);
    }

    expect(extractNMapKeys(removed)).toEqual([0, 1, 10, 9]);

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(extractNMapKeys(removed)).toEqual([0, 1, 10, 9, 4, 3, 2, 1, 0, 5]);
  });

  it("memoization: `leavesPerStorageLimit`", () => {
    const fn = memoize((a, b) => Math.random(), {
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

    expect(removed).toEqual([]);

    for (let i = 10; i > -1; --i) {
      fn(...args[i]);
    }

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(removed).toEqual([0, 10, 4, 3, 2, 1, 0]);
  });

  memoryOverflowTests(LRU);
});
