const {
  zip,
  chain,
  values,
  cycle,
  flatMap,
  map,
  empty,
  once,
} = require("../build/iterables");

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

  it("Checks `values`", () => {
    expect([...values(1, 2, 3)]).toEqual([1, 2, 3]);
    expect([...values()]).toEqual([]);
  });

  it("Checks `cycle`", () => {
    let ctr = 1,
      repetitions = 0;
    for (const item of cycle([1, 2, 3])) {
      if (ctr === 4) {
        ctr = 1;
        if (++repetitions === 10) break;
      }
      expect(item).toBe(ctr++);
    }

    expect(repetitions).toBe(10);
  });

  it("Checks `map`", () => {
    expect([...map((item) => item + 1, [1, 2, 3])]).toEqual([2, 3, 4]);
  });

  it("Checks `flatMap`", () => {
    expect([...flatMap((item) => [...item, 2], [[1], [2], [3, 4]])]).toEqual([
      1, 2, 2, 2, 3, 4, 2,
    ]);
  });

  it("Checks `once`", () => {
    expect([...once(2)]).toEqual([2]);
  });

  it("Checks `empty`", () => {
    expect([...empty()]).toEqual([]);
  });
});
