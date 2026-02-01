# Everything Claude Code ショートフォームガイド

![Header: Anthropic Hackathon Winner - Tips & Tricks for Claude Code](./assets/images/shortform/00-header.png)

---

**2 月の実験的ローンチ以来 Claude Code を熱心に使い続け、[@DRodriguezFX](https://x.com/DRodriguezFX) と共に [zenith.chat](https://zenith.chat) で Anthropic x Forum Ventures ハッカソンを優勝した。Claude Code だけで完走した。**

10 か月の日次利用を経て辿り着いたセットアップを共有する。スキル、フック、サブエージェント、MCP、プラグイン、そして実際に効くもの。

---

## スキルとコマンド

スキルはルールのように動作し、特定のスコープとワークフローに限定される。特定のワークフローを実行したいときのプロンプトの省略形である。

Opus 4.5 で長時間コーディングした後、不要なコードや散らばった .md ファイルを掃除したい? `/refactor-clean` を実行する。テストが必要? `/tdd`、`/e2e`、`/test-coverage`。スキルには codemap を含めることもでき、探索にコンテキストを使わずにコードベースを素早く移動できる。

![Terminal showing chained commands](./assets/images/shortform/02-chaining-commands.jpeg)
*コマンドの連結*

コマンドはスラッシュコマンドで実行されるスキルである。両者は重なるが、保存場所は異なる:

- **スキル**: `~/.claude/skills/` - 幅広いワークフロー定義
- **コマンド**: `~/.claude/commands/` - すぐ実行できるプロンプト

```bash
# スキル構造の例
~/.claude/skills/
  pmx-guidelines.md      # プロジェクト固有のパターン
  coding-standards.md    # 言語のベストプラクティス
  tdd-workflow/          # README.md を含む複数ファイルスキル
  security-review/       # チェックリスト型スキル
```

---

## フック

フックは特定イベントで発火するトリガーベースの自動化である。スキルとは異なり、ツール呼び出しとライフサイクルイベントに限定される。

**フック種別:**

1. **PreToolUse** - ツール実行の前 (バリデーション、リマインド)
2. **PostToolUse** - ツール完了の後 (フォーマット、フィードバックループ)
3. **UserPromptSubmit** - メッセージ送信時
4. **Stop** - Claude の応答終了時
5. **PreCompact** - コンテキスト圧縮の前
6. **Notification** - 許可リクエスト

**例: 長時間コマンド前の tmux リマインド**

```json
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm|yarn|cargo|pytest)\"",
      "hooks": [
        {
          "type": "command",
          "command": "if [ -z \"$TMUX\" ]; then echo '[Hook] Consider tmux for session persistence' >&2; fi"
        }
      ]
    }
  ]
}
```

![PostToolUse hook feedback](./assets/images/shortform/03-posttooluse-hook.png)
*PostToolUse フック実行時のフィードバック例*

**プロのコツ:** `hookify` プラグインを使えば、JSON を手で書かずに会話形式でフックを作成できる。`/hookify` を実行し、やりたいことを説明する。

---

## サブエージェント

サブエージェントは、オーケストレーター (メイン Claude) が限定スコープでタスクを委譲できるプロセスである。バックグラウンド / フォアグラウンドで実行でき、メインエージェントのコンテキストを節約できる。

サブエージェントはスキルと相性がよい。サブエージェントに限定スキルセットを持たせれば、自律的にタスクを処理できる。ツール権限を限定したサンドボックス化も可能だ。

```bash
# サブエージェント構造の例
~/.claude/agents/
  planner.md           # 機能実装の計画
  architect.md         # システム設計
  tdd-guide.md         # テスト駆動開発
  code-reviewer.md     # 品質 / セキュリティレビュー
  security-reviewer.md # 脆弱性分析
  build-error-resolver.md
  e2e-runner.md
  refactor-cleaner.md
```

適切なスコープ設定のため、サブエージェントごとに許可ツール、MCP、権限を設定する。

---

## ルールとメモリ

`.rules` フォルダには、Claude が常に従うべきベストプラクティスを `.md` で置く。2 つのアプローチがある:

1. **単一の CLAUDE.md** - すべてを 1 ファイルにまとめる (ユーザー / プロジェクト レベル)
2. **ルールフォルダ** - 関心ごとに分割した `.md` のモジュール

```bash
~/.claude/rules/
  security.md      # ハードコードされたシークレット禁止、入力バリデーション
  coding-style.md  # イミュータブル、ファイル構成
  testing.md       # TDD ワークフロー、80% カバレッジ
  git-workflow.md  # コミット形式、PR プロセス
  agents.md        # サブエージェント委譲の指針
  performance.md   # モデル選定、コンテキスト管理
```

**ルール例:**

- コードベースで絵文字を使わない
- フロントエンドで紫系の色を避ける
- デプロイ前に必ずテストする
- メガファイルではなくモジュール化されたコードを優先する
- console.log をコミットしない

---

## MCP (Model Context Protocol)

MCP は Claude を外部サービスに直接接続する。API の代替ではなく、プロンプト駆動のラッパーであり、情報の探索を柔軟にする。

**例:** Supabase MCP を使えば、Claude が特定データを取得したり、SQL を直接実行したりできる。データベースやデプロイプラットフォームも同様である。

![Supabase MCP listing tables](./assets/images/shortform/04-supabase-mcp.jpeg)
*Supabase MCP が public schema のテーブル一覧を表示する例*

**Claude 内の Chrome:** Claude がブラウザを自律的に操作し、クリックして挙動を確認できる組み込みプラグイン MCP である。

**重要: コンテキストウィンドウ管理**

MCP の選定は慎重に行う。すべての MCP をユーザー設定に入れていても、**使わないものは必ず無効化する**。`/plugins` に移動してスクロールするか、`/mcp` を実行する。

![/plugins interface](./assets/images/shortform/05-plugins-interface.jpeg)
*/plugins で MCP を確認し、現在のインストール状況と状態を見る*

200k のコンテキストウィンドウは、ツールを有効化しすぎると 70k まで減る。性能は大きく劣化する。

**経験則:** 設定上は 20-30 個の MCP を持ちつつ、実際に有効化するのは 10 未満 / アクティブツール 80 未満に抑える。

```bash
# 有効化された MCP を確認する
/mcp

# ~/.claude.json の projects.disabledMcpServers で不要なものを無効化する
```

---

## プラグイン

プラグインは、面倒な手動セットアップの代わりにツールをまとめてインストールできる仕組みである。プラグインはスキル + MCP の組み合わせ、またはフック / ツールのバンドルになりうる。

**プラグインのインストール:**

```bash
# マーケットプレイスを追加する
claude plugin marketplace add https://github.com/mixedbread-ai/mgrep

# Claude を開き /plugins を実行して新しいマーケットプレイスを探し、そこからインストールする
```

![Marketplaces tab showing mgrep](./assets/images/shortform/06-marketplaces-mgrep.jpeg)
*新しくインストールした Mixedbread-Grep のマーケットプレイスを表示*

**LSP プラグイン** は、Claude Code をエディタ外で頻繁に使う場合に特に有用だ。Language Server Protocol は IDE を開かなくても、リアルタイムの型チェック、定義ジャンプ、賢い補完を提供する。

```bash
# 有効化されたプラグイン例
typescript-lsp@claude-plugins-official  # TypeScript の補助
pyright-lsp@claude-plugins-official     # Python の型チェック
hookify@claude-plugins-official         # フックを会話形式で作成
mgrep@Mixedbread-Grep                   # ripgrep より優れた検索
```

MCP と同じ警告 - コンテキストウィンドウに注意すること。

---

## Tips and Tricks

### キーボードショートカット

- `Ctrl+U` - 行全体を削除する (バックスペース連打より速い)
- `!` - bash コマンドのクイック接頭辞
- `@` - ファイルを検索する
- `/` - スラッシュコマンドを開始する
- `Shift+Enter` - 複数行入力
- `Tab` - 思考表示の切替
- `Esc Esc` - Claude の中断 / コードの復元

### 並列ワークフロー

- **Fork** (`/fork`) - キューに詰めず、非重複タスクを並列処理するために会話をフォークする
- **Git Worktrees** - 衝突のない並列 Claude を実現する。各 worktree は独立したチェックアウト

```bash
git worktree add ../feature-branch feature-branch
# 各 worktree で別の Claude インスタンスを起動する
```

### 長時間コマンドには tmux

Claude が実行するログ / bash をストリームして監視する:

https://github.com/user-attachments/assets/shortform/07-tmux-video.mp4

```bash
tmux new -s dev
# Claude はここでコマンドを実行し、切断 / 再接続できる
tmux attach -t dev
```

### mgrep > grep

`mgrep` は ripgrep/grep から大きく改善されている。プラグインマーケットプレイスからインストールし、`/mgrep` スキルを使う。ローカル検索と Web 検索の両方に対応する。

```bash
mgrep "function handleSubmit"  # ローカル検索
mgrep --web "Next.js 15 app router changes"  # Web 検索
```

### ほかに便利なコマンド

- `/rewind` - 以前の状態に戻る
- `/statusline` - ブランチ、コンテキスト %、todos をカスタマイズする
- `/checkpoints` - ファイル単位の元に戻すポイント
- `/compact` - 手動でコンテキスト圧縮を実行する

### GitHub Actions CI/CD

GitHub Actions で PR のコードレビューを設定する。構成できれば、Claude が PR を自動レビューできる。

![Claude bot approving a PR](./assets/images/shortform/08-github-pr-review.jpeg)
*Claude がバグ修正 PR を承認する例*

### サンドボックス

リスクのある操作にはサンドボックスモードを使う。Claude は制限された環境で実行され、実システムには影響しない。

---

## エディタについて

エディタの選択は Claude Code ワークフローに大きく影響する。Claude Code はどのターミナルでも動くが、優れたエディタと組み合わせると、リアルタイムのファイル追跡、素早いナビゲーション、統合コマンド実行が可能になる。

### Zed (私の好み)

私は [Zed](https://zed.dev) を使っている。Rust 製なので本当に速く、起動も瞬時で、大規模コードベースでも余裕があり、システムリソースをほとんど消費しない。

**Zed + Claude Code が優れている理由:**

- **速度** - Rust ベースの性能により、Claude が高速編集しても遅延がない
- **Agent Panel 連携** - Zed の Claude 連携は、Claude の編集をリアルタイムで追跡できる。Claude が参照するファイルをエディタ内で即座に移動できる
- **CMD+Shift+R コマンドパレット** - カスタムスラッシュコマンド、デバッガ、ビルドスクリプトに検索 UI で素早くアクセスできる
- **最小のリソース使用** - Opus 実行時に RAM/CPU を奪わない
- **Vim モード** - vim キーバインドが使える

![Zed Editor with custom commands](./assets/images/shortform/09-zed-editor.jpeg)
*CMD+Shift+R のコマンドドロップダウンを表示した Zed エディタ。右下にフォローモードの照準がある。*

**エディタに依存しないコツ:**

1. **画面分割** - 片側に Claude Code のターミナル、もう片側にエディタ
2. **Ctrl + G** - Zed で Claude が作業中のファイルを素早く開く
3. **自動保存** - Claude のファイル読み取りが常に最新になるよう自動保存を有効化する
4. **Git 連携** - コミット前にエディタの Git 機能で Claude の変更をレビューする
5. **ファイルウォッチャー** - 多くのエディタが自動再読み込みを行う。これが有効か確認する

### VSCode / Cursor

これも十分に有効で、Claude Code と相性がよい。`\ide` による LSP 機能を有効化すれば (プラグインでほぼ冗長になったが)、ターミナル形式でもエディタとの自動同期を使える。あるいは、よりエディタ統合された拡張機能を使う手もあり、UI も揃っている。

![VS Code Claude Code Extension](./assets/images/shortform/10-vscode-extension.jpeg)
*VS Code 拡張は Claude Code のネイティブ UI を提供し、IDE に直接統合する。*

---

## 私のセットアップ

### プラグイン

**インストール済み:** (通常はこのうち 4-5 個だけ有効化している)

```markdown
ralph-wiggum@claude-code-plugins       # ループ自動化
frontend-design@claude-code-plugins    # UI/UX パターン
commit-commands@claude-code-plugins    # Git ワークフロー
security-guidance@claude-code-plugins  # セキュリティチェック
pr-review-toolkit@claude-code-plugins  # PR 自動化
typescript-lsp@claude-plugins-official # TS の補助
hookify@claude-plugins-official        # フック作成
code-simplifier@claude-plugins-official
feature-dev@claude-code-plugins
explanatory-output-style@claude-code-plugins
code-review@claude-code-plugins
context7@claude-plugins-official       # ライブドキュメント
pyright-lsp@claude-plugins-official    # Python の型
mgrep@Mixedbread-Grep                  # ripgrep より優れた検索
```

### MCP サーバー

**設定済み (ユーザーレベル):**

```json
{
  "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"] },
  "firecrawl": { "command": "npx", "args": ["-y", "firecrawl-mcp"] },
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=YOUR_REF"]
  },
  "memory": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"] },
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
  },
  "vercel": { "type": "http", "url": "https://mcp.vercel.com" },
  "railway": { "command": "npx", "args": ["-y", "@railway/mcp-server"] },
  "cloudflare-docs": { "type": "http", "url": "https://docs.mcp.cloudflare.com/mcp" },
  "cloudflare-workers-bindings": {
    "type": "http",
    "url": "https://bindings.mcp.cloudflare.com/mcp"
  },
  "clickhouse": { "type": "http", "url": "https://mcp.clickhouse.cloud/mcp" },
  "AbletonMCP": { "command": "uvx", "args": ["ableton-mcp"] },
  "magic": { "command": "npx", "args": ["-y", "@magicuidesign/mcp@latest"] }
}
```

ここが重要である。MCP は 14 個設定しているが、プロジェクトごとに有効化するのは 5-6 個に留める。コンテキストウィンドウを健全に保てる。

### 主要フック

```json
{
  "PreToolUse": [
    { "matcher": "npm|pnpm|yarn|cargo|pytest", "hooks": ["tmux reminder"] },
    { "matcher": "Write && .md file", "hooks": ["block unless README/CLAUDE"] },
    { "matcher": "git push", "hooks": ["open editor for review"] }
  ],
  "PostToolUse": [
    { "matcher": "Edit && .ts/.tsx/.js/.jsx", "hooks": ["prettier --write"] },
    { "matcher": "Edit && .ts/.tsx", "hooks": ["tsc --noEmit"] },
    { "matcher": "Edit", "hooks": ["grep console.log warning"] }
  ],
  "Stop": [
    { "matcher": "*", "hooks": ["check modified files for console.log"] }
  ]
}
```

### カスタムステータスライン

ユーザー名、ディレクトリ、ダーティ表示付きの git ブランチ、残りコンテキスト %、モデル、時刻、todo 件数を表示する:

![Custom status line](./assets/images/shortform/11-statusline.jpeg)
*Mac の root ディレクトリでのステータスライン例*

```
affoon:~ ctx:65% Opus 4.5 19:52
▌▌ plan mode on (shift+tab to cycle)
```

### ルール構造

```
~/.claude/rules/
  security.md      # 必須のセキュリティチェック
  coding-style.md  # イミュータブル、ファイルサイズ制限
  testing.md       # TDD、80% カバレッジ
  git-workflow.md  # コンベンショナルコミット
  agents.md        # サブエージェント委譲ルール
  patterns.md      # API レスポンス形式
  performance.md   # モデル選定 (Haiku vs Sonnet vs Opus)
  hooks.md         # フックのドキュメント
```

### サブエージェント

```
~/.claude/agents/
  planner.md           # 機能分解
  architect.md         # システム設計
  tdd-guide.md         # テストを先に書く
  code-reviewer.md     # 品質レビュー
  security-reviewer.md # 脆弱性スキャン
  build-error-resolver.md
  e2e-runner.md        # Playwright テスト
  refactor-cleaner.md  # デッドコード削除
  doc-updater.md       # ドキュメント同期
```

---

## 重要ポイント

1. **過度に複雑化しない** - 設定はアーキテクチャではなく微調整として扱う
2. **コンテキストウィンドウは貴重** - 使わない MCP とプラグインを無効化する
3. **並列実行** - 会話をフォークし、git worktree を使う
4. **反復の自動化** - フォーマット、lint、リマインドのフック
5. **サブエージェントのスコープ** - 限定ツールで集中実行

---

## 参考リンク

- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
- [Interactive Mode](https://code.claude.com/docs/en/interactive-mode)
- [Memory System](https://code.claude.com/docs/en/memory)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [MCP Overview](https://code.claude.com/docs/en/mcp-overview)

---

**注記:** これは詳細の一部である。高度なパターンは [ロングフォームガイド](./the-longform-guide.md) を参照すること。

---

*NYC の Anthropic x Forum Ventures ハッカソンで [zenith.chat](https://zenith.chat) を構築し、[@DRodriguezFX](https://x.com/DRodriguezFX) と共に優勝した*
