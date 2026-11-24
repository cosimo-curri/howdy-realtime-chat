const jwt = require("jsonwebtoken");
const User = require("../models/users");
const { tokenMatches } = require("../utils/authTokens");
const chatSocketHandler = require("../socket_handlers/chatSocketHandler");
const userSocketHandler = require("../socket_handlers/userSocketHandler");

async function sessionIsCurrent(userId, token) {
    const user = await User.findById(userId);
    return Boolean(user && tokenMatches(user.currentValidToken, token));
}

module.exports = io => {
    for (const [namespace, handler] of [
        ["/socket/chat", chatSocketHandler.handler],
        ["/socket/user", userSocketHandler.handler]
    ]) {
        const socketNamespace = io.of(namespace);
        socketNamespace.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token || socket.handshake.query?.token;
                if (typeof token !== "string" || !token) return next(new Error("Authentication required"));
                const decoded = jwt.verify(token, process.env.AUTH_SECRET_ENCODING_PASSPHRASE);
                if (!await sessionIsCurrent(decoded.data, token)) {
                    return next(new Error("Invalid or revoked session"));
                }
                socket.decoded_token = decoded;
                // A handshake alone is insufficient: JWTs may be revoked after connection.
                socket.use(async (_packet, accept) => {
                    try {
                        if (!await sessionIsCurrent(decoded.data, token)) {
                            socket.disconnect(true);
                            return accept(new Error("Session revoked"));
                        }
                        accept();
                    } catch (_) {
                        socket.disconnect(true);
                        accept(new Error("Session validation unavailable"));
                    }
                });
                next();
            } catch (_) { next(new Error("Invalid token")); }
        });
        socketNamespace.on("connection", handler);
    }
};
