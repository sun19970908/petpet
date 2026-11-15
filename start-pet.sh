#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -x node_modules/.bin/electron ]; then
  echo '缺少 Electron 依赖，请先运行：bash init.sh' >&2
  exit 1
fi

exec node_modules/.bin/electron . "$@"
