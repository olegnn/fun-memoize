// TODO: add more libraries
const Benchmark = require("benchmark");
const memoizeMoize = require("moize");
const { createSelector } = require("reselect");
const fastMemoize = require("fast-memoize");
const memoizeLodash = require("lodash.memoize");
const imemoized = require("iMemoized");
const { default: createCachedSelector } = require("re-reselect");
const { default: memoize, createMemoizedSelector } = require("../dist");

const suites = Array.from({ length: 6 }, () => new Benchmark.Suite());

const strA = "hello world!".repeat(1e5);
const strB = "c";
const strC = strA + strB;

const stringsFunc = (a, b, c) => {
  let res = 0;
  for (let i = 0; i < (a.length + b.length + c.length) / 10; i++) res += 5;
  return res;
};

const numberFunc = (a, b, c) => {
  let res = 0;
  for (let i = 0; i < 1e5; i++) res += 5;

  return res;
};

const mixedFunc = (a, b, c) => {
  let res = 0;
  for (let i = 0; i < a.length * b + Object.keys(c).length; i++) res += 5;

  return res;
};

const fibonacci = (n) => (n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2));

const memoizedStringsFunMemoize = memoize(stringsFunc);
const memoizedStringsI = imemoized.memoize(stringsFunc);
const memoizedStringsFast = fastMemoize(stringsFunc);
const memoizedStringsLodash = memoizeLodash(stringsFunc);
const memoizedStringsMoize = memoizeMoize(stringsFunc);

const memoizedFibFunMemoize = memoize(fibonacci);
const memoizedFibI = imemoized.memoize(fibonacci);
const memoizedFibFast = fastMemoize(fibonacci);
const memoizedFibLodash = memoizeLodash(fibonacci);
const memoizedFibMoize = memoizeMoize(fibonacci);

const memoizedNumbersFunMemoize = memoize(numberFunc);
const memoizedNumbersI = imemoized.memoize(numberFunc);
const memoizedFNumbers = fastMemoize(numberFunc);
const memoizedNumbersLodash = memoizeLodash(numberFunc);
const memoizedNumbersMoize = memoizeMoize(numberFunc);

const memoizedMixedFunMemoize = memoize(mixedFunc);
const memoizedMixedI = imemoized.memoize(mixedFunc);
const memoizedMixedFast = fastMemoize(mixedFunc);
const memoizedMixedLodash = memoizeLodash(mixedFunc);
const memoizedMixedMoize = memoizeMoize(mixedFunc);

const selectA = (obj) => obj.a;

const selectB = (obj) => obj.b;

const selectC = (obj) => obj.c;

const stateSelectorReselect = createSelector(
  selectA,
  selectB,
  selectC,
  numberFunc
);
const stateSelectorReReselect = createCachedSelector(
  selectA,
  selectB,
  selectC,
  numberFunc
)((a, b, c) => String(a + b + c));
const stateSelectorFunMemoize = createMemoizedSelector(
  selectA,
  selectB,
  selectC,
  numberFunc
);
const selectorFuncs = [selectA, selectB, selectC];

const states = Array.from({ length: 1e2 }, () => ({
  a: Math.random() * 10,
  b: Math.random() * 70,
  c: Math.random() * 10,
}));

const o = { a: 15 };

function* stateGen() {
  for (let i = 0, m = 1; 1; ) {
    const next = 3;
    if (i + m * next > states.length || i + m * next < 0) m = -m;
    i += m * next;
    yield states[i];
  }
}

const stateGen1 = stateGen();

const stateGen2 = stateGen();

const stateGen3 = stateGen();

const assertEq = (param1, param2) => {
  if (param1 !== param2) {
    throw new Error(
      `Assertion failed: ${String(param1)} !== ${String(param2)}`
    );
  }
};

const computedStates = new WeakMap(
  states.map((obj) => [obj, stateSelectorReselect(obj)])
);

const computedStringsFuncResult = stringsFunc(strA, strB, strC);

const computedNumbersFuncResult = numberFunc(5, 100, 2);

const computedMixedFuncResult = mixedFunc(strA, 0.0025, o);

suites[0]
  .add("fun-memoize#strings", () =>
    assertEq(
      memoizedStringsFunMemoize(strA, strB, strC),
      computedStringsFuncResult
    )
  )
  .add("fast-memoize#strings", () =>
    assertEq(memoizedStringsFast(strA, strB, strC), computedStringsFuncResult)
  )
  .add("iMemoized#strings", () =>
    assertEq(memoizedStringsI(strA, strB, strC), computedStringsFuncResult)
  )
  .add("lodash.memoize#strings", () =>
    assertEq(memoizedStringsLodash(strA, strB, strC), computedStringsFuncResult)
  )
  .add("moize#strings", () =>
    assertEq(memoizedStringsMoize(strA, strB, strC), computedStringsFuncResult)
  );
suites[1]
  .add("fun-memoize#numbers", () =>
    assertEq(memoizedNumbersFunMemoize(5, 100, 2), computedNumbersFuncResult)
  )
  .add("lodash.memoize#numbers", () =>
    assertEq(memoizedNumbersLodash(5, 100, 2), computedNumbersFuncResult)
  )
  .add("iMemoized#numbers", () =>
    assertEq(memoizedNumbersI(5, 100, 2), computedNumbersFuncResult)
  )
  .add("moize#numbers", () =>
    assertEq(memoizedNumbersMoize(5, 100, 2), computedNumbersFuncResult)
  )
  .add("fast-memoize#numbers", () =>
    assertEq(memoizedFNumbers(5, 100, 2), computedNumbersFuncResult)
  );
suites[2]
  .add("fun-memoize#mixed", () =>
    assertEq(memoizedMixedFunMemoize(strA, 0.0025, o), computedMixedFuncResult)
  )
  .add("lodash.memoize#mixed", () =>
    assertEq(memoizedMixedLodash(strA, 0.0025, o), computedMixedFuncResult)
  )
  .add("iMemoized#mixed", () =>
    assertEq(memoizedMixedI(strA, 0.0025, o), computedMixedFuncResult)
  )
  .add("moize#mixed", () =>
    assertEq(memoizedMixedMoize(strA, 0.0025, o), computedMixedFuncResult)
  )
  .add("fast-memoize#mixed", () =>
    assertEq(memoizedMixedFast(strA, 0.0025, o), computedMixedFuncResult)
  );
suites[3]
  .add("fun-memoize#fib", () => assertEq(memoizedFibFunMemoize(15), 610))
  .add("lodash.memoize#fib", () => assertEq(memoizedFibLodash(15), 610))
  .add("iMemoized#fib", () => assertEq(memoizedFibI(15), 610))
  .add("moize#fib", () => assertEq(memoizedFibMoize(15), 610))
  .add("fast-memoize#fib", () => assertEq(memoizedFibFast(15), 610));
suites[4]
  .add("fun-memoize#selectors: different states", () => {
    const val = stateGen1.next().value;
    assertEq(stateSelectorFunMemoize(val), computedStates.get(val));
  })
  .add("reselect#selectors: different states", () => {
    const val = stateGen2.next().value;
    assertEq(stateSelectorReselect(val), computedStates.get(val));
  })
  .add("re-reselect#selectors: different states", () => {
    const val = stateGen3.next().value;
    assertEq(stateSelectorReReselect(val), computedStates.get(val));
  });
suites[5]
  .add("fun-memoize#selectors: same state", () =>
    assertEq(stateSelectorFunMemoize(states[0]), computedStates.get(states[0]))
  )
  .add("reselect#selectors: same state", () =>
    assertEq(stateSelectorReselect(states[0]), computedStates.get(states[0]))
  )
  .add("re-reselect#selectors: same state", () =>
    assertEq(stateSelectorReReselect(states[0]), computedStates.get(states[0]))
  );

const runNextSuite = () => {
  const suite = suites.shift();
  suite &&
    suite
      .on("cycle", (event) => console.log(`${event.target}`))
      .on("complete", function () {
        console.log(`Fastest is ${this.filter("fastest").map("name")}`);
        console.log("+".repeat(1e2));
        runNextSuite();
      })
      .run({ async: true });
};

runNextSuite();
