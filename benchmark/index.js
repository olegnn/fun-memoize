// @flow

// TODO: add more libraries
import Benchmark from 'benchmark';
import memoizeMoize from 'moize';
import { createSelector } from 'reselect';
import fastMemoize from 'fast-memoize';
import memoizeLodash from 'lodash.memoize';
import imemoized from 'iMemoized';
import createCachedSelector from 're-reselect';
import memoize, { createObjectSelector } from '../src';

const suites = Array.from({ length: 6 }, () => new Benchmark.Suite());

const strA = 'hello world!'.repeat(1e5);
const strB = 'c';
const strC = strA + strB;

const stringsFunc = (a: string, b: string, c: string): number => {
  let res = 0;
  for (let i = 0; i < (a.length + b.length + c.length) / 10; i++)
    res += 5;
  return res;
};

const numberFunc = (a: number, b: number, c: number): number => {
  let res = 0;
  for (let i = 0; i < 1e5; i++)
    res += 5;

  return res;
};

const mixedFunc = (a: string, b: number, c: Object): number => {
  let res = 0;
  for (let i = 0; i < a.length * b + Object.keys(c).length; i++)
    res += 5;

  return res;
};

const fibonacci = n => n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);

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

const selectA = obj => obj.a;

const selectB = obj => obj.b;

const selectC = obj => obj.c;

const memoizedStateSelectorReselect = createSelector(
  selectA, selectB, selectC, numberFunc,
);
const memoizedStateSelectorReReselect = createCachedSelector(
  selectA, selectB, selectC, numberFunc,
);
const memoizedStateSelectorFunMemoize = createObjectSelector(
  selectA, selectB, selectC, numberFunc,
);
const selectorFuncs = [selectA, selectB, selectC];

const states = Array.from({ length: 1e2 }, () => ({
  a: Math.random() * 10,
  b: Math.random() * 70,
  c: Math.random() * 10,
}));

const o = { a: 15 };

function* stateGen() {
  for (let i = 0, m = 1; 1;) {
    const next = 3;
    if (i + m * next > states.length || i + m * next < 0)
      m = -m;
    i += m * next;
    yield states[i];
  }
}

const stateGen1 = stateGen();

const stateGen2 = stateGen();

const stateGen3 = stateGen();

suites[0]
  .add(
    'fun-memoize#strings', () => memoizedStringsFunMemoize(strA, strB, strC),
  )
  .add(
    'fast-memoize#strings', () => memoizedStringsFast(strA, strB, strC),
  )
  .add(
    'iMemoized#strings', () => memoizedStringsI(strA, strB, strC),
  )
  .add(
    'lodash.memoize#strings', () => memoizedStringsLodash(strA, strB, strC),
  )
  .add(
    'moize#strings', () => memoizedStringsMoize(strA, strB, strC),
  );
suites[1]
  .add(
    'fun-memoize#numbers', () => memoizedNumbersFunMemoize(5, 100, 2),
  )
  .add(
    'lodash.memoize#numbers', () => memoizedNumbersLodash(5, 100, 2),
  )
  .add(
    'iMemoized#numbers', () => memoizedNumbersI(5, 100, 2),
  )
  .add(
    'moize#numbers', () => memoizedNumbersMoize(5, 100, 2),
  )
  .add(
    'fast-memoize#numbers', () => memoizedFNumbers(5, 100, 2),
  );
suites[2]
  .add(
    'fun-memoize#mixed', () => memoizedMixedFunMemoize(strA, 0.0025, o),
  )
  .add(
    'lodash.memoize#mixed', () => memoizedMixedLodash(strA, 0.0025, o),
  )
  .add(
    'iMemoized#mixed', () => memoizedMixedI(strA, 0.0025, o),
  )
  .add(
    'moize#mixed', () => memoizedMixedMoize(strA, 0.0025, o),
  )
  .add(
    'fast-memoize#mixed', () => memoizedMixedFast(strA, 0.0025, o),
  );
suites[3]
  .add(
    'fun-memoize#fib', () => memoizedFibFunMemoize(15),
  )
  .add(
    'lodash.memoize#fib', () => memoizedFibLodash(15),
  )
  .add(
    'iMemoized#fib', () => memoizedFibI(15),
  )
  .add(
    'moize#fib', () => memoizedFibMoize(15),
  )
  .add(
    'fast-memoize#fib', () => memoizedFibFast(15),
  );
suites[4]
  .add(
    'fun-memoize#selectors: different states', () =>
      memoizedStateSelectorFunMemoize(stateGen1.next().value),
  )
  .add(
    'reselect#selectors: different states', () =>
      memoizedStateSelectorReselect(stateGen2.next().value),
  )
  .add(
    're-reselect#selectors: different states', () => memoizedStateSelectorReReselect(stateGen3.next().value),
  );
suites[5]
  .add(
    'fun-memoize#selectors: same state', () =>
      memoizedStateSelectorFunMemoize(states[0]),
  )
  .add(
    'reselect#selectors: same state', () =>
      memoizedStateSelectorReselect(states[0]),
  )
  .add(
    're-reselect#selectors: same state', () => memoizedStateSelectorReReselect(states[0]),
  );

const runNextSuite = () => {
  const suite = suites.pop();
  suite && suite
    .on('cycle', event => console.log(`${event.target}`))
    .on('complete', function() {
      console.log(`Fastest is ${this.filter('fastest').map('name')}`);
      console.log('+'.repeat(1e2));
      runNextSuite();
    })
    .run({ async: true });
};

runNextSuite();
