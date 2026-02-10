/**
 * Claude Code 向けのセッション エイリアス ライブラリ
 * ~/.claude/session-aliases.json に保存されたセッション エイリアスを管理する
 */

const fs = require('fs');
const path = require('path');

const {
  getClaudeDir,
  ensureDir,
  readFile,
  log
} = require('./utils');

// エイリアス ファイルのパス
function getAliasesPath() {
  return path.join(getClaudeDir(), 'session-aliases.json');
}

// 現在のエイリアス保存フォーマットのバージョン
const ALIAS_VERSION = '1.0';

/**
 * デフォルトのエイリアス ファイル構造
 */
function getDefaultAliases() {
  return {
    version: ALIAS_VERSION,
    aliases: {},
    metadata: {
      totalCount: 0,
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * ファイルからエイリアスを読み込む
 * @returns {object} エイリアス オブジェクト
 */
function loadAliases() {
  const aliasesPath = getAliasesPath();

  if (!fs.existsSync(aliasesPath)) {
    return getDefaultAliases();
  }

  const content = readFile(aliasesPath);
  if (!content) {
    return getDefaultAliases();
  }

  try {
    const data = JSON.parse(content);

    // 構造を検証する
    if (!data.aliases || typeof data.aliases !== 'object') {
      log('[Aliases] Invalid aliases file structure, resetting');
      return getDefaultAliases();
    }

    // version フィールドを保証する
    if (!data.version) {
      data.version = ALIAS_VERSION;
    }

    // metadata を保証する
    if (!data.metadata) {
      data.metadata = {
        totalCount: Object.keys(data.aliases).length,
        lastUpdated: new Date().toISOString()
      };
    }

    return data;
  } catch (err) {
    log(`[Aliases] Error parsing aliases file: ${err.message}`);
    return getDefaultAliases();
  }
}

/**
 * 原子的書き込みでエイリアスを保存する
 * @param {object} aliases - 保存するエイリアス オブジェクト
 * @returns {boolean} 成功ステータス
 */
function saveAliases(aliases) {
  const aliasesPath = getAliasesPath();
  const tempPath = aliasesPath + '.tmp';
  const backupPath = aliasesPath + '.bak';

  try {
    // metadata を更新する
    aliases.metadata = {
      totalCount: Object.keys(aliases.aliases).length,
      lastUpdated: new Date().toISOString()
    };

    const content = JSON.stringify(aliases, null, 2);

    // ディレクトリの存在を保証する
    ensureDir(path.dirname(aliasesPath));

    // ファイルが存在する場合はバックアップを作成する
    if (fs.existsSync(aliasesPath)) {
      fs.copyFileSync(aliasesPath, backupPath);
    }

    // 原子的書き込み: 一時ファイルに書き込み後、リネームする
    fs.writeFileSync(tempPath, content, 'utf8');

    // Windows ではリネーム前に対象ファイルを削除する必要がある
    if (fs.existsSync(aliasesPath)) {
      fs.unlinkSync(aliasesPath);
    }
    fs.renameSync(tempPath, aliasesPath);

    // 成功時はバックアップを削除する
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }

    return true;
  } catch (err) {
    log(`[Aliases] Error saving aliases: ${err.message}`);

    // バックアップがあれば復元する
    if (fs.existsSync(backupPath)) {
      try {
        fs.copyFileSync(backupPath, aliasesPath);
        log('[Aliases] Restored from backup');
      } catch (restoreErr) {
        log(`[Aliases] Failed to restore backup: ${restoreErr.message}`);
      }
    }

    // 一時ファイルをクリーンアップする
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    return false;
  }
}

/**
 * エイリアスを解決してセッション パスを取得する
 * @param {string} alias - 解決するエイリアス名
 * @returns {object|null} エイリアス データ、未検出なら null
 */
function resolveAlias(alias) {
  // エイリアス名を検証する（英数字、ダッシュ、アンダースコア）
  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    return null;
  }

  const data = loadAliases();
  const aliasData = data.aliases[alias];

  if (!aliasData) {
    return null;
  }

  return {
    alias,
    sessionPath: aliasData.sessionPath,
    createdAt: aliasData.createdAt,
    title: aliasData.title || null
  };
}

/**
 * セッションのエイリアスを設定または更新する
 * @param {string} alias - エイリアス名（英数字、ダッシュ、アンダースコア）
 * @param {string} sessionPath - セッション ディレクトリ パス
 * @param {string} title - エイリアスの任意タイトル
 * @returns {object} 成否ステータスとメッセージを含む結果
 */
function setAlias(alias, sessionPath, title = null) {
  // エイリアス名を検証する
  if (!alias || alias.length === 0) {
    return { success: false, error: 'Alias name cannot be empty' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
    return { success: false, error: 'Alias name must contain only letters, numbers, dashes, and underscores' };
  }

  // 予約済みのエイリアス名
  const reserved = ['list', 'help', 'remove', 'delete', 'create', 'set'];
  if (reserved.includes(alias.toLowerCase())) {
    return { success: false, error: `'${alias}' is a reserved alias name` };
  }

  const data = loadAliases();
  const existing = data.aliases[alias];
  const isNew = !existing;

  data.aliases[alias] = {
    sessionPath,
    createdAt: existing ? existing.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: title || null
  };

  if (saveAliases(data)) {
    return {
      success: true,
      isNew,
      alias,
      sessionPath,
      title: data.aliases[alias].title
    };
  }

  return { success: false, error: 'Failed to save alias' };
}

/**
 * すべてのエイリアスを一覧表示する
 * @param {object} options - オプション オブジェクト
 * @param {string} options.search - エイリアス名で絞り込み（部分一致）
 * @param {number} options.limit - 返すエイリアスの最大数
 * @returns {Array} エイリアス オブジェクト配列
 */
function listAliases(options = {}) {
  const { search = null, limit = null } = options;
  const data = loadAliases();

  let aliases = Object.entries(data.aliases).map(([name, info]) => ({
    name,
    sessionPath: info.sessionPath,
    createdAt: info.createdAt,
    updatedAt: info.updatedAt,
    title: info.title
  }));

  // 更新時刻でソートする（新しい順）
  aliases.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  // 検索フィルタを適用する
  if (search) {
    const searchLower = search.toLowerCase();
    aliases = aliases.filter(a =>
      a.name.toLowerCase().includes(searchLower) ||
      (a.title && a.title.toLowerCase().includes(searchLower))
    );
  }

  // 件数制限を適用する
  if (limit && limit > 0) {
    aliases = aliases.slice(0, limit);
  }

  return aliases;
}

/**
 * エイリアスを削除する
 * @param {string} alias - 削除するエイリアス名
 * @returns {object} 成否ステータスを含む結果
 */
function deleteAlias(alias) {
  const data = loadAliases();

  if (!data.aliases[alias]) {
    return { success: false, error: `Alias '${alias}' not found` };
  }

  const deleted = data.aliases[alias];
  delete data.aliases[alias];

  if (saveAliases(data)) {
    return {
      success: true,
      alias,
      deletedSessionPath: deleted.sessionPath
    };
  }

  return { success: false, error: 'Failed to delete alias' };
}

/**
 * エイリアス名を変更する
 * @param {string} oldAlias - 現在のエイリアス名
 * @param {string} newAlias - 新しいエイリアス名
 * @returns {object} 成否ステータスを含む結果
 */
function renameAlias(oldAlias, newAlias) {
  const data = loadAliases();

  if (!data.aliases[oldAlias]) {
    return { success: false, error: `Alias '${oldAlias}' not found` };
  }

  if (data.aliases[newAlias]) {
    return { success: false, error: `Alias '${newAlias}' already exists` };
  }

  // 新しいエイリアス名を検証する
  if (!/^[a-zA-Z0-9_-]+$/.test(newAlias)) {
    return { success: false, error: 'New alias name must contain only letters, numbers, dashes, and underscores' };
  }

  const aliasData = data.aliases[oldAlias];
  delete data.aliases[oldAlias];

  aliasData.updatedAt = new Date().toISOString();
  data.aliases[newAlias] = aliasData;

  if (saveAliases(data)) {
    return {
      success: true,
      oldAlias,
      newAlias,
      sessionPath: aliasData.sessionPath
    };
  }

  // 失敗時は古いエイリアスを復元する
  data.aliases[oldAlias] = aliasData;
  return { success: false, error: 'Failed to rename alias' };
}

/**
 * エイリアスからセッション パスを取得する（利便関数）
 * @param {string} aliasOrId - エイリアス名またはセッション ID
 * @returns {string|null} セッション パス、未検出なら null
 */
function resolveSessionAlias(aliasOrId) {
  // まずエイリアスとして解決する
  const resolved = resolveAlias(aliasOrId);
  if (resolved) {
    return resolved.sessionPath;
  }

  // エイリアスでなければ、そのまま返す（セッション パスの可能性がある）
  return aliasOrId;
}

/**
 * エイリアス タイトルを更新する
 * @param {string} alias - エイリアス名
 * @param {string} title - 新しいタイトル
 * @returns {object} 成否ステータスを含む結果
 */
function updateAliasTitle(alias, title) {
  const data = loadAliases();

  if (!data.aliases[alias]) {
    return { success: false, error: `Alias '${alias}' not found` };
  }

  data.aliases[alias].title = title;
  data.aliases[alias].updatedAt = new Date().toISOString();

  if (saveAliases(data)) {
    return {
      success: true,
      alias,
      title
    };
  }

  return { success: false, error: 'Failed to update alias title' };
}

/**
 * 特定セッションに紐づくエイリアスを取得する
 * @param {string} sessionPath - エイリアスを探す対象セッション パス
 * @returns {Array} エイリアス名の配列
 */
function getAliasesForSession(sessionPath) {
  const data = loadAliases();
  const aliases = [];

  for (const [name, info] of Object.entries(data.aliases)) {
    if (info.sessionPath === sessionPath) {
      aliases.push({
        name,
        createdAt: info.createdAt,
        title: info.title
      });
    }
  }

  return aliases;
}

/**
 * 存在しないセッションのエイリアスをクリーンアップする
 * @param {Function} sessionExists - セッション存在を判定する関数
 * @returns {object} クリーンアップ結果
 */
function cleanupAliases(sessionExists) {
  const data = loadAliases();
  const removed = [];

  for (const [name, info] of Object.entries(data.aliases)) {
    if (!sessionExists(info.sessionPath)) {
      removed.push({ name, sessionPath: info.sessionPath });
      delete data.aliases[name];
    }
  }

  if (removed.length > 0) {
    saveAliases(data);
  }

  return {
    totalChecked: Object.keys(data.aliases).length + removed.length,
    removed: removed.length,
    removedAliases: removed
  };
}

module.exports = {
  getAliasesPath,
  loadAliases,
  saveAliases,
  resolveAlias,
  setAlias,
  listAliases,
  deleteAlias,
  renameAlias,
  resolveSessionAlias,
  updateAliasTitle,
  getAliasesForSession,
  cleanupAliases
};
