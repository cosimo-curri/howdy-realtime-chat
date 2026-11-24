const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function harness({ failsCreate = false, failsCommit = false } = {}) {
    const state = {
        requests: [{ _id: "request-1", senderUser: "alice", recipientUser: "bob" }],
        friendships: [],
        sessionsStarted: 0,
        sessionsEnded: 0,
        transactionalDeletes: 0,
        transactionalCreates: 0,
        rejectsWithoutSession: 0
    };

    const session = {
        async withTransaction(callback) {
            const previousRequests = state.requests.map(request => ({ ...request }));
            const previousFriendships = state.friendships.map(friend => ({ ...friend }));
            try {
                const result = await callback();
                if (failsCommit) throw new Error("commit failed");
                return result;
            } catch (error) {
                state.requests = previousRequests;
                state.friendships = previousFriendships;
                throw error;
            }
        },
        async endSession() { state.sessionsEnded++; }
    };
    const PendingRequest = {
        async findOneAndDelete(query, options) {
            if (options?.session === session) state.transactionalDeletes++;
            else state.rejectsWithoutSession++;
            const index = state.requests.findIndex(request => request._id === query._id && request.recipientUser === query.recipientUser);
            if (index < 0) return null;
            return state.requests.splice(index, 1)[0];
        }
    };
    const Friendship = {
        async create(docs, options) {
            assert.equal(options?.session, session);
            state.transactionalCreates++;
            if (failsCreate) throw new Error("write failed");
            state.friendships.push(...docs);
            return docs;
        }
    };
    const mocks = {
        "../../utils/socketConnections": { connectionIds: () => [] },
        "../../models/friendships/pendingRequests": PendingRequest,
        "../../models/friendships/friendships": Friendship,
        "../../utils/helpers": { isAlreadyFriendOrRequest: async () => ({ message: "FALSE" }) },
        mongoose: { connection: { async startSession() { state.sessionsStarted++; return session; } } },
        moment: () => ({ toDate: () => new Date("2026-01-01T00:00:00Z") })
    };
    const file = path.join(__dirname, "..", "controllers", "friendships", "pendingRequests.js");
    const code = fs.readFileSync(file, "utf8");
    const module = { exports: {} };
    vm.runInNewContext("(function(exports, require, module) {" + code + "\n})", {}, { filename: file })(
        module.exports,
        name => { if (!(name in mocks)) throw new Error("Unexpected import: " + name); return mocks[name]; },
        module
    );
    async function manage({ requestId = "request-1", recipient = "bob", action = "ACCEPT" } = {}) {
        const response = { body: null, json(body) { this.body = body; return this; } };
        await module.exports.manageFriendRequest({
            body: { pendingRequestId: requestId, action },
            user: { _id: recipient }
        }, response);
        return response.body?.message;
    }
    return { state, manage };
}

test("acceptance commits friendship and request removal together", async () => {
    const h = harness();
    assert.equal(await h.manage(), "ACCEPT_OK");
    assert.equal(h.state.requests.length, 0);
    assert.equal(h.state.friendships.length, 1);
    const friendship = h.state.friendships[0];
    assert.equal(friendship.user1, "alice");
    assert.equal(friendship.user2, "bob");
    assert.equal(friendship.acceptDate.toISOString(), "2026-01-01T00:00:00.000Z");
    assert.equal(h.state.transactionalDeletes, 1);
    assert.equal(h.state.transactionalCreates, 1);
    assert.equal(h.state.sessionsStarted, 1);
    assert.equal(h.state.sessionsEnded, 1);
});

test("failure creating friendship rolls back deletion of pending request", async () => {
    const h = harness({ failsCreate: true });
    assert.equal(await h.manage(), "MANAGE_FRIEND_REQUEST_ERROR");
    assert.equal(h.state.requests.length, 1);
    assert.equal(h.state.friendships.length, 0);
    assert.equal(h.state.sessionsEnded, 1);
});

test("commit failure also restores request and does not create friendship", async () => {
    const h = harness({ failsCommit: true });
    assert.equal(await h.manage(), "MANAGE_FRIEND_REQUEST_ERROR");
    assert.equal(h.state.requests.length, 1);
    assert.equal(h.state.friendships.length, 0);
});

test("only the recipient can accept a pending request", async () => {
    const h = harness();
    assert.equal(await h.manage({ recipient: "eve" }), "MANAGE_FRIEND_REQUEST_ERROR");
    assert.equal(h.state.requests.length, 1);
    assert.equal(h.state.friendships.length, 0);
});

test("accepting the same request twice cannot create two friendships", async () => {
    const h = harness();
    assert.equal(await h.manage(), "ACCEPT_OK");
    assert.equal(await h.manage(), "MANAGE_FRIEND_REQUEST_ERROR");
    assert.equal(h.state.friendships.length, 1);
});

test("rejection removes the authorized request without creating a friendship", async () => {
    const h = harness();
    assert.equal(await h.manage({ action: "REJECT" }), "REJECT_OK");
    assert.equal(h.state.requests.length, 0);
    assert.equal(h.state.friendships.length, 0);
    assert.equal(h.state.sessionsStarted, 0);
    assert.equal(h.state.rejectsWithoutSession, 1);
});

test("invalid action does not mutate the pending request", async () => {
    const h = harness();
    assert.equal(await h.manage({ action: "EXPIRE" }), "MANAGE_FRIEND_REQUEST_ERROR");
    assert.equal(h.state.requests.length, 1);
    assert.equal(h.state.sessionsStarted, 0);
});
