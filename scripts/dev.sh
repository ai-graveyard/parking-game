#!/usr/bin/env sh

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
RELEASE_VERSION=$(tr -d '[:space:]' < "$PROJECT_DIR/VERSION")
# 版本目录用下划线命名：1.1.0 -> 1_1_0
VERSION_DIR=${VERSION_DIR:-$(printf '%s' "$RELEASE_VERSION" | tr '.' '_')}
DEV_PORT=${PORT:-4173}

exec python3 -m http.server "$DEV_PORT" --bind 127.0.0.1 --directory "$PROJECT_DIR/$VERSION_DIR"
