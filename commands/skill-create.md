---
name: skill-create
description: ローカルの git 履歴を解析してコーディング パターンを抽出し、SKILL.md を生成する。Skill Creator GitHub App のローカル版。
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /skill-create - ローカル スキル生成

リポジトリの git 履歴を解析し、チームのプラクティスを Claude に教える SKILL.md を生成する。

## 使用方法

```bash
/skill-create                    # 現在のリポジトリを解析
/skill-create --commits 100      # 直近 100 コミットを解析
/skill-create --output ./skills  # 出力ディレクトリを指定
/skill-create --instincts        # continuous-learning-v2 向けインスティンクトも生成
```

## できること

1. **Git 履歴の解析** - コミット、ファイル変更、パターンを解析
2. **パターン検出** - 反復するワークフローや規約を特定
3. **SKILL.md 生成** - Claude Code 用のスキル ファイルを作成
4. **インスティンクト生成（任意）** - continuous-learning-v2 向けに生成

## 解析手順

### ステップ 1: Git データ収集

```bash
# 直近のコミットと変更ファイルを取得
git log --oneline -n ${COMMITS:-200} --name-only --pretty=format:"%H|%s|%ad" --date=short

# ファイル別の変更頻度を取得
git log --oneline -n 200 --name-only | grep -v "^$" | grep -v "^[a-f0-9]" | sort | uniq -c | sort -rn | head -20

# コミット メッセージのパターンを取得
git log --oneline -n 200 | cut -d' ' -f2- | head -50
```

### ステップ 2: パターン検出

次のパターン種別を探す:

| パターン | 検出方法 |
| --- | --- |
| **コミット規約** | コミット メッセージの正規表現（feat:, fix:, chore:） |
| **ファイルの共変更** | いつも一緒に変更されるファイル |
| **ワークフローの連鎖** | 反復されるファイル変更パターン |
| **アーキテクチャ** | フォルダ構造と命名規則 |
| **テスト パターン** | テスト ファイルの場所、命名、カバレッジ |

### ステップ 3: SKILL.md 生成

出力フォーマット:

```markdown
---
name: {repo-name}-patterns
description: Coding patterns extracted from {repo-name}
version: 1.0.0
source: local-git-analysis
analyzed_commits: {count}
---

# {Repo Name} Patterns

## Commit Conventions
{detected commit message patterns}

## Code Architecture
{detected folder structure and organization}

## Workflows
{detected repeating file change patterns}

## Testing Patterns
{detected test conventions}
```

### ステップ 4: インスティンクト生成（--instincts 指定時）

continuous-learning-v2 連携用:

```yaml
---
id: {repo}-commit-convention
trigger: "when writing a commit message"
confidence: 0.8
domain: git
source: local-repo-analysis
---

# Use Conventional Commits

## Action
Prefix commits with: feat:, fix:, chore:, docs:, test:, refactor:

## Evidence
- Analyzed {n} commits
- {percentage}% follow conventional commit format
```

## 出力例

TypeScript プロジェクトで `/skill-create` を実行した場合:

```markdown
---
name: my-app-patterns
description: Coding patterns from my-app repository
version: 1.0.0
source: local-git-analysis
analyzed_commits: 150
---

# My App Patterns

## Commit Conventions

This project uses **conventional commits**:
- `feat:` - New features
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks
- `docs:` - Documentation updates

## Code Architecture

```
src/
├── components/     # React components (PascalCase.tsx)
├── hooks/          # Custom hooks (use*.ts)
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── services/       # API and external services
```

## Workflows

### Adding a New Component
1. Create `src/components/ComponentName.tsx`
2. Add tests in `src/components/__tests__/ComponentName.test.tsx`
3. Export from `src/components/index.ts`

### Database Migration
1. Modify `src/db/schema.ts`
2. Run `pnpm db:generate`
3. Run `pnpm db:migrate`

## Testing Patterns

- Test files: `__tests__/` directories or `.test.ts` suffix
- Coverage target: 80%+
- Framework: Vitest
```

## GitHub App 連携

高度な機能（10k+ コミット、チーム共有、自動 PR など）が必要なら、[Skill Creator GitHub App](https://github.com/apps/skill-creator) を使う:

- インストール: [github.com/apps/skill-creator](https://github.com/apps/skill-creator)
- issue に `/skill-creator analyze` とコメント
- 生成された skills の PR を受け取る

## 関連コマンド

- `/instinct-import` - 生成されたインスティンクトを取り込む
- `/instinct-status` - 学習済みインスティンクトを見る
- `/evolve` - インスティンクトを skills / agents にクラスター化

---

*Part of [Everything Claude Code](https://github.com/affaan-m/everything-claude-code)*
