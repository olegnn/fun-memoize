const { UnifiedStorage } = require("../build/storage/UnifiedStorage");
const { TRICKY_VALUES, createBasicStorageTests } = require("./helpers");

const obj1 = {};
const obj2 = {};
const obj3 = Object.create(null);
const obj4 = Object.create(obj2);
const obj5 = Object.create(obj3);
const obj6 = Object.create(obj5);
const fns = [() => {}, function () {}, function* () {}];
const arr = [1, 2];
const keys = [
  ...fns,
  arr,
  1,
  "234",
  true,
  obj2,
  obj3,
  obj4,
  obj5,
  obj1,
  obj6,
  ...TRICKY_VALUES,
];

describe("UnifiedStorage based on a Map", () =>
  createBasicStorageTests(UnifiedStorage, keys));
describe("UnifiedStorage based on a WeakMap", () =>
  createBasicStorageTests(
    UnifiedStorage,
    keys,
    { useWeakStorage: true },
    true
  ));
describe("UnifiedStorage based on a ObjectMap", () =>
  createBasicStorageTests(UnifiedStorage, keys, { useObjectStorage: true }));
describe("UnifiedStorage based on a ObjectMap", () =>
  createBasicStorageTests(
    UnifiedStorage,
    keys,
    {
      useWeakStorage: true,
      useObjectStorage: true,
    },
    true
  ));
