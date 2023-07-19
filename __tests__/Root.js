const { LeafStorage } = require("../build/memoize/LeafStorage");
const { Root } = require("../build/memoize/Root");
const { StorageContext } = require("../build/memoize/StorageContext");
const { MapStorage } = require("../build/storage/MapStorage");
const { Noop } = require("../build/strategy/noop");
const { NO_VALUE } = require("../build/value");
const { assertWithNTrickyValues } = require("./helpers");

describe("Root", () => {
  for (const checkLast of [false, true]) {
    it(`object workflow ${checkLast ? "with" : "without"} last`, () => {
      const ctx = new StorageContext();
      const storage = new Root({ length: 4, checkLast }, ctx);

      const obj1 = {};
      const obj2 = {};
      const obj3 = {};

      storage.setPath(["234", NaN, obj3, obj1], obj3);
      assertWithNTrickyValues(storage.extractPath.bind(storage), 4, (value) =>
        expect(value.result).toBe(NO_VALUE)
      );
      expect(storage.extractPath(["234", 0, obj3, obj2]).result).toBe(NO_VALUE);
      expect(storage.extractPath(["234", NaN, obj3, obj2]).result).toBe(
        NO_VALUE
      );
      expect(storage.extractPath(["234", NaN, obj2, obj2]).result).toBe(
        NO_VALUE
      );
      expect(storage.extractPath(["234", NaN, obj3, obj1]).result).toBe(obj3);

      expect(() =>
        storage.getOrInsertWith(["1", obj2, obj3], () => 1)
      ).toThrowErrorMatchingSnapshot();
    });

    it(`storage removal ${checkLast ? "with" : "without"} last`, () => {
      const ctx = new StorageContext({
        totalLeavesLimit: 1,
        totalStoragesLimit: 5,
      });
      const storage = new Root({ length: 3, checkLast }, ctx);

      storage.getOrInsertWith([1, 2, 3], Math.random);
      storage.getOrInsertWith([1, 3, 4], Math.random);
      storage.getOrInsertWith([1, 4, 5], Math.random);
      storage.getOrInsertWith([2, 5, 5], Math.random);
      storage.getOrInsertWith([2, 6, 6], Math.random);
      expect(ctx.rootLeafStrategy.len()).toBe(1);
      expect(ctx.rootStorageStrategy.len()).toBe(3);
      expect(ctx.rootLeafStrategy.peek().len()).toBe(1);
    });

    it(`primitive ${checkLast ? "with" : "without"} last`, () => {
      const ctx = new StorageContext();
      const storage = new Root({ length: 4, checkLast }, ctx);

      storage.setPath(["", NaN, 1, 2], 3);
      assertWithNTrickyValues(storage.extractPath.bind(storage), 4, (value) =>
        expect(value.result).toBe(NO_VALUE)
      );
      expect(storage.extractPath(["", 0, 2, 1]).result).toBe(NO_VALUE);
      expect(storage.extractPath(["", NaN, 1, 3]).result).toBe(NO_VALUE);
      expect(storage.extractPath(["1", NaN, 1, 2]).result).toBe(NO_VALUE);
      expect(storage.extractPath(["", NaN, 1, 2]).result).toBe(3);

      expect(() =>
        storage.getOrInsertWith(["1", "2", "3"], () => 1)
      ).toThrowErrorMatchingSnapshot();
    });
  }
});
