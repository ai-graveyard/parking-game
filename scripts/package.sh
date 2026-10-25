#!/usr/bin/env sh

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
RELEASE_VERSION=$(tr -d '[:space:]' < "$PROJECT_DIR/VERSION")
GAME_DIR="$PROJECT_DIR/src"
OUTPUT_DIR="$PROJECT_DIR/dist"
ARCHIVE_PATH="$OUTPUT_DIR/parking-game-v$RELEASE_VERSION.zip"

node "$PROJECT_DIR/scripts/validate.mjs"
mkdir -p "$OUTPUT_DIR"
rm -f "$ARCHIVE_PATH"

(
  cd "$GAME_DIR"
  zip -q -X -r "$ARCHIVE_PATH" index.html app.js challenges.js style.css favicon.svg assets
)

unzip -tq "$ARCHIVE_PATH"
ARCHIVE_BYTES=$(wc -c < "$ARCHIVE_PATH" | tr -d '[:space:]')
if [ "$ARCHIVE_BYTES" -gt 10485760 ]; then
  printf '产物超过 10MB：%s bytes\n' "$ARCHIVE_BYTES" >&2
  exit 1
fi

printf '产物：%s\n' "$ARCHIVE_PATH"
printf '大小：%s bytes\n' "$ARCHIVE_BYTES"
shasum -a 256 "$ARCHIVE_PATH"
