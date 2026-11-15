#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PLAYER_REPO="https://github.com/livliv-dev/player.git"

copy_if_missing() {
  local src="$1"
  local dest="$2"
  if [ -e "$dest" ]; then
    printf '[skip]   %s 已存在\n' "$dest"
    return
  fi
  cp -R "$src" "$dest"
  printf '[copy]   %s -> %s\n' "$src" "$dest"
}

echo "初始化 livliv-pet：$ROOT"
echo "[license] 角色仅拉取 p01/p02，来源：$PLAYER_REPO"
echo "[license] p01/p02 为 CC BY-NC-SA 4.0：必须署名、仅限非商业、修改后同协议分发。"
echo

copy_if_missing pet_space.example pet_space
copy_if_missing renderer/system-prompt.example.txt renderer/system-prompt.txt
copy_if_missing config.example.json config.json
copy_if_missing llm.config.example.json llm.config.json
copy_if_missing tts.config.example.json tts.config.json

mkdir -p logs history

if [ ! -d node_modules/electron ]; then
  echo '[run]    npm install'
  npm install
else
  echo '[skip]   node_modules/electron 已存在'
fi

if [ -d characters/characters/p01 ]; then
  if [ ! -d characters/characters/p02 ]; then
    echo '[warn]   characters/characters/p02 缺失；不覆盖现有 characters/ 目录。'
  else
    echo '[skip]   characters/characters/p01、p02 已存在'
  fi
elif [ -d characters ]; then
  echo '[warn]   characters/ 已存在但缺少 characters/characters/p01；不覆盖现有目录。'
else
  if ! command -v git >/dev/null 2>&1; then
    echo '找不到 git，请先安装 Git。' >&2
    exit 1
  fi

  tmp="$(mktemp -d "${TMPDIR:-/tmp}/livliv-characters.XXXXXX")"
  trap 'rm -rf "$tmp"' EXIT

  echo "[run]    git clone --depth 1 --filter=blob:none --no-checkout $PLAYER_REPO (仅 p01/p02)"
  git clone --depth 1 --filter=blob:none --no-checkout "$PLAYER_REPO" "$tmp"
  git -C "$tmp" sparse-checkout init --no-cone
  git -C "$tmp" sparse-checkout set \
    '/characters/p01/' \
    '/characters/p02/' \
    '/characters/LICENSE.md' \
    '/characters/CREDITS.md' \
    '/LICENSE' \
    '/NOTICE'
  git -C "$tmp" checkout

  if [ ! -d "$tmp/characters/p01" ]; then
    echo '角色仓库中未找到 characters/p01。' >&2
    exit 1
  fi
  if [ ! -d "$tmp/characters/p02" ]; then
    echo '角色仓库中未找到 characters/p02。' >&2
    exit 1
  fi

  mv "$tmp" characters
  trap - EXIT
  echo '[done]   角色 p01/p02 已克隆到 characters/'
fi

echo
if [ ! -d voices ]; then
  echo '[hint]   TTS 默认关闭；以后开启 TTS 时需要 voices/ 和 GPT-SoVITS。'
fi
if [ ! -d models ]; then
  echo '[hint]   ASR 可选：SenseVoice 模型和官方下载链接见 README 的 SenseVoice ASR 一节。'
fi
echo '初始化完成。下一步：'
echo '  1. 编辑 config.json / llm.config.json / tts.config.json'
echo '  2. llm.config.json 的 baseUrl 默认为空，配置端点后才能聊天'
echo '  3. 运行 bash start-pet.sh'
