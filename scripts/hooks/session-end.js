#!/usr/bin/env node
/**
 * Stop フック (セッション終了) - セッション終了時に学びを永続化する
 *
 * クロスプラットフォーム (Windows, macOS, Linux)
 *
 * Claude セッション終了時に実行する。セッションログファイルを作成 / 更新し、
 * 連続性追跡のためにタイムスタンプを付ける。
 */

const path = require('path');
const fs = require('fs');
const {
  getSessionsDir,
  getDateString,
  getTimeString,
  getSessionIdShort,
  ensureDir,
  readFile,
  writeFile,
  replaceInFile,
  log
} = require('../lib/utils');

async function main() {
  const sessionsDir = getSessionsDir();
  const today = getDateString();
  const shortId = getSessionIdShort();
  // セッション ID をファイル名に含め、セッションごとに一意の追跡を行う
  const sessionFile = path.join(sessionsDir, `${today}-${shortId}-session.tmp`);

  ensureDir(sessionsDir);

  const currentTime = getTimeString();

  // 今日のセッションファイルが存在する場合は終了時刻を更新する
  if (fs.existsSync(sessionFile)) {
    const success = replaceInFile(
      sessionFile,
      /\*\*Last Updated:\*\*.*/,
      `**Last Updated:** ${currentTime}`
    );

    if (success) {
      log(`[SessionEnd] Updated session file: ${sessionFile}`);
    }
  } else {
    // テンプレート付きの新規セッションファイルを作成する
    const template = `# Session: ${today}
**Date:** ${today}
**Started:** ${currentTime}
**Last Updated:** ${currentTime}

---

## Current State

[Session context goes here]

### Completed
- [ ]

### In Progress
- [ ]

### Notes for Next Session
-

### Context to Load
\`\`\`
[relevant files]
\`\`\`
`;

    writeFile(sessionFile, template);
    log(`[SessionEnd] Created session file: ${sessionFile}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[SessionEnd] Error:', err.message);
  process.exit(0);
});
