const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function handler(component, name, endMarker, values = {}) {
    const file = path.join(__dirname, "..", "..", "client", "src", "pages", `${component}.jsx`);
    const source = fs.readFileSync(file, "utf8");
    const start = source.indexOf(`async function ${name}(event) {`);
    assert.ok(start >= 0, `Missing ${name}`);
    const end = source.indexOf(endMarker, start);
    assert.ok(end > start, `Missing ${endMarker}`);
    const notifications = [];
    const context = {
        API_BASE_URL: "https://api.example.org",
        toast: {
            error(message) { notifications.push({ type: "error", message }); },
            warn(message) { notifications.push({ type: "warn", message }); },
            info(message) { notifications.push({ type: "info", message }); }
        },
        isSubmitting: false,
        setIsSubmitting(value) { context.isSubmitting = value; },
        ...values
    };
    const fn = vm.runInNewContext(`(${source.slice(start, end).trim()})`, context, { filename: file });
    let prevented = false;
    const event = { preventDefault() { prevented = true; } };
    return { fn, context, notifications, event, get prevented() { return prevented; }, source };
}

function change(values = {}) {
    return handler("ChangePassword", "handleChange", "function valid(item,", {
        currentPassword: "old-password",
        newPassword: "NewPassword1!",
        confirmPassword: "NewPassword1!",
        sessionStorage: { getItem() { return "jwt"; }, clear() {} },
        navigate() {},
        ...values
    });
}
function forgot(values = {}) {
    return handler("Forgot", "handleRecover", "return (", { email: "alice@example.org", ...values });
}

test("password mismatch prevents native submit and never sends credentials", async () => {
    let calls = 0;
    const h = change({ confirmPassword: "different", fetch: async () => { calls++; } });
    await h.fn(h.event);
    assert.equal(h.prevented, true);
    assert.equal(calls, 0);
    assert.equal(h.notifications[0].type, "warn");
    assert.match(h.source, /<form[^>]+onSubmit=\{handleChange\}/);
    assert.doesNotMatch(h.source, /onClick=\{handleChange\}/);
});

test("password change reports non-200 responses without crashing", async () => {
    const h = change({ fetch: async () => ({ ok: false, status: 500 }) });
    await h.fn(h.event);
    assert.equal(h.prevented, true);
    assert.equal(h.notifications[0].type, "error");
    assert.equal(h.context.isSubmitting, false);
});

test("password change accepts array-form weak-password validation errors", async () => {
    const h = change({ fetch: async () => ({ ok: true, json: async () => [{ message: "WEAK_PASSWORD" }] }) });
    await h.fn(h.event);
    assert.equal(h.notifications[0].type, "warn");
    assert.equal(h.context.isSubmitting, false);
});

test("password change logs out after successful response", async () => {
    let cleared = false, redirect = null;
    const h = change({
        fetch: async () => ({ ok: true, json: async () => ({ message: "LOGOUT_OK" }) }),
        sessionStorage: { getItem() { return "jwt"; }, clear() { cleared = true; } },
        navigate(url) { redirect = url; }
    });
    await h.fn(h.event);
    assert.equal(cleared, true);
    assert.equal(redirect, "/");
});

test("password recovery handles non-200 HTTP and network errors", async () => {
    for (const fetch of [async () => ({ ok: false, status: 429 }), async () => { throw new Error("offline"); }]) {
        const h = forgot({ fetch });
        await h.fn(h.event);
        assert.equal(h.prevented, true);
        assert.equal(h.notifications[0].type, "error");
        assert.equal(h.context.isSubmitting, false);
    }
});

test("password recovery preserves known responses and handles malformed bodies", async () => {
    const valid = forgot({ fetch: async () => ({ ok: true, json: async () => ({ message: "EMAIL_SEND_OK" }) }) });
    await valid.fn(valid.event);
    assert.equal(valid.notifications[0].type, "info");

    const invalid = forgot({ fetch: async () => ({ ok: true, json: async () => null }) });
    await invalid.fn(invalid.event);
    assert.equal(invalid.notifications[0].type, "error");
});
