---
name: configure-ecc
description: Everything Claude Code の対話式インストーラー。スキル / ルールをユーザーレベルまたはプロジェクトレベルに選択インストールし、パス検証と最適化を行う。
---

# Configure Everything Claude Code (ECC)

Everything Claude Code 向けの対話式ステップ実行ウィザード。`AskUserQuestion` を使ってスキルとルールを選択的に導入し、導入後の整合性検証と最適化を行う。

## When to Activate

- ユーザーが "configure ecc"、"install ecc"、"setup everything claude code" などを指示した時
- このプロジェクトからスキル / ルールを選択導入したい時
- 既存 ECC 導入状態を検証または修正したい時
- 導入済みスキル / ルールをプロジェクト向けに最適化したい時

## Prerequisites

この skill は、起動前に Claude Code から参照可能である必要がある。ブートストラップ方法は 2 通り:
1. **Via Plugin**: `/plugin install everything-claude-code`（自動でこの skill が読み込まれる）
2. **Manual**: この skill のみを `~/.claude/skills/configure-ecc/SKILL.md` に配置し、"configure ecc" と発話して起動

---

## Step 0: Clone ECC Repository

導入前に、最新 ECC ソースを `/tmp` に clone する:

```bash
rm -rf /tmp/everything-claude-code
git clone https://github.com/affaan-m/everything-claude-code.git /tmp/everything-claude-code
```

以降のコピー元として `ECC_ROOT=/tmp/everything-claude-code` を使う。

clone に失敗した場合（ネットワークなど）は、`AskUserQuestion` で既存ローカル clone のパス入力を求める。

---

## Step 1: Choose Installation Level

`AskUserQuestion` で導入先を確認する:

```
Question: "Where should ECC components be installed?"
Options:
  - "User-level (~/.claude/)" — "Applies to all your Claude Code projects"
  - "Project-level (.claude/)" — "Applies only to the current project"
  - "Both" — "Common/shared items user-level, project-specific items project-level"
```

選択値を `INSTALL_LEVEL` として保存し、導入先を設定:
- User-level: `TARGET=~/.claude`
- Project-level: `TARGET=.claude`（現在プロジェクトルートからの相対）
- Both: `TARGET_USER=~/.claude`, `TARGET_PROJECT=.claude`

必要なら導入先ディレクトリを作成する:
```bash
mkdir -p $TARGET/skills $TARGET/rules
```

---

## Step 2: Select & Install Skills

### 2a: Choose Skill Categories

27 個の skills を 4 カテゴリで提示する。`AskUserQuestion` で `multiSelect: true` を使う:

```
Question: "Which skill categories do you want to install?"
Options:
  - "Framework & Language" — "Django, Spring Boot, Go, Python, Java, Frontend, Backend patterns"
  - "Database" — "PostgreSQL, ClickHouse, JPA/Hibernate patterns"
  - "Workflow & Quality" — "TDD, verification, learning, security review, compaction"
  - "All skills" — "Install every available skill"
```

### 2b: Confirm Individual Skills

選択カテゴリごとに以下の一覧を提示し、導入対象を最終確認する。4 件を超える場合は一覧をテキスト表示し、`AskUserQuestion` では "Install all listed" と "Other"（個別入力）を使う。

**Category: Framework & Language (16 skills)**

| Skill | Description |
|-------|-------------|
| `backend-patterns` | Node.js / Express / Next.js 向けの backend 設計・API 設計・サーバー側ベストプラクティス |
| `coding-standards` | TypeScript / JavaScript / React / Node.js 向け共通コーディング規約 |
| `django-patterns` | Django 設計、DRF API、ORM、cache、signals、middleware |
| `django-security` | Django セキュリティ（auth、CSRF、SQL injection、XSS 対策） |
| `django-tdd` | pytest-django、factory_boy、mock、coverage による Django テスト |
| `django-verification` | migration、lint、test、security scan を含む Django 検証ループ |
| `frontend-patterns` | React、Next.js、state 管理、性能、UI パターン |
| `golang-patterns` | robust な Go アプリ向け idiomatic patterns |
| `golang-testing` | table-driven tests、subtests、benchmarks、fuzzing |
| `java-coding-standards` | Spring Boot 向け Java 規約（命名、不変性、Optional、streams） |
| `python-patterns` | Pythonic idioms、PEP 8、type hints、ベストプラクティス |
| `python-testing` | pytest、TDD、fixtures、mocking、parametrization |
| `springboot-patterns` | Spring Boot 設計、REST API、レイヤー設計、cache、async |
| `springboot-security` | Spring Security（authn/authz、validation、CSRF、secrets、rate limiting） |
| `springboot-tdd` | JUnit 5、Mockito、MockMvc、Testcontainers による TDD |
| `springboot-verification` | build、静的解析、test、security scan の検証ループ |

**Category: Database (3 skills)**

| Skill | Description |
|-------|-------------|
| `clickhouse-io` | ClickHouse パターン、クエリ最適化、分析、データエンジニアリング |
| `jpa-patterns` | JPA / Hibernate の entity 設計、関連、クエリ最適化、transaction |
| `postgres-patterns` | PostgreSQL クエリ最適化、スキーマ設計、index、セキュリティ |

**Category: Workflow & Quality (8 skills)**

| Skill | Description |
|-------|-------------|
| `continuous-learning` | セッションから再利用パターンを自動抽出して学習 |
| `continuous-learning-v2` | confidence scoring 付き instinct 学習。skills / commands / agents に昇格 |
| `eval-harness` | eval-driven development（EDD）向け評価フレームワーク |
| `iterative-retrieval` | subagent の context 問題に対する段階的文脈精緻化 |
| `security-review` | auth、input、secrets、API、payment 向けセキュリティチェック |
| `strategic-compact` | 論理区切りでの手動 context compaction を提案 |
| `tdd-workflow` | 80%+ coverage を前提に unit / integration / E2E を含む TDD を強制 |
| `verification-loop` | 検証と品質ループのパターン |

**Standalone**

| Skill | Description |
|-------|-------------|
| `project-guidelines-example` | プロジェクト専用 skill 作成テンプレート |

### 2c: Execute Installation

選択された skill ごとに、ディレクトリごとコピーする:
```bash
cp -r $ECC_ROOT/skills/<skill-name> $TARGET/skills/
```

注: `continuous-learning` と `continuous-learning-v2` は `config.json` / hooks / scripts を含むため、`SKILL.md` 単体ではなく **ディレクトリ全体** をコピーする。

---

## Step 3: Select & Install Rules

`AskUserQuestion` で `multiSelect: true` を使って確認する:

```
Question: "Which rule sets do you want to install?"
Options:
  - "Common rules (Recommended)" — "Language-agnostic principles: coding style, git workflow, testing, security, etc. (8 files)"
  - "TypeScript/JavaScript" — "TS/JS patterns, hooks, testing with Playwright (5 files)"
  - "Python" — "Python patterns, pytest, black/ruff formatting (5 files)"
  - "Go" — "Go patterns, table-driven tests, gofmt/staticcheck (5 files)"
```

導入コマンド:
```bash
# Common rules (flat copy into rules/)
cp -r $ECC_ROOT/rules/common/* $TARGET/rules/

# Language-specific rules (flat copy into rules/)
cp -r $ECC_ROOT/rules/typescript/* $TARGET/rules/   # if selected
cp -r $ECC_ROOT/rules/python/* $TARGET/rules/        # if selected
cp -r $ECC_ROOT/rules/golang/* $TARGET/rules/        # if selected
```

**Important**: 言語別ルールのみを選択し common rules を選ばなかった場合は警告する:
> "Language-specific rules extend the common rules. Installing without common rules may result in incomplete coverage. Install common rules too?"

---

## Step 4: Post-Installation Verification

導入後に以下を自動検証する。

### 4a: Verify File Existence

導入されたファイル一覧と実在を確認:
```bash
ls -la $TARGET/skills/
ls -la $TARGET/rules/
```

### 4b: Check Path References

導入された `.md` のパス参照を検査:
```bash
grep -rn "~/.claude/" $TARGET/skills/ $TARGET/rules/
grep -rn "../common/" $TARGET/rules/
grep -rn "skills/" $TARGET/skills/
```

**project-level install の場合**、`~/.claude/` 参照を確認:
- `~/.claude/settings.json` 参照は通常問題なし（settings は user-level 前提）
- `~/.claude/skills/` や `~/.claude/rules/` は project-level 単独導入時に壊れる可能性あり
- 他 skill 名参照がある場合は、その skill が導入済みかを検証

### 4c: Check Cross-References Between Skills

代表依存関係を確認:
- `django-tdd` -> `django-patterns`
- `springboot-tdd` -> `springboot-patterns`
- `continuous-learning-v2` -> `~/.claude/homunculus/`
- `python-testing` -> `python-patterns`
- `golang-testing` -> `golang-patterns`
- 言語別 rules -> `common/` 側 rules

### 4d: Report Issues

問題ごとに次を報告:
1. **File**: 問題参照を含むファイル
2. **Line**: 行番号
3. **Issue**: 問題内容（例: `python-patterns` 未導入なのに参照している）
4. **Suggested fix**: 対応案（例: skill 導入、パス修正）

---

## Step 5: Optimize Installed Files (Optional)

`AskUserQuestion`:

```
Question: "Would you like to optimize the installed files for your project?"
Options:
  - "Optimize skills" — "Remove irrelevant sections, adjust paths, tailor to your tech stack"
  - "Optimize rules" — "Adjust coverage targets, add project-specific patterns, customize tool configs"
  - "Optimize both" — "Full optimization of all installed files"
  - "Skip" — "Keep everything as-is"
```

### If optimizing skills:
1. 導入済み `SKILL.md` を読む
2. 既知でなければ技術スタックを確認
3. 不要セクション削除を提案
4. 導入先ファイルをその場で更新（source repo ではなく target）
5. Step 4 で見つかったパス問題を修正

### If optimizing rules:
1. 導入済み rule `.md` を読む
2. 次の希望を確認:
   - テストカバレッジ目標（既定 80%）
   - 整形ツール
   - Git 運用規約
   - セキュリティ要件
3. 導入先 rule ファイルをその場で更新

**Critical**: 変更対象は必ず導入先（`$TARGET/`）のみ。source ECC リポジトリ（`$ECC_ROOT/`）は変更しない。

---

## Step 6: Installation Summary

`/tmp` の clone を掃除:

```bash
rm -rf /tmp/everything-claude-code
```

次のサマリーを出力:

```
## ECC Installation Complete

### Installation Target
- Level: [user-level / project-level / both]
- Path: [target path]

### Skills Installed ([count])
- skill-1, skill-2, skill-3, ...

### Rules Installed ([count])
- common (8 files)
- typescript (5 files)
- ...

### Verification Results
- [count] issues found, [count] fixed
- [list any remaining issues]

### Optimizations Applied
- [list changes made, or "None"]
```

---

## Troubleshooting

### "Skills not being picked up by Claude Code"
- skill ディレクトリに `SKILL.md` があるか確認（単体 md だけでは不可）
- user-level: `~/.claude/skills/<skill-name>/SKILL.md` の存在確認
- project-level: `.claude/skills/<skill-name>/SKILL.md` の存在確認

### "Rules not working"
- rules はサブディレクトリではなくフラット配置: `$TARGET/rules/coding-style.md` が正
- rules 導入後は Claude Code を再起動

### "Path reference errors after project-level install"
- 一部 skills は `~/.claude/` 前提。Step 4 で検出し修正する。
- `continuous-learning-v2` の `~/.claude/homunculus/` は user-level 前提で正常。
