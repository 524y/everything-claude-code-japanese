#!/usr/bin/env bash
# install.sh — ディレクトリ構造を保持して claude rules をインストールする。
#
# 使い方:
#   ./install.sh <language> [<language> ...]
#
# 例:
#   ./install.sh typescript
#   ./install.sh typescript python golang
#
# このスクリプトは rules を ~/.claude/rules/ にコピーする際、common/ と
# 言語別サブディレクトリの構造を保ち、次を満たす:
#   1. common/ と <language>/ に同名ファイルがあっても相互に上書きしない。
#   2. 相対参照（例: ../common/coding-style.md）を有効なまま維持できる。

set -euo pipefail

RULES_DIR="$(cd "$(dirname "$0")/rules" && pwd)"
DEST_DIR="${CLAUDE_RULES_DIR:-$HOME/.claude/rules}"

if [[ $# -eq 0 ]]; then
    echo "Usage: $0 <language> [<language> ...]"
    echo ""
    echo "Available languages:"
    for dir in "$RULES_DIR"/*/; do
        name="$(basename "$dir")"
        [[ "$name" == "common" ]] && continue
        echo "  - $name"
    done
    exit 1
fi

# common rules は常にインストールする
echo "Installing common rules -> $DEST_DIR/common/"
mkdir -p "$DEST_DIR/common"
cp -r "$RULES_DIR/common/." "$DEST_DIR/common/"

# 指定された各言語をインストールする
for lang in "$@"; do
    lang_dir="$RULES_DIR/$lang"
    if [[ ! -d "$lang_dir" ]]; then
        echo "Warning: rules/$lang/ does not exist, skipping." >&2
        continue
    fi
    echo "Installing $lang rules -> $DEST_DIR/$lang/"
    mkdir -p "$DEST_DIR/$lang"
    cp -r "$lang_dir/." "$DEST_DIR/$lang/"
done

echo "Done. Rules installed to $DEST_DIR/"
