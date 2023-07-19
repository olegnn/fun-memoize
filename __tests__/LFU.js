const { LeafStorage } = require("../build/memoize/LeafStorage");
const { withDestroyable } = require("../build/base/CacheStrategy");
const { LFU } = require("../build/strategy/lfu");
const { NO_VALUE } = require("../build/value");
const {
  Destroyable,
  expectResult,
  extractNMapKeys,
  memoryOverflowTests,
} = require("./helpers");
const { default: memoize } = require("../build/index");

const DLFU = withDestroyable(LFU);

describe("Least frequently used:", () => {
  it("basic workflow", () => {
    let destroyed = [];
    const lfu = new DLFU(10);

    const values = Array.from(
      { length: 100 },
      (_, i) => new Destroyable(i, destroyed)
    );

    for (let i = 0; i < 10; i++) {
      expectResult(lfu.write(values[i]), [], [values[i]]);
      expect(lfu.len()).toBe(i + 1);
      expect(lfu.isFull()).toBe(false);
    }

    for (let i = 0; i < 10; i++) {
      expectResult(lfu.write(values[i]), [], []);
      expect(lfu.len()).toBe(10);
      expect(lfu.isFull()).toBe(false);
    }

    expectResult(lfu.write(values[10]), [values[0]], [values[10]]);
    expect(lfu.drop(values[0])).toBe(false);

    for (let i = 11; i <= 22; i++) {
      expect(lfu.write(values[i]));
      expect(lfu.len()).toBe(10);
      expect(lfu.isFull()).toBe(false);
    }

    expect(destroyed).toEqual([
      0, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ]);
  });

  it("Least frequently used", () => {
    let destroyed = [];
    const lfu = new DLFU(10);
    class Destroyable {
      constructor(value) {
        this.value = value;
      }

      destroy() {
        destroyed.push(this.value);
      }
    }
    const values = Array.from({ length: 100 }, (_, i) => new Destroyable(i));

    for (let i = 0; i < 10; i++) {
      expectResult(lfu.write(values[i]), [], [values[i]]);
      expect(lfu.len()).toBe(i + 1);
      expect(lfu.isFull()).toBe(false);
    }

    for (let i = 50; i < 55; i++) {
      expectResult(lfu.write(values[i]), [values[i - 50]], [values[i]]);
      expect(lfu.len()).toBe(10);
    }

    for (let i = 5; i < 10; i++) {
      expectResult(lfu.write(values[i]), [], []);
      expect(lfu.len()).toBe(10);
    }

    for (let i = 25; i < 50; i++) {
      expectResult(lfu.write(values[i]), undefined, [values[i]]);
      expect(lfu.len()).toBe(10);
    }

    expect(destroyed).toEqual([
      0, 1, 2, 3, 4, 50, 51, 52, 53, 54, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
      35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
    ]);
  });

  it("Zero cap", () => {
    expect(() => new DLFU(0)).toThrowErrorMatchingSnapshot();
  });

  it("memoization: `totalLeavesLimit = 2`", () => {
    const removed = [];
    const fn = memoize((a, b, c, d, e) => Math.random(), {
      strategy: LFU,
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
    const fn = memoize((a, b) => Math.random(), {
      strategy: LFU,
      onRemoveLeaf: (key) => {
        destroyed.push(key);
      },
      totalLeavesLimit: 10,
    });
    const destroyed = [];

    const args = Array.from({ length: 100 }, (_, i) => [String(i), i]);

    for (let i = 0; i < 10; i++) {
      fn(...args[i]);
    }

    expect(destroyed).toEqual([]);

    for (let i = 10; i > -1; --i) {
      fn(...args[i]);
    }

    expect(destroyed).toEqual([0, 10]);

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(destroyed).toEqual([0, 10, 0, 10, 11, 12, 13]);
  });

  it("memoization: `totalStoragesLimit`", () => {
    const fn = memoize((a, b) => Math.random(), {
      strategy: LFU,
      onRemoveStorage: (storage) => {
        removed.push(storage);
      },
      totalStoragesLimit: 10,
      checkLast: false,
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

    expect(extractNMapKeys(removed)).toEqual([0, 1, 10, 1]);

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(extractNMapKeys(removed)).toEqual([0, 1, 10, 1, 0, 10, 11, 12, 13]);
  });

  it("memoization: `leavesPerStorageLimit`", () => {
    const fn = memoize((a, b) => Math.random(), {
      strategy: LFU,
      onRemoveLeaf: (key) => {
        removed.push(key);
      },
      leavesPerStorageLimit: 10,
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

    expect(removed).toEqual([0, 10, 0, 10, 11, 12, 13]);
  });

  memoryOverflowTests(LFU);
});
