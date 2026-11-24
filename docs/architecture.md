# Architecture

## Components

1. **React client:** login, profile, contacts, chat and multimedia messaging; API origin set by `REACT_APP_API_BASE_URL`.
2. **Express backend:** JSON endpoints under `/api` and `/tokenApi`, optional Google OAuth under `/auth`, and Socket.IO namespaces `/socket/chat` and `/socket/user`.
3. **MongoDB:** users, sessions, friendships, requests, chats, messages and expiring Stories. Operations using transactions require a replica set.
4. **Android application:** enrollment and rotating two-factor verification codes, with a revocable device credential encrypted using Android Keystore.

## Authentication

### Browser login

For accounts without 2FA, `POST /api/login` verifies credentials and issues a 24-hour JWT. For 2FA-enabled accounts:

1. `POST /api/isUserAuth2FA` validates the password and returns a random single-use challenge valid for five minutes.
2. The React client stores only this random challenge in tab-scoped session storage.
3. `POST /api/login` receives the challenge and a fresh six-digit code. An atomic conditional MongoDB update consumes the challenge and code, checks their expiry and account lock status, and rejects reuse.
4. The backend issues a new JWT only when both factors have succeeded.

Protected REST operations and Socket.IO connections compare presented tokens with the stored active session token. Socket.IO also validates this session before each incoming event; logging out or rotating the session disconnects existing sockets. A user can have multiple concurrent socket connections; disconnecting one tab leaves others registered.

### Android enrollment

`POST /api/login` with `clientType: ANDROID_2FA_APP` verifies account credentials when no second factor is active. The server issues a random device credential, retaining its digest in MongoDB. The companion app encrypts its copy using Android Keystore. An email verification code must then be submitted to `PUT /tokenApi/android/enableAuth2FA` to activate 2FA.

### Android codes

An enrolled device authenticates to `/api/android/session`, submits a short-lived code with `/api/android/setCode2FA`, and may disable 2FA using `/api/android/logout`. Browser and device credentials are not interchangeable. A successful browser login consumes the code; repeated failures result in temporary account lockouts. Recovery or migration after device loss is not implemented. Google OAuth does not bypass a configured second factor.

## Conversations and real-time events

Chat creation, message insertion and attachment access require participation in the conversation. Socket.IO events notify clients of persisted changes and typing/presence updates; MongoDB remains authoritative. Friend-request management and deletion notifications originate from authenticated REST operations. Socket.IO connection mappings support multiple tabs per account.

## Uploaded content

User-uploaded media are kept in `server/howdy_cloud_storage`. The repository provides default avatars only; runtime uploads must not be added to commits. Supported files retain their actual extensions, and the server checks basic container signatures. This does not guarantee all codecs will play on every browser, nor replace antivirus scanning or safe decoding. Story media can be read by an owner or an authorized friend; the web interface does not include a complete Stories user experience. Profile pictures are publicly served. Replacing or removing an uploaded local profile picture also removes its previous stored file; default avatars and external profile pictures remain untouched.

## External services and deployment

Local execution requires a MongoDB replica set and Gmail SMTP configuration. Google OAuth is optional. Multi-instance production throttling requires Redis; `express-session` must be configured with a persistent production store, and TLS and database security must be enforced externally.

## Optional media transfer

`server/scripts/backup.sh` and `restore.sh` transfer media via Magic Wormhole. They stage and validate restored archives and retain the previous directory for rollback, but **do not back up MongoDB**. Stop the backend before restoring and review cross-system consistency before deleting previous backups.
