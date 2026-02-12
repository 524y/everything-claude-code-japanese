#!/usr/bin/env bash
# install.sh — ディレクトリ構造を保持して claude rules をインストールする。
#
# 使い方:
#   ./install.sh [--target <claude|cursor>] <language> [<language> ...]
#
# 例:
#   ./install.sh typescript
#   ./install.sh typescript python golang
#   ./install.sh --target cursor typescript
#   ./install.sh --target cursor typescript python golang
#
# 対象:
#   claude（既定）— rules を ~/.claude/rules/ にインストール
#   cursor — rules、agents、skills、commands、MCP を ./.cursor/ にインストール
#
# このスクリプトは対象ディレクトリへ rules をコピーする際に common/ と
# 言語別サブディレクトリ構造を保持し、次を満たす:
#   1. common/ と <language>/ の同名ファイルが相互上書きしない。
#   2. 相対参照（例: ../common/coding-style.md）を有効なまま維持する。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RULES_DIR="$SCRIPT_DIR/rules"

# --- --target フラグ解析 ---
TARGET="claude"
if [[ "${1:-}" == "--target" ]]; then
    if [[ -z "${2:-}" ]]; then
        echo "Error: --target requires a value (claude or cursor)" >&2
        exit 1
    fi
    TARGET="$2"
    shift 2
fi

if [[ "$TARGET" != "claude" && "$TARGET" != "cursor" ]]; then
    echo "Error: unknown target '$TARGET'. Must be 'claude' or 'cursor'." >&2
    exit 1
fi

# --- 使い方 ---
if [[ $# -eq 0 ]]; then
    echo "Usage: $0 [--target <claude|cursor>] <language> [<language> ...]"
    echo ""
    echo "Targets:"
    echo "  claude  (default) — Install rules to ~/.claude/rules/"
    echo "  cursor  — Install rules, agents, skills, commands, and MCP to ./.cursor/"
    echo ""
    echo "Available languages:"
    for dir in "$RULES_DIR"/*/; do
        name="$(basename "$dir")"
        [[ "$name" == "common" ]] && continue
        echo "  - $name"
    done
    exit 1
fi

# --- Claude ターゲット（従来動作） ---
if [[ "$TARGET" == "claude" ]]; then
    DEST_DIR="${CLAUDE_RULES_DIR:-$HOME/.claude/rules}"

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
fi

# --- Cursor ターゲット ---
if [[ "$TARGET" == "cursor" ]]; then
    DEST_DIR=".cursor"
    CURSOR_SRC="$SCRIPT_DIR/.cursor"

    echo "Installing Cursor configs to $DEST_DIR/"

    # --- Rules ---
    echo "Installing common rules -> $DEST_DIR/rules/"
    mkdir -p "$DEST_DIR/rules"
    # common rules をコピーする（common-coding-style.md のようなフラット名）
    if [[ -d "$CURSOR_SRC/rules" ]]; then
        for f in "$CURSOR_SRC/rules"/common-*.md; do
            [[ -f "$f" ]] && cp "$f" "$DEST_DIR/rules/"
        done
    fi

    # 言語別 rules をインストールする
    for lang in "$@"; do
        if [[ -d "$CURSOR_SRC/rules" ]]; then
            found=false
            for f in "$CURSOR_SRC/rules"/${lang}-*.md; do
                if [[ -f "$f" ]]; then
                    cp "$f" "$DEST_DIR/rules/"
                    found=true
                fi
            done
            if $found; then
                echo "Installing $lang rules -> $DEST_DIR/rules/"
            else
                echo "Warning: no Cursor rules for '$lang' found, skipping." >&2
            fi
        fi
    done

    # --- Agents ---
    if [[ -d "$CURSOR_SRC/agents" ]]; then
        echo "Installing agents -> $DEST_DIR/agents/"
        mkdir -p "$DEST_DIR/agents"
        cp -r "$CURSOR_SRC/agents/." "$DEST_DIR/agents/"
    fi

    # --- Skills ---
    if [[ -d "$CURSOR_SRC/skills" ]]; then
        echo "Installing skills -> $DEST_DIR/skills/"
        mkdir -p "$DEST_DIR/skills"
        cp -r "$CURSOR_SRC/skills/." "$DEST_DIR/skills/"
    fi

    # --- Commands ---
    if [[ -d "$CURSOR_SRC/commands" ]]; then
        echo "Installing commands -> $DEST_DIR/commands/"
        mkdir -p "$DEST_DIR/commands"
        cp -r "$CURSOR_SRC/commands/." "$DEST_DIR/commands/"
    fi

    # --- MCP 設定 ---
    if [[ -f "$CURSOR_SRC/mcp.json" ]]; then
        echo "Installing MCP config -> $DEST_DIR/mcp.json"
        cp "$CURSOR_SRC/mcp.json" "$DEST_DIR/mcp.json"
    fi

    echo "Done. Cursor configs installed to $DEST_DIR/"
fi
