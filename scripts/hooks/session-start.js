#!/usr/bin/env node
/**
 * SessionStart フック - 新規セッションで前回のコンテキストを読み込む
 *
 * クロスプラットフォーム (Windows, macOS, Linux)
 *
 * Claude の新規セッション開始時に実行する。最近のセッション
 * ファイルを確認し、利用可能なコンテキストを Claude に通知する。
 */

const {
  getSessionsDir,
  getLearnedSkillsDir,
  findFiles,
  ensureDir,
  log
} = require('../lib/utils');
const { getPackageManager, getSelectionPrompt } = require('../lib/package-manager');
const { listAliases } = require('../lib/session-aliases');

async function main() {
  const sessionsDir = getSessionsDir();
  const learnedDir = getLearnedSkillsDir();

  // ディレクトリを確保する
  ensureDir(sessionsDir);
  ensureDir(learnedDir);

  // 最近のセッションファイルを確認する (過去 7 日)
  // 旧形式 (YYYY-MM-DD-session.tmp) と新形式 (YYYY-MM-DD-shortid-session.tmp) の両方に一致させる
  const recentSessions = findFiles(sessionsDir, '*-session.tmp', { maxAge: 7 });

  if (recentSessions.length > 0) {
    const latest = recentSessions[0];
    log(`[SessionStart] Found ${recentSessions.length} recent session(s)`);
    log(`[SessionStart] Latest: ${latest.path}`);
  }

  // 学習済みスキルを確認する
  const learnedSkills = findFiles(learnedDir, '*.md');

  if (learnedSkills.length > 0) {
    log(`[SessionStart] ${learnedSkills.length} learned skill(s) available in ${learnedDir}`);
  }

  // 利用可能なセッション エイリアスを確認する
  const aliases = listAliases({ limit: 5 });

  if (aliases.length > 0) {
    const aliasNames = aliases.map(a => a.name).join(', ');
    log(`[SessionStart] ${aliases.length} session alias(es) available: ${aliasNames}`);
    log(`[SessionStart] Use /sessions load <alias> to continue a previous session`);
  }

  // パッケージマネージャーを検出して報告する
  const pm = getPackageManager();
  log(`[SessionStart] Package manager: ${pm.name} (${pm.source})`);

  // パッケージマネージャーが fallback で検出された場合は選択プロンプトを表示する
  if (pm.source === 'fallback' || pm.source === 'default') {
    log('[SessionStart] No package manager preference found.');
    log(getSelectionPrompt());
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[SessionStart] Error:', err.message);
  process.exit(0); // エラー時もブロックしない
});
