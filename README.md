# Fun memoize

__Have fun! 😏__

[![npm](https://img.shields.io/npm/v/fun-memoize.svg)](https://www.npmjs.com/package/fun-memoize)
[![npm](https://img.shields.io/npm/dm/fun-memoize.svg)](https://www.npmjs.com/package/fun-memoize)


Memoization module based on [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) and [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) for modern JavaScript applications.

Provides fast enough memoization with O(1) complexity to retrieve cache and only __strict__ (===) equality check (no custom) for functions with __fixed arguments length__.

## Installation

```shell
  npm i --save fun-memoize
```

```shell
  yarn add fun-memoize
```

## Examples

```javascript
  import memoize from 'fun-memoize';

  const func = (a, b, c) => {
    // Some expensive calculations...
    let res = 0;
    for (let i = 0; i < a * b * c; i++) {
      res += i % 17;
    }
    return res;
  }

  const memoizedFunc = memoize(func);

  const myRes = memoizedFunc(50, 60, 70);
  // It will take some time...
  // And then

  const myResAgain = memoizedFunc(50, 60, 70);
  // Will complete extremely faster

  const mySecondRes = memoizedFunc(20, 30, 40);


  const myResAgainAgain = memoizedFunc(50, 60, 70);
  // Almost instantly

```

Also you can replace [reselect](https://github.com/reactjs/reselect), which stores only latest result of function execution

```javascript
  import { createObjectSelector } from 'fun-memoize'

  const shopItemsSelector = state => state.shop.items
  const taxPercentSelector = state => state.shop.taxPercent

  const subtotalSelector = createObjectSelector(
    shopItemsSelector,
    items => items.reduce((acc, item) => acc + item.value, 0)
  )

  const taxSelector = createObjectSelector(
    subtotalSelector,
    taxPercentSelector,
    (subtotal, taxPercent) => subtotal * (taxPercent / 100)
  )

  export const totalSelector = createObjectSelector(
    subtotalSelector,
    taxSelector,
    (subtotal, tax) => ({ total: subtotal + tax })
  )

  let exampleState = {
    shop: {
      taxPercent: 8,
      items: [
        { name: 'apple', value: 1.20 },
        { name: 'orange', value: 0.95 },
      ]
    }
  }

  console.log(subtotalSelector(exampleState)) // 2.15
  console.log(taxSelector(exampleState))      // 0.172
  console.log(totalSelector(exampleState))    // { total: 2.322 }

```

## API

__memoize__ AKA "export default" - (func: Function, ?options: { storageCount: number(default - __1000__), checkLast: boolean(default - __true__) })

___storageCount___ - maximum number of Storage objects for primitive types, each of which represents cache tree node

___checkLast___ - firstly check last arguments passed to function and if they equal to current arguments, return last result

__createObjectSelector__ - (...selectorFuncs | selectorFuncs[], calculateFunc, ?options: { storageCount: number(default - __1000__), checkLast: boolean(default - __true__) }) - check [reselect](https://github.com/reactjs/reselect#createselectorinputselectors--inputselectors-resultfunc)

All object's caches (Object | Function) are stored in [WeakMaps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap). When object wont be referenced and will be collected by [GC](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management), its cache subtree will be collected too [except primitive value storages, which might be referenced, they will be removed later when primitive arguments cache nodes count will rise up to specified storage count].

 When primitive arguments (boolean | string | number | Symbol | null | void) storage count will be reached, first sub-caching-node will be removed ([Queue](https://en.wikipedia.org/wiki/Queue_(abstract_data_type)) order, also known as [FIFO](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics))). Let's look at example.

```javascript
  import memoize from 'fun-memoize';
  const f = (a, b) => a * b;

  // We set storageCount to 3
  const memoizedF = memoize(f, { storageCount: 3 });

  const res1 = memoizedF(1, 1);
  // Added first node as root->1->1=>1

  const res2 = memoizedF(2, 1);
  //  Added second node as root->2->1=>2

  const res3 = memoizedF(1, 3);
  //  Added new value to first node root->1->3=>3

  const res4 = memoizedF(3, 5);
  //  Added third node as root->3->5=>15

  const res5 = memoizedF(2, 8);
  // We have no more nodes for cache
  // So cache with arg 1 will be dropped
  // root->1 doesn't exist anymore :C

  const memRes = memoizedF(2, 2); // - Memoized
  const notMemRes = memoizedF(1, 1); // - Recalculated and now memoized
  const notMemRes2 = memoizedF(1, 3); // - Recalculated and now memoized

```

It's a cheap operation and you dont need to worry about cache management cost.

## Import

To import compiled js file (es3 compatible) just use
```javascript
import memoize from 'fun-memoize';
```
To import es6-module use (Required [Flow](https://github.com/facebook/flow))

```javascript
import memoize from 'fun-memoize/es6';
```

## Benchmarks
![Results](https://github.com/olegnn/fun-memoize/blob/master/benchmark/results.png)
