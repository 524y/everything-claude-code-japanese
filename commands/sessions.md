# Sessions コマンド

Claude Code のセッション履歴を管理する。`~/.claude/sessions/` に保存されたセッションを一覧、読み込み、エイリアス、編集する。

## 使用方法

`/sessions [list|load|alias|info|help] [options]`

## アクション

### セッション一覧

メタデータ、フィルタリング、ページネーション付きで全セッションを表示する。

```bash
/sessions                              # すべてのセッションを一覧表示（デフォルト）
/sessions list                         # 上と同じ
/sessions list --limit 10              # 10 件を表示
/sessions list --date 2026-02-01       # 日付で絞り込み
/sessions list --search abc            # セッション ID を検索
```

**スクリプト:**
```bash
node -e "
const sm = require('./scripts/lib/session-manager');
const aa = require('./scripts/lib/session-aliases');

const result = sm.getAllSessions({ limit: 20 });
const aliases = aa.listAliases();
const aliasMap = {};
for (const a of aliases) aliasMap[a.sessionPath] = a.name;

console.log('セッション（' + result.sessions.length + ' / ' + result.total + ' 件を表示）:');
console.log('');
console.log('ID        日付        時刻     サイズ   行数  エイリアス');
console.log('────────────────────────────────────────────────────');

for (const s of result.sessions) {
  const alias = aliasMap[s.filename] || '';
  const size = sm.getSessionSize(s.sessionPath);
  const stats = sm.getSessionStats(s.sessionPath);
  const id = s.shortId === 'no-id' ? '(なし)' : s.shortId.slice(0, 8);
  const time = s.modifiedTime.toTimeString().slice(0, 5);

  console.log(id.padEnd(8) + ' ' + s.date + '  ' + time + '   ' + size.padEnd(7) + '  ' + String(stats.lineCount).padEnd(5) + '  ' + alias);
}
"
```

### セッション読み込み

セッション内容を読み込んで表示する（ID またはエイリアス）。

```bash
/sessions load <id|alias>             # セッションを読み込む
/sessions load 2026-02-01             # 日付で指定（no-id セッション向け）
/sessions load a1b2c3d4               # short ID で指定
/sessions load my-alias               # エイリアス名で指定
```

**スクリプト:**
```bash
node -e "
const sm = require('./scripts/lib/session-manager');
const aa = require('./scripts/lib/session-aliases');
const id = process.argv[1];

// まずエイリアスとして解決する
const resolved = aa.resolveAlias(id);
const sessionId = resolved ? resolved.sessionPath : id;

const session = sm.getSessionById(sessionId, true);
if (!session) {
  console.log('セッションが見つかりません: ' + id);
  process.exit(1);
}

const stats = sm.getSessionStats(session.sessionPath);
const size = sm.getSessionSize(session.sessionPath);
const aliases = aa.getAliasesForSession(session.filename);

console.log('セッション: ' + session.filename);
console.log('パス: ~/.claude/sessions/' + session.filename);
console.log('');
console.log('統計:');
console.log('  行数: ' + stats.lineCount);
console.log('  総項目数: ' + stats.totalItems);
console.log('  完了: ' + stats.completedItems);
console.log('  進行中: ' + stats.inProgressItems);
console.log('  サイズ: ' + size);
console.log('');

if (aliases.length > 0) {
  console.log('エイリアス: ' + aliases.map(a => a.name).join(', '));
  console.log('');
}

if (session.metadata.title) {
  console.log('タイトル: ' + session.metadata.title);
  console.log('');
}

if (session.metadata.started) {
  console.log('開始: ' + session.metadata.started);
}

if (session.metadata.lastUpdated) {
  console.log('最終更新: ' + session.metadata.lastUpdated);
}
" "$ARGUMENTS"
```

### エイリアス作成

セッションに覚えやすいエイリアスを作成する。

```bash
/sessions alias <id> <name>           # エイリアスを作成
/sessions alias 2026-02-01 today-work # "today-work" というエイリアスを作成
```

**スクリプト:**
```bash
node -e "
const sm = require('./scripts/lib/session-manager');
const aa = require('./scripts/lib/session-aliases');

const sessionId = process.argv[1];
const aliasName = process.argv[2];

if (!sessionId || !aliasName) {
  console.log('使い方: /sessions alias <id> <name>');
  process.exit(1);
}

// セッション ファイル名を取得する
const session = sm.getSessionById(sessionId);
if (!session) {
  console.log('セッションが見つかりません: ' + sessionId);
  process.exit(1);
}

const result = aa.setAlias(aliasName, session.filename);
if (result.success) {
  console.log('✓ エイリアスを作成: ' + aliasName + ' → ' + session.filename);
} else {
  console.log('✗ エラー: ' + result.error);
  process.exit(1);
}
" "$ARGUMENTS"
```

### エイリアス削除

既存のエイリアスを削除する。

```bash
/sessions alias --remove <name>        # エイリアスを削除
/sessions unalias <name>               # 上と同じ
```

**スクリプト:**
```bash
node -e "
const aa = require('./scripts/lib/session-aliases');

const aliasName = process.argv[1];
if (!aliasName) {
  console.log('使い方: /sessions alias --remove <name>');
  process.exit(1);
}

const result = aa.deleteAlias(aliasName);
if (result.success) {
  console.log('✓ エイリアスを削除: ' + aliasName);
} else {
  console.log('✗ エラー: ' + result.error);
  process.exit(1);
}
" "$ARGUMENTS"
```

### セッション情報

セッションの詳細情報を表示する。

```bash
/sessions info <id|alias>              # セッション詳細を表示
```

**スクリプト:**
```bash
node -e "
const sm = require('./scripts/lib/session-manager');
const aa = require('./scripts/lib/session-aliases');

const id = process.argv[1];
const resolved = aa.resolveAlias(id);
const sessionId = resolved ? resolved.sessionPath : id;

const session = sm.getSessionById(sessionId, true);
if (!session) {
  console.log('セッションが見つかりません: ' + id);
  process.exit(1);
}

const stats = sm.getSessionStats(session.sessionPath);
const size = sm.getSessionSize(session.sessionPath);
const aliases = aa.getAliasesForSession(session.filename);

console.log('セッション情報');
console.log('════════════════════');
console.log('ID:          ' + (session.shortId === 'no-id' ? '(なし)' : session.shortId));
console.log('ファイル名:  ' + session.filename);
console.log('日付:        ' + session.date);
console.log('更新:        ' + session.modifiedTime.toISOString().slice(0, 19).replace('T', ' '));
console.log('');
console.log('内容:');
console.log('  行数:         ' + stats.lineCount);
console.log('  総項目数:     ' + stats.totalItems);
console.log('  完了:         ' + stats.completedItems);
console.log('  進行中:       ' + stats.inProgressItems);
console.log('  サイズ:       ' + size);
if (aliases.length > 0) {
  console.log('エイリアス:   ' + aliases.map(a => a.name).join(', '));
}
" "$ARGUMENTS"
```

### エイリアス一覧

すべてのセッション エイリアスを表示する。

```bash
/sessions aliases                      # すべてのエイリアスを一覧表示
```

**スクリプト:**
```bash
node -e "
const aa = require('./scripts/lib/session-aliases');

const aliases = aa.listAliases();
console.log('セッション エイリアス (' + aliases.length + '):');
console.log('');

if (aliases.length === 0) {
  console.log('エイリアスは見つかりません。');
} else {
  console.log('名前          セッション ファイル                    タイトル');
  console.log('─────────────────────────────────────────────────────────────');
  for (const a of aliases) {
    const name = a.name.padEnd(12);
    const file = (a.sessionPath.length > 30 ? a.sessionPath.slice(0, 27) + '...' : a.sessionPath).padEnd(30);
    const title = a.title || '';
    console.log(name + ' ' + file + ' ' + title);
  }
}
"
```

## 引数

$ARGUMENTS:
- `list [options]` - セッションを一覧表示する
- `--limit <n>` - 表示する最大件数（デフォルト: 50）
- `--date <YYYY-MM-DD>` - 日付で絞り込み
- `--search <pattern>` - セッション ID 内を検索
- `load <id|alias>` - セッション内容を読み込む
- `alias <id> <name>` - セッションのエイリアスを作成する
- `alias --remove <name>` - エイリアスを削除する
- `unalias <name>` - `--remove` と同じ
- `info <id|alias>` - セッション統計を表示する
- `aliases` - すべてのエイリアスを一覧表示する
- `help` - このヘルプを表示する

## 例

```bash
# すべてのセッションを一覧表示
/sessions list

# 今日のセッションにエイリアスを作成
/sessions alias 2026-02-01 today

# エイリアスでセッションを読み込む
/sessions load today

# セッション情報を表示
/sessions info today

# エイリアスを削除
/sessions alias --remove today

# すべてのエイリアスを一覧表示
/sessions aliases
```

## 注意

- セッションは `~/.claude/sessions/` に markdown ファイルとして保存される
- エイリアスは `~/.claude/session-aliases.json` に保存される
- セッション ID は短縮できる（先頭 4-8 文字で通常は十分にユニーク）
- 頻繁に参照するセッションにはエイリアスを使う
