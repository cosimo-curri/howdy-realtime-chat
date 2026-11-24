"use strict";

// Each account may have several browser tabs or devices connected at once.
function registerConnection(registry, userId, socketId) {
    const key = String(userId);
    const connections = registry.get(key) || new Set();
    connections.add(socketId);
    registry.set(key, connections);
}

function unregisterConnection(registry, userId, socketId) {
    const key = String(userId);
    const connections = registry.get(key);
    if (!connections) return;
    connections.delete(socketId);
    if (connections.size === 0) registry.delete(key);
}

function connectionIds(registry, userId) {
    return [...(registry.get(String(userId)) || [])];
}

function disconnectAccount(io, userId) {
    if (!io) return;
    for (const [name, registry] of [
        ["/socket/chat", global.chatSocketOnlineUsers],
        ["/socket/user", global.userSocketOnlineUsers]
    ]) {
        if (!registry) continue;
        const namespace = io.of(name);
        for (const socketId of connectionIds(registry, userId)) {
            namespace.sockets.get(socketId)?.disconnect(true);
        }
    }
}

module.exports = { registerConnection, unregisterConnection, connectionIds, disconnectAccount };
