const { Root } = require("../build/memoize/Root");
const { StorageContext } = require("../build/memoize/StorageContext");
const { NO_VALUE } = require("../build/value");
const { assertWithNTrickyValues } = require("./helpers");

describe("Root", () => {
  for (const checkLast of [false, true]) {
    it(`object workflow ${checkLast ? "with" : "without"} last`, () => {
      const ctx = new StorageContext({ depth: 4 });
      const storage = new Root({ depth: 4, checkLast }, ctx);

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
        depth: 3,
        totalLeavesLimit: 1,
        totalStoragesLimit: 5,
      });
      const storage = new Root({ depth: 3, checkLast }, ctx);

      storage.getOrInsertWith([1, 2, 3], Math.random);
      storage.getOrInsertWith([1, 3, 4], Math.random);
      storage.getOrInsertWith([1, 4, 5], Math.random);
      storage.getOrInsertWith([2, 5, 5], Math.random);
      storage.getOrInsertWith([2, 6, 6], Math.random);
      expect(ctx.rootLeafStoragesStrategy.len()).toBe(1);
      expect(ctx.rootStoragesStrategy.len()).toBe(2);
      expect(ctx.rootLeafStoragesStrategy.peek().len()).toBe(1);
    });

    it(`primitive ${checkLast ? "with" : "without"} last`, () => {
      const ctx = new StorageContext({ depth: 4 });
      const storage = new Root({ depth: 4, checkLast }, ctx);

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

  it(`input validation`, () => {
    expect(
      () =>
        new StorageContext({
          depth: 6,
          totalStoragesLimit: 5,
        })
    ).toThrowErrorMatchingSnapshot();

    for (const value of [1.3, -1, -Infinity, 131232312313123112312]) {
      for (const key of [
        "totalLeavesLimit",
        "totalStoragesLimit",
        "totalLeafStoragesLimit",
        "leavesPerStorageLimit",
        "depth",
      ]) {
        expect(() => {
          new StorageContext({
            depth: 1,
            [key]: value,
          });
        }).toThrowErrorMatchingSnapshot();
      }
    }
  });
});
