
`node v18.12.1`:

```
fun-memoize#strings x 2,005,605 ops/sec ±0.40% (95 runs sampled)
lru-memoize#strings x 359 ops/sec ±1.03% (90 runs sampled)
fast-memoize#strings x 57,593 ops/sec ±0.31% (93 runs sampled)
moize#strings x 1,641,220 ops/sec ±0.21% (101 runs sampled)
Fastest is fun-memoize#strings
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#numbers x 3,046,329 ops/sec ±0.23% (94 runs sampled)
lru-memoize#numbers x 209,108 ops/sec ±0.11% (100 runs sampled)
fast-memoize#numbers x 1,224,082 ops/sec ±0.27% (99 runs sampled)
moize#numbers x 1,688,594 ops/sec ±0.34% (100 runs sampled)
Fastest is fun-memoize#numbers
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#mixed x 3,093,026 ops/sec ±0.26% (98 runs sampled)
lru-memoize#mixed x 7,599,647 ops/sec ±0.24% (98 runs sampled)
fast-memoize#mixed x 17,879 ops/sec ±0.23% (99 runs sampled)
moize#mixed x 2,439,232 ops/sec ±0.26% (99 runs sampled)
Fastest is lru-memoize#mixed
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#fib x 3,939,907 ops/sec ±0.43% (89 runs sampled)
lru-memoize#fib x 1,126,546 ops/sec ±0.36% (95 runs sampled)
fast-memoize#fib x 98,673 ops/sec ±0.38% (65 runs sampled)
moize#fib x 5,335,186 ops/sec ±0.22% (96 runs sampled)
Fastest is moize#fib
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
reselect#selectors - different states x 205,180 ops/sec ±0.15% (96 runs sampled)
re-reselect#selectors - different states x 197,318 ops/sec ±0.25% (99 runs sampled)
fun-memoize#selectors - different states x 2,533,627 ops/sec ±0.11% (93 runs sampled)
Fastest is fun-memoize#selectors - different states
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
reselect#selectors - same state x 33,392,996 ops/sec ±0.37% (99 runs sampled)
re-reselect#selectors - same state x 4,973,468 ops/sec ±0.24% (92 runs sampled)
fun-memoize#selectors - same state x 5,344,875 ops/sec ±0.34% (99 runs sampled)
Fastest is reselect#selectors - same state
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
```