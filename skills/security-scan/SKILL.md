---
name: security-scan
description: AgentShield を使って Claude Code 設定（.claude/ ディレクトリ）の脆弱性、設定ミス、インジェクションリスクをスキャンする。CLAUDE.md、settings.json、MCP servers、hooks、agent 定義を検査する。
---

# Security Scan スキル

[AgentShield](https://github.com/affaan-m/agentshield) を使って Claude Code 設定のセキュリティ問題を監査する。

## いつ有効化するか

- 新しい Claude Code プロジェクトをセットアップするとき
- `.claude/settings.json`、`CLAUDE.md`、MCP 設定を変更した後
- 設定変更をコミットする前
- 既存の Claude Code 設定がある新規リポジトリへ参加するとき
- 定期的なセキュリティ衛生チェック

## 検査対象

| File | Checks |
|------|--------|
| `CLAUDE.md` | ハードコードされたシークレット、自動実行指示、プロンプトインジェクションパターン |
| `settings.json` | 過剰に許可的な allow list、欠落した deny list、危険な bypass フラグ |
| `mcp.json` | リスクの高い MCP server、ハードコードされた env シークレット、npx のサプライチェーンリスク |
| `hooks/` | 補間経由のコマンドインジェクション、データ流出、サイレントなエラー抑制 |
| `agents/*.md` | 制限なしのツールアクセス、プロンプトインジェクション面、欠落した model 指定 |

## 前提条件

AgentShield のインストールが必要。必要に応じて確認 / インストールする:

```bash
# インストール確認
npx ecc-agentshield --version

# グローバルインストール（推奨）
npm install -g ecc-agentshield

# もしくは npx で直接実行（インストール不要）
npx ecc-agentshield scan .
```

## 使い方

### 基本スキャン

現在のプロジェクトの `.claude/` ディレクトリに対して実行する:

```bash
# 現在のプロジェクトをスキャン
npx ecc-agentshield scan

# 特定パスをスキャン
npx ecc-agentshield scan --path /path/to/.claude

# 最低 severity を指定してスキャン
npx ecc-agentshield scan --min-severity medium
```

### 出力形式

```bash
# ターミナル出力（既定）— グレード付きカラー レポート
npx ecc-agentshield scan

# JSON — CI / CD 連携向け
npx ecc-agentshield scan --format json

# Markdown — ドキュメント向け
npx ecc-agentshield scan --format markdown

# HTML — 単体で閲覧できるダークテーマ レポート
npx ecc-agentshield scan --format html > security-report.html
```

### 自動修正

安全な修正を自動適用する（auto-fixable としてマークされたもののみ）:

```bash
npx ecc-agentshield scan --fix
```

実行内容:
- ハードコードされたシークレットを環境変数参照に置換する
- ワイルドカード権限をより限定的な代替に絞る
- 手動対応のみの提案は変更しない

### Opus 4.6 深層分析

より深い分析のために敵対的 3 エージェントパイプラインを実行する:

```bash
# ANTHROPIC_API_KEY が必要
export ANTHROPIC_API_KEY=your-key
npx ecc-agentshield scan --opus --stream
```

実行内容:
1. **Attacker（Red Team）** — 攻撃ベクトルを発見する
2. **Defender（Blue Team）** — ハードニング案を提示する
3. **Auditor（Final Verdict）** — 両視点を統合する

### セキュア設定の初期化

新しいセキュアな `.claude/` 設定をゼロから生成する:

```bash
npx ecc-agentshield init
```

生成内容:
- スコープ済み権限と deny list を持つ `settings.json`
- セキュリティベストプラクティスを含む `CLAUDE.md`
- `mcp.json` のプレースホルダー

### GitHub Action

CI パイプラインへ追加する:

```yaml
- uses: affaan-m/agentshield@v1
  with:
    path: '.'
    min-severity: 'medium'
    fail-on-findings: true
```

## Severity レベル

| Grade | Score | Meaning |
|-------|-------|---------|
| A | 90-100 | セキュアな設定 |
| B | 75-89 | 軽微な問題 |
| C | 60-74 | 要注意 |
| D | 40-59 | 重大リスクあり |
| F | 0-39 | 致命的脆弱性 |

## 結果の読み方

### Critical findings（即時修正）
- 設定ファイル内のハードコード API key / token
- allow list 内の `Bash(*)`（無制限 shell アクセス）
- `${file}` 補間経由の hook コマンドインジェクション
- shell 実行型 MCP server

### High findings（本番前に修正）
- CLAUDE.md の自動実行指示（プロンプトインジェクション経路）
- permission の deny list 欠落
- 不要な Bash アクセスを持つ agent

### Medium findings（推奨対応）
- hook のサイレントなエラー抑制（`2>/dev/null`、`|| true`）
- PreToolUse セキュリティ hook の欠落
- MCP server 設定内の `npx -y` 自動インストール

### Info findings（認識事項）
- MCP server の説明不足
- 良い実践として正しく検出された禁止的指示

## リンク

- **GitHub**: [github.com/affaan-m/agentshield](https://github.com/affaan-m/agentshield)
- **npm**: [npmjs.com/package/ecc-agentshield](https://www.npmjs.com/package/ecc-agentshield)
