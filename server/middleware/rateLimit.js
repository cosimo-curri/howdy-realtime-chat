"use strict";
const crypto = require("node:crypto");

// A bounded development limiter, or a Redis-backed per-account and per-IP limiter
// when REDIS_URL is configured. Production startup requires Redis.
const buckets = new Map();
let redisClient;
function getRedis() {
    if (!process.env.REDIS_URL) return null;
    if (!redisClient) {
        const Redis = require("ioredis");
        redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1, enableOfflineQueue: false, connectTimeout: 3000
        });
        redisClient.on("error", () => {}); // errors are handled by awaiting requests
    }
    return redisClient;
}
function hashed(prefix, value) {
    return `howdy:limit:${prefix}:${crypto.createHash("sha256").update(value).digest("hex")}`;
}
function identityKeys(req) {
    const ip = String(req.ip || req.socket?.remoteAddress || "unknown");
    const body = req.body || {};
    const account = req.user?._id || body.email || body.username || body.deviceToken;
    return { ip: hashed("ip", ip), account: account ? hashed("account", String(account).trim().toLowerCase()) : null };
}
function localCount(key, windowMs, now) {
    const existing = buckets.get(key);
    const count = existing && existing.expiresAt > now ? existing.count + 1 : 1;
    const expiresAt = existing && existing.expiresAt > now ? existing.expiresAt : now + windowMs;
    buckets.delete(key);
    buckets.set(key, { count, expiresAt });
    // Prevent an attacker from forcing unlimited memory growth with distinct keys.
    if (buckets.size > 20000) {
        for (const [oldKey, bucket] of buckets) {
            if (bucket.expiresAt <= now) buckets.delete(oldKey);
        }
        while (buckets.size > 20000) buckets.delete(buckets.keys().next().value);
    }
    return count;
}
const REDIS_INCREMENT = `
local value = redis.call('INCR', KEYS[1])
if value == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return value
`;
function createRateLimit({ windowMs = 5 * 60_000, max = 10 } = {}) {
    if (!Number.isSafeInteger(windowMs) || windowMs < 1000 || !Number.isSafeInteger(max) || max < 1) {
        throw new Error("Invalid rate limit configuration");
    }
    const ipMax = Math.max(max * 5, 20);
    // Keep limits with different windows/quotas independent.
    const scope = `${windowMs}:${max}`;
    return async (req, res, next) => {
        try {
            const identity = identityKeys(req);
            const ip = `${identity.ip}:${scope}`;
            const account = identity.account && `${identity.account}:${scope}`;
            const redis = getRedis();
            const increment = redis
                ? key => redis.eval(REDIS_INCREMENT, 1, key, windowMs)
                : key => localCount(key, windowMs, Date.now());
            const ipHits = await increment(ip);
            const accountHits = account ? await increment(account) : 0;
            if (ipHits > ipMax || accountHits > max) {
                res.set?.("Retry-After", String(Math.ceil(windowMs / 1000)));
                return res.status(429).json({ message: "TOO_MANY_REQUESTS" });
            }
            next();
        } catch (_) {
            // Never bypass throttling on a failed Redis connection.
            res.status(503).json({ message: "RATE_LIMIT_UNAVAILABLE" });
        }
    };
}
module.exports = { createRateLimit };
