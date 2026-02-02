# 非公式日本語訳 / Unofficial Japanese Translation

- 元リポジトリ: https://github.com/affaan-m/everything-claude-code
- 翻訳最終更新日: 2026-02-01

# Everything Claude Code

[![Stars](https://img.shields.io/github/stars/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/-Go-00ADD8?logo=go&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-000000?logo=markdown&logoColor=white)

**Anthropic のハッカソン優勝者による Claude Code 設定の完全版コレクションである。**

実運用可能なエージェント、スキル、フック、コマンド、ルール、MCP 設定が、実際のプロダクト構築を 10 か月以上の日次の集中的な使用で進化したものである。

---

## ガイド

このリポジトリは生のコードのみである。ガイドがすべてを説明する。

<table>
<tr>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2012378465664745795">
<img src="https://github.com/user-attachments/assets/1a471488-59cc-425b-8345-5245c7efbcef" alt="The Shorthand Guide to Everything Claude Code" />
</a>
</td>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2014040193557471352">
<img src="https://github.com/user-attachments/assets/c9ca43bc-b149-427f-b551-af6840c368f0" alt="The Longform Guide to Everything Claude Code" />
</a>
</td>
</tr>
<tr>
<td align="center"><b>Shorthand Guide</b><br/>セットアップ、基礎、思想。<b>まずこれを読むこと。</b></td>
<td align="center"><b>Longform Guide</b><br/>トークン最適化、メモリ永続化、評価、並列化。</td>
</tr>
</table>

| トピック | 学べる内容 |
|-------|-------------------|
| トークン最適化 | モデル選定、system prompt のスリム化、バックグラウンドプロセス |
| メモリ永続化 | セッション間でコンテキストを自動で保存/読み込みするフック |
| 継続学習 | セッションからパターンを自動抽出して再利用可能なスキルにする |
| 検証ループ | チェックポイント vs 継続評価、grader の種類、pass@k 指標 |
| 並列化 | Git worktrees、カスケード方式、インスタンスのスケール条件 |
| サブエージェントオーケストレーション | コンテキスト問題、iterative retrieval パターン |

---

## クロスプラットフォーム対応

このプラグインは現在 Windows、macOS、Linux を完全にサポートする。すべてのフックとスクリプトは最大の互換性のために Node.js で書き直されている。

### パッケージマネージャー検出

このプラグインは、好みのパッケージマネージャー（npm、pnpm、yarn、bun）を次の優先順位で自動検出する:

1. **環境変数**: `CLAUDE_PACKAGE_MANAGER`
2. **プロジェクト設定**: `.claude/package-manager.json`
3. **package.json**: `packageManager` フィールド
4. **ロックファイル**: package-lock.json、yarn.lock、pnpm-lock.yaml、bun.lockb から検出
5. **グローバル設定**: `~/.claude/package-manager.json`
6. **フォールバック**: 最初に利用可能なパッケージマネージャー

希望のパッケージマネージャーを設定するには次のとおりである:

```bash
# 環境変数経由
export CLAUDE_PACKAGE_MANAGER=pnpm

# グローバル設定経由
node scripts/setup-package-manager.js --global pnpm

# プロジェクト設定経由
node scripts/setup-package-manager.js --project bun

# 現在の設定を検出
node scripts/setup-package-manager.js --detect
```

または Claude Code の `/setup-pm` コマンドを使う。

---

## 中身

このリポジトリは Claude Code プラグインである。直接インストールするか、構成要素を手動でコピーする。

```
everything-claude-code/
|-- .claude-plugin/   # プラグインとマーケットプレイスのマニフェスト
|   |-- plugin.json         # プラグインメタデータとコンポーネントパス
|   |-- marketplace.json    # /plugin marketplace add 用マーケットプレイスカタログ
|
|-- agents/           # 委任用の専門サブエージェント
|   |-- planner.md           # 機能実装の計画
|   |-- architect.md         # システム設計の意思決定
|   |-- tdd-guide.md         # テスト駆動開発
|   |-- code-reviewer.md     # 品質とセキュリティのレビュー
|   |-- security-reviewer.md # 脆弱性分析
|   |-- build-error-resolver.md
|   |-- e2e-runner.md        # Playwright E2E テスト
|   |-- refactor-cleaner.md  # デッドコード整理
|   |-- doc-updater.md       # ドキュメント同期
|   |-- go-reviewer.md       # Go コードレビュー (NEW)
|   |-- go-build-resolver.md # Go ビルドエラー解消 (NEW)
|
|-- skills/           # ワークフロー定義とドメイン知識
|   |-- coding-standards/           # 言語のベストプラクティス
|   |-- backend-patterns/           # API、データベース、キャッシュパターン
|   |-- frontend-patterns/          # React、Next.js パターン
|   |-- continuous-learning/        # セッションからの自動抽出 (Longform Guide)
|   |-- continuous-learning-v2/     # 信頼度スコア付きの Instinct ベース学習
|   |-- iterative-retrieval/        # サブエージェントの段階的コンテキスト精錬
|   |-- strategic-compact/          # 手動コンパクション提案 (Longform Guide)
|   |-- tdd-workflow/               # TDD 手法
|   |-- security-review/            # セキュリティチェックリスト
|   |-- eval-harness/               # 検証ループ評価 (Longform Guide)
|   |-- verification-loop/          # 継続的検証 (Longform Guide)
|   |-- golang-patterns/            # Go イディオムとベストプラクティス (NEW)
|   |-- golang-testing/             # Go テストパターン、TDD、ベンチマーク (NEW)
|
|-- commands/         # すぐ実行できるスラッシュコマンド
|   |-- tdd.md              # /tdd - テスト駆動開発
|   |-- plan.md             # /plan - 実装計画
|   |-- e2e.md              # /e2e - E2E テスト生成
|   |-- code-review.md      # /code-review - 品質レビュー
|   |-- build-fix.md        # /build-fix - ビルドエラー修正
|   |-- refactor-clean.md   # /refactor-clean - デッドコード削除
|   |-- learn.md            # /learn - セッション中のパターン抽出 (Longform Guide)
|   |-- checkpoint.md       # /checkpoint - 検証状態の保存 (Longform Guide)
|   |-- verify.md           # /verify - 検証ループの実行 (Longform Guide)
|   |-- setup-pm.md         # /setup-pm - パッケージマネージャー設定
|   |-- go-review.md        # /go-review - Go コードレビュー (NEW)
|   |-- go-test.md          # /go-test - Go TDD ワークフロー (NEW)
|   |-- go-build.md         # /go-build - Go ビルドエラー修正 (NEW)
|
|-- rules/            # 常に従うガイドライン ( ~/.claude/rules/ にコピー )
|   |-- security.md         # 必須セキュリティチェック
|   |-- coding-style.md     # 不変性、ファイル構成
|   |-- testing.md          # TDD、80% カバレッジ要件
|   |-- git-workflow.md     # コミット形式、PR プロセス
|   |-- agents.md           # サブエージェントへ委任する条件
|   |-- performance.md      # モデル選定、コンテキスト管理
|
|-- hooks/            # トリガー型の自動化
|   |-- hooks.json                # フック設定一式 (PreToolUse、PostToolUse、Stop など)
|   |-- memory-persistence/       # セッションライフサイクルフック (Longform Guide)
|   |-- strategic-compact/        # コンパクション提案 (Longform Guide)
|
|-- scripts/          # クロスプラットフォーム Node.js スクリプト (NEW)
|   |-- lib/                     # 共通ユーティリティ
|   |   |-- utils.js             # クロスプラットフォームファイル/パス/システムユーティリティ
|   |   |-- package-manager.js   # パッケージマネージャー検出と選択
|   |-- hooks/                   # フック実装
|   |   |-- session-start.js     # セッション開始時のコンテキスト読み込み
|   |   |-- session-end.js       # セッション終了時の状態保存
|   |   |-- pre-compact.js       # コンパクション前の状態保存
|   |   |-- suggest-compact.js   # 戦略的コンパクション提案
|   |   |-- evaluate-session.js  # セッションからのパターン抽出
|   |-- setup-package-manager.js # 対話式の PM 設定
|
|-- tests/            # テストスイート (NEW)
|   |-- lib/                     # ライブラリテスト
|   |-- hooks/                   # フックテスト
|   |-- run-all.js               # 全テスト実行
|
|-- contexts/         # 動的 system prompt 注入コンテキスト (Longform Guide)
|   |-- dev.md              # 開発モードコンテキスト
|   |-- review.md           # レビューモードコンテキスト
|   |-- research.md         # 調査/探索モードコンテキスト
|
|-- examples/         # 設定とセッションの例
|   |-- CLAUDE.md           # プロジェクトレベル設定の例
|   |-- user-CLAUDE.md      # ユーザーレベル設定の例
|
|-- mcp-configs/      # MCP サーバー設定
|   |-- mcp-servers.json    # GitHub、Supabase、Vercel、Railway など
|
|-- marketplace.json  # 自前のマーケットプレイス設定 (/plugin marketplace add 用)
```

---

## エコシステムツール

### ecc.tools - Skill Creator

リポジトリから Claude Code スキルを自動生成する。

[Install GitHub App](https://github.com/apps/skill-creator) | [ecc.tools](https://ecc.tools)

リポジトリを解析し、次を作成する:
- **SKILL.md files** - Claude Code ですぐ使えるスキル
- **Instinct collections** - continuous-learning-v2 用
- **Pattern extraction** - コミット履歴から学習する

インスティンクト（instincts）は「いつ」「何をするか」を短いルールとして記録した行動パターンである。continuous-learning-v2 では、個人用（personal）と継承用（inherited）に分けて蓄積し、必要に応じてスキル / コマンド / エージェントへ進化させる。

```bash
# GitHub App をインストール後、スキルは次に生成される:
~/.claude/skills/generated/
```

継承された instincts のために、`continuous-learning-v2` スキルとシームレスに連携する。

---

## インストール

### 方法 1: プラグインとしてインストール（推奨）

このリポジトリを使う最も簡単な方法は、Claude Code プラグインとしてインストールすることである:

```bash
# このリポジトリをマーケットプレイスとして追加
/plugin marketplace add affaan-m/everything-claude-code

# プラグインをインストール
/plugin install everything-claude-code@everything-claude-code
```

または `~/.claude/settings.json` に直接追加する:

```json
{
  "extraKnownMarketplaces": {
    "everything-claude-code": {
      "source": {
        "source": "github",
        "repo": "affaan-m/everything-claude-code"
      }
    }
  },
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  }
}
```

これにより、すべてのコマンド、エージェント、スキル、フックに即座にアクセスできる。

> **注意:** Claude Code の plugin system は、plugin 経由で `rules` を配布できない（[本家の制限](https://code.claude.com/docs/en/plugins-reference)）。`rules` は手動でインストールする必要がある。
>
> ```bash
> # 先にリポジトリを clone
> git clone https://github.com/affaan-m/everything-claude-code.git
>
> # 選択肢 A: ユーザー単位の rules（全プロジェクトに適用）
> cp -r everything-claude-code/rules/* ~/.claude/rules/
>
> # 選択肢 B: プロジェクト単位の rules（現在のプロジェクトのみに適用）
> mkdir -p .claude/rules
> cp -r everything-claude-code/rules/* .claude/rules/
> ```

---

### 方法 2: 手動インストール

インストール内容を手動で制御したい場合は次のとおりである:

```bash
# リポジトリをクローン
git clone https://github.com/affaan-m/everything-claude-code.git

# Claude 設定へ agents をコピー
cp everything-claude-code/agents/*.md ~/.claude/agents/

# rules をコピー
cp everything-claude-code/rules/*.md ~/.claude/rules/

# commands をコピー
cp everything-claude-code/commands/*.md ~/.claude/commands/

# skills をコピー
cp -r everything-claude-code/skills/* ~/.claude/skills/
```

#### hooks を settings.json に追加する

`hooks/hooks.json` のフックを `~/.claude/settings.json` にコピーする。

#### MCP を設定する

`mcp-configs/mcp-servers.json` から必要な MCP サーバーを `~/.claude.json` にコピーする。

**重要:** `YOUR_*_HERE` プレースホルダーを実際の API キーに置き換えること。

---

## 主要な概念

### エージェント

サブエージェントは限定されたスコープで委任タスクを処理する。例:

```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and maintainability
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

You are a senior code reviewer...
```

### スキル

スキルはコマンドまたはエージェントによって呼び出されるワークフロー定義である:

```markdown
# TDD ワークフロー

1. まずインターフェースを定義する
2. 失敗するテストを書く (RED)
3. 最小限のコードを実装する (GREEN)
4. リファクタする (IMPROVE)
5. 80%+ のカバレッジを確認する
```

### フック

フックはツールのイベントで発火する。例 - console.log の警告:

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \\\"\\\\.(ts|tsx|js|jsx)$\\\"",
  "hooks": [{
    "type": "command",
    "command": "#!/bin/bash\ngrep -n 'console\\.log' \"$file_path\" && echo '[Hook] Remove console.log' >&2"
  }]
}
```

### ルール

ルールは常に従うガイドラインである。モジュール化を維持する:

```
~/.claude/rules/
  security.md      # ハードコードされたシークレットの禁止
  coding-style.md  # 不変性、ファイル制限
  testing.md       # TDD、カバレッジ要件
```

---

## テストの実行

このプラグインには包括的なテストスイートが含まれる:

```bash
# 全テストを実行
node tests/run-all.js

# 個別のテストファイルを実行
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

---

## コントリビュート

**貢献は歓迎され、奨励される。**

このリポジトリはコミュニティリソースとして意図されている。次のものがあれば:
- 有用なエージェントまたはスキル
- 気の利いたフック
- より良い MCP 設定
- 改善されたルール

ぜひ貢献してほしい。ガイドラインは [CONTRIBUTING.md](CONTRIBUTING.md) を参照すること。

### 貢献のアイデア

- 言語固有のスキル（Python、Rust パターン）- Go はすでに含まれている
- フレームワーク固有の設定（Django、Rails、Laravel）
- DevOps エージェント（Kubernetes、Terraform、AWS）
- テスト戦略（異なるフレームワーク）
- ドメイン固有の知識（ML、データエンジニアリング、モバイル）

---

## 背景

私は実験的な公開以来 Claude Code を使っている。2025 年 9 月に [zenith.chat](https://zenith.chat) を [@DRodriguezFX](https://x.com/DRodriguezFX) と構築し、Anthropic x Forum Ventures ハッカソンで優勝した。完全に Claude Code を使っている。

これらの設定は複数の本番アプリケーションで実戦投入されている。

---

## 重要な注意事項

### コンテキストウィンドウ管理

**重要:** すべての MCP を一度に有効化しないこと。ツールを多く有効化すると 200k のコンテキストウィンドウが 70k に縮む可能性がある。

目安:
- 20 から 30 の MCP を設定する
- プロジェクトごとの有効化は 10 未満に抑える
- 有効なツールは 80 未満に抑える

未使用のものは project config の `disabledMcpServers` を使って無効化する。

### カスタマイズ

これらの設定は私のワークフローに合っている。次のとおりにすること:
1. 共感するものから始める
2. 自分のスタック向けに修正する
3. 使わないものを削除する
4. 自分のパターンを追加する

---

## Star 履歴

[![Star History Chart](https://api.star-history.com/svg?repos=affaan-m/everything-claude-code&type=Date)](https://star-history.com/#affaan-m/everything-claude-code&Date)

---

## リンク

- **Shorthand Guide（開始はこちら）:** [The Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2012378465664745795)
- **Longform Guide（上級）:** [The Longform Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2014040193557471352)
- **Follow:** [@affaanmustafa](https://x.com/affaanmustafa)
- **zenith.chat:** [zenith.chat](https://zenith.chat)

---

## ライセンス

MIT - 自由に使い、必要に応じて改変し、可能なら貢献すること。

---

**役立つならこのリポジトリに Star を付けること。両方のガイドを読むこと。素晴らしいものを作ること。**
