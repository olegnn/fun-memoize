const { Result } = require("../build/strategy/types");
const { expectResult } = require("./helpers");
const { withSize } = require("../build/iterators");

describe("Result", () => {
  it("checks constructor", () => {
    expectResult(new Result(), [], []),
      expectResult(new Result(void 0, [1]), [], [1]);
    expectResult(new Result([1], void 0), [1]);
  });

  it("checks `chain`ing", () => {
    expectResult(new Result([1]).chain(new Result([2, 3])), [1, 2, 3]);
    expectResult(
      new Result([1]).chain(new Result([2, 3], [3, 4])),
      [1, 2, 3],
      [3, 4]
    );
    expectResult(
      new Result([1], [2]).chain(new Result([2, 3], [3, 4])),
      [1, 2, 3],
      [2, 3, 4]
    );
  });

  it("checks `counter`", () => {
    expect(new Result().counter()).toBe(0),
      expect(new Result(void 0, withSize([1], 1)).counter()).toBe(1);
    expect(new Result(withSize([1], 1), void 0).counter()).toBe(-1);
    expect(
      new Result(withSize([1, 2, 3], 3), withSize([4, 5, 6], 3)).counter()
    ).toBe(0);
    expect(new Result(withSize([1, 2, 3], 3), withSize([4], 1)).counter()).toBe(
      -2
    );
    expect(new Result(withSize([1], 1), withSize([4, 5, 6], 3)).counter()).toBe(
      2
    );
  });

  it("checks combinators", () => {
    const removed = [];
    const added = [];
    const removedMore = [];
    const addedMore = [];
    Result.removedAdded([4, 5, 6], [1, 2, 3])
      .forEachRemoved((val) => removed.push(val))
      .forEachAdded((val) => added.push(val))
      .forEachRemoved((val) => removedMore.push(val))
      .forEachAdded((val) => addedMore.push(val));

    expect(added).toEqual([1, 2, 3]);
    expect(addedMore).toEqual([1, 2, 3]);
    expect(removed).toEqual([4, 5, 6]);
    expect(removedMore).toEqual([4, 5, 6]);
  });
});
