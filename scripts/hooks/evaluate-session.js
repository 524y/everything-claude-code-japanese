#!/usr/bin/env node
/**
 * Continuous Learning - セッション評価
 *
 * クロスプラットフォーム (Windows, macOS, Linux)
 *
 * Stop フックで実行し、Claude Code セッションから再利用可能なパターンを抽出する
 *
 * UserPromptSubmit ではなく Stop フックを使う理由:
 * - Stop はセッション終了時に 1 回だけ実行される (軽量)
 * - UserPromptSubmit は各メッセージで実行される (重く、遅延が増える)
 */

const path = require('path');
const fs = require('fs');
const {
  getLearnedSkillsDir,
  ensureDir,
  readFile,
  countInFile,
  log
} = require('../lib/utils');

async function main() {
  // スクリプトディレクトリを取得して設定を見つける
  const scriptDir = __dirname;
  const configFile = path.join(scriptDir, '..', '..', 'skills', 'continuous-learning', 'config.json');

  // デフォルト設定
  let minSessionLength = 10;
  let learnedSkillsPath = getLearnedSkillsDir();

  // 設定が存在すれば読み込む
  const configContent = readFile(configFile);
  if (configContent) {
    try {
      const config = JSON.parse(configContent);
      minSessionLength = config.min_session_length || 10;

      if (config.learned_skills_path) {
        // パス内の ~ を処理する
        learnedSkillsPath = config.learned_skills_path.replace(/^~/, require('os').homedir());
      }
    } catch {
      // 無効な設定はデフォルトを使う
    }
  }

  // 学習済みスキルのディレクトリを確保する
  ensureDir(learnedSkillsPath);

  // 環境変数から transcript のパスを取得する (Claude Code が設定する)
  const transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  // セッション内のユーザーメッセージ数を数える
  const messageCount = countInFile(transcriptPath, /"type":"user"/g);

  // 短いセッションはスキップする
  if (messageCount < minSessionLength) {
    log(`[ContinuousLearning] Session too short (${messageCount} messages), skipping`);
    process.exit(0);
  }

  // 抽出可能なパターンの評価対象として Claude に通知する
  log(`[ContinuousLearning] Session has ${messageCount} messages - evaluate for extractable patterns`);
  log(`[ContinuousLearning] Save learned skills to: ${learnedSkillsPath}`);

  process.exit(0);
}

main().catch(err => {
  console.error('[ContinuousLearning] Error:', err.message);
  process.exit(0);
});
