# エージェントオーケストレーション

## 利用可能なエージェント

`~/.claude/agents/` に配置する:

| エージェント | 目的 | 使用タイミング |
|-------|---------|-------------|
| planner | 実装計画 | 複雑な機能、リファクタリング |
| architect | システム設計 | アーキテクチャ決定 |
| tdd-guide | テスト駆動開発 | 新機能、バグ修正 |
| code-reviewer | コードレビュー | コード変更後 |
| security-reviewer | セキュリティ分析 | コミット前 |
| build-error-resolver | ビルドエラー修正 | ビルド失敗時 |
| e2e-runner | E2E テスト | 重要ユーザーフロー |
| refactor-cleaner | デッドコード整理 | 保守作業 |
| doc-updater | ドキュメント更新 | docs 変更時 |

## 即時利用ルール

1. 複雑機能要求では **planner** を使う
2. コード変更直後は **code-reviewer** を使う
3. バグ修正 / 新機能では **tdd-guide** を使う
4. 設計判断では **architect** を使う

## 並列タスク実行

独立作業は並列で実行する:

```markdown
# GOOD: Parallel execution
3 つのエージェントを並列起動:
1. エージェント 1: auth モジュールのセキュリティ分析
2. エージェント 2: キャッシュの性能レビュー
3. エージェント 3: utilities の型チェック

# BAD: Sequential when unnecessary
エージェント 1 の後に 2、さらに 3 を順次実行
```

## 多面的分析

複雑課題では役割分担したサブエージェントを使う。
