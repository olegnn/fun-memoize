const { ObjectStorage } = require("../build/storage/ObjectStorage");
const { isPrimitiveValue } = require("../build/value");
const { TRICKY_VALUES, createBasicStorageTests } = require("./helpers");

const keys = [1, "234", true, ...TRICKY_VALUES].filter(isPrimitiveValue);

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
