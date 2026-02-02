# 非公式日本語訳 / Unofficial Japanese Translation

- 元リポジトリ: https://github.com/affaan-m/everything-claude-code
- 翻訳最終更新日: 2026-02-02

**言語:** 日本語 | [简体中文](README.zh-CN.md) | [繁體中文](docs/zh-TW/README.md)

# Everything Claude Code

[![Stars](https://img.shields.io/github/stars/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/-Go-00ADD8?logo=go&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-000000?logo=markdown&logoColor=white)

---

<div align="center">

**🌐 Language / 语言 / 語言**

[**日本語**](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](docs/zh-TW/README.md)

</div>

---

**Anthropic のハッカソン優勝者による Claude Code 設定の完全版コレクションである。**

実運用可能なエージェント、スキル、フック、コマンド、ルール、MCP 設定が、実際のプロダクト構築を 10 か月以上の日次の集中的な使用で進化したものである。

---

## ガイド

このリポジトリは生のコードのみである。ガイドがすべてを説明する。

<table>
<tr>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2012378465664745795">
<img src="https://github.com/user-attachments/assets/1a471488-59cc-425b-8345-5245c7efbcef" alt="Everything Claude Code ショートフォームガイド" />
</a>
</td>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2014040193557471352">
<img src="https://github.com/user-attachments/assets/c9ca43bc-b149-427f-b551-af6840c368f0" alt="Everything Claude Code ロングフォームガイド" />
</a>
</td>
</tr>
<tr>
<td align="center"><b>ショートフォームガイド</b><br/>セットアップ、基礎、思想。<b>まずこれを読むこと。</b></td>
<td align="center"><b>ロングフォームガイド</b><br/>トークン最適化、メモリ永続化、評価、並列化。</td>
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

## 🚀 クイックスタート

2 分以内に起動できる:

### ステップ 1: プラグインをインストールする

```bash
# マーケットプレイス追加
/plugin marketplace add affaan-m/everything-claude-code

# プラグインをインストール
/plugin install everything-claude-code@everything-claude-code
```

### ステップ 2: ルールをインストールする（必須）

> ⚠️ **重要:** Claude Code プラグインは `rules` を自動配布できない。手動でインストールすること。

```bash
# まずリポジトリを clone する
git clone https://github.com/affaan-m/everything-claude-code.git

# ルールをコピー（すべてのプロジェクトに適用）
cp -r everything-claude-code/rules/* ~/.claude/rules/
```

### ステップ 3: 使い始める

```bash
# コマンドを試す
/plan "ユーザー認証を追加"

# 利用可能なコマンドを確認
/plugin list everything-claude-code@everything-claude-code
```

✨ **これで完了。** 15 以上のエージェント、30 以上のスキル、20 以上のコマンドを利用できる。

---

## 🌐 クロスプラットフォーム対応

このプラグインは **Windows、macOS、Linux** を完全にサポートする。すべてのフックとスクリプトは最大の互換性のために Node.js で書き直されている。

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

## 📦 中身

このリポジトリは **Claude Code プラグイン** である。直接インストールするか、構成要素を手動でコピーする。

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
|   |-- continuous-learning/        # セッションからの自動抽出 (ロングフォームガイド)
|   |-- continuous-learning-v2/     # 信頼度スコア付きの Instinct ベース学習
|   |-- iterative-retrieval/        # サブエージェントの段階的コンテキスト精錬
|   |-- strategic-compact/          # 手動コンパクション提案 (ロングフォームガイド)
|   |-- tdd-workflow/               # TDD 手法
|   |-- security-review/            # セキュリティチェックリスト
|   |-- eval-harness/               # 検証ループ評価 (ロングフォームガイド)
|   |-- verification-loop/          # 継続的検証 (ロングフォームガイド)
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
|   |-- learn.md            # /learn - セッション中のパターン抽出 (ロングフォームガイド)
|   |-- checkpoint.md       # /checkpoint - 検証状態の保存 (ロングフォームガイド)
|   |-- verify.md           # /verify - 検証ループの実行 (ロングフォームガイド)
|   |-- setup-pm.md         # /setup-pm - パッケージマネージャー設定
|   |-- go-review.md        # /go-review - Go コードレビュー (NEW)
|   |-- go-test.md          # /go-test - Go TDD ワークフロー (NEW)
|   |-- go-build.md         # /go-build - Go ビルドエラー修正 (NEW)
|   |-- skill-create.md     # /skill-create - git 履歴からスキル生成 (NEW)
|   |-- instinct-status.md  # /instinct-status - 学習済み instinct の表示 (NEW)
|   |-- instinct-import.md  # /instinct-import - instinct のインポート (NEW)
|   |-- instinct-export.md  # /instinct-export - instinct のエクスポート (NEW)
|   |-- evolve.md           # /evolve - instinct をスキルにクラスタリング (NEW)
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
|   |-- memory-persistence/       # セッションライフサイクルフック (ロングフォームガイド)
|   |-- strategic-compact/        # コンパクション提案 (ロングフォームガイド)
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
|-- contexts/         # 動的 system prompt 注入コンテキスト (ロングフォームガイド)
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

## 🛠️ エコシステムツール

### Skill Creator

リポジトリから Claude Code のスキルを生成する方法は 2 つある。

#### 方法 A: ローカル解析（組み込み）

外部サービスなしでローカル解析を行うには `/skill-create` コマンドを使う:

```bash
/skill-create                    # 現在のリポジトリを解析
/skill-create --instincts        # continuous-learning 用の instinct も生成
```

このコマンドは git 履歴をローカルで解析し、SKILL.md ファイルを生成する。

#### 方法 B: GitHub App（高度）

高度な機能（1 万以上のコミット、自動 PR、チーム共有）を使う場合:

[Install GitHub App](https://github.com/apps/skill-creator) | [ecc.tools](https://ecc.tools)

```bash
# 任意の issue にコメント:
/skill-creator analyze

# または default ブランチへの push で自動トリガー
```

どちらの方法でも作成されるもの:
- **SKILL.md ファイル** - Claude Code 用にすぐ使えるスキル
- **Instinct コレクション** - continuous-learning-v2 用
- **パターン抽出** - コミット履歴から学習

### 🧠 Continuous Learning v2

instinct ベースの学習システムが自動でパターンを学習する:

```bash
/instinct-status        # 信頼度付きの学習済み instinct を表示
/instinct-import <file> # 他者の instinct をインポート
/instinct-export        # 自分の instinct をエクスポート
/evolve                 # 関連 instinct をスキルにクラスタリング
```

詳細は `skills/continuous-learning-v2/` を参照する。

---

## 📋 要件

### Claude Code CLI バージョン

**最小バージョン: v2.1.0 以降**

このプラグインは、プラグインシステムのフック取り扱い変更により Claude Code CLI v2.1.0+ が必要である。

バージョン確認:
```bash
claude --version
```

### 重要: フックの自動ロード挙動

> ⚠️ **コントリビューター向け:** `.claude-plugin/plugin.json` に `"hooks"` フィールドを追加しないこと。これはリグレッションテストで強制されている。

Claude Code v2.1+ は規約により、インストールされたプラグインの `hooks/hooks.json` を **自動で読み込む**。`plugin.json` に明示すると重複検出エラーになる:

```
Duplicate hooks file detected: ./hooks/hooks.json resolves to already-loaded file
```

**履歴:** これは過去に何度も修正/差し戻しを引き起こした（[#29](https://github.com/affaan-m/everything-claude-code/issues/29), [#52](https://github.com/affaan-m/everything-claude-code/issues/52), [#103](https://github.com/affaan-m/everything-claude-code/issues/103)）。Claude Code バージョン間の挙動変更が混乱の原因であり、現在はリグレッションテストで再導入を防いでいる。

---

## 📥 インストール

### 方法 1: プラグインとしてインストール（推奨）

最も簡単な方法は Claude Code プラグインとしてインストールすること:

```bash
# マーケットプレイスとして追加
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

> **注記:** Claude Code のプラグインシステムは `rules` を配布できない（[上流の制約](https://code.claude.com/docs/en/plugins-reference)）。ルールは手動でインストールする必要がある:
>
> ```bash
> # まずリポジトリを clone する
> git clone https://github.com/affaan-m/everything-claude-code.git
>
> # 方法 A: ユーザーレベル ルール（全プロジェクトに適用）
> cp -r everything-claude-code/rules/* ~/.claude/rules/
>
> # 方法 B: プロジェクトレベル ルール（現在のプロジェクトのみ）
> mkdir -p .claude/rules
> cp -r everything-claude-code/rules/* .claude/rules/
> ```

---

### 🔧 方法 2: 手動インストール

インストール内容を手動で制御したい場合:

```bash
# リポジトリを clone
git clone https://github.com/affaan-m/everything-claude-code.git

# エージェントを Claude 設定にコピー
cp everything-claude-code/agents/*.md ~/.claude/agents/

# ルールをコピー
cp everything-claude-code/rules/*.md ~/.claude/rules/

# コマンドをコピー
cp everything-claude-code/commands/*.md ~/.claude/commands/

# スキルをコピー
cp -r everything-claude-code/skills/* ~/.claude/skills/
```

#### settings.json にフックを追加する

`hooks/hooks.json` からフック設定を `~/.claude/settings.json` にコピーする。

#### MCP の構成

`mcp-configs/mcp-servers.json` から必要な MCP サーバーを `~/.claude.json` にコピーする。

**重要:** `YOUR_*_HERE` のプレースホルダーは実際の API キーに置き換えること。

---

## 🎯 主要概念

### エージェント

サブエージェントは限定的な範囲で委任タスクを処理する。例:

```markdown
---
name: code-reviewer
description: 品質、セキュリティ、保守性をレビューする
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

あなたは品質、セキュリティ、保守性を担保するシニア コードレビュアーである。
```

### スキル

スキルはコマンドやエージェントから呼び出されるワークフロー定義である:

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
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [{
    "type": "command",
    "command": "#!/bin/bash\ngrep -n 'console\\.log' \"$file_path\" && echo '[Hook] console.log を削除する' >&2"
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

## 🧪 テストの実行

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

## 🤝 コントリビュート

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

## 📖 背景

私は実験的な公開以来 Claude Code を使っている。2025 年 9 月に [zenith.chat](https://zenith.chat) を [@DRodriguezFX](https://x.com/DRodriguezFX) と構築し、Anthropic x Forum Ventures ハッカソンで優勝した。完全に Claude Code を使っている。

これらの設定は複数の本番アプリケーションで実戦投入されている。

---

## ⚠️ 重要な注意事項

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

## 🌟 Star 履歴

[![Star History Chart](https://api.star-history.com/svg?repos=affaan-m/everything-claude-code&type=Date)](https://star-history.com/#affaan-m/everything-claude-code&Date)

---

## 🔗 リンク

- **Shorthand Guide（開始はこちら）:** [The Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2012378465664745795)
- **Longform Guide（上級）:** [The Longform Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2014040193557471352)
- **Follow:** [@affaanmustafa](https://x.com/affaanmustafa)
- **zenith.chat:** [zenith.chat](https://zenith.chat)

---

## 📄 ライセンス

MIT - 自由に使い、必要に応じて改変し、可能なら貢献すること。

---

**役立つならこのリポジトリに Star を付けること。両方のガイドを読むこと。素晴らしいものを作ること。**
