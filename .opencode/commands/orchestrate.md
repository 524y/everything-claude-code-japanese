# Orchestrate コマンド

複雑なタスクのための逐次エージェントワークフロー。

## 使用方法

`/orchestrate [workflow-type] [task-description]`

## ワークフロー種別

### feature
フル機能実装のワークフロー:
```
planner -> tdd-guide -> code-reviewer -> security-reviewer
```

### bugfix
バグ調査と修正のワークフロー:
```
explorer -> tdd-guide -> code-reviewer
```

### refactor
安全なリファクタリングのワークフロー:
```
architect -> code-reviewer -> tdd-guide
```

### security
セキュリティ重視のレビュー:
```
security-reviewer -> code-reviewer -> architect
```

## 実行パターン

ワークフロー内の各エージェントごとに:

1. **エージェントを呼び出す**（直前のエージェントのコンテキスト付き）
2. **出力を収集する**（構造化された引き継ぎドキュメント）
3. **次のエージェントに渡す**
4. **結果を集約** して最終レポートを作成

## 引き継ぎドキュメント形式

エージェント間で次の引き継ぎドキュメントを作成する:

```markdown
## HANDOFF: [previous-agent] -> [next-agent]

### Context
[実施内容の要約]

### Findings
[主要な発見や決定事項]

### Files Modified
[変更したファイル一覧]

### Open Questions
[次のエージェントの未解決事項]

### Recommendations
[次のステップの提案]
```

## 例: feature ワークフロー

```
/orchestrate feature "ユーザー認証を追加する"
```

実行内容:

1. **Planner エージェント**
   - 要件分析
   - 実装計画の作成
   - 依存関係の特定
   - 出力: `HANDOFF: planner -> tdd-guide`

2. **TDD Guide エージェント**
   - planner の引き継ぎを読む
   - テストを先に書く
   - テストが通るように実装
   - 出力: `HANDOFF: tdd-guide -> code-reviewer`

3. **Code Reviewer エージェント**
   - 実装をレビュー
   - 問題点の確認
   - 改善提案
   - 出力: `HANDOFF: code-reviewer -> security-reviewer`

4. **Security Reviewer エージェント**
   - セキュリティ監査
   - 脆弱性チェック
   - 最終承認
   - 出力: 最終レポート

## 最終レポート形式

```
ORCHESTRATION REPORT
====================
Workflow: feature
Task: Add user authentication
Agents: planner -> tdd-guide -> code-reviewer -> security-reviewer

SUMMARY
-------
[1 段落の要約]

AGENT OUTPUTS
-------------
Planner: [summary]
TDD Guide: [summary]
Code Reviewer: [summary]
Security Reviewer: [summary]

FILES CHANGED
-------------
[変更したファイル一覧]

TEST RESULTS
------------
[テストの合否サマリー]

SECURITY STATUS
---------------
[セキュリティの指摘]

RECOMMENDATION
--------------
[SHIP / NEEDS WORK / BLOCKED]
```

## 並列実行

独立したチェックは並列で実行する:

```markdown
### Parallel Phase
同時に実行:
- code-reviewer（品質）
- security-reviewer（セキュリティ）
- architect（設計）

### Merge Results
単一レポートに統合
```

## 引数

$ARGUMENTS:
- `feature <description>` - フル機能ワークフロー
- `bugfix <description>` - バグ修正ワークフロー
- `refactor <description>` - リファクタリングワークフロー
- `security <description>` - セキュリティレビューワークフロー
- `custom <agents> <description>` - カスタムエージェント順

## カスタムワークフロー例

```
/orchestrate custom "architect,tdd-guide,code-reviewer" "キャッシュ層を再設計する"
```

## ヒント

1. **複雑な機能は planner から開始**
2. **merge 前に code-reviewer を必ず含める**
3. **auth / payment / PII には security-reviewer を使う**
4. **引き継ぎは簡潔に** - 次のエージェントが必要な内容に集中
5. **必要ならエージェント間で検証を実行**
