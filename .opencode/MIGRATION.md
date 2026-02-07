# Migration Guide: Claude Code から OpenCode へ

このガイドは、Everything Claude Code（ECC）設定を使いながら Claude Code から OpenCode へ移行するための手順である。

## 概要

OpenCode は AI 支援開発向けの代替 CLI であり、Claude Code と同等機能を持つ。主な違いは設定形式である。

## 主な違い

| Feature | Claude Code | OpenCode | Notes |
|---------|-------------|----------|-------|
| Configuration | `CLAUDE.md`, `plugin.json` | `opencode.json` | ファイル形式が異なる |
| Agents | Markdown frontmatter | JSON object | 機能互換 |
| Commands | `commands/*.md` | `command` object or `.md` files | 機能互換 |
| Skills | `skills/*/SKILL.md` | `instructions` array | コンテキストとして読み込む |
| **Hooks** | `hooks.json`（3 phase） | **Plugin system（20+ event）** | **互換 + 拡張** |
| Rules | `rules/*.md` | `instructions` array | 統合も分離も可能 |
| MCP | Full support | Full support | 機能互換 |

## Hook 移行

OpenCode はプラグインシステム経由でフックを完全サポートする。イベント種類は 20+ で Claude Code より多い。

### Hook Event 対応

| Claude Code Hook | OpenCode Plugin Event | Notes |
|-----------------|----------------------|-------|
| `PreToolUse` | `tool.execute.before` | ツール入力を変更可能 |
| `PostToolUse` | `tool.execute.after` | ツール出力を変更可能 |
| `Stop` | `session.idle` or `session.status` | セッションライフサイクル |
| `SessionStart` | `session.created` | セッション開始 |
| `SessionEnd` | `session.deleted` | セッション終了 |
| N/A | `file.edited` | OpenCode 専用 |
| N/A | `file.watcher.updated` | OpenCode 専用 |
| N/A | `message.updated` | OpenCode 専用 |
| N/A | `lsp.client.diagnostics` | OpenCode 専用 |
| N/A | `tui.toast.show` | OpenCode 専用 |

### Hook から Plugin への変換例

**Claude Code hook（hooks.json）:**
```json
{
  "PostToolUse": [{
    "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
    "hooks": [{
      "type": "command",
      "command": "prettier --write \"$file_path\""
    }]
  }]
}
```

**OpenCode plugin（.opencode/plugins/prettier-hook.ts）:**
```typescript
export const PrettierPlugin = async ({ $ }) => {
  return {
    "file.edited": async (event) => {
      if (event.path.match(/\.(ts|tsx|js|jsx)$/)) {
        await $`prettier --write ${event.path}`
      }
    }
  }
}
```

### ECC に含まれる Plugin Hook

| Hook | OpenCode Event | Purpose |
|------|----------------|---------|
| Prettier auto-format | `file.edited` | 編集後に JS / TS を整形 |
| TypeScript check | `tool.execute.after` | `.ts` 編集後に tsc を実行 |
| console.log warning | `file.edited` | console.log を警告 |
| Session notification | `session.idle` | タスク完了を通知 |
| Security check | `tool.execute.before` | commit 前にシークレット確認 |

## 移行手順

### 1. OpenCode をインストール

```bash
npm install -g opencode
# or
curl -fsSL https://opencode.ai/install | bash
```

### 2. ECC の OpenCode 設定を使う

このリポジトリの `.opencode/` には OpenCode 向け設定が含まれる:

```
.opencode/
├── opencode.json
├── plugins/
│   ├── ecc-hooks.ts
│   └── index.ts
├── tools/
│   ├── run-tests.ts
│   ├── check-coverage.ts
│   └── security-audit.ts
├── commands/
│   ├── plan.md
│   ├── tdd.md
│   └── ...
├── prompts/
│   └── agents/
├── instructions/
│   └── INSTRUCTIONS.md
├── package.json
├── tsconfig.json
└── MIGRATION.md
```

### 3. OpenCode を実行

```bash
# リポジトリルートで実行
opencode

# .opencode/opencode.json が自動検出される
```

## 概念マッピング

### Agents

**Claude Code:**
```markdown
---
name: planner
description: Expert planning specialist...
tools: ["Read", "Grep", "Glob"]
model: opus
---

You are an expert planning specialist...
```

**OpenCode:**
```json
{
  "agent": {
    "planner": {
      "description": "Expert planning specialist...",
      "mode": "subagent",
      "model": "anthropic/claude-opus-4-5",
      "prompt": "{file:.opencode/prompts/agents/planner.txt}",
      "tools": { "read": true, "bash": true }
    }
  }
}
```

### Commands

**Claude Code:**
```markdown
---
name: plan
description: Create implementation plan
---

Create a detailed implementation plan for: {input}
```

**OpenCode（JSON）:**
```json
{
  "command": {
    "plan": {
      "description": "Create implementation plan",
      "template": "Create a detailed implementation plan for: $ARGUMENTS",
      "agent": "planner"
    }
  }
}
```

**OpenCode（Markdown - .opencode/commands/plan.md）:**
```markdown
---
description: Create implementation plan
agent: planner
---

Create a detailed implementation plan for: $ARGUMENTS
```

### Skills

**Claude Code:** `skills/*/SKILL.md` から読み込む。

**OpenCode:** `instructions` 配列に追加する:
```json
{
  "instructions": [
    "skills/tdd-workflow/SKILL.md",
    "skills/security-review/SKILL.md",
    "skills/coding-standards/SKILL.md"
  ]
}
```

### Rules

**Claude Code:** `rules/*.md` を個別管理する。

**OpenCode:** `instructions` に統合または個別追加できる:
```json
{
  "instructions": [
    ".opencode/instructions/INSTRUCTIONS.md",
    "rules/security.md",
    "rules/coding-style.md"
  ]
}
```

## モデル名対応

| Claude Code | OpenCode |
|-------------|----------|
| `opus` | `anthropic/claude-opus-4-5` |
| `sonnet` | `anthropic/claude-sonnet-4-5` |
| `haiku` | `anthropic/claude-haiku-4-5` |

## 利用可能コマンド

移行後は 24 コマンドを利用できる:

| Command | Description |
|---------|-------------|
| `/plan` | 実装計画を作成 |
| `/tdd` | TDD ワークフローを強制 |
| `/code-review` | コード変更をレビュー |
| `/security` | セキュリティレビュー実行 |
| `/build-fix` | ビルドエラー修正 |
| `/e2e` | E2E テスト生成 |
| `/refactor-clean` | デッドコード削除 |
| `/orchestrate` | マルチエージェント実行 |
| `/learn` | セッション中のパターン抽出 |
| `/checkpoint` | 検証状態保存 |
| `/verify` | 検証ループ実行 |
| `/eval` | 評価実行 |
| `/update-docs` | ドキュメント更新 |
| `/update-codemaps` | codemap 更新 |
| `/test-coverage` | カバレッジ確認 |
| `/setup-pm` | パッケージマネージャー設定 |
| `/go-review` | Go コードレビュー |
| `/go-test` | Go TDD ワークフロー |
| `/go-build` | Go ビルドエラー修正 |
| `/skill-create` | git 履歴からスキル生成 |
| `/instinct-status` | 学習済みインスティンクト表示 |
| `/instinct-import` | インスティンクト取り込み |
| `/instinct-export` | インスティンクト書き出し |
| `/evolve` | インスティンクトをスキルへ昇格 |
