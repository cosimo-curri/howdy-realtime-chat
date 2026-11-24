const crypto = require("node:crypto");

function issueToken(userId, secret) {
    return require("jsonwebtoken").sign({ data: String(userId) }, secret, {
        expiresIn: "1d", jwtid: crypto.randomBytes(16).toString("hex")
    });
}
function tokenMatches(stored, received) {
    if (typeof stored !== "string" || typeof received !== "string" || !stored || !received) return false;
    const a = Buffer.from(stored);
    const b = Buffer.from(received);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function issueDeviceToken() { return crypto.randomBytes(32).toString("hex"); }
function deviceTokenHash(token) { return crypto.createHash("sha256").update(token).digest("hex"); }
function codeHash(code, secret) {
    return crypto.createHmac("sha256", secret).update(String(code)).digest("hex");
}
module.exports = { issueToken, tokenMatches, issueDeviceToken, deviceTokenHash, codeHash };
