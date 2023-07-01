import {
  CacheStrategy,
  CacheStrategyClass,
  withDestroyable,
} from "../base/CacheStrategy";
import { EMPTY_ITER } from "../iterators";
import { LeafStorage, LeafStorageParams } from "./LeafStorage";
import { Storage, ChildPath, StorageParams } from "../base/Storage";
import {
  SafeMapStorage,
  UnifiedStorage,
  UnifiedStorageParams,
} from "../storage";
import { RootLeafStrategy } from "./RootLeafStrategy";
import { LRU, Noop } from "../strategy";
import { DEFAULT_MAX_ENTRIES_COUNT } from "../constants";
import { noop } from "../utils";

/**
 * Either leaf storage or nested storage containing either nested storages or leaf storages.
 */
export type NestedStorage<K, V> =
  | LeafStorage<K, V>
  | Storage<K, NestedStorage<K, V> | LeafStorage<K, V> | V>;

/**
 * Storage class describing storage that may have child storage(s).
 */
type NestedStorageClass<K, V> = new (
  params: StorageParams<K, V>,
  root: Iterable<ChildPath<any>>
) => NestedStorage<K, V>;

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
  strategy?: StrategyConfig<K, V> | CacheStrategyClass<unknown>;
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
 */
const ensureLimitIsValid = (name: string, value: number) => {
  if (!limitIsValid(value)) {
    throw new Error(`\`${name}\` is invalid: ${value}`);
  }
};

/**
 * Class describing a cache strategy to be used for the leaf nodes.
 */
type LeafCacheStrategyClass<K, V> = CacheStrategyClass<LeafStorage<K, V>>;
/**
 * Class describing a cache strategy to be used for the storage nodes.
 */
type StorageCacheStrategyClass<K, V> = CacheStrategyClass<NestedStorage<K, V>>;

/**
 * Root storage context.
 */
export class StorageContext<K, V> {
  /**
   * Strategy containing all storage nodes.
   */
  rootStorageStrategy: CacheStrategy<NestedStorage<K, V>>;
  /**
   * Strategy containing all leaf storages.
   */
  rootLeafStrategy: CacheStrategy<LeafStorage<K, V>>;
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
  storageClass: NestedStorageClass<K, V>;
  /**
   * Strategy class used for leaf values.
   */
  leafStrategyClass: CacheStrategyClass<K>;

  constructor({
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
  }: Params<K, V>) {
    let leafStrategyClass: LeafCacheStrategyClass<K, V>,
      storageStrategyClass: StorageCacheStrategyClass<K, V>;
    if (strategy.constructor === CacheStrategy.constructor) {
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
    if (leafStrategyClass?.constructor !== CacheStrategy.constructor) {
      throw new Error("Invalid `leafStrategyClass`");
    }
    if (storageStrategyClass?.constructor !== CacheStrategy.constructor) {
      throw new Error("Invalid `storageStrategyClass`");
    }
    ensureLimitIsValid("totalLeavesLimit", totalLeavesLimit);
    ensureLimitIsValid("totalStoragesLimit", totalStoragesLimit);
    ensureLimitIsValid("totalLeafStoragesLimit", totalLeafStoragesLimit);
    ensureLimitIsValid("leavesPerStorageLimit", leavesPerStorageLimit);

    storageStrategyClass = withDestroyable(
      pickNoopIfNoLimit(storageStrategyClass, totalStoragesLimit)
    );
    leafStrategyClass =
      totalLeavesLimit === totalLeafStoragesLimit &&
      totalLeavesLimit === leavesPerStorageLimit
        ? pickNoopIfNoLimit(leafStrategyClass, totalLeavesLimit)
        : leafStrategyClass;

    this.rootStorageStrategy = new storageStrategyClass(totalStoragesLimit);
    this.rootLeafStrategy = new RootLeafStrategy(
      totalLeavesLimit,
      new (withDestroyable(leafStrategyClass))(totalLeafStoragesLimit)
    );
    this.storageClass =
      useWeakStorage || useObjectStorage ? UnifiedStorage : SafeMapStorage;
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
    parents: Iterable<ChildPath<K>> = EMPTY_ITER
  ): NestedStorage<K, V> {
    return new this.storageClass(this.params, parents);
  }

  /**
   * Instantiates new leaf storage with supplied parents
   * @param root
   */
  createLeafStorage(
    root: Iterable<ChildPath<K>> = EMPTY_ITER
  ): LeafStorage<K, V> {
    return new LeafStorage(
      this.createStorage() as Storage<K, V>,
      new this.leafStrategyClass(this.leavesPerStorageLimit),
      this.params,
      root
    );
  }
}
