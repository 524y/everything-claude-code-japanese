# Git ワークフロー

## コミットメッセージ形式

```
<type>: <description>

<optional body>
```

タイプ: feat, fix, refactor, docs, test, chore, perf, ci

注記: Attribution は ~/.claude/settings.json でグローバルに無効化されている。

## Pull Request ワークフロー

PR を作成するとき:
1. 最新コミットだけでなく、コミット履歴全体を分析する
2. `git diff [base-branch]...HEAD` で全変更を確認する
3. 包括的な PR サマリーをドラフトする
4. TODO 付きのテスト計画を含める
5. 新規ブランチの場合は `-u` フラグ付きで push する

## 機能実装ワークフロー

1. **まず計画**
   - **planner** エージェントを使って実装計画を作成する
   - 依存関係とリスクを特定する
   - フェーズに分解する

2. **TDD アプローチ**
   - **tdd-guide** エージェントを使う
   - テストを先に書く (RED)
   - テストに通るよう実装する (GREEN)
   - リファクタする (IMPROVE)
   - 80% + カバレッジを確認する

3. **コードレビュー**
   - コードを書いた直後に **code-reviewer** エージェントを使う
   - CRITICAL と HIGH の問題に対応する
   - 可能なら MEDIUM の問題を修正する

4. **コミット & プッシュ**
   - 詳細なコミットメッセージ
   - Conventional Commits 形式に従う
