#!/usr/bin/env bash
# Transfer a snapshot of local media storage through Magic Wormhole.
# MongoDB is NOT included in this backup.
set -Eeuo pipefail
umask 077

SERVER_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
STORAGE="$SERVER_DIR/howdy_cloud_storage"

if ! command -v wormhole >/dev/null 2>&1; then
    echo "Magic Wormhole CLI is required (wormhole command)." >&2
    exit 1
fi
if ! command -v tar >/dev/null 2>&1; then
    echo "tar is required." >&2
    exit 1
fi
if [[ ! -d "$STORAGE" || -L "$STORAGE" ]]; then
    echo "Media storage directory does not exist or is a symbolic link: $STORAGE" >&2
    exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf -- "$TMP_DIR"' EXIT
ARCHIVE="$TMP_DIR/howdy-storage-backup.tar.gz"
tar -C "$SERVER_DIR" -czf "$ARCHIVE" howdy_cloud_storage

echo "Transferring media storage only (not the MongoDB database)."
echo "The sender will display a one-time Wormhole code to share securely."
wormhole send "$ARCHIVE"
