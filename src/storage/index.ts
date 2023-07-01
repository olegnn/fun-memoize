import { mapImplemented } from "../utils";
import { MapStorage } from "./MapStorage";
import { UnifiedStorage } from "./UnifiedStorage";

export * from "./MapStorage";
export * from "./UnifiedStorage";
export * from "./WeakStorage";
export * from "./ObjectStorage";

/**
 * `MapStorage` if `Map` is implemented, `UnifiedStorage` otherwise.
 */
export const SafeMapStorage = mapImplemented() ? MapStorage : UnifiedStorage;
