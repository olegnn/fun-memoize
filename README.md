# `fun-memoize`

[![npm](https://img.shields.io/npm/v/fun-memoize.svg)](https://www.npmjs.com/package/fun-memoize)
[![codecov](https://codecov.io/gh/olegnn/fun-memoize/branch/master/graph/badge.svg)](https://codecov.io/gh/olegnn/fun-memoize)

**Have fun! 😏**

Performant configurable memoization module with fully controllable cache for modern JavaScript applications.

Provides fast memoization using **Same-value-zero** equality check for **non-variadic** functions [with **fixed argument length**].

## Installation

```shell
  npm i --save fun-memoize
```

```shell
  yarn add fun-memoize
```

## Examples

```javascript
import memoize from "fun-memoize";

const func = (a, b, c) => {
  // Some expensive calculations...
  let res = 0;
  for (let i = 0; i < a * b * c; i++) {
    res += i % 17;
  }
  return res;
};

const memoizedFunc = memoize(func);

const myRes = memoizedFunc(50, 60, 70);
// It will take some time...
// And then

const myResAgain = memoizedFunc(50, 60, 70);
// Will complete almost instantly

const mySecondRes = memoizedFunc(20, 30, 40);
const myResAgainAgain = memoizedFunc(50, 60, 70);
// Almost instantly again
```

Also, you can replace [reselect](https://github.com/reactjs/reselect), which stores only the last result of the function execution

```javascript
import { createMemoizedSelector } from "fun-memoize";

const shopItemsSelector = (state) => state.shop.items;
const taxPercentSelector = (state) => state.shop.taxPercent;

const subtotalSelector = createMemoizedSelector(shopItemsSelector, (items) =>
  items.reduce((acc, item) => acc + item.value, 0)
);

const taxSelector = createMemoizedSelector(
  subtotalSelector,
  taxPercentSelector,
  (subtotal, taxPercent) => subtotal * (taxPercent / 100)
);

export const totalSelector = createMemoizedSelector(
  subtotalSelector,
  taxSelector,
  (subtotal, tax) => ({
    total: subtotal + tax,
  })
);

let exampleState = {
  shop: {
    taxPercent: 8,
    items: [
      { name: "apple", value: 1.2 },
      { name: "orange", value: 0.95 },
    ],
  },
};

console.log(subtotalSelector(exampleState)); // 2.15
console.log(taxSelector(exampleState)); // 0.172
console.log(totalSelector(exampleState)); // { total: 2.322 }
```

## API

```typescript
/**
 * Config for the leaf and storage cache strategies.
 */
type StrategyConfig<K, V> = {
  leafStrategyClass: CacheStrategyClass<K | LeafStorage<K, V>>;
  storageStrategyClass: CacheStrategyClass<NestedStorage<K, V>>;
};

/**
 * Storage callbacks.
 */
interface StorageParams<K, V> {
  /**
   * Callback to be called on the storage creation.
   * @param storage
   */
  onCreateStorage?: (storage: Storage<K, V>) => void;
  /**
   * Callback to be called on the storage removal.
   * @param storage
   */
  onRemoveStorage?: (storage: Storage<K, V>) => void;
}

/**
 * Leaf storage callbacks.
 */
interface LeafStorageParams<K, V> extends StorageParams<K, V> {
  /** Callback to be called on the leaf creation */
  onCreateLeaf?: (leafStorage: K) => void;
  /** Callback to be called on the leaf removal */
  onRemoveLeaf?: (leafStorage: K) => void;
}

/** Parameters for the `UnifiedStorage` */
interface UnifiedStorageParams<K, V> extends StorageParams<K, V> {
  /** Denotes if the object storage must be used for values with primitive keys */
  useObjectStorage?: boolean;
  /** Denotes if the weak storage must be used for values with non-primitive keys */
  useWeakStorage?: boolean;
}

/**
 * Params for the storage context.
 */
interface Params<K, V>
  extends UnifiedStorageParams<K, V>,
    LeafStorageParams<K, V>,
    StorageParams<K, V> {
  /**
   * Total limit for the storages (cache nodes).
   */
  totalStoragesLimit?: number;
  /**
   * Total limit for the leaves (cache entries). Default is 10000.
   */
  totalLeavesLimit?: number;
  /**
   * Limit of the leaves per a single leaf storage.
   */
  leavesPerStorageLimit?: number;
  /**
   * Total limit of the leaf storages.
   */
  totalLeafStoragesLimit?: number;
  /**
   * Either strategy class or different strategy classes for leaves and storage nodes.
   */
  strategy?: StrategyConfig<K, V> | CacheStrategyClass<unknown>;
}

/** Params interface extended with optional length and checkLast flag */
interface ParamsWithLength<K, V> extends Params<K, V> {
  /** Overrides function length */
  length?: number;
  /** Check last arguments or not (default to `true`) */
  checkLast?: boolean;
}

/**
 * Memoizes provided function returning wrapped version of it.
 * Result function will return value without calling the supplied function if it's present in the cache for the supplied arguments according to `Same-value-zero` algorithm.
 * If no value is found, the underlying function will be called with provided arguments.
 * @param func
 * @param params
 */
declare function memoize<V>(
  func: (...args: any[]) => V,
  { length, checkLast, ...params }?: ParamsWithLength<any, V>
): typeof func & {
  recomputations: number;
};
```

## Available cache strategies

- `LFU` - `L`east `F`requently `U`used cache replacement policy.
- `LRU` - `L`east `R`ecently `U`sed cache replacement policy.
- `FIFO` - `F`irst `I`n - `F`irst `O`ut cache replacement policy.

Also, you can build your own by extending `CacheStrategy` or one of the existing strategy classes.

## Example custom configuration

```javascript
import { memoize, LRU, LFU } from "fun-memoize";

const fn = (a, b, c, d, e) => a + b + c + d + e;

const memo = memoize(fn, {
  length: 5,
  checkLast: false,
  totalLeavesLimit: 1e5,
  totalStoragesLimit: 500,
  totalLeafStoragesLimit: 1000,
  leavesPerStorageLimit: 1000,
  strategy: { leafStrategyClass: LRU, storageStrategyClass: LFU },
});
```

## Benchmarks


`node v18.12.1`:

```
fun-memoize#strings x 4,991,846 ops/sec ±0.33% (96 runs sampled)
lru-memoize#strings x 418 ops/sec ±0.69% (91 runs sampled)
fast-memoize#strings x 66,578 ops/sec ±0.35% (99 runs sampled)
moize#strings x 2,389,621 ops/sec ±0.17% (97 runs sampled)
Fastest is fun-memoize#strings
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#numbers x 4,789,282 ops/sec ±0.43% (97 runs sampled)
lru-memoize#numbers x 206,804 ops/sec ±0.29% (99 runs sampled)
fast-memoize#numbers x 1,223,078 ops/sec ±0.35% (92 runs sampled)
moize#numbers x 1,651,064 ops/sec ±0.27% (100 runs sampled)
Fastest is fun-memoize#numbers
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#mixed x 5,374,839 ops/sec ±0.58% (93 runs sampled)
lru-memoize#mixed x 7,603,573 ops/sec ±0.18% (98 runs sampled)
fast-memoize#mixed x 17,907 ops/sec ±0.68% (98 runs sampled)
moize#mixed x 2,503,442 ops/sec ±0.07% (101 runs sampled)
Fastest is lru-memoize#mixed
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#fib x 6,697,478 ops/sec ±0.16% (95 runs sampled)
lru-memoize#fib x 1,146,090 ops/sec ±0.14% (99 runs sampled)
fast-memoize#fib x 97,381 ops/sec ±0.16% (65 runs sampled)
moize#fib x 5,342,408 ops/sec ±0.37% (98 runs sampled)
Fastest is fun-memoize#fib
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
reselect#selectors - different states x 203,160 ops/sec ±0.25% (99 runs sampled)
re-reselect#selectors - different states x 195,782 ops/sec ±0.27% (99 runs sampled)
fun-memoize#selectors - different states x 3,373,974 ops/sec ±0.38% (92 runs sampled)
Fastest is fun-memoize#selectors - different states
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
reselect#selectors - same state x 32,517,937 ops/sec ±0.68% (97 runs sampled)
re-reselect#selectors - same state x 5,029,092 ops/sec ±0.24% (101 runs sampled)
fun-memoize#selectors - same state x 6,677,330 ops/sec ±0.47% (98 runs sampled)
Fastest is reselect#selectors - same state
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
```

## Development

Build

```
yarn build
```

Format code using prettier

```
yarn fmt
```

Benchmark

```
yarn benchmark
```
