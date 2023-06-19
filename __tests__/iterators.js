const { zip, chain } = require("../build/iterators");

describe("Iterators", () => {
  it("Checks `zip`", () => {
    expect([...zip([1, 2, 3], [3, 4, 5])]).toEqual([
      { left: 1, right: 3 },
      { left: 2, right: 4 },
      { left: 3, right: 5 },
    ]);
    expect([...zip([1, 2, 3], [3, 4])]).toEqual([
      { left: 1, right: 3 },
      { left: 2, right: 4 },
    ]);
    expect([...zip([1, 2], [3, 4, 5])]).toEqual([
      { left: 1, right: 3 },
      { left: 2, right: 4 },
    ]);
    expect([...zip([1, 2, 3], [])]).toEqual([]);
    expect([...zip([], [1, 2, 3])]).toEqual([]);
  });

  it("Checks `chain`", () => {
    expect([...chain([1, 2, 3], [4, 5, 6])]).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...chain([1, 2, 3], [])]).toEqual([1, 2, 3]);
    expect([...chain([], [1, 2, 3])]).toEqual([1, 2, 3]);
  });
});
