const test = require("node:test");
const assert = require("node:assert/strict");
const { issueDeviceToken, deviceTokenHash, tokenMatches, codeHash } = require("../utils/authTokens");

test("session tokens require complete equality", () => {
    assert.equal(tokenMatches("a.b.c", "a.b.c"), true);
    assert.equal(tokenMatches("a.b.c", "a.b.d"), false);
    assert.equal(tokenMatches("a.b.c", "a.b"), false);
    assert.equal(tokenMatches(null, "a.b.c"), false);
    assert.equal(tokenMatches("", ""), false);
});

test("device credentials are random and never stored as raw values", () => {
    const a = issueDeviceToken();
    const b = issueDeviceToken();
    assert.match(a, /^[a-f0-9]{64}$/);
    assert.notEqual(a, b);
    assert.notEqual(deviceTokenHash(a), a);
    assert.equal(deviceTokenHash(a), deviceTokenHash(a));
    assert.notEqual(deviceTokenHash(a), deviceTokenHash(b));
});

test("six-digit code digests depend on the secret", () => {
    assert.equal(codeHash("123456", "secret-a"), codeHash("123456", "secret-a"));
    assert.notEqual(codeHash("123456", "secret-a"), codeHash("123456", "secret-b"));
    assert.notEqual(codeHash("123456", "secret-a"), "123456");
});

test('each JWT issuance includes a unique session identifier', () => {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const path = require('node:path');
    const filename = path.join(__dirname, '..', 'utils', 'authTokens.js');
    const seen = [];
    const mocked = { exports: {} };
    vm.runInNewContext('(function(require, module) {' + fs.readFileSync(filename, 'utf8') + '\n})', {})(
        name => name === 'node:crypto' ? require('node:crypto') : {
            sign(_payload, _secret, options) { seen.push(options.jwtid); return options.jwtid; }
        }, mocked
    );
    const a = mocked.exports.issueToken('user-id', 'secret');
    const b = mocked.exports.issueToken('user-id', 'secret');
    assert.notEqual(a, b);
    assert.match(a, /^[0-9a-f]{32}$/);
});
