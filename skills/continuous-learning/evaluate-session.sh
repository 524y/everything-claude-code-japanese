#!/bin/bash
# Continuous Learning - セッション評価器
# Claude Code セッションから再利用可能なパターンを抽出するために Stop フックで実行する
#
# UserPromptSubmit ではなく Stop フックを使う理由:
# - Stop はセッション終了時に 1 回だけ実行される（軽量）
# - UserPromptSubmit は毎メッセージ実行される（重い、レイテンシが増える）
#
# フック設定（~/.claude/settings.json 内）:
# {
#   "hooks": {
#     "Stop": [{
#       "matcher": "*",
#       "hooks": [{
#         "type": "command",
#         "command": "~/.claude/skills/continuous-learning/evaluate-session.sh"
#       }]
#     }]
#   }
# }
#
# 検出するパターン: error_resolution, debugging_techniques, workarounds, project_specific
# 無視するパターン: simple_typos, one_time_fixes, external_api_issues
# 抽出したスキルの保存先: ~/.claude/skills/learned/

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
LEARNED_SKILLS_PATH="${HOME}/.claude/skills/learned"
MIN_SESSION_LENGTH=10

# 設定ファイルがある場合は読み込む
if [ -f "$CONFIG_FILE" ]; then
  MIN_SESSION_LENGTH=$(jq -r '.min_session_length // 10' "$CONFIG_FILE")
  LEARNED_SKILLS_PATH=$(jq -r '.learned_skills_path // "~/.claude/skills/learned/"' "$CONFIG_FILE" | sed "s|~|$HOME|")
fi

# 学習済みスキルのディレクトリが存在することを保証する
mkdir -p "$LEARNED_SKILLS_PATH"

# 環境から書き起こしパスを取得する（Claude Code が設定する）
transcript_path="${CLAUDE_TRANSCRIPT_PATH:-}"

if [ -z "$transcript_path" ] || [ ! -f "$transcript_path" ]; then
  exit 0
fi

# セッション内のメッセージ数を数える
message_count=$(grep -c '"type":"user"' "$transcript_path" 2>/dev/null || echo "0")

# 短いセッションはスキップする
if [ "$message_count" -lt "$MIN_SESSION_LENGTH" ]; then
  echo "[ContinuousLearning] Session too short ($message_count messages), skipping" >&2
  exit 0
fi

# 抽出可能なパターンの評価を Claude に通知する
echo "[ContinuousLearning] Session has $message_count messages - evaluate for extractable patterns" >&2
echo "[ContinuousLearning] Save learned skills to: $LEARNED_SKILLS_PATH" >&2
