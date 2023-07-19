
`node v18.12.1`:

```
fun-memoize#strings x 32,483 ops/sec ±194.39% (92 runs sampled)
lru-memoize#strings x 353 ops/sec ±0.54% (74 runs sampled)
fast-memoize#strings x 21,235 ops/sec ±118.79% (99 runs sampled)
moize#strings x 32,044 ops/sec ±192.94% (94 runs sampled)
Fastest is fun-memoize#strings
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#numbers x 4,606,528 ops/sec ±0.46% (96 runs sampled)
lru-memoize#numbers x 207,652 ops/sec ±0.19% (96 runs sampled)
fast-memoize#numbers x 1,210,468 ops/sec ±0.37% (95 runs sampled)
moize#numbers x 1,673,100 ops/sec ±0.26% (99 runs sampled)
Fastest is fun-memoize#numbers
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#mixed x 5,041,636 ops/sec ±0.33% (90 runs sampled)
lru-memoize#mixed x 7,567,959 ops/sec ±0.37% (96 runs sampled)
fast-memoize#mixed x 17,806 ops/sec ±0.20% (101 runs sampled)
moize#mixed x 2,479,815 ops/sec ±0.24% (94 runs sampled)
Fastest is lru-memoize#mixed
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#fib x 6,643,884 ops/sec ±0.18% (93 runs sampled)
lru-memoize#fib x 1,143,697 ops/sec ±0.24% (97 runs sampled)
fast-memoize#fib x 101,059 ops/sec ±0.40% (63 runs sampled)
moize#fib x 5,304,315 ops/sec ±0.35% (98 runs sampled)
Fastest is fun-memoize#fib
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
reselect#selectors - different states x 206,427 ops/sec ±0.15% (101 runs sampled)
re-reselect#selectors - different states x 199,469 ops/sec ±0.08% (102 runs sampled)
fun-memoize#selectors - different states x 3,399,746 ops/sec ±0.50% (97 runs sampled)
Fastest is fun-memoize#selectors - different states
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
reselect#selectors - same state x 32,857,180 ops/sec ±0.34% (98 runs sampled)
re-reselect#selectors - same state x 4,937,953 ops/sec ±0.32% (97 runs sampled)
fun-memoize#selectors - same state x 6,650,829 ops/sec ±0.48% (92 runs sampled)
Fastest is reselect#selectors - same state
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
```