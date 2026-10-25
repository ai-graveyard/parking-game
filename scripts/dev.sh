#!/usr/bin/env sh

set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DEV_PORT=${PORT:-4173}

exec python3 "$PROJECT_DIR/scripts/preview_server.py" --port "$DEV_PORT" --directory "$PROJECT_DIR/src"
