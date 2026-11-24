require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const helpers = require("./utils/helpers");

const required = ["MONGODB_URI", "AUTH_SECRET_ENCODING_PASSPHRASE", "SESSION_SECRET_PASSCODE",
    "USER_ACTIVATION_TOKEN_SECRET_ENCODING_PASSPHRASE", "USER_CHANGE_PASSWORD_TOKEN_SECRET_ENCODING_PASSPHRASE",
    "BASE_URL", "REACT_APP_DOMAIN"];
for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}
if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) {
    throw new Error("Production requires REDIS_URL for shared authentication throttling");
}
const clientOrigin = new URL(process.env.REACT_APP_DOMAIN).origin;
const port = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: clientOrigin, methods: ["GET", "POST"] } });
app.set("io", io);

global.chatSocketOnlineUsers = new Map();
global.userSocketOnlineUsers = new Map();

app.disable("x-powered-by");
app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (process.env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000");
    }
    next();
});
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(path.join(__dirname, "public")));
app.use("/default", express.static(path.join(__dirname, "howdy_cloud_storage", "default")));
app.use("/profilePictures", express.static(path.join(__dirname, "howdy_cloud_storage", "profile_pictures")));
app.use(session({
    secret: process.env.SESSION_SECRET_PASSCODE,
    resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", require("./routes/api"));
app.use("/auth", require("./routes/auth"));
app.use("/tokenApi", require("./routes/tokenApi"));
require("./routes/socket")(io);

async function start() {
    for (const folder of ["chats", "profile_pictures", "stories"]) {
        await fs.promises.mkdir(path.join(__dirname, "howdy_cloud_storage", folder), { recursive: true });
    }
    await mongoose.connect(process.env.MONGODB_URI);
    await helpers.re_schedule();
    server.listen(port, () => console.log(`Howdy server listening on port ${port}`));
}
if (require.main === module) start().catch(error => { console.error("Startup failed:", error.message); process.exitCode = 1; });
module.exports = { app, server, start };
