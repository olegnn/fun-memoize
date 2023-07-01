const { createMemoizedSelector, default: memoize } = require("../build");

// Construct 1E6 states for perf test outside of the perf test so as to not change the execute time of the test function
const numOfStates = 1e6;
const states = [];

for (let i = 0; i < numOfStates; i++) states.push({ a: 1, b: 2 });

describe("selectors:", () => {
  it("basic selector", () => {
    const selector = createMemoizedSelector(
      (state) => state.a,
      (a) => a
    );
    const firstState = { a: 1 };
    const firstStateNewPointer = { a: 1 };
    const secondState = { a: 2 };

    expect(selector(firstState)).toEqual(1);
    expect(selector(firstState)).toEqual(1);
    expect(selector.recomputations()).toEqual(1);
    expect(selector(firstStateNewPointer)).toEqual(1);
    expect(selector.recomputations()).toEqual(1);
    expect(selector(secondState)).toEqual(2);
    expect(selector.recomputations()).toEqual(2);
  });
  test("don't pass extra parameters to inputSelector when only called with the state", () => {
    const selector = createMemoizedSelector(
      (...params) => 1,
      (a) => a
    );
    expect(selector({})).toEqual(1);
  });
  it("basic selector multiple keys", () => {
    const selector = createMemoizedSelector(
      (state) => state.a,
      (state) => state.b,
      (a, b) => a + b
    );
    const state1 = { a: 1, b: 2 };
    expect(selector(state1)).toEqual(3);
    expect(selector(state1)).toEqual(3);
    expect(selector.recomputations()).toEqual(1);
    const state2 = { a: 3, b: 2 };
    expect(selector(state2)).toEqual(5);
    expect(selector(state2)).toEqual(5);
    expect(selector.recomputations()).toEqual(2);
  });
  it("basic selector invalid input selector", () => {
    expect(() =>
      createMemoizedSelector(
        (state) => state.a,
        "not a function",
        (a, b) => a + b
      )
    ).toThrowError();
  });
  it("basic selector cache hit performance", () => {
    if (process.env.COVERAGE) return; // don't run performance tests for coverage

    const selector = createMemoizedSelector(
      (state) => state.a,
      (state) => state.b,
      (a, b) => a + b
    );
    const state1 = { a: 1, b: 2 };

    const start = new Date();
    for (let i = 0; i < 1000000; i++) selector(state1);

    const totalTime = new Date() - start;

    expect(selector(state1)).toEqual(3);
    expect(selector.recomputations()).toEqual(1);
  });
  it("basic selector cache hit performance for state changes but shallowly equal selector args", () => {
    if (process.env.COVERAGE) return; // don't run performance tests for coverage

    const selector = createMemoizedSelector(
      (state) => state.a,
      (state) => state.b,
      (a, b) => a + b
    );

    const start = new Date();
    for (let i = 0; i < numOfStates; i++) selector(states[i]);

    const totalTime = new Date() - start;

    expect(selector(states[0])).toEqual(3);
    expect(selector.recomputations()).toEqual(1);
  });
  it("memoized composite arguments", () => {
    const selector = createMemoizedSelector(
      (state) => state.sub,
      (sub) => sub
    );
    const state1 = { sub: { a: 1 } };
    expect(selector(state1)).toEqual({ a: 1 });
    expect(selector(state1)).toEqual({ a: 1 });
    expect(selector.recomputations()).toEqual(1);
    const state2 = { sub: { a: 2 } };
    expect(selector(state2)).toEqual({ a: 2 });
    expect(selector.recomputations()).toEqual(2);
  });
  it("first argument can be an array", () => {
    const selector = createMemoizedSelector(
      [(state) => state.a, (state) => state.b],
      (a, b) => a + b
    );
    expect(selector({ a: 1, b: 2 })).toEqual(3);
    expect(selector({ a: 1, b: 2 })).toEqual(3);
    expect(selector.recomputations()).toEqual(1);
    expect(selector({ a: 3, b: 2 })).toEqual(5);
    expect(selector.recomputations()).toEqual(2);
  });
  it("recomputes result after exception", () => {
    let called = 0;
    const selector = createMemoizedSelector(
      (state) => state.a,
      (_) => {
        called++;
        throw Error("test error");
      }
    );
    expect(() => selector({ a: 1 })).toThrowError();
    expect(() => selector({ a: 1 })).toThrowError();
    expect(called).toEqual(2);
  });
  it("memoizes previous result before exception", () => {
    let called = 0;
    const selector = createMemoizedSelector(
      (state) => state.a,
      (a) => {
        called++;
        if (a > 1) throw Error("test error");
        return a;
      }
    );
    const state1 = { a: 1 };
    const state2 = { a: 2 };
    expect(selector(state1)).toEqual(1);
    expect(selector(state1)).toEqual(1);
    expect(called).toEqual(1);
  });
  it("chained selector", () => {
    const selector1 = createMemoizedSelector(
      (state) => state.sub,
      (sub) => sub
    );
    const selector2 = createMemoizedSelector(selector1, (sub) => sub.value);
    const state1 = { sub: { value: 1 } };
    expect(selector2(state1)).toEqual(1);
    expect(selector2(state1)).toEqual(1);
    expect(selector2.recomputations()).toEqual(1);
    const state2 = { sub: { value: 2 } };
    expect(selector2(state2)).toEqual(2);
    expect(selector2.recomputations()).toEqual(2);
  });

  it("exported memoize", () => {
    let called = 0;
    const memoized = memoize((state) => {
      called++;
      return state.a;
    });

    const o1 = { a: 1 };
    const o2 = { a: 2 };
    expect(memoized(o1)).toEqual(1);
    expect(memoized(o1)).toEqual(1);
    expect(called).toEqual(1);
    expect(memoized(o2)).toEqual(2);
    expect(called).toEqual(2);
  });
  it("exported memoize with valueEquals override", () => {
    // a rather absurd equals operation we can verify in tests
    let called = 0;
    const valueEquals = (a, b) => typeof a === typeof b;
    const memoized = memoize((a) => {
      called++;
      return a;
    }, valueEquals);
    expect(memoized(1)).toEqual(1);
    expect(memoized(2)).toEqual(2);
    expect(called).toEqual(2);
    expect(memoized("A")).toEqual("A");
    expect(called).toEqual(3);
  });
  it("exported memoize passes correct objects to equalityCheck", () => {
    let callNums = 0;
    const someObject = { foo: "bar" };
    const anotherObject = { foo: "bar" };
    const memoized = memoize((a) => {
      callNums += 1;
      return a;
    });

    // the first call to `memoized` doesn't hit because `memoize.lastArgs` is uninitialized
    // and so `equalityCheck` is never called
    memoized(someObject);
    expect(callNums).toBe(1);

    // the next call, with a different object reference, does fall through
    memoized(anotherObject);
    expect(callNums).toBe(2);

    // the third call does not fall through because `memoize` passes `anotherObject` as
    // both the `newVal` and `oldVal` params. This allows `shallowEqual` to be much more performant
    // than if it had passed `someObject` as `oldVal`, even though `someObject` and `anotherObject`
    // are shallowly equal
    memoized(anotherObject);
    expect(callNums).toBe(2);
  });
  it("export last function as resultFunc", () => {
    const lastFunction = () => {};
    const selector = createMemoizedSelector((state) => state.a, lastFunction);
    expect(selector.resultFunction).toEqual(lastFunction);
  });
  it("export dependencies as dependencies", () => {
    const dependency1 = (state) => {
      state.a;
    };
    const dependency2 = (state) => {
      state.a;
    };

    const selector = createMemoizedSelector(dependency1, dependency2, () => {});
    expect(selector.dependencies).toEqual([dependency1, dependency2]);
  });
  it("tests call with many args", () => {
    const selector = createMemoizedSelector(
      (a) => a,
      (_, b) => b,
      (_, __, c) => c,
      (_, b) => b,
      (a, b, c, b1) => a + b + c + b1
    );

    for (let i = 10; --i; ) expect(selector(5, 6, 7)).toBe(24);
    expect(selector.recomputations()).toBe(1);
  });
});
