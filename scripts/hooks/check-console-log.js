#!/usr/bin/env node

/**
 * Stop フック: 変更済みファイル内の console.log 文をチェックする
 * 
 * このフックは各レスポンス後に実行され、変更済みの
 * JavaScript / TypeScript ファイルに console.log 文が含まれるか確認する。
 * コミット前にデバッグ文を削除することを
 * 開発者に思い出させるための警告を提供する。
 */

const { execSync } = require('child_process');
const fs = require('fs');

let data = '';

// stdin を読む
process.stdin.on('data', chunk => {
  data += chunk;
});

process.stdin.on('end', () => {
  try {
    // git リポジトリ内かを確認する
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch {
      // git リポジトリでない場合はデータをそのまま通す
      console.log(data);
      process.exit(0);
    }

    // 変更済みファイルの一覧を取得する
    const files = execSync('git diff --name-only HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
      .split('\n')
      .filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && fs.existsSync(f));

    let hasConsole = false;

    // 各ファイルの console.log を確認する
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('console.log')) {
        console.error(`[Hook] WARNING: console.log found in ${file}`);
        hasConsole = true;
      }
    }

    if (hasConsole) {
      console.error('[Hook] Remove console.log statements before committing');
    }
  } catch (error) {
    // エラーは黙って無視する (git が利用できないなど)
  }

  // いつでも元のデータを出力する
  console.log(data);
});
