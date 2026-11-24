const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('a revoked JWT fails validation for the next socket event', async () => {
    let activeToken = 'good-token';
    const namespaces = new Map();
    const io = { of(name) {
        const namespace = {
            use(fn) { this.handshakeMiddleware = fn; },
            on() {}
        };
        namespaces.set(name, namespace);
        return namespace;
    } };
    const mocks = {
        jsonwebtoken: { verify: () => ({ data: 'user-id' }) },
        '../models/users': { async findById() { return { currentValidToken: activeToken }; } },
        '../utils/authTokens': { tokenMatches: (stored, value) => stored === value },
        '../socket_handlers/chatSocketHandler': { handler() {} },
        '../socket_handlers/userSocketHandler': { handler() {} }
    };
    const file = path.join(__dirname, '..', 'routes', 'socket.js');
    const module = { exports: {} };
    vm.runInNewContext('(function(require, module, process) {' + fs.readFileSync(file, 'utf8') + '\n})', {})(
        name => mocks[name], module, { env: { AUTH_SECRET_ENCODING_PASSPHRASE: 'secret' } }
    );
    module.exports(io);
    const socket = {
        handshake: { auth: { token: 'good-token' } },
        use(fn) { this.eventMiddleware = fn; },
        disconnect(force) { this.disconnected = force; }
    };
    let handshakeError;
    await namespaces.get('/socket/chat').handshakeMiddleware(socket, error => { handshakeError = error; });
    assert.equal(handshakeError, undefined);
    let eventError;
    await socket.eventMiddleware(['sendMessage', {}], error => { eventError = error; });
    assert.equal(eventError, undefined);
    activeToken = 'revoked-session';
    await socket.eventMiddleware(['sendMessage', {}], error => { eventError = error; });
    assert.equal(eventError.message, "Session revoked");
    assert.equal(socket.disconnected, true);
});
