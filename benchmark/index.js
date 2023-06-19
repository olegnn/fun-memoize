const Benchmark = require("benchmark");
const memoizeMoize = require("moize");
const { createSelector } = require("reselect");
const fastMemoize = require("fast-memoize");
const lruMemoize = require("lru-memoize");
const { default: createCachedSelector } = require("re-reselect");
const { default: memoize, createMemoizedSelector } = require("../build");

function cycle(iter) {
  return {
    [Symbol.iterator]() {
      let lastIter = iter[Symbol.iterator]();

      return {
        next() {
          for (let i = 0; i++ < 2; ) {
            const item = lastIter.next();

            if (item.done) {
              lastIter = iter[Symbol.iterator]();
            } else {
              return item;
            }
          }

          return { value: undefined, done: true };
        },
      };
    },
  };
}

function zip(leftIterable, rightIterable) {
  return {
    [Symbol.iterator]() {
      let leftIter = leftIterable[Symbol.iterator]();
      let rightIter = rightIterable[Symbol.iterator]();

      return {
        next() {
          for (;;) {
            const left = leftIter.next();
            const right = rightIter.next();

            if (left.done || right.done) {
              return { value: undefined, done: true };
            } else {
              return {
                value: { left: left.value, right: right.value },
                done: false,
              };
            }
          }
        },
      };
    },
    size() {
      return Math.min(leftIterable.size(), rightIterable.size());
    },
  };
}

const strA = "hello world!".repeat(2);
const strB = "c".repeat(10);
const strC = strA + strB;

const stringsFunc = (a, b, c) => {
  let res = 0;
  for (let i = 0; i < (a.length + b.length + c.length) * 1000; i++) res += 5;
  return res;
};

const numberFunc = (a, b, c) => {
  let res = 0;
  for (let i = 0; i < 1e4; i++) res += 5;

  return res;
};

const mixedFunc = (a, b, c) => {
  let res = 0;
  for (let i = 0; i < a.length * b + Object.keys(c).length; i++) res += 5;

  return res;
};

function fibonacci(f, n) {
  n < 2 ? n : f(f, n - 1) + f(f, n - 2);
}

const selectA = (obj) => obj.a;

const selectB = (obj) => obj.b;

const selectC = (obj) => obj.c;

const states = Array.from({ length: 1e2 }, () => ({
  a: Math.random() * 10,
  b: Math.random() * 70,
  c: Math.random() * 10,
}));

const obj1 = {};

const o = { a: 15 };
for (let i = 0; i < 999; i++) {
  o[i] = i;
}

const strPermutations = Array.from({ length: 30 }, () => [
  strA,
  strB.repeat(Math.random() * 5e2),
  strC.repeat(Math.random() * 100),
]);

const assertEq = (param1, param2) => {
  if (param1 !== param2) {
    throw new Error(
      `Assertion failed: ${String(param1)} !== ${String(param2)}`
    );
  }
};

const buildSuite = (fn, data, name, callWithF = false) => {
  const fns = [
    memoize,
    lruMemoize.default(),
    fastMemoize,
    memoizeMoize,
  ].map((memo) => memo(fn));

  const results = data.map((args) => ({
    data: args,
    res: callWithF ? fn.apply(null, [fn, ...args]) : fn.apply(null, args),
  }));

  const buildFn = (suite, fn, name) => {
    const states = cycle(results)[Symbol.iterator]();

    return suite.add(name, () => {
      const { data, res } = states.next().value;

      if (callWithF) {
        assertEq(fn.apply(null, [fn, ...data], res));
      } else {
        assertEq(fn.apply(null, data), res);
      }
    });
  };

  return [
    ...zip(fns, ["fun-memoize", "lru-memoize", "fast-memoize", "moize"]),
  ].reduce(
    (suite, { left: fn, right: base }) => buildFn(suite, fn, `${base}#${name}`),
    new Benchmark.Suite()
  );
};

const buildSelectorSuite = (input, data, name) => {
  const fns = [
    createSelector,
    createCachedSelector,
    createMemoizedSelector,
  ].map((createSelector) => {
    const selector = createSelector(...input);
    if (createCachedSelector === createSelector) {
      return selector((a, b, c) => String(a + "_" + b + "_" + c));
    } else {
      return selector;
    }
  });

  const results = data.map((args) => ({
    data: args,
    res: createSelector(...input)(args),
  }));

  const buildFn = (suite, fn, name) => {
    const states = cycle(results)[Symbol.iterator]();

    return suite.add(name, () => {
      const { data, res } = states.next().value;

      assertEq(fn(data), res);
    });
  };

  return [...zip(fns, ["reselect", "re-reselect", "fun-memoize"])].reduce(
    (suite, { left: fn, right: base }) => buildFn(suite, fn, `${base}#${name}`),
    new Benchmark.Suite()
  );
};

const suites = [
  buildSuite(stringsFunc, strPermutations, "strings"),
  buildSuite(
    numberFunc,
    Array.from({ length: 30 }, () => [1, 2, Math.random(), Math.random()]),
    "numbers"
  ),
  buildSuite(
    mixedFunc,
    Array.from({ length: 20 }, () => [
      obj1,
      strA,
      Math.random(),
      o,
      strA.slice(0, Math.random() * strA.length),
      8,
    ]),
    "mixed"
  ),
  buildSuite(
    fibonacci,
    Array.from({ length: 30 }, (_, i) => [i]),
    "fib",
    true
  ),
  buildSelectorSuite(
    [selectA, selectB, selectC, numberFunc],
    states,
    "selectors - different states"
  ),
  buildSelectorSuite(
    [selectA, selectB, selectC, numberFunc],
    [states[0]],
    "selectors - same state"
  ),
];

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
