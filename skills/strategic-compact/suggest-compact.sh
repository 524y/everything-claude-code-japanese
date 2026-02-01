#!/bin/bash
# Strategic Compact 提案ツール
# PreToolUse または定期的に動作し、論理的な区切りで手動コンパクトを提案する
#
# 自動コンパクトではなく手動にする理由:
# - 自動コンパクトは任意のタイミングで起き、タスク途中になることが多い
# - 戦略的コンパクトは論理的なフェーズでコンテキストを維持する
# - 探索後、実行前にコンパクトする
# - マイルストーン完了後、次に進む前にコンパクトする
#
# フック設定 (~/.claude/settings.json):
# {
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "Edit|Write",
#       "hooks": [{
#         "type": "command",
#         "command": "~/.claude/skills/strategic-compact/suggest-compact.sh"
#       }]
#     }]
#   }
# }
#
# コンパクト提案の基準:
# - セッションが長時間継続している
# - ツール呼び出し回数が多い
# - 調査 / 探索から実装に切り替える
# - 計画が確定している

# ツール呼び出し回数を追跡する (一時ファイルでインクリメント)
COUNTER_FILE="/tmp/claude-tool-count-$$"
THRESHOLD=${COMPACT_THRESHOLD:-50}

# カウンターを初期化またはインクリメントする
if [ -f "$COUNTER_FILE" ]; then
  count=$(cat "$COUNTER_FILE")
  count=$((count + 1))
  echo "$count" > "$COUNTER_FILE"
else
  echo "1" > "$COUNTER_FILE"
  count=1
fi

# しきい値に達したらコンパクトを提案する
if [ "$count" -eq "$THRESHOLD" ]; then
  echo "[StrategicCompact] $THRESHOLD tool calls reached - consider /compact if transitioning phases" >&2
fi

# しきい値以降は定期的に提案する
if [ "$count" -gt "$THRESHOLD" ] && [ $((count % 25)) -eq 0 ]; then
  echo "[StrategicCompact] $count tool calls - good checkpoint for /compact if context is stale" >&2
fi
