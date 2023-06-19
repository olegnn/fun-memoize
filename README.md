# Fun memoize

[![npm](https://img.shields.io/npm/v/fun-memoize.svg)](https://www.npmjs.com/package/fun-memoize)

**Have fun! 😏**

Configurable memoization module with fully controllable cache based on [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) and [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) for modern JavaScript applications.

Provides fast memoization using **Same-value-zero** equality check for **non-variadic** functions [with **fixed arguments length**].

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

Also, you can replace [reselect](https://github.com/reactjs/reselect), which stores only last result of the function execution

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
 * Memoizes provided function returning wrapped version of the provided function.
 * Returned function will return the calculated value if it's present in the cache for the arguments according to `Same-value-zero` algorithm.
 * If no value is found, the underlying function will be called with provided arguments.
 * @param func
 * @param params
 */
declare function memoize<K, V>(
  func: (...args: K[]) => V,
  { length, checkLast, ...params }?: ParamsWithLength<K, V>
): typeof func;
```

## Example custom configuration

```javascript
import { memoize, LRU, LFU } from "fun-memoize";

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
