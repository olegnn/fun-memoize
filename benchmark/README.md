
`node v18.12.1`:

```
fun-memoize#strings x 28,008 ops/sec ±192.60% (97 runs sampled)
lru-memoize#strings x 321 ops/sec ±1.04% (69 runs sampled)
fast-memoize#strings x 18,463 ops/sec ±125.62% (97 runs sampled)
moize#strings x 27,660 ops/sec ±192.24% (95 runs sampled)
Fastest is fun-memoize#strings
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#numbers x 2,194,534 ops/sec ±0.70% (90 runs sampled)
lru-memoize#numbers x 208,455 ops/sec ±0.22% (100 runs sampled)
fast-memoize#numbers x 1,193,509 ops/sec ±0.44% (97 runs sampled)
moize#numbers x 1,715,697 ops/sec ±0.17% (102 runs sampled)
Fastest is fun-memoize#numbers
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#mixed x 2,210,416 ops/sec ±0.45% (97 runs sampled)
lru-memoize#mixed x 7,507,002 ops/sec ±0.20% (99 runs sampled)
fast-memoize#mixed x 17,963 ops/sec ±0.24% (97 runs sampled)
moize#mixed x 2,467,835 ops/sec ±0.29% (94 runs sampled)
Fastest is lru-memoize#mixed
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
fun-memoize#fib x 2,624,111 ops/sec ±1.20% (98 runs sampled)
lru-memoize#fib x 1,129,153 ops/sec ±0.20% (97 runs sampled)
fast-memoize#fib x 99,121 ops/sec ±0.21% (67 runs sampled)
moize#fib x 5,372,870 ops/sec ±0.37% (97 runs sampled)
Fastest is moize#fib
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
reselect#selectors - different states x 202,595 ops/sec ±0.39% (91 runs sampled)
re-reselect#selectors - different states x 196,134 ops/sec ±0.35% (90 runs sampled)
fun-memoize#selectors - different states x 1,860,201 ops/sec ±0.17% (96 runs sampled)
Fastest is fun-memoize#selectors - different states
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
reselect#selectors - same state x 33,751,297 ops/sec ±0.20% (100 runs sampled)
re-reselect#selectors - same state x 5,055,570 ops/sec ±0.50% (100 runs sampled)
fun-memoize#selectors - same state x 4,046,273 ops/sec ±0.69% (93 runs sampled)
Fastest is reselect#selectors - same state
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
```