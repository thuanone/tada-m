import * as loggerUtil from '@console/console-platform-log4js-utils';
const logger = loggerUtil.getLogger('clg-ui:utils-cache');

import * as nconf from 'nconf';

import * as commonModel from '../../../common/model/common-model';
import * as encryptionUtils from './encryption-utils';

const configuredTtl = nconf.get('coligoTokenCacheTtl') || process.env.coligoTokenCacheTtl;
const DEFAULT_CACHE_TTL: number = isNaN(configuredTtl) ? (50 * 60) : parseInt(configuredTtl, 10);

import * as NodeCache from 'node-cache';

const caches: { [key: string]: CacheInstance } = {};

export function getCacheInstance(instanceId: string, maxTtl?: number, maxKeys?: number): CacheInstance {
  if (caches[instanceId]) {
    return caches[instanceId];
  }

  const newCache = new CacheInstance(instanceId, maxTtl, maxKeys);
  // store the cache in the array
  caches[instanceId] = newCache;

  return newCache;
}
export class CacheInstance {

  // the cache instance
  private cacheInstance;

  private cacheIdentifier: string;
  private cacheTTL: number;

  constructor(identifier: string, maxTtl: number = DEFAULT_CACHE_TTL, maxKeys: number = 1000) {
    this.cacheIdentifier = identifier;
    this.cacheTTL = maxTtl;
    this.cacheInstance = new NodeCache({ stdTTL: maxTtl, maxKeys});
  }

  public getInternalCache() {
    return this.cacheInstance;
  }

  public getCacheStats() {
    const stats: any = this.cacheInstance.getStats();
    stats.id = this.cacheIdentifier;
    return stats;
  }

  public get(ctx: commonModel.IUIRequestContext, key: string, isUserScoped: boolean = true): any {
    const fn = 'get ';
    let cacheKey: string;
    try {
      cacheKey = this.calculateCacheKey(ctx, key, isUserScoped);
      if (cacheKey) {
        return this.cacheInstance.get(cacheKey);
      }
    } catch (e) {
      logger.error(`${fn}- Failed to retrieve '${cacheKey}' from in-memory cache`, e);
    }
  }

  public getDecrypted(ctx: commonModel.IUIRequestContext, key: string, isUserScoped: boolean = true): any {
    const cachedValue = this.get(ctx, key, isUserScoped);
    if (cachedValue) {
      return encryptionUtils.decrypt(cachedValue);
    }
    return undefined;
  }

  public getDecryptedJson(ctx: commonModel.IUIRequestContext, key: string, isUserScoped: boolean = true): any {
    const cachedValue = this.get(ctx, key, isUserScoped);
    if (cachedValue && cachedValue !== '') {
      return encryptionUtils.decryptJson(cachedValue);
    }
    return undefined;
  }

  public put(ctx: commonModel.IUIRequestContext, key: string, value: any, ttl?: number, isUserScoped: boolean = true) {
    const fn = 'put ';
    let cacheKey;
    try {
      cacheKey = this.calculateCacheKey(ctx, key, isUserScoped);
      if (cacheKey) {
        this.cacheInstance.set(cacheKey, value, (ttl || this.cacheTTL));
      }
    } catch (e) {
      logger.error(`${fn}- Failed to store '${cacheKey}' in in-memory cache`, e);
    }
  }

  public putEncrypted(ctx: commonModel.IUIRequestContext, key: string, value: any, ttl?: number) {
    this.put(ctx, key, encryptionUtils.encrypt(value), ttl);
  }

  public putEncryptedJson(ctx: commonModel.IUIRequestContext, key: string, value: any, ttl?: number) {
    this.put(ctx, key, encryptionUtils.encryptJson(value), ttl);
  }

  private calculateCacheKey(ctx: commonModel.IUIRequestContext, key: string, isUserScoped: boolean = true): string {
    let cacheKey;
    if (isUserScoped) {
      const userId = this.getUserIdFromReq(ctx);
      if (!userId) {
        // for security reasons we need to stop here, as we cannot ensure that the cached entry belongs to the current user
        return undefined;
      }
      cacheKey = `${this.getUserIdFromReq(ctx)}_____${key}`;
    } else {
      cacheKey = key;
    }
    return cacheKey;
  }

  private getUserIdFromReq(ctx: commonModel.IUIRequestContext) {
    const fn = 'getUserIdFromReq ';

    const iamId = ctx && ctx.user && ctx.user.iam_id;
    if (!iamId) {
      logger.warn(`${fn}- failed to extract the user id (req.user.iam_id) from the given request object`);
    }
    return iamId;
  }
}

export function getCaches() {
  return Object.keys(caches);
}
