# OpenCode ECC プラグイン

Everything Claude Code（ECC）を OpenCode で利用するためのプラグインである。エージェント / コマンド / フック / スキルを含む。

## インストール

### Option 1: npm パッケージ

```bash
npm install opencode-ecc
```

`opencode.json` に追加する:

```json
{
  "plugin": ["opencode-ecc"]
}
```

### Option 2: 直接利用

リポジトリを clone して OpenCode を実行する:

```bash
git clone https://github.com/affaan-m/everything-claude-code
cd everything-claude-code
opencode
```

## 機能

### Agents（12）

| Agent | 説明 |
|-------|------|
| planner | 実装計画 |
| architect | システム設計 |
| code-reviewer | コードレビュー |
| security-reviewer | セキュリティ分析 |
| tdd-guide | テスト駆動開発 |
| build-error-resolver | ビルドエラー修正 |
| e2e-runner | E2E テスト |
| doc-updater | ドキュメント更新 |
| refactor-cleaner | デッドコード整理 |
| go-reviewer | Go コードレビュー |
| go-build-resolver | Go ビルドエラー修正 |
| database-reviewer | データベース最適化 |

### Commands（24）

| Command | 説明 |
|---------|------|
| `/plan` | 実装計画を作成 |
| `/tdd` | TDD ワークフロー |
| `/code-review` | コード変更をレビュー |
| `/security` | セキュリティレビュー |
| `/build-fix` | ビルドエラー修正 |
| `/e2e` | E2E テスト |
| `/refactor-clean` | デッドコード削除 |
| `/orchestrate` | マルチエージェント実行 |
| `/learn` | パターン抽出 |
| `/checkpoint` | 進捗保存 |
| `/verify` | 検証ループ |
| `/eval` | 評価実行 |
| `/update-docs` | ドキュメント更新 |
| `/update-codemaps` | codemap 更新 |
| `/test-coverage` | カバレッジ分析 |
| `/setup-pm` | パッケージマネージャー設定 |
| `/go-review` | Go コードレビュー |
| `/go-test` | Go TDD |
| `/go-build` | Go ビルド修正 |
| `/skill-create` | スキル生成 |
| `/instinct-status` | インスティンクト表示 |
| `/instinct-import` | インスティンクト取り込み |
| `/instinct-export` | インスティンクト書き出し |
| `/evolve` | インスティンクトをクラスタ化 |

### Plugin Hooks

| Hook | Event | 目的 |
|------|-------|------|
| Prettier | `file.edited` | JS / TS の自動整形 |
| TypeScript | `tool.execute.after` | 型エラーチェック |
| console.log | `file.edited` | デバッグ出力警告 |
| Notification | `session.idle` | デスクトップ通知 |
| Security | `tool.execute.before` | シークレットチェック |

### Custom Tools

| Tool | 説明 |
|------|------|
| run-tests | オプション付きテスト実行 |
| check-coverage | テストカバレッジ分析 |
| security-audit | セキュリティ脆弱性スキャン |

## Hook Event 対応表

OpenCode のプラグインシステムは Claude Code のフックに次のように対応する:

| Claude Code | OpenCode |
|-------------|----------|
| PreToolUse | `tool.execute.before` |
| PostToolUse | `tool.execute.after` |
| Stop | `session.idle` |
| SessionStart | `session.created` |
| SessionEnd | `session.deleted` |

OpenCode には Claude Code にはない追加イベントが 20+ 種類ある。

## Skills

16 個の ECC スキルを `instructions` 配列で利用できる:

- coding-standards
- backend-patterns
- frontend-patterns
- security-review
- tdd-workflow
- continuous-learning
- continuous-learning-v2
- iterative-retrieval
- strategic-compact
- eval-harness
- verification-loop
- golang-patterns
- golang-testing
- clickhouse-io
- pmx-guidelines

## 設定

完全な設定は `opencode.json` を参照:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5",
  "plugin": ["./.opencode/plugins"],
  "instructions": [
    "skills/tdd-workflow/SKILL.md",
    "skills/security-review/SKILL.md"
  ],
  "agent": { /* 12 agents */ },
  "command": { /* 24 commands */ }
}
```

## License

MIT
