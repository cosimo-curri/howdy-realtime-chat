const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadHelpers(accounts) {
    const User = {
        async findOne(query) {
            if (Object.hasOwn(query, 'email')) return accounts.find(u => u.email === query.email) || null;
            if (Object.hasOwn(query, 'username')) return accounts.find(u => u.username === query.username) || null;
            return null;
        },
        async create(payload) { const user = { ...payload, _id: `id-${accounts.length + 1}` }; accounts.push(user); return user; }
    };
    const mocks = {
        '../models/users': User,
        '../models/friendships/friendships': {},
        '../models/friendships/pendingRequests': {},
        '../models/chats/chats': {},
        '../models/stories': {},
        moment: () => ({ toDate: () => new Date() }),
        'node-schedule': {},
        '../utils/scheduleJobs': {},
        fs: {}
    };
    const source = fs.readFileSync(path.join(__dirname, '..', 'utils', 'helpers.js'), 'utf8');
    const module = { exports: {} };
    vm.runInNewContext('(function(exports, require, module) {' + source + '\n})', { URL }, { filename: 'helpers.js' })(
        module.exports,
        name => { if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`); return mocks[name]; },
        module
    );
    return module.exports;
}

test('Google OAuth creates a unique account without a reference error', async () => {
    const accounts = [];
    const helpers = loadHelpers(accounts);
    const first = await helpers.userFindOrCreate('John', 'Smith', 'John@Example.org', 'avatar', { google: true });
    const second = await helpers.userFindOrCreate('John', 'Smith', 'other@example.org', 'avatar', { google: true });
    assert.equal(first.username, 'john.smith');
    assert.equal(second.username, 'john.smith1');
    assert.equal(first.email, 'john@example.org');
    assert.equal(accounts.length, 2);
});

test('Google OAuth reuses an existing matching email account', async () => {
    const accounts = [{ _id: 'existing', email: 'john@example.org', username: 'john.smith' }];
    const helpers = loadHelpers(accounts);
    const match = await helpers.userFindOrCreate('John', 'Smith', 'John@Example.org', 'avatar', { google: true });
    assert.equal(match._id, 'existing');
    assert.equal(accounts.length, 1);
});

test('Google OAuth callback escapes HTML control characters in user data', () => {
    const helpers = loadHelpers([]);
    const document = helpers.googleAuthCallback({ user: { username: '</script><script>alert(1)</script>' } }, 'http://localhost:3001');
    assert.ok(!document.includes('</script><script>alert(1)</script>'));
    assert.ok(document.includes('\\u003c/script\\u003e'));
    assert.ok(document.includes('"http://localhost:3001"'));
});
