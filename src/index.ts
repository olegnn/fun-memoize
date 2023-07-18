import memoize from "./memoize";
import createMemoizedSelector from "./selector";
import { LFU, LRU, FIFO } from "./strategy";

export default memoize;
export { memoize, createMemoizedSelector, LRU, LFU, FIFO };
export { CacheStrategy } from "./base";
export * from "./constants";
