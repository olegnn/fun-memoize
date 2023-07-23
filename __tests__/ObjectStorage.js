const { ObjectStorage } = require("../build/storage/ObjectStorage");
const { isPrimitiveValue } = require("../build/value");
const { TEST_VALUES, createBasicStorageTests } = require("./helpers");

const keys = [
  1,
  "234",
  12313123,
  12.23123,
  12.23,
  123131231,
  123131231n,
  12313123123123123n,
  true,
  Symbol("1"),
  Symbol("1"),
  ...TEST_VALUES,
].filter(isPrimitiveValue);

describe("ObjectStorage", () => {
  createBasicStorageTests(ObjectStorage, keys);

  it("checks non-primitive errors", () => {
    const storage = new ObjectStorage();

    for (const key of [
      {},
      () => {},
      function () {},
      function* () {},
      Object.create(null),
    ]) {
      expect(() => storage.set(key, 1)).toThrowErrorMatchingSnapshot();
      expect(() => storage.get(key)).toThrowErrorMatchingSnapshot();
      expect(() => storage.drop(key)).toThrowErrorMatchingSnapshot();
      expect(() => storage.has(key)).toThrowErrorMatchingSnapshot();
    }
  });
});
