const { LeafStorage } = require("../build/memoize/LeafStorage");
const { Root } = require("../build/memoize/Root");
const { StorageContext } = require("../build/memoize/StorageContext");
const { MapStorage } = require("../build/storage/MapStorage");
const { Noop } = require("../build/strategy/noop");
const { NO_VALUE } = require("../build/value");
const { assertWithNTrickyValues } = require("./helpers");

describe("selectors:", () => {
  it("object workflow", () => {
    const ctx = new StorageContext(
      new Noop(1),
      new Noop(1),
      MapStorage,
      LeafStorage,
      () => new Noop(1)
    );
    const storage = new Root(4, ctx);

    const obj1 = {};
    const obj2 = {};
    const obj3 = {};

    storage.setPath(["234", NaN, obj3, obj1], obj3);
    assertWithNTrickyValues(storage.extractPath.bind(storage), 4, (value) =>
      expect(value.result).toBe(NO_VALUE)
    );
    expect(storage.extractPath(["234", 0, obj3, obj2]).result).toBe(NO_VALUE);
    expect(storage.extractPath(["234", NaN, obj3, obj2]).result).toBe(NO_VALUE);
    expect(storage.extractPath(["234", NaN, obj2, obj2]).result).toBe(NO_VALUE);
    expect(storage.extractPath(["234", NaN, obj3, obj1]).result).toBe(obj3);
  });

  it("primitive workflow", () => {
    const ctx = new StorageContext(
      new Noop(1),
      new Noop(1),
      MapStorage,
      LeafStorage,
      () => new Noop(1)
    );
    const storage = new Root(4, ctx);

    storage.setPath(["", NaN, 1, 2], 3);
    assertWithNTrickyValues(storage.extractPath.bind(storage), 4, (value) =>
      expect(value.result).toBe(NO_VALUE)
    );
    expect(storage.extractPath(["", 0, 2, 1]).result).toBe(NO_VALUE);
    expect(storage.extractPath(["", NaN, 1, 3]).result).toBe(NO_VALUE);
    expect(storage.extractPath(["1", NaN, 1, 2]).result).toBe(NO_VALUE);
    expect(storage.extractPath(["", NaN, 1, 2]).result).toBe(3);
  });
});
