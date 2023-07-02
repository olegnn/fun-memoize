const { Single } = require("../build/collections/Single");
const { NO_VALUE } = require("../build/value");

const expectValues = (value, expected) => {
  expect([...value.valuesBack()]).toEqual(expected);
  expect([...value.valuesFront()]).toEqual(expected);
  expect([...value.keysFront()]).toEqual(expected);
  expect([...value.keysBack()]).toEqual(expected);
  expect([...value.keys()]).toEqual(expected);
};

describe("Single", () => {
  it("checks basic workflow", () => {
    const value = new Single(1);

    expect(value.get(0)).toBe(NO_VALUE);
    expect(value.get(1)).toBe(1);
    value.pushFront(2);
    expectValues(value, [2]);
    value.takeKeyFront();
    expectValues(value, []);
    value.pushBack(3);
    expectValues(value, [3]);
    value.addKeyFront(10, 10);
    expectValues(value, [10]);
    value.addKeyFront(1231, 11);
    expectValues(value, [11]);
    expect(value.takeBack()).toBe(11);
    value.pushBack(12);
    expectValues(value, [12]);
    expect(value.takeFront()).toBe(12);
    value.pushBack(1);
    value.remove(2);
    expectValues(value, [1]);
    value.remove(1);
    expectValues(value, []);
    value.pushBack(1);
    value.insertAfter(1, 2);
    expectValues(value, [2]);
    value.insertBefore(2, 3);
    expectValues(value, [3]);
    value.insertBefore(2, 1);
    expectValues(value, [3]);
    value.insertAfter(2, 1);
    expectValues(value, [3]);
    value.dropKey(3);
    expectValues(value, []);
    value.pushBack(1);
    value.dropKey(3);
    expectValues(value, [1]);
    value.dropKey(1);
    expectValues(value, []);
    value.pushBack(1);
    value.remove(1);
    expectValues(value, []);
  });
});
