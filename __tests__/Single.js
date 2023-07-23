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
    expect(value.pushFront(2)).toBe(NO_VALUE);
    expectValues(value, [1]);
    value.takeKeyFront();
    expectValues(value, []);
    expect(value.pushBack(3)).toBe(3);
    expectValues(value, [3]);
    expect(value.addKeyFront(10, 10)).toBe(false);
    expectValues(value, [3]);
    value.addKeyFront(3, 11);
    expectValues(value, [3]);
    expect(value.takeBack()).toBe(3);
    value.takeBack();
    value.pushBack(12);
    expectValues(value, [12]);
    expect(value.takeFront()).toBe(12);
    value.takeBack();
    value.pushBack(1);
    value.remove(2);
    expectValues(value, [1]);
    value.remove(1);
    expectValues(value, []);
    value.pushBack(1);
    value.insertAfter(1, 2);
    expectValues(value, [1]);
    value.insertBefore(2, 3);
    expectValues(value, [1]);
    value.insertBefore(2, 1);
    expectValues(value, [1]);
    value.insertAfter(2, 1);
    expectValues(value, [1]);
    value.dropKey(1);
    expectValues(value, []);
    value.pushBack(1);
    expect(value.peekItemBack()).toBe(1);
    expect(value.peekItemFront()).toBe(1);
    expect(value.peekKeyBack()).toBe(1);
    expect(value.moveBack(1)).toBe(true);
    expect(value.moveBack(2)).toBe(false);
    expect(value.moveFront(1)).toBe(true);
    expect(value.moveFront(2)).toBe(false);
    expectValues(value, [1]);
    expect(value.peekBack()).toBe(1);
    value.dropKey(1);
    expectValues(value, []);
    value.pushBack(1);
    value.remove(1);
    expectValues(value, []);
  });
});
