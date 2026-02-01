---
name: instinct-status
description: 学習済みのインスティンクトを信頼度レベル付きで表示する
command: /instinct-status
implementation: python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py status
---

# インスティンクトステータスコマンド

学習済みのインスティンクトを信頼度スコア付きでドメイン別に表示する。

## 実装

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py status
```

## 使い方

```
/instinct-status
/instinct-status --domain code-style
/instinct-status --low-confidence
```

## やること

1. `~/.claude/homunculus/instincts/personal/` からすべてのインスティンクトファイルを読み込む
2. `~/.claude/homunculus/instincts/inherited/` から継承されたインスティンクトを読み込む
3. ドメイン別に信頼度バー付きで表示する

## 出力形式

```
📊 Instinct Status
==================

## Code Style (4 instincts)

### prefer-functional-style
Trigger: when writing new functions
Action: Use functional patterns over classes
Confidence: ████████░░ 80%
Source: session-observation | Last updated: 2025-01-22

### use-path-aliases
Trigger: when importing modules
Action: Use @/ path aliases instead of relative imports
Confidence: ██████░░░░ 60%
Source: repo-analysis (github.com/acme/webapp)

## Testing (2 instincts)

### test-first-workflow
Trigger: when adding new functionality
Action: Write test first, then implementation
Confidence: █████████░ 90%
Source: session-observation

## Workflow (3 instincts)

### grep-before-edit
Trigger: when modifying code
Action: Search with Grep, confirm with Read, then Edit
Confidence: ███████░░░ 70%
Source: session-observation

---
Total: 9 instincts (4 personal, 5 inherited)
Observer: Running (last analysis: 5 min ago)
```

## フラグ

- `--domain <name>`: ドメインで絞り込む（code-style、testing、git など）
- `--low-confidence`: 信頼度 < 0.5 のものだけ表示する
- `--high-confidence`: 信頼度 >= 0.7 のものだけ表示する
- `--source <type>`: ソースで絞り込む（session-observation、repo-analysis、inherited）
- `--json`: プログラム向けに JSON で出力する
