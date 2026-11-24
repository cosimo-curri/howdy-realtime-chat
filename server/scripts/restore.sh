#!/usr/bin/env bash
# Safely receive a Magic Wormhole media backup without deleting live data first.
# MongoDB is NOT included in this restore.
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
if [[ -L "$STORAGE" ]]; then
    echo "Refusing to restore over a symbolic link: $STORAGE" >&2
    exit 1
fi

# Place staging next to the destination so final directory renames are atomic.
TMP_DIR="$(mktemp -d "$SERVER_DIR/.howdy-restore.XXXXXXXX")"
trap 'rm -rf -- "$TMP_DIR"' EXIT

printf '%s\n' 'Enter the Wormhole code when prompted (do not place it in command arguments).'
(
    cd -- "$TMP_DIR"
    wormhole receive
)
ARCHIVE="$TMP_DIR/howdy-storage-backup.tar.gz"
if [[ ! -f "$ARCHIVE" || -L "$ARCHIVE" ]]; then
    echo "Unexpected received filename; expected howdy-storage-backup.tar.gz." >&2
    exit 1
fi

# Do not unpack archives with absolute, parent-traversal, symlink or device entries.
# The generated backup contains only ordinary files and directories.
while IFS= read -r entry; do
    if [[ "$entry" != howdy_cloud_storage && "$entry" != howdy_cloud_storage/ && "$entry" != howdy_cloud_storage/* ]]; then
        echo "Unexpected archive path: $entry" >&2
        exit 1
    fi
    if [[ "/$entry/" == *"/../"* || "/$entry/" == *"/./"* || "$entry" == *"//"* ]]; then
        echo "Unsafe archive path: $entry" >&2
        exit 1
    fi
done < <(tar -tzf "$ARCHIVE")
if tar -tvzf "$ARCHIVE" | awk '{t=substr($1,1,1); if (t!="-" && t!="d") bad=1} END {exit (bad?0:1)}'; then
    echo "Archive contains a symbolic link or special file; restore refused." >&2
    exit 1
fi

mkdir -- "$TMP_DIR/extracted"
tar --no-same-owner --no-same-permissions -xzf "$ARCHIVE" -C "$TMP_DIR/extracted"
NEW_STORAGE="$TMP_DIR/extracted/howdy_cloud_storage"
if [[ ! -d "$NEW_STORAGE" || -L "$NEW_STORAGE" ]]; then
    echo "Received archive has no usable storage directory." >&2
    exit 1
fi

# Preserve the old directory as a dated sibling for manual rollback.
PREVIOUS=""
if [[ -e "$STORAGE" ]]; then
    PREVIOUS="$SERVER_DIR/howdy_cloud_storage.previous.$(date -u +%Y%m%dT%H%M%SZ).$$"
    mv -- "$STORAGE" "$PREVIOUS"
fi
if ! mv -- "$NEW_STORAGE" "$STORAGE"; then
    if [[ -n "$PREVIOUS" ]]; then mv -- "$PREVIOUS" "$STORAGE"; fi
    echo "Failed to place restored storage; existing storage has been rolled back." >&2
    exit 1
fi
printf '%s\n' 'Media storage restored successfully.'
if [[ -n "$PREVIOUS" ]]; then
    printf 'Previous storage preserved for rollback at: %s\n' "$PREVIOUS"
fi
printf '%s\n' 'The MongoDB database has not been restored or modified.'
