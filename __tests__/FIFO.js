const { withDestroyable } = require("../build/base/CacheStrategy");
const { FIFO } = require("../build/strategy/fifo");
const {
  Destroyable,
  extractNMapKeys,
  expectResult,
  memoryOverflowTests,
} = require("./helpers");
const { default: memoize } = require("../build/index");

const DFIFO = withDestroyable(FIFO);

describe("First in first out:", () => {
  it("basic workflow", () => {
    let removed = [];
    const fifo = new DFIFO(10);

    const values = Array.from(
      { length: 100 },
      (_, i) => new Destroyable(i, removed)
    );

    for (let i = 0; i < 10; i++) {
      expectResult(fifo.write(values[i]), [], [values[i]]);
      expect(fifo.len()).toBe(i + 1);
      expect(fifo.isFull()).toBe(false);
    }

    for (let i = 0; i < 10; i++) {
      expectResult(fifo.write(values[i]), [], []);
      expect(fifo.len()).toBe(10);
      expect(fifo.isFull()).toBe(false);
    }

    expect(fifo.willBeFull()).toBe(true);
    expectResult(fifo.write(values[10]), [values[0]], [values[10]]);
    expect(fifo.len()).toBe(10);
    expect(fifo.has(values[0])).toBe(false);

    for (let i = 1; i < 11; i++) {
      expect(fifo.drop(values[i])).toBe(true);
      expect(fifo.len()).toBe(10 - i);
      expect(fifo.isFull()).toBe(false);
    }

    expect(removed).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("FIFO", () => {
    let removed = [];
    const fifo = new DFIFO(10);
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
      expectResult(fifo.write(values[i]), void 0, [values[i]]);
      expect(fifo.len()).toBe(i + 1);
      expect(fifo.isFull()).toBe(false);
    }

    for (let i = 50; i < 55; i++) {
      expectResult(fifo.write(values[i]), [values[i - 50]], [values[i]]);
      expect(fifo.len()).toBe(10);
    }

    for (let i = 5; i < 10; i++) {
      expectResult(fifo.write(values[i]), [], []);
      expect(fifo.len()).toBe(10);
    }

    for (let i = 25; i < 50; i++) {
      expectResult(fifo.write(values[i]), undefined, [values[i]]);
      expect(fifo.len()).toBe(10);
    }

    expect(removed).toEqual([
      0, 1, 2, 3, 4, 50, 51, 52, 53, 54, 5, 6, 7, 8, 9, 25, 26, 27, 28, 29, 30,
      31, 32, 33, 34, 35, 36, 37, 38, 39,
    ]);
  });

  it("Zero cap", () => {
    expect(() => new DFIFO(0)).toThrowErrorMatchingSnapshot();
  });

  it("memoization: `totalLeavesLimit`", () => {
    const fn = memoize((a, b) => Math.random(), {
      strategy: FIFO,
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

    expect(removed).toEqual([0, 1]);

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(removed).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("memoization: `totalStoragesLimit`", () => {
    const fn = memoize((a, b) => Math.random(), {
      strategy: FIFO,
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

    expect(extractNMapKeys(removed)).toEqual([0, 1, 2, 3]);

    for (let i = 5; i < 15; i++) {
      fn(...args[i]);
    }

    expect(extractNMapKeys(removed)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("memoization: `leavesPerStorageLimit`", () => {
    const fn = memoize((a, b) => Math.random(), {
      strategy: FIFO,
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

    expect(removed).toEqual([0, 1, 2, 3, 4, 5]);
  });

  memoryOverflowTests(FIFO);
});
