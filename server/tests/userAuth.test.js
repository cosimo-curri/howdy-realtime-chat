const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const tokens = require("../utils/authTokens");

function harness({ activated = true, twoFactor = false, code = "123456", expires = new Date() } = {}) {
    const user = {
        _id: "user-id", username: "demo", email: "demo@example.org",
        secureSignUp: { active: activated }, auth2FA: twoFactor,
        code2FA: { value: tokens.codeHash(code, "test-secret"), date: expires },
        currentValidToken: null, saveCount: 0, failed2FAAttempts: 0,
        async save() { this.saveCount++; }
    };
    function matches(query) {
        if (query.pending2FAChallengeHash && user.pending2FAChallengeHash !== query.pending2FAChallengeHash) return false;
        if (query.pending2FAChallengeExpiresAt?.$gt && !(user.pending2FAChallengeExpiresAt > query.pending2FAChallengeExpiresAt.$gt)) return false;
        if (query.auth2FA === true && !user.auth2FA) return false;
        if (query["secureSignUp.active"] && !user.secureSignUp.active) return false;
        if (query["code2FA.value"] && user.code2FA.value !== query["code2FA.value"]) return false;
        if (query["code2FA.date"] && !(user.code2FA.date >= query["code2FA.date"].$gte && user.code2FA.date <= query["code2FA.date"].$lte)) return false;
        if (query.$or && user.auth2FALockedUntil && user.auth2FALockedUntil > new Date()) return false;
        if (query.failed2FAAttempts?.$gte && !(user.failed2FAAttempts >= query.failed2FAAttempts.$gte)) return false;
        return true;
    }
    function apply(update) {
        for (const [name, value] of Object.entries(update.$set || {})) {
            const parts = name.split(".");
            if (parts.length === 2) user[parts[0]][parts[1]] = value;
            else user[name] = value;
        }
        for (const [name, value] of Object.entries(update.$inc || {})) user[name] = (user[name] || 0) + value;
        for (const name of Object.keys(update.$unset || {})) delete user[name];
    }
    const User = {
        async findOne() { return user; },
        async findById() { return user; },
        async updateOne(query, update) { if (!matches(query)) return { modifiedCount: 0 }; apply(update); return { modifiedCount: 1 }; },
        async findOneAndUpdate(query, update) { if (!matches(query)) return null; apply(update); return user; }
    };
    const passport = { _verify: user, authenticate: (_strategy, callback) => (_req, _res) => callback(null, passport._verify) };
    const mocks = {
        passport, "node:crypto": require("node:crypto"),
        "../utils/socketConnections": { disconnectAccount() {} },
        "../models/users": User, moment: () => ({}),
        jsonwebtoken: { verify: () => ({ data: "user-id" }) },
        "express-validator": { validationResult: () => ({ errors: [] }) },
        "../utils/helpers": { clientFilterUser: () => ({ _id: "user-id" }) },
        "../utils/authTokens": { ...tokens, issueToken: () => "new-token" }
    };
    const file = path.join(__dirname, "..", "controllers", "users.js");
    const source = fs.readFileSync(file, "utf8");
    const module = { exports: {} };
    vm.runInNewContext("(function(exports, require, module, process) {" + source + "\n})", {}, { filename: file })(
        module.exports,
        name => { if (!(name in mocks)) throw new Error("Unexpected dependency: " + name); return mocks[name]; },
        module, { env: { AUTH_SECRET_ENCODING_PASSPHRASE: "test-secret" } }
    );
    return { controller: module.exports, user, passport };
}
function response() {
    return { code: 200, value: null, status(code) { this.code = code; return this; },
        json(data) { this.value = data; return this; } };
}
function flush() { return new Promise(resolve => setImmediate(resolve)); }
async function beginChallenge(h) {
    const res = response();
    await h.controller.isUserAuth2FA({ body: { username: "demo", password: "secret" } }, res);
    await flush();
    assert.equal(res.value.message, "AUTH_2FA_YES");
    assert.match(res.value.challenge, /^[a-f0-9]{64}$/);
    assert.notEqual(h.user.pending2FAChallengeHash, res.value.challenge);
    return res.value.challenge;
}

test("password-only login is rejected when 2FA is enabled", async () => {
    const h = harness({ twoFactor: true });
    const res = response();
    await h.controller.login({ body: { username: "demo", code2FA: "123456" } }, res);
    await flush();
    assert.equal(res.value.message, "AUTH_2FA_ERROR");
    assert.equal(h.user.currentValidToken, null);
});

test("invalid code does not issue a token after a password-authenticated challenge", async () => {
    const h = harness({ twoFactor: true });
    const challenge = await beginChallenge(h);
    const res = response();
    await h.controller.login({ body: { challenge, code2FA: "999999" } }, res);
    assert.equal(res.value.message, "AUTH_2FA_ERROR");
    assert.equal(h.user.currentValidToken, null);
    assert.equal(h.user.failed2FAAttempts, 1);
});

test("valid code completes challenge and cannot be replayed", async () => {
    const h = harness({ twoFactor: true });
    const challenge = await beginChallenge(h);
    const first = response();
    await h.controller.login({ body: { challenge, code2FA: "123456" } }, first);
    assert.equal(first.value.message, "LOGIN_OK");
    assert.equal(first.value.token, "new-token");
    assert.equal(h.user.code2FA.value, null);
    const replay = response();
    await h.controller.login({ body: { challenge, code2FA: "123456" } }, replay);
    assert.equal(replay.value.message, "AUTH_2FA_ERROR");
});

test("expired code and expired challenge cannot complete 2FA", async () => {
    const h = harness({ twoFactor: true, expires: new Date(Date.now() - 90_000) });
    const challenge = await beginChallenge(h);
    let res = response();
    await h.controller.login({ body: { challenge, code2FA: "123456" } }, res);
    assert.equal(res.value.message, "AUTH_2FA_ERROR");
    h.user.code2FA.date = new Date();
    h.user.pending2FAChallengeExpiresAt = new Date(Date.now() - 1000);
    res = response();
    await h.controller.login({ body: { challenge, code2FA: "123456" } }, res);
    assert.equal(res.value.message, "AUTH_2FA_ERROR");
});

test("five incorrect 2FA attempts temporarily lock the challenge", async () => {
    const h = harness({ twoFactor: true });
    const challenge = await beginChallenge(h);
    for (let i = 0; i < 5; i++) {
        const res = response();
        await h.controller.login({ body: { challenge, code2FA: "111111" } }, res);
        assert.equal(res.value.message, "AUTH_2FA_ERROR");
    }
    assert.ok(h.user.auth2FALockedUntil > new Date());
    const res = response();
    await h.controller.login({ body: { challenge, code2FA: "123456" } }, res);
    assert.equal(res.value.message, "AUTH_2FA_ERROR");
});

test("a password cannot re-enroll Android after second factor activation", async () => {
    const h = harness({ twoFactor: true });
    const res = response();
    await h.controller.login({ body: { username: "demo", clientType: "ANDROID_2FA_APP" } }, res);
    await flush();
    assert.equal(res.value.message, "AUTH_2FA_ERROR");
    assert.equal(h.user.androidDeviceTokenHash, undefined);
});

test("a new Android credential is stored only as a digest", async () => {
    const h = harness({ twoFactor: false });
    const res = response();
    await h.controller.login({ body: { username: "demo", clientType: "ANDROID_2FA_APP" } }, res);
    await flush();
    assert.equal(res.value.message, "LOGIN_OK");
    assert.match(res.value.deviceToken, /^[a-f0-9]{64}$/);
    assert.equal(h.user.androidDeviceTokenHash, tokens.deviceTokenHash(res.value.deviceToken));
});

test("logout cannot revoke a different stored session", async () => {
    const h = harness();
    h.user.currentValidToken = "other-session";
    const res = response();
    await h.controller.logout({ headers: { token: "forged-session" } }, res);
    assert.equal(res.code, 401);
    assert.equal(h.user.currentValidToken, "other-session");
});

test("six-digit email code enables Android second-factor enrollment", async () => {
    const h = harness();
    h.user.androidDeviceTokenHash = "device-digest";
    h.user.androidEnrollmentCodeHash = tokens.codeHash("654321", "test-secret");
    h.user.androidEnrollmentCodeExpiresAt = new Date(Date.now() + 60_000);
    const res = response();
    await h.controller.enableAuth2FA({ user: h.user, body: { enrollmentCode: "654321" } }, res);
    assert.equal(res.value.message, "ENABLE_AUTH_2FA_OK");
    assert.equal(h.user.auth2FA, true);
    assert.equal(h.user.androidEnrollmentCodeHash, null);
});

test("repeated incorrect enrollment codes create a temporary lock", async () => {
    const h = harness();
    h.user.androidDeviceTokenHash = "device-digest";
    h.user.androidEnrollmentCodeHash = tokens.codeHash("654321", "test-secret");
    h.user.androidEnrollmentCodeExpiresAt = new Date(Date.now() + 60_000);
    for (let i = 0; i < 5; i++) {
        const res = response();
        await h.controller.enableAuth2FA({ user: h.user, body: { enrollmentCode: "111111" } }, res);
        assert.equal(res.value.message, "ENABLE_AUTH_2FA_ERROR");
    }
    assert.ok(h.user.enrollmentLockedUntil > new Date());
    const res = response();
    await h.controller.enableAuth2FA({ user: h.user, body: { enrollmentCode: "654321" } }, res);
    assert.equal(res.value.message, "ENABLE_AUTH_2FA_ERROR");
});
