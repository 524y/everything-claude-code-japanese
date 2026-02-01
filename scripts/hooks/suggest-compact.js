#!/usr/bin/env node
/**
 * Strategic Compact 提案
 *
 * クロスプラットフォーム (Windows, macOS, Linux)
 *
 * PreToolUse または定期的に実行し、適切なタイミングで手動の圧縮を提案する
 *
 * 自動圧縮より手動を推奨する理由:
 * - 自動圧縮は任意のタイミングで行われ、タスクの途中になりがち
 * - 戦略的な圧縮は論理的なフェーズを通してコンテキストを保持できる
 * - 探索の後、実行の前に圧縮する
 * - マイルストーンを完了した後、次を始める前に圧縮する
 */

const path = require('path');
const fs = require('fs');
const {
  getTempDir,
  readFile,
  writeFile,
  log
} = require('../lib/utils');

async function main() {
  // ツール呼び出し回数を追跡する (temp ファイルでインクリメント)
  // 親プロセスの PID か環境変数のセッション ID に基づくセッション固有カウンターファイルを使う
  const sessionId = process.env.CLAUDE_SESSION_ID || process.ppid || 'default';
  const counterFile = path.join(getTempDir(), `claude-tool-count-${sessionId}`);
  const threshold = parseInt(process.env.COMPACT_THRESHOLD || '50', 10);

  let count = 1;

  // 既存のカウントを読むか、1 から開始する
  const existing = readFile(counterFile);
  if (existing) {
    count = parseInt(existing.trim(), 10) + 1;
  }

  // 更新したカウントを保存する
  writeFile(counterFile, String(count));

  // 閾値のツール呼び出し後に圧縮を提案する
  if (count === threshold) {
    log(`[StrategicCompact] ${threshold} tool calls reached - consider /compact if transitioning phases`);
  }

  // 閾値以降は一定間隔で提案する
  if (count > threshold && count % 25 === 0) {
    log(`[StrategicCompact] ${count} tool calls - good checkpoint for /compact if context is stale`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[StrategicCompact] Error:', err.message);
  process.exit(0);
});
