const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const BASE = "https://api.example.test";
const filename = "alice-bb20fa779af02411.webp";
const pictureUrl = `${BASE}/profilePictures/${filename}`;

function harness() {
    const handlers = {};
    const removed = [];
    const saved = [];
    const user = {
        username: "alice", profilePictureURL: pictureUrl, gender: "F",
        async save() {
            saved.push(this.profilePictureURL);
            if (this.failSave) throw new Error("storage unavailable");
        }
    };
    const helpers = {
        safeFileStem: value => String(value).replace(/[^a-zA-Z0-9_-]/g, "_"),
        clientFilterUser: u => ({ profilePictureURL: u.profilePictureURL }),
        applyDefaultProfilePicture: req => { req.user.profilePictureURL = `${BASE}/default/user_female.png`; },
        isExtAllowed: (ext, allowed) => allowed.includes(ext),
        isValidImageFile: () => true,
        fileUpload: async () => ({ message: "UPLOAD_OK" })
    };
    const source = fs.readFileSync(path.join(__dirname, "..", "utils", "helpers.js"), "utf8");
    const helperCode = source.slice(source.indexOf("exports.managedProfilePictureFilename ="), source.indexOf("exports.isValidImageFile ="));
    vm.runInNewContext("(function(exports) {" + helperCode + "})", { URL })(helpers);
    const router = {
        use() {}, get() {}, put() {},
        post(name, handler) { handlers[name] = handler; },
        delete(name, handler) { handlers[name] = handler; }
    };
    const mocks = {
        "express": { Router: () => router },
        "express-fileupload": () => (_req, _res, next) => next(),
        "node:crypto": require("node:crypto"),
        "node:path": require("node:path"),
        "path": require("node:path"),
        "node:fs/promises": { unlink: async filepath => { removed.push(path.basename(filepath)); } },
        "../../controllers/users": { changeUserInfo() {}, changePassword: { firstStep() {}, stepAfterPasswordValidation() {} }, onlyLocalAuth() {}, logout() {}, changeDarkTheme() {}, loggedUserAuth2FA() {} },
        "../../utils/validators": { strongPasswordValidator() {} },
        "../../utils/helpers": helpers,
        "../../controllers/chats/messages": { uploadBinaryFile() {}, insertMessage() {} },
        "../../controllers/stories": { manageStoryDate() {}, uploadStoryContent() {}, pushStory() {} }
    };
    function load(rel) {
        const sourcePath = path.join(__dirname, "..", rel);
        const code = fs.readFileSync(sourcePath, "utf8");
        const module = { exports: {} };
        vm.runInNewContext("(function(exports,require,module,__dirname,process,console){" + code + "\n})", {}, { filename: sourcePath })(
            module.exports, name => {
                if (!(name in mocks)) throw new Error("Unexpected dependency: " + name);
                return mocks[name];
            }, module, path.dirname(sourcePath), { env: { BASE_URL: BASE } }, { warn() {} }
        );
    }
    load("routes/tokenApi_routes/profile.js");
    load("routes/tokenApi_routes/file.js");
    const response = () => ({ body: null, json(data) { this.body = data; return this; } });
    return { handlers, helpers, removed, saved, user, response };
}

test("managed profile pictures exclude defaults, external URLs and traversal", () => {
    const h = harness();
    assert.equal(h.helpers.managedProfilePictureFilename(pictureUrl, BASE), filename);
    assert.equal(h.helpers.managedProfilePictureFilename(`${BASE}/profilePictures/alice.png`, BASE), "alice.png");
    for (const invalid of [
        `${BASE}/default/user_male.png`, "https://cdn.example.org/alice.png",
        `${BASE}/profilePictures/%2e%2e%2fsecrets.png`,
        `${BASE}/profilePictures/../private.png`,
        `${BASE}/profilePictures/other.png?token=1`, null
    ]) assert.equal(h.helpers.managedProfilePictureFilename(invalid, BASE), null);
});

test("deleting a previously uploaded picture resets the profile and unlinks the correct file", async () => {
    const h = harness();
    const res = h.response();
    await h.handlers["/deleteProfilePicture"]({ user: h.user }, res);
    assert.equal(res.body.message, "DELETE_PROFILE_PICTURE_OK");
    assert.equal(h.user.profilePictureURL, `${BASE}/default/user_female.png`);
    assert.equal(res.body.userInfo.profilePictureURL, h.user.profilePictureURL);
    assert.deepEqual(h.removed, [filename]);
});

test("default and externally hosted profile pictures are not unlinked", async () => {
    const h = harness();
    for (const url of [`${BASE}/default/user_female.png`, "https://accounts.google.com/photo.jpg"]) {
        h.user.profilePictureURL = url;
        const res = h.response();
        await h.handlers["/deleteProfilePicture"]({ user: h.user }, res);
        assert.equal(res.body.message, "DELETE_PROFILE_PICTURE_OK");
    }
    assert.deepEqual(h.removed, []);
});

test("failed profile save preserves the previous image without unlinking", async () => {
    const h = harness();
    h.user.failSave = true;
    const res = h.response();
    await h.handlers["/deleteProfilePicture"]({ user: h.user }, res);
    assert.equal(res.body.message, "DELETE_PROFILE_PICTURE_ERROR");
    assert.equal(h.user.profilePictureURL, pictureUrl);
    assert.deepEqual(h.removed, []);
});

test("replacing a picture deletes the previous locally stored image only after saving", async () => {
    const h = harness();
    const upload = { name: "new.png", size: 16, data: Buffer.from([137,80,78,71,13,10,26,10]) };
    const res = h.response();
    await h.handlers["/uploadProfilePicture"]({ user: h.user, files: { file: upload } }, res);
    assert.equal(res.body.message, "UPLOAD_OK");
    assert.match(h.user.profilePictureURL, /^https:\/\/api\.example\.test\/profilePictures\/alice-[a-f0-9]{16}\.png$/);
    assert.deepEqual(h.removed, [filename]);
    assert.equal(h.saved.length, 1);
});

test("upload failure to save restores the original profile URL", async () => {
    const h = harness();
    h.user.failSave = true;
    const upload = { name: "new.png", size: 16, data: Buffer.from([137,80,78,71,13,10,26,10]) };
    const res = h.response();
    await h.handlers["/uploadProfilePicture"]({ user: h.user, files: { file: upload } }, res);
    assert.equal(res.body.message, "UPLOAD_ERROR");
    assert.equal(h.user.profilePictureURL, pictureUrl);
    assert.equal(h.removed.length, 1);
    assert.match(h.removed[0], /^alice-[a-f0-9]{16}\.png$/);
});
