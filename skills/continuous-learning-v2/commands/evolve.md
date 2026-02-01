---
name: evolve
description: 関連する instinct を skill、command、agent にクラスタリングする
command: /evolve
implementation: python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve
---

# Evolve コマンド

## 実装

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve [--generate]
```

instinct を分析し、関連するものを上位構造にクラスタリングする:
- **Commands**: instinct がユーザー起動の行動を記述している場合
- **Skills**: instinct が自動トリガーの振る舞いを記述している場合
- **Agents**: instinct が複雑な複数ステップのプロセスを記述している場合

## 使い方

```
/evolve                    # すべての instinct を分析し、進化を提案する
/evolve --domain testing   # testing ドメインの instinct のみ進化
/evolve --dry-run          # 作成せずに作成内容を表示する
/evolve --threshold 5      # クラスタに必要な関連 instinct を 5 以上にする
```

## 進化ルール

### → Command (ユーザー起動)
ユーザーが明示的に要求する行動を instinct が記述している場合:
- "when user asks to..." に関する複数の instinct
- "when creating a new X" のようなトリガーを持つ instinct
- 再現可能なシーケンスに従う instinct

例:
- `new-table-step1`: "when adding a database table, create migration"
- `new-table-step2`: "when adding a database table, update schema"
- `new-table-step3`: "when adding a database table, regenerate types"

→ 作成: `/new-table` command

### → Skill (自動トリガー)
自動的に発動すべき振る舞いを instinct が記述している場合:
- パターンマッチするトリガー
- エラー処理の応答
- コードスタイルの強制

例:
- `prefer-functional`: "when writing functions, prefer functional style"
- `use-immutable`: "when modifying state, use immutable patterns"
- `avoid-classes`: "when designing modules, avoid class-based design"

→ 作成: `functional-patterns` skill

### → Agent (深さ / 分離が必要)
複雑で複数ステップのプロセスを instinct が記述しており、分離の恩恵がある場合:
- デバッグワークフロー
- リファクタシーケンス
- 調査タスク

例:
- `debug-step1`: "when debugging, first check logs"
- `debug-step2`: "when debugging, isolate the failing component"
- `debug-step3`: "when debugging, create minimal reproduction"
- `debug-step4`: "when debugging, verify fix with test"

→ 作成: `debugger` agent

## やること

1. `~/.claude/homunculus/instincts/` からすべての instinct を読む
2. 次の基準で instinct をグループ化する:
   - ドメインの近さ
   - トリガーパターンの重なり
   - アクションシーケンスの関係
3. 関連する instinct が 3 つ以上の各クラスタに対して:
   - 進化タイプ (command/skill/agent) を決定する
   - 適切なファイルを生成する
   - `~/.claude/homunculus/evolved/{commands,skills,agents}/` に保存する
4. 進化構造を元の instinct にリンクする

## 出力形式

```
🧬 Evolve Analysis
==================

Found 3 clusters ready for evolution:

## Cluster 1: Database Migration Workflow
Instincts: new-table-migration, update-schema, regenerate-types
Type: Command
Confidence: 85% (based on 12 observations)

Would create: /new-table command
Files:
  - ~/.claude/homunculus/evolved/commands/new-table.md

## Cluster 2: Functional Code Style
Instincts: prefer-functional, use-immutable, avoid-classes, pure-functions
Type: Skill
Confidence: 78% (based on 8 observations)

Would create: functional-patterns skill
Files:
  - ~/.claude/homunculus/evolved/skills/functional-patterns.md

## Cluster 3: Debugging Process
Instincts: debug-check-logs, debug-isolate, debug-reproduce, debug-verify
Type: Agent
Confidence: 72% (based on 6 observations)

Would create: debugger agent
Files:
  - ~/.claude/homunculus/evolved/agents/debugger.md

---
Run `/evolve --execute` to create these files.
```

## フラグ

- `--execute`: 進化構造を実際に作成する (デフォルトはプレビュー)
- `--dry-run`: 作成せずにプレビューする
- `--domain <name>`: 指定したドメインのみ進化
- `--threshold <n>`: クラスタ形成に必要な instinct の最小数 (デフォルト: 3)
- `--type <command|skill|agent>`: 指定したタイプのみ作成

## 生成ファイル形式

### Command
```markdown
---
name: new-table
description: Create a new database table with migration, schema update, and type generation
command: /new-table
evolved_from:
  - new-table-migration
  - update-schema
  - regenerate-types
---

# New Table Command

[Generated content based on clustered instincts]

## Steps
1. ...
2. ...
```

### Skill
```markdown
---
name: functional-patterns
description: Enforce functional programming patterns
evolved_from:
  - prefer-functional
  - use-immutable
  - avoid-classes
---

# Functional Patterns Skill

[Generated content based on clustered instincts]
```

### Agent
```markdown
---
name: debugger
description: Systematic debugging agent
model: sonnet
evolved_from:
  - debug-check-logs
  - debug-isolate
  - debug-reproduce
---

# Debugger Agent

[Generated content based on clustered instincts]
```
