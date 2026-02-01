#!/usr/bin/env node
/**
 * PreCompact フック - コンテキスト圧縮前に状態を保存する
 *
 * クロスプラットフォーム (Windows, macOS, Linux)
 *
 * Claude がコンテキストを圧縮する前に実行し、
 * 要約で失われる可能性のある重要な状態を
 * 保存する機会を提供する。
 */

const path = require('path');
const {
  getSessionsDir,
  getDateTimeString,
  getTimeString,
  findFiles,
  ensureDir,
  appendFile,
  log
} = require('../lib/utils');

async function main() {
  const sessionsDir = getSessionsDir();
  const compactionLog = path.join(sessionsDir, 'compaction-log.txt');

  ensureDir(sessionsDir);

  // タイムスタンプ付きで圧縮イベントを記録する
  const timestamp = getDateTimeString();
  appendFile(compactionLog, `[${timestamp}] Context compaction triggered\n`);

  // アクティブなセッションファイルがあれば圧縮を記録する
  const sessions = findFiles(sessionsDir, '*.tmp');

  if (sessions.length > 0) {
    const activeSession = sessions[0].path;
    const timeStr = getTimeString();
    appendFile(activeSession, `\n---\n**[Compaction occurred at ${timeStr}]** - Context was summarized\n`);
  }

  log('[PreCompact] State saved before compaction');
  process.exit(0);
}

main().catch(err => {
  console.error('[PreCompact] Error:', err.message);
  process.exit(0);
});
