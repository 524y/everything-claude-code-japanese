#!/bin/bash
# Continuous Learning v2 - Observer エージェント起動
#
# 観測を分析して instinct を作成する
# バックグラウンド observer エージェントを起動する。コスト効率のため Haiku を使う。
#
# 使用方法:
#   start-observer.sh        # バックグラウンドで observer を開始
#   start-observer.sh stop   # 実行中の observer を停止
#   start-observer.sh status # observer が動作中か確認

set -e

CONFIG_DIR="${HOME}/.claude/homunculus"
PID_FILE="${CONFIG_DIR}/.observer.pid"
LOG_FILE="${CONFIG_DIR}/observer.log"
OBSERVATIONS_FILE="${CONFIG_DIR}/observations.jsonl"

mkdir -p "$CONFIG_DIR"

case "${1:-start}" in
  stop)
    if [ -f "$PID_FILE" ]; then
      pid=$(cat "$PID_FILE")
      if kill -0 "$pid" 2>/dev/null; then
        echo "Stopping observer (PID: $pid)..."
        kill "$pid"
        rm -f "$PID_FILE"
        echo "Observer stopped."
      else
        echo "Observer not running (stale PID file)."
        rm -f "$PID_FILE"
      fi
    else
      echo "Observer not running."
    fi
    exit 0
    ;;

  status)
    if [ -f "$PID_FILE" ]; then
      pid=$(cat "$PID_FILE")
      if kill -0 "$pid" 2>/dev/null; then
        echo "Observer is running (PID: $pid)"
        echo "Log: $LOG_FILE"
        echo "Observations: $(wc -l < "$OBSERVATIONS_FILE" 2>/dev/null || echo 0) lines"
        exit 0
      else
        echo "Observer not running (stale PID file)"
        rm -f "$PID_FILE"
        exit 1
      fi
    else
      echo "Observer not running"
      exit 1
    fi
    ;;

  start)
    # すでに実行中か確認する
    if [ -f "$PID_FILE" ]; then
      pid=$(cat "$PID_FILE")
      if kill -0 "$pid" 2>/dev/null; then
        echo "Observer already running (PID: $pid)"
        exit 0
      fi
      rm -f "$PID_FILE"
    fi

    echo "Starting observer agent..."

    # observer ループ
    (
      trap 'rm -f "$PID_FILE"; exit 0' TERM INT

      analyze_observations() {
        # 観測数が十分な場合のみ分析する
        obs_count=$(wc -l < "$OBSERVATIONS_FILE" 2>/dev/null || echo 0)
        if [ "$obs_count" -lt 10 ]; then
          return
        fi

        echo "[$(date)] Analyzing $obs_count observations..." >> "$LOG_FILE"

        # Claude Code と Haiku で観測を分析する
        # すばやい分析セッションを起動する
        if command -v claude &> /dev/null; then
          claude --model haiku --max-turns 3 --print \
            "Read $OBSERVATIONS_FILE and identify patterns. If you find 3+ occurrences of the same pattern, create an instinct file in $CONFIG_DIR/instincts/personal/ following the format in the observer agent spec. Be conservative - only create instincts for clear patterns." \
            >> "$LOG_FILE" 2>&1 || true
        fi

        # 処理済みの観測をアーカイブする
        if [ -f "$OBSERVATIONS_FILE" ]; then
          archive_dir="${CONFIG_DIR}/observations.archive"
          mkdir -p "$archive_dir"
          mv "$OBSERVATIONS_FILE" "$archive_dir/processed-$(date +%Y%m%d-%H%M%S).jsonl"
          touch "$OBSERVATIONS_FILE"
        fi
      }

      # SIGUSR1 でオンデマンド分析を実行する
      trap 'analyze_observations' USR1

      echo "$$" > "$PID_FILE"
      echo "[$(date)] Observer started (PID: $$)" >> "$LOG_FILE"

      while true; do
        # 5 分ごとに確認する
        sleep 300

        analyze_observations
      done
    ) &

    disown

    # PID ファイルの作成を少し待つ
    sleep 1

    if [ -f "$PID_FILE" ]; then
      echo "Observer started (PID: $(cat "$PID_FILE"))"
      echo "Log: $LOG_FILE"
    else
      echo "Failed to start observer"
      exit 1
    fi
    ;;

  *)
    echo "Usage: $0 {start|stop|status}"
    exit 1
    ;;
esac
