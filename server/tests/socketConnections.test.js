const test = require('node:test');
const assert = require('node:assert/strict');
const { registerConnection, unregisterConnection, connectionIds, disconnectAccount } = require('../utils/socketConnections');

test('closing one tab does not unregister another tab', () => {
    const registry = new Map();
    registerConnection(registry, 'user-a', 'tab-a');
    registerConnection(registry, 'user-a', 'tab-b');
    assert.deepEqual(connectionIds(registry, 'user-a'), ['tab-a', 'tab-b']);
    unregisterConnection(registry, 'user-a', 'tab-a');
    assert.deepEqual(connectionIds(registry, 'user-a'), ['tab-b']);
    unregisterConnection(registry, 'user-a', 'tab-b');
    assert.equal(registry.has('user-a'), false);
});

test('revocation disconnects all tabs in both socket namespaces', () => {
    const disconnected = [];
    const socket = id => ({ disconnect(force) { disconnected.push([id, force]); } });
    global.chatSocketOnlineUsers = new Map();
    global.userSocketOnlineUsers = new Map();
    registerConnection(global.chatSocketOnlineUsers, 'user-a', 'chat-one');
    registerConnection(global.chatSocketOnlineUsers, 'user-a', 'chat-two');
    registerConnection(global.userSocketOnlineUsers, 'user-a', 'user-one');
    registerConnection(global.userSocketOnlineUsers, 'other', 'other-socket');
    const io = { of(namespace) {
        return { sockets: new Map((namespace === '/socket/chat' ? ['chat-one', 'chat-two'] : ['user-one', 'other-socket']).map(id => [id, socket(id)])) };
    } };
    disconnectAccount(io, 'user-a');
    assert.deepEqual(disconnected, [['chat-one', true], ['chat-two', true], ['user-one', true]]);
});
