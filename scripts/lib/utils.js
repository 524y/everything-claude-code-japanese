/**
 * Claude Code のフックとスクリプト向けクロスプラットフォームユーティリティ
 * Windows, macOS, Linux で動作する
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

// プラットフォーム検出
const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

/**
 * ユーザーのホームディレクトリを取得する (クロスプラットフォーム)
 */
function getHomeDir() {
  return os.homedir();
}

/**
 * Claude の設定ディレクトリを取得する
 */
function getClaudeDir() {
  return path.join(getHomeDir(), '.claude');
}

/**
 * セッションディレクトリを取得する
 */
function getSessionsDir() {
  return path.join(getClaudeDir(), 'sessions');
}

/**
 * セッション エイリアスのファイルパスを取得する
 */
function getAliasesPath() {
  return path.join(getClaudeDir(), 'session-aliases.json');
}

/**
 * 学習済みスキルのディレクトリを取得する
 */
function getLearnedSkillsDir() {
  return path.join(getClaudeDir(), 'skills', 'learned');
}

/**
 * temp ディレクトリを取得する (クロスプラットフォーム)
 */
function getTempDir() {
  return os.tmpdir();
}

/**
 * ディレクトリの存在を保証する (なければ作成)
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

/**
 * 現在日付を YYYY-MM-DD 形式で取得する
 */
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 現在時刻を HH:MM 形式で取得する
 */
function getTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * git リポジトリ名を取得する
 */
function getGitRepoName() {
  const result = runCommand('git rev-parse --show-toplevel');
  if (!result.success) return null;
  return path.basename(result.output);
}

/**
 * git リポジトリまたはカレントディレクトリからプロジェクト名を取得する
 */
function getProjectName() {
  const repoName = getGitRepoName();
  if (repoName) return repoName;
  return path.basename(process.cwd()) || null;
}

/**
 * CLAUDE_SESSION_ID 環境変数から短いセッション ID を取得する
 * 末尾 8 文字を返し、未設定ならプロジェクト名、最後に 'default' へフォールバックする
 */
function getSessionIdShort(fallback = 'default') {
  const sessionId = process.env.CLAUDE_SESSION_ID;
  if (sessionId && sessionId.length > 0) {
    return sessionId.slice(-8);
  }
  return getProjectName() || fallback;
}

/**
 * 現在日時を YYYY-MM-DD HH:MM:SS 形式で取得する
 */
function getDateTimeString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * ディレクトリ内のパターン一致ファイルを探す (find のクロスプラットフォーム代替)
 * @param {string} dir - 検索するディレクトリ
 * @param {string} pattern - ファイルパターン (例: "*.tmp", "*.md")
 * @param {object} options - オプション { maxAge: days, recursive: boolean }
 */
function findFiles(dir, pattern, options = {}) {
  const { maxAge = null, recursive = false } = options;
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`);

  function searchDir(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isFile() && regex.test(entry.name)) {
          if (maxAge !== null) {
            const stats = fs.statSync(fullPath);
            const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
            if (ageInDays <= maxAge) {
              results.push({ path: fullPath, mtime: stats.mtimeMs });
            }
          } else {
            const stats = fs.statSync(fullPath);
            results.push({ path: fullPath, mtime: stats.mtimeMs });
          }
        } else if (entry.isDirectory() && recursive) {
          searchDir(fullPath);
        }
      }
    } catch (err) {
      // 権限エラーは無視する
    }
  }

  searchDir(dir);

  // 更新時刻でソートする (新しい順)
  results.sort((a, b) => b.mtime - a.mtime);

  return results;
}

/**
 * stdin から JSON を読み込む (フック入力用)
 */
async function readStdinJson() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        if (data.trim()) {
          resolve(JSON.parse(data));
        } else {
          resolve({});
        }
      } catch (err) {
        reject(err);
      }
    });

    process.stdin.on('error', reject);
  });
}

/**
 * stderr へログ出力する (Claude Code でユーザーに見える)
 */
function log(message) {
  console.error(message);
}

/**
 * stdout へ出力する (Claude に返る)
 */
function output(data) {
  if (typeof data === 'object') {
    console.log(JSON.stringify(data));
  } else {
    console.log(data);
  }
}

/**
 * テキストファイルを安全に読む
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * テキストファイルを書く
 */
function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * テキストファイルに追記する
 */
function appendFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, content, 'utf8');
}

/**
 * コマンドが PATH に存在するか確認する
 * コマンドインジェクション防止のため execFileSync を使う
 */
function commandExists(cmd) {
  // コマンド名を検証する - 英数字、ハイフン、アンダースコア、ドットのみ許可
  if (!/^[a-zA-Z0-9_.-]+$/.test(cmd)) {
    return false;
  }

  try {
    if (isWindows) {
      // シェル補間を避けるために spawnSync を使う
      const result = spawnSync('where', [cmd], { stdio: 'pipe' });
      return result.status === 0;
    } else {
      const result = spawnSync('which', [cmd], { stdio: 'pipe' });
      return result.status === 0;
    }
  } catch {
    return false;
  }
}

/**
 * コマンドを実行して出力を返す
 *
 * セキュリティ注記: この関数はシェルコマンドを実行する。信頼できる
 * ハードコードされたコマンドのみ使う。ユーザー入力を直接渡さない。
 * ユーザー入力には引数配列付きの spawnSync を使う。
 *
 * @param {string} cmd - 実行するコマンド (信頼済み / ハードコード済み)
 * @param {object} options - execSync オプション
 */
function runCommand(cmd, options = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return { success: false, output: err.stderr || err.message };
  }
}

/**
 * 現在のディレクトリが git リポジトリか確認する
 */
function isGitRepo() {
  return runCommand('git rev-parse --git-dir').success;
}

/**
 * git の変更済みファイルを取得する
 */
function getGitModifiedFiles(patterns = []) {
  if (!isGitRepo()) return [];

  const result = runCommand('git diff --name-only HEAD');
  if (!result.success) return [];

  let files = result.output.split('\n').filter(Boolean);

  if (patterns.length > 0) {
    files = files.filter(file => {
      return patterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(file);
      });
    });
  }

  return files;
}

/**
 * ファイル内のテキストを置換する (クロスプラットフォーム sed 代替)
 */
function replaceInFile(filePath, search, replace) {
  const content = readFile(filePath);
  if (content === null) return false;

  const newContent = content.replace(search, replace);
  writeFile(filePath, newContent);
  return true;
}

/**
 * ファイル内のパターン出現回数を数える
 */
function countInFile(filePath, pattern) {
  const content = readFile(filePath);
  if (content === null) return 0;

  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

/**
 * ファイル内のパターンを検索し、行番号付きで一致行を返す
 */
function grepFile(filePath, pattern) {
  const content = readFile(filePath);
  if (content === null) return [];

  const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
  const lines = content.split('\n');
  const results = [];

  lines.forEach((line, index) => {
    if (regex.test(line)) {
      results.push({ lineNumber: index + 1, content: line });
    }
  });

  return results;
}

module.exports = {
  // プラットフォーム情報
  isWindows,
  isMacOS,
  isLinux,

  // ディレクトリ
  getHomeDir,
  getClaudeDir,
  getSessionsDir,
  getAliasesPath,
  getLearnedSkillsDir,
  getTempDir,
  ensureDir,

  // 日付 / 時刻
  getDateString,
  getTimeString,
  getDateTimeString,

  // セッション / プロジェクト
  getSessionIdShort,
  getGitRepoName,
  getProjectName,

  // ファイル操作
  findFiles,
  readFile,
  writeFile,
  appendFile,
  replaceInFile,
  countInFile,
  grepFile,

  // フック I/O
  readStdinJson,
  log,
  output,

  // システム
  commandExists,
  runCommand,
  isGitRepo,
  getGitModifiedFiles
};
