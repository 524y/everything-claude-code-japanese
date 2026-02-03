/**
 * Claude Code 向けのセッション マネージャー ライブラリ
 * セッションの一覧、読み込み、管理のための中核 CRUD 操作を提供する
 *
 * セッションは ~/.claude/sessions/ に markdown ファイルとして保存され、形式は次の通り:
 * - YYYY-MM-DD-session.tmp（旧形式）
 * - YYYY-MM-DD-<short-id>-session.tmp（新形式）
 */

const fs = require('fs');
const path = require('path');

const {
  getSessionsDir,
  readFile,
  log
} = require('./utils');

// セッション ファイル名のパターン: YYYY-MM-DD-[short-id]-session.tmp
// short-id は任意（旧形式）で、英数字 8 文字以上
// 一致例: "2026-02-01-session.tmp" または "2026-02-01-a1b2c3d4-session.tmp"
const SESSION_FILENAME_REGEX = /^(\d{4}-\d{2}-\d{2})(?:-([a-z0-9]{8,}))?-session\.tmp$/;

/**
 * セッション ファイル名を解析してメタデータを抽出する
 * @param {string} filename - セッション ファイル名（例: "2026-01-17-abc123-session.tmp" または "2026-01-17-session.tmp"）
 * @returns {object|null} 解析済みメタデータ、無効なら null
 */
function parseSessionFilename(filename) {
  const match = filename.match(SESSION_FILENAME_REGEX);
  if (!match) return null;

  const dateStr = match[1];
  // match[2] は旧形式（ID なし）では undefined
  const shortId = match[2] || 'no-id';

  return {
    filename,
    shortId,
    date: dateStr,
    // 日付文字列を Date オブジェクトに変換する
    datetime: new Date(dateStr)
  };
}

/**
 * セッション ファイルのフルパスを取得する
 * @param {string} filename - セッション ファイル名
 * @returns {string} セッション ファイルのフルパス
 */
function getSessionPath(filename) {
  return path.join(getSessionsDir(), filename);
}

/**
 * セッションの markdown 内容を読み込んで解析する
 * @param {string} sessionPath - セッション ファイルのフルパス
 * @returns {string|null} セッション内容、未検出なら null
 */
function getSessionContent(sessionPath) {
  if (!fs.existsSync(sessionPath)) {
    return null;
  }

  return readFile(sessionPath);
}

/**
 * markdown 内容からセッション メタデータを解析する
 * @param {string} content - セッションの markdown 内容
 * @returns {object} 解析済みメタデータ
 */
function parseSessionMetadata(content) {
  const metadata = {
    title: null,
    date: null,
    started: null,
    lastUpdated: null,
    completed: [],
    inProgress: [],
    notes: '',
    context: ''
  };

  if (!content) return metadata;

  // 先頭見出しからタイトルを抽出する
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // 日付を抽出する
  const dateMatch = content.match(/\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    metadata.date = dateMatch[1];
  }

  // 開始時刻を抽出する
  const startedMatch = content.match(/\*\*Started:\*\*\s*([\d:]+)/);
  if (startedMatch) {
    metadata.started = startedMatch[1];
  }

  // 最終更新を抽出する
  const updatedMatch = content.match(/\*\*Last Updated:\*\*\s*([\d:]+)/);
  if (updatedMatch) {
    metadata.lastUpdated = updatedMatch[1];
  }

  // 完了項目を抽出する
  const completedSection = content.match(/### Completed\s*\n([\s\S]*?)(?=###|\n\n|$)/);
  if (completedSection) {
    const items = completedSection[1].match(/- \[x\]\s*(.+)/g);
    if (items) {
      metadata.completed = items.map(item => item.replace(/- \[x\]\s*/, '').trim());
    }
  }

  // 進行中項目を抽出する
  const progressSection = content.match(/### In Progress\s*\n([\s\S]*?)(?=###|\n\n|$)/);
  if (progressSection) {
    const items = progressSection[1].match(/- \[ \]\s*(.+)/g);
    if (items) {
      metadata.inProgress = items.map(item => item.replace(/- \[ \]\s*/, '').trim());
    }
  }

  // メモを抽出する
  const notesSection = content.match(/### Notes for Next Session\s*\n([\s\S]*?)(?=###|\n\n|$)/);
  if (notesSection) {
    metadata.notes = notesSection[1].trim();
  }

  // 読み込むコンテキストを抽出する
  const contextSection = content.match(/### Context to Load\s*\n```\n([\s\S]*?)```/);
  if (contextSection) {
    metadata.context = contextSection[1].trim();
  }

  return metadata;
}

/**
 * セッションの統計情報を計算する
 * @param {string} sessionPath - セッション ファイルのフルパス
 * @returns {object} 統計情報オブジェクト
 */
function getSessionStats(sessionPath) {
  const content = getSessionContent(sessionPath);
  const metadata = parseSessionMetadata(content);

  return {
    totalItems: metadata.completed.length + metadata.inProgress.length,
    completedItems: metadata.completed.length,
    inProgressItems: metadata.inProgress.length,
    lineCount: content ? content.split('\n').length : 0,
    hasNotes: !!metadata.notes,
    hasContext: !!metadata.context
  };
}

/**
 * 任意のフィルタとページネーションでセッションを取得する
 * @param {object} options - オプション オブジェクト
 * @param {number} options.limit - 返すセッションの最大数
 * @param {number} options.offset - スキップするセッション数
 * @param {string} options.date - 日付で絞り込み（YYYY-MM-DD 形式）
 * @param {string} options.search - short ID 内を検索
 * @returns {object} セッション配列とページネーション情報を含むオブジェクト
 */
function getAllSessions(options = {}) {
  const {
    limit = 50,
    offset = 0,
    date = null,
    search = null
  } = options;

  const sessionsDir = getSessionsDir();

  if (!fs.existsSync(sessionsDir)) {
    return { sessions: [], total: 0, offset, limit, hasMore: false };
  }

  const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });
  const sessions = [];

  for (const entry of entries) {
    // ファイル以外はスキップする（.tmp ファイルのみ処理）
    if (!entry.isFile() || !entry.name.endsWith('.tmp')) continue;

    const filename = entry.name;
    const metadata = parseSessionFilename(filename);

    if (!metadata) continue;

    // 日付フィルタを適用する
    if (date && metadata.date !== date) {
      continue;
    }

    // 検索フィルタを適用する（short ID 内を検索）
    if (search && !metadata.shortId.includes(search)) {
      continue;
    }

    const sessionPath = path.join(sessionsDir, filename);

    // ファイルの stats を取得する
    const stats = fs.statSync(sessionPath);

    sessions.push({
      ...metadata,
      sessionPath,
      hasContent: stats.size > 0,
      size: stats.size,
      modifiedTime: stats.mtime,
      createdTime: stats.birthtime
    });
  }

  // 更新時刻でソートする（新しい順）
  sessions.sort((a, b) => b.modifiedTime - a.modifiedTime);

  // ページネーションを適用する
  const paginatedSessions = sessions.slice(offset, offset + limit);

  return {
    sessions: paginatedSessions,
    total: sessions.length,
    offset,
    limit,
    hasMore: offset + limit < sessions.length
  };
}

/**
 * ID で単一セッションを取得する（short ID またはフルパス）
 * @param {string} sessionId - short ID またはセッション ファイル名
 * @param {boolean} includeContent - セッション内容を含める
 * @returns {object|null} セッション オブジェクト、未検出なら null
 */
function getSessionById(sessionId, includeContent = false) {
  const sessionsDir = getSessionsDir();

  if (!fs.existsSync(sessionsDir)) {
    return null;
  }

  const entries = fs.readdirSync(sessionsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.tmp')) continue;

    const filename = entry.name;
    const metadata = parseSessionFilename(filename);

    if (!metadata) continue;

    // セッション ID が一致するか確認する（short ID または .tmp を除いたファイル名）
    const shortIdMatch = metadata.shortId !== 'no-id' && metadata.shortId.startsWith(sessionId);
    const filenameMatch = filename === sessionId || filename === `${sessionId}.tmp`;
    const noIdMatch = metadata.shortId === 'no-id' && filename === `${sessionId}-session.tmp`;

    if (!shortIdMatch && !filenameMatch && !noIdMatch) {
      continue;
    }

    const sessionPath = path.join(sessionsDir, filename);
    const stats = fs.statSync(sessionPath);

    const session = {
      ...metadata,
      sessionPath,
      size: stats.size,
      modifiedTime: stats.mtime,
      createdTime: stats.birthtime
    };

    if (includeContent) {
      session.content = getSessionContent(sessionPath);
      session.metadata = parseSessionMetadata(session.content);
      session.stats = getSessionStats(sessionPath);
    }

    return session;
  }

  return null;
}

/**
 * 内容からセッション タイトルを取得する
 * @param {string} sessionPath - セッション ファイルのフルパス
 * @returns {string} タイトルまたはデフォルト文言
 */
function getSessionTitle(sessionPath) {
  const content = getSessionContent(sessionPath);
  const metadata = parseSessionMetadata(content);

  return metadata.title || 'Untitled Session';
}

/**
 * セッション サイズを可読形式でフォーマットする
 * @param {string} sessionPath - セッション ファイルのフルパス
 * @returns {string} フォーマット済みサイズ（例: "1.2 KB"）
 */
function getSessionSize(sessionPath) {
  if (!fs.existsSync(sessionPath)) {
    return '0 B';
  }

  const stats = fs.statSync(sessionPath);
  const size = stats.size;

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * セッション内容をファイルに書き込む
 * @param {string} sessionPath - セッション ファイルのフルパス
 * @param {string} content - 書き込む markdown 内容
 * @returns {boolean} 成功ステータス
 */
function writeSessionContent(sessionPath, content) {
  try {
    fs.writeFileSync(sessionPath, content, 'utf8');
    return true;
  } catch (err) {
    log(`[SessionManager] Error writing session: ${err.message}`);
    return false;
  }
}

/**
 * セッションに内容を追記する
 * @param {string} sessionPath - セッション ファイルのフルパス
 * @param {string} content - 追記する内容
 * @returns {boolean} 成功ステータス
 */
function appendSessionContent(sessionPath, content) {
  try {
    fs.appendFileSync(sessionPath, content, 'utf8');
    return true;
  } catch (err) {
    log(`[SessionManager] Error appending to session: ${err.message}`);
    return false;
  }
}

/**
 * セッション ファイルを削除する
 * @param {string} sessionPath - セッション ファイルのフルパス
 * @returns {boolean} 成功ステータス
 */
function deleteSession(sessionPath) {
  try {
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
      return true;
    }
    return false;
  } catch (err) {
    log(`[SessionManager] Error deleting session: ${err.message}`);
    return false;
  }
}

/**
 * セッションの存在を確認する
 * @param {string} sessionPath - セッション ファイルのフルパス
 * @returns {boolean} セッションが存在するなら true
 */
function sessionExists(sessionPath) {
  return fs.existsSync(sessionPath) && fs.statSync(sessionPath).isFile();
}

module.exports = {
  parseSessionFilename,
  getSessionPath,
  getSessionContent,
  parseSessionMetadata,
  getSessionStats,
  getSessionTitle,
  getSessionSize,
  getAllSessions,
  getSessionById,
  writeSessionContent,
  appendSessionContent,
  deleteSession,
  sessionExists
};
