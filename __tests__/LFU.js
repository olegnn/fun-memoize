const { LeafStorage } = require("../build/memoize/LeafStorage");
const { withDestroyable } = require("../build/base/CacheStrategy");
const { LFU } = require("../build/strategy/lfu");
const { NO_VALUE } = require("../build/value");
const {
  Destroyable,
  expectResult,
  getStorageKey,
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

    expect(destroyed).toMatchSnapshot();
  });

  it("`Destroyable` implementation", () => {
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

    expect(destroyed).toMatchSnapshot();
  });

  it("Zero cap", () => {
    expect(() => new DLFU(0)).toThrowErrorMatchingSnapshot();
  });

  it("memoization: `totalLeavesLimit = 2`", () => {
    const removed = [];
    const fn = memoize((_a, _b, _c, _d, _e) => Math.random(), {
      strategy: LFU,
      totalLeavesLimit: 2,
      onRemoveStorage: (storage) => {
        removed.push(getStorageKey(storage));
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
    const fn = memoize((_a, _b, _c) => Math.random(), {
      strategy: LFU,
      onRemoveLeaf: (key) => {
        destroyed.push(key);
      },
      totalLeavesLimit: 10,
    });
    const destroyed = [];

    const args = Array.from({ length: 100 }, (_, i) => [
      `root-${i}`,
      String(i),
      i,
    ]);

    for (let i = 0; i < 10; i++) {
      fn(...args[i]);
    }

    expect(destroyed).toMatchSnapshot();

    for (let i = 10; i > -1; --i) {
      fn(...args[i]);
    }

    expect(destroyed).toMatchSnapshot();

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(destroyed).toMatchSnapshot();
  });

  it("memoization: `totalStoragesLimit`", () => {
    const fn = memoize((_a, _b, _c) => Math.random(), {
      strategy: LFU,
      onRemoveStorage: (storage) => {
        removed.push(getStorageKey(storage));
      },
      totalStoragesLimit: 10,
      checkLast: false,
    });
    const removed = [];

    const args = Array.from({ length: 10 }, (_, i) => [
      `root-${(i / 2) | 0}`,
      String((i / 2) | 0),
      i,
    ]);

    for (let i = 0; i < 5; i++) {
      fn(...args[i]);
    }

    expect(removed).toMatchSnapshot();

    for (let i = 5; i > -1; --i) {
      fn(...args[i]);
    }

    expect(removed).toMatchSnapshot();

    for (let i = 3; i < 8; i++) {
      fn(...args[i]);
    }

    expect(removed).toMatchSnapshot();
  });

  it("memoization: `leavesPerStorageLimit`", () => {
    const fn = memoize((_a, _b, _c) => Math.random(), {
      strategy: LFU,
      onRemoveLeaf: (key) => {
        removed.push(key);
      },
      leavesPerStorageLimit: 10,
    });
    const removed = [];

    const args = Array.from({ length: 100 }, (_, i) => [
      `root-${i}`,
      String(i),
      i,
    ]);

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

    expect(removed).toMatchSnapshot();
  });

  memoryOverflowTests(LFU);
});
