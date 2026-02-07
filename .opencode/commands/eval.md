# Eval コマンド

eval 駆動開発のワークフローを管理する。

## 使用方法

`/eval [define|check|report|list] [feature-name]`

## Evals を定義する

`/eval define feature-name`

新しい eval 定義を作成する:

1. `.claude/evals/feature-name.md` を次のテンプレートで作成する:

```markdown
## EVAL: feature-name
Created: $(date)

### Capability Evals
- [ ] [機能 1 の説明]
- [ ] [機能 2 の説明]

### Regression Evals
- [ ] [既存動作 1 が維持されている]
- [ ] [既存動作 2 が維持されている]

### Success Criteria
- pass@3 > 90% for capability evals
- pass^3 = 100% for regression evals
```

2. ユーザーに具体的な基準を記入してもらう

## Evals をチェックする

`/eval check feature-name`

機能の eval を実行する:

1. `.claude/evals/feature-name.md` から eval 定義を読む
2. capability eval ごとに:
   - 基準を検証する
   - PASS/FAIL を記録する
   - 試行を `.claude/evals/feature-name.log` に記録する
3. regression eval ごとに:
   - 関連するテストを実行する
   - ベースラインと比較する
   - PASS/FAIL を記録する
4. 現在の状態を報告する:

```
EVAL CHECK: feature-name
========================
Capability: X/Y passing
Regression: X/Y passing
Status: IN PROGRESS / READY
```

## Evals を報告する

`/eval report feature-name`

包括的な eval レポートを生成する:

```
EVAL REPORT: feature-name
=========================
Generated: $(date)

CAPABILITY EVALS
----------------
[eval-1]: PASS (pass@1)
[eval-2]: PASS (pass@2) - required retry
[eval-3]: FAIL - see notes

REGRESSION EVALS
----------------
[test-1]: PASS
[test-2]: PASS
[test-3]: PASS

METRICS
-------
Capability pass@1: 67%
Capability pass@3: 100%
Regression pass^3: 100%

NOTES
-----
[Any issues, edge cases, or observations]

RECOMMENDATION
--------------
[SHIP / NEEDS WORK / BLOCKED]
```

## Evals を一覧表示する

`/eval list`

すべての eval 定義を表示する:

```
EVAL DEFINITIONS
================
feature-auth      [3/5 passing] IN PROGRESS
feature-search    [5/5 passing] READY
feature-export    [0/4 passing] NOT STARTED
```

## 引数

$ARGUMENTS:
- `define <name>` - 新しい eval 定義を作成する
- `check <name>` - eval を実行し状態を確認する
- `report <name>` - フルレポートを生成する
- `list` - すべての eval を表示する
- `clean` - 古い eval ログを削除する（最後の 10 回分は残す）
