const { Result } = require("../build/utils");
const { expectResult } = require("./helpers");

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
