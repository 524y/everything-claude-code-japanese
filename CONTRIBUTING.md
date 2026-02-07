# Everything Claude Code への貢献

貢献に関心を持ってくれてありがとう。このリポジトリは Claude Code ユーザー向けのコミュニティ資源である。

## 目次

- [求めている貢献](#求めている貢献)
- [クイックスタート](#クイックスタート)
- [スキルの貢献](#スキルの貢献)
- [エージェントの貢献](#エージェントの貢献)
- [フックの貢献](#フックの貢献)
- [コマンドの貢献](#コマンドの貢献)
- [Pull Request 手順](#pull-request-手順)

---

## 求めている貢献

### Agents
- 言語別レビュー担当（Python、Go、Rust）
- フレームワーク専門家（Django、Rails、Laravel、Spring）
- DevOps 専門家（Kubernetes、Terraform、CI/CD）
- ドメイン専門家（ML パイプライン、データエンジニアリング、モバイル）

### Skills
- 言語ベストプラクティス
- フレームワークパターン
- テスト戦略
- アーキテクチャガイド

### Hooks
- lint / formatting フック
- セキュリティチェック
- バリデーションフック
- 通知フック

### Commands
- デプロイコマンド
- テストコマンド
- コード生成コマンド

---

## クイックスタート

```bash
# 1. Fork & clone
gh repo fork affaan-m/everything-claude-code --clone
cd everything-claude-code

# 2. ブランチ作成
git checkout -b feat/my-contribution

# 3. 貢献内容を追加

# 4. ローカル検証
cp -r skills/my-skill ~/.claude/skills/  # skill の場合

# 5. PR 提出
git add . && git commit -m "feat: add my-skill" && git push
```

---

## スキルの貢献

### 配置場所

```
skills/
└── your-skill-name/
    └── SKILL.md
```

### SKILL.md テンプレート

```markdown
---
name: your-skill-name
description: skill 一覧に表示される短い説明
---

# Skill Title

## Core Concepts
- 重要な指針

## Code Examples

typescript などの実用例を掲載する。

## Best Practices
- Do / Don't
- よくある落とし穴

## When to Use
- 適用シナリオ
```

### チェックリスト

- [ ] 1 つの領域に焦点化
- [ ] 実用的なコード例を含む
- [ ] 500 行以内
- [ ] 見出し構成が明確
- [ ] Claude Code で検証済み

---

## エージェントの貢献

### 配置場所

```
agents/your-agent-name.md
```

### テンプレート

```markdown
---
name: your-agent-name
description: いつ・何のために呼ぶかを具体的に書く
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
---

You are a [role] specialist.

## Your Role
- 主責務
- 副責務
- やらないこと

## Workflow
### Step 1: Understand
### Step 2: Execute
### Step 3: Verify

## Output Format
返却形式を定義する。
```

### フィールド指針

| Field | 説明 | 例 |
|-------|------|----|
| `name` | 小文字 + ハイフン | `code-reviewer` |
| `description` | 起動判定に使う | 具体的に書く |
| `tools` | 必要最小限 | `Read, Write, Edit, Bash ...` |
| `model` | 複雑性に応じて選択 | `haiku` / `sonnet` / `opus` |

---

## フックの貢献

### 配置場所

```
hooks/hooks.json
```

### Hook Types

| Type | Trigger | 用途 |
|------|---------|------|
| `PreToolUse` | 実行前 | 検証、警告、ブロック |
| `PostToolUse` | 実行後 | 整形、チェック、通知 |
| `SessionStart` | 開始時 | コンテキスト読込 |
| `Stop` | 終了時 | 監査、後始末 |

### チェックリスト

- [ ] matcher が過剰に広くない
- [ ] 明確なメッセージを返す
- [ ] `exit 1` / `exit 0` を正しく使う
- [ ] 実機で検証済み
- [ ] `description` を記載

---

## コマンドの貢献

### 配置場所

```
commands/your-command.md
```

### テンプレート

```markdown
---
description: /help に表示される短い説明
---

# Command Name

## Purpose
何をするコマンドか

## Usage
/your-command [args]

## Workflow
1. Step 1
2. Step 2
3. Step 3

## Output
ユーザーへの返却内容
```

---

## Pull Request 手順

### 1. タイトル形式

```
feat(skills): add rust-patterns skill
feat(agents): add api-designer agent
feat(hooks): add auto-format hook
fix(skills): update react patterns
docs: improve contributing guide
```

### 2. PR 説明テンプレート

```markdown
## Summary
追加内容と理由

## Type
- [ ] Skill
- [ ] Agent
- [ ] Hook
- [ ] Command

## Testing
検証方法

## Checklist
- [ ] フォーマット規約に準拠
- [ ] Claude Code で検証済み
- [ ] 機密情報を含まない
- [ ] 説明が明確
```

### 3. レビューの流れ

1. メンテナがレビュー
2. 指摘があれば修正
3. 承認後 main にマージ

---

## ガイドライン

### Do
- 貢献は焦点化しモジュール化する
- 明確な説明を添える
- 提出前に必ず検証する
- 既存パターンに合わせる
- 依存関係を明記する

### Don't
- 機密情報（API キー、トークン、ローカルパス）を含めない
- 過度にニッチ / 複雑な設定を追加しない
- 未検証のまま提出しない
- 既存機能の重複を作らない

---

## ファイル命名

- 小文字 + ハイフン（例: `python-reviewer.md`）
- 意図が分かる名前にする
- `name` とファイル名を一致させる

---

## 質問がある場合

- **Issues:** https://github.com/affaan-m/everything-claude-code/issues
- **X/Twitter:** [@affaanmustafa](https://x.com/affaanmustafa)

---

貢献に感謝する。より良い資源を一緒に育てよう。
