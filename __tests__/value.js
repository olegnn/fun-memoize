const { isPrimitiveValue } = require("../build/value");

describe("value", () => {
  it("verifies `isPrimitiveValue`", () => {
    expect(isPrimitiveValue(null)).toBe(true);
    expect(isPrimitiveValue(undefined)).toBe(true);
    expect(isPrimitiveValue(NaN)).toBe(true);
    expect(isPrimitiveValue(Infinity)).toBe(true);
    expect(isPrimitiveValue("")).toBe(true);
    expect(isPrimitiveValue(2)).toBe(true);
    expect(isPrimitiveValue({})).toBe(false);
    expect(isPrimitiveValue(() => {})).toBe(false);
    expect(isPrimitiveValue(Symbol("123"))).toBe(true);
    expect(isPrimitiveValue(123n)).toBe(true);
    expect(isPrimitiveValue(Infinity)).toBe(true);
  });
});
