const test = require("node:test");
const assert = require("node:assert/strict");
const { createRateLimit } = require("../middleware/rateLimit");

function response(log) {
    return { set() {}, status(code) { assert.equal(code, 429); return this; },
        json(obj) { assert.equal(obj.message, "TOO_MANY_REQUESTS"); log.rejected++; return this; } };
}
test("throttling applies to the account across source IPs", async () => {
    const middleware = createRateLimit({ windowMs: 60_000, max: 2 });
    const log = { accepted: 0, rejected: 0 };
    const req = (username, ip) => ({ body: { username }, ip });
    for (const ip of ["198.51.100.1", "198.51.100.2", "198.51.100.3"]) {
        await middleware(req("test-account-a", ip), response(log), () => log.accepted++);
    }
    await middleware(req("test-account-b", "198.51.100.4"), response(log), () => log.accepted++);
    assert.equal(log.accepted, 3);
    assert.equal(log.rejected, 1);
});
test("throttling applies to an IP even when usernames change", async () => {
    const middleware = createRateLimit({ windowMs: 60_000, max: 1 });
    const log = { accepted: 0, rejected: 0 };
    for (let i = 0; i < 21; i++) {
        await middleware({ ip: "203.0.113.123", body: { username: `candidate${i}` } },
            response(log), () => log.accepted++);
    }
    assert.equal(log.accepted, 20);
    assert.equal(log.rejected, 1);
});
