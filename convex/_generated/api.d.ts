/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as blockchain from "../blockchain.js";
import type * as booths from "../booths.js";
import type * as geoFences from "../geoFences.js";
import type * as geospatial from "../geospatial.js";
import type * as neo4j from "../neo4j.js";
import type * as notifications from "../notifications.js";
import type * as ogd from "../ogd.js";
import type * as projects from "../projects.js";
import type * as ragAgent from "../ragAgent.js";
import type * as reports from "../reports.js";
import type * as seed from "../seed.js";
import type * as testZone from "../testZone.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  analytics: typeof analytics;
  blockchain: typeof blockchain;
  booths: typeof booths;
  geoFences: typeof geoFences;
  geospatial: typeof geospatial;
  neo4j: typeof neo4j;
  notifications: typeof notifications;
  ogd: typeof ogd;
  projects: typeof projects;
  ragAgent: typeof ragAgent;
  reports: typeof reports;
  seed: typeof seed;
  testZone: typeof testZone;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
