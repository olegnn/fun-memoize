import {
  CacheStrategy,
  CacheStrategyClass,
  withDestroyable,
} from "../base/CacheStrategy";
import { EMPTY_ITERABLE } from "../iterables";
import { LeafStorage, LeafStorageParams } from "./LeafStorage";
import { Storage, StorageClass, StorageParams } from "../base/Storage";
import {
  SafeMapStorage,
  UnifiedStorage,
  UnifiedStorageParams,
} from "../storage";
import { RootLeafStrategy } from "./RootLeafStrategy";
import { LRU, Noop } from "../strategy";
import { DEFAULT_MAX_ENTRIES_COUNT } from "../constants";
import { noop, ParentPath } from "../utils";

/**
 * Either leaf storage or nested storage containing either nested storages or leaf storages.
 */
export type NestedStorage<K, V> =
  | LeafStorage<K, V>
  | Storage<K, NestedStorage<K, V> | LeafStorage<K, V> | V>;

/**
 * Params for the storage context.
 */
export interface Params<K, V>
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
  strategy?:
    | StrategyConfig<K, V>
    | CacheStrategyClass<K | LeafStorage<K, V> | NestedStorage<K, V>>;
}

/**
 * Config for the leaf and storage cache strategies.
 */
type StrategyConfig<K, V> = {
  leafStrategyClass: CacheStrategyClass<K | LeafStorage<K, V>>;
  storageStrategyClass: CacheStrategyClass<NestedStorage<K, V>>;
};

/**
 * Picks a `Noop` strategy if the `limit` is `Infinity`.
 * @param strategy
 * @param limit
 */
const pickNoopIfNoLimit = <V>(
  strategy: CacheStrategyClass<V>,
  limit: number
): CacheStrategyClass<V> => (limit !== Infinity ? strategy : Noop);

/**
 * Checks whether the provided limit is a valid number.
 * @param limit
 */
const limitIsValid = (limit: number) =>
  (Number.isSafeInteger(limit) && limit > 0) || limit === Infinity;

/**
 * Ensures that the provided limit is a valid number.
 * @param name
 * @param value
 * @param min
 */
const ensureLimitIsValid = (name: string, value: number, min: number) => {
  if (!limitIsValid(value)) {
    throw new Error(`\`${name}\` is invalid: \`${value}\``);
  }
  if (value < min) {
    throw new Error(
      `\`${name}\`'s value = \`${value}\` is too small, expected \`${min}\` at least`
    );
  }
};

/**
 * Returns `true` if supplied class extends `CacheStrategy`.
 * @param strategy
 */
const extendsCacheStrategy = (strategy: unknown) =>
  strategy &&
  (
    strategy as {
      prototype: any;
    }
  ).prototype instanceof CacheStrategy;

/**
 * Class describing a cache strategy to be used for the leaf nodes.
 */
type LeafCacheStrategyClass<K, V> = CacheStrategyClass<LeafStorage<K, V>>;
/**
 * Class describing a cache strategy to be used for the storage nodes.
 */
type StorageCacheStrategyClass<K, V> = CacheStrategyClass<NestedStorage<K, V>>;

/**
 * Params with cache depth.
 */
type ParamsWithDepth<K, V> = Params<K, V> & {
  /**
   * Cache depth.
   */
  depth: number;
};

/**
 * Root storage context.
 */
export class Context<K, V> {
  /**
   * Strategy containing all storage nodes.
   */
  rootStoragesStrategy: CacheStrategy<NestedStorage<K, V>>;
  /**
   * Strategy containing all leaf storages.
   */
  rootLeafStoragesStrategy: CacheStrategy<LeafStorage<K, V>>;
  /**
   * Params for all storages.
   */
  params: LeafStorageParams<K, V> & UnifiedStorageParams<K, V>;
  /**
   * Limit of leaf per a single leaf storage.
   */
  leavesPerStorageLimit: number;

  /**
   * Storage class to be used for cached values.
   */
  storageClass: StorageClass<K, V>;
  /**
   * Strategy class used for leaf values.
   */
  leafStrategyClass: CacheStrategyClass<K>;

  constructor({
    depth,
    strategy = LRU,
    totalLeavesLimit = DEFAULT_MAX_ENTRIES_COUNT,
    totalStoragesLimit = Infinity,
    totalLeafStoragesLimit = Infinity,
    leavesPerStorageLimit = Infinity,
    useWeakStorage = false,
    useObjectStorage = false,
    onCreateStorage = noop,
    onRemoveStorage = noop,
    onCreateLeaf = noop,
    onRemoveLeaf = noop,
  }: ParamsWithDepth<K, V>) {
    if (!Number.isSafeInteger(depth) || depth <= 0) {
      throw new TypeError(
        `Invalid depth, an expected natural number which is a safe integer`
      );
    }
    let leafStrategyClass: LeafCacheStrategyClass<K, V>,
      storageStrategyClass: StorageCacheStrategyClass<K, V>;
    if (extendsCacheStrategy(strategy)) {
      leafStrategyClass = strategy as LeafCacheStrategyClass<K, V>;
      storageStrategyClass = strategy as StorageCacheStrategyClass<K, V>;
    } else {
      const config = strategy as StrategyConfig<K, V>;

      leafStrategyClass = config.leafStrategyClass as LeafCacheStrategyClass<
        K,
        V
      >;
      storageStrategyClass =
        config.storageStrategyClass as StorageCacheStrategyClass<K, V>;
    }
    if (!extendsCacheStrategy(leafStrategyClass)) {
      throw new Error("Invalid `leafStrategyClass`");
    }
    if (!extendsCacheStrategy(storageStrategyClass)) {
      throw new Error("Invalid `storageStrategyClass`");
    }
    ensureLimitIsValid("totalLeavesLimit", totalLeavesLimit, 1);
    ensureLimitIsValid("totalStoragesLimit", totalStoragesLimit, depth);
    ensureLimitIsValid("totalLeafStoragesLimit", totalLeafStoragesLimit, 1);
    ensureLimitIsValid("leavesPerStorageLimit", leavesPerStorageLimit, 1);

    storageStrategyClass = withDestroyable(
      pickNoopIfNoLimit(storageStrategyClass, totalStoragesLimit)
    );
    leafStrategyClass =
      totalLeavesLimit === totalLeafStoragesLimit &&
      totalLeavesLimit === leavesPerStorageLimit
        ? pickNoopIfNoLimit(leafStrategyClass, totalLeavesLimit)
        : leafStrategyClass;

    this.rootStoragesStrategy = new storageStrategyClass(
      totalStoragesLimit - 1
    );
    this.rootLeafStoragesStrategy = new RootLeafStrategy(
      totalLeavesLimit,
      new (withDestroyable(leafStrategyClass))(totalLeafStoragesLimit)
    );
    this.storageClass = (
      useWeakStorage || useObjectStorage ? UnifiedStorage : SafeMapStorage
    ) as StorageClass<K, V>;
    this.leafStrategyClass = leafStrategyClass as CacheStrategyClass<K>;
    this.leavesPerStorageLimit = leavesPerStorageLimit;
    this.params = {
      useObjectStorage,
      useWeakStorage,
      onCreateStorage,
      onRemoveStorage,
      onCreateLeaf,
      onRemoveLeaf,
    };
  }

  /**
   * Instantiates new storage with supplied parents
   * @param root
   */
  createStorage(
    parentPaths: Iterable<ParentPath<K | NestedStorage<K, V>>> = EMPTY_ITERABLE
  ): NestedStorage<K, V> {
    return new this.storageClass(this.params, parentPaths);
  }

  /**
   * Instantiates new leaf storage with supplied parents
   * @param root
   */
  createLeafStorage(
    parentPaths: Iterable<ParentPath<K | LeafStorage<K, V>>> = EMPTY_ITERABLE
  ): LeafStorage<K, V> {
    return new LeafStorage(
      this.createStorage() as Storage<K, V>,
      new this.leafStrategyClass(this.leavesPerStorageLimit),
      this.params,
      parentPaths
    );
  }
}
