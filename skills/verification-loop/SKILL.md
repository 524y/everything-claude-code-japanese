# 検証ループ スキル

Claude Code セッション向けの包括的な検証システムである。

## いつ使うか

このスキルを呼び出すのは次のときである:
- 機能や重要なコード変更を完了した後
- PR を作成する前
- 品質ゲートの通過を確認したいとき
- リファクタ後

## 検証フェーズ

### フェーズ 1: ビルド検証
```bash
# プロジェクトがビルドできるか確認する
npm run build 2>&1 | tail -20
# OR
pnpm build 2>&1 | tail -20
```

ビルドが失敗したら、続行せず STOP して修正する。

### フェーズ 2: 型チェック
```bash
# TypeScript プロジェクト
npx tsc --noEmit 2>&1 | head -30

# Python プロジェクト
pyright . 2>&1 | head -30
```

すべての型エラーを報告する。重大なものは続行前に修正する。

### フェーズ 3: Lint チェック
```bash
# JavaScript/TypeScript
npm run lint 2>&1 | head -30

# Python
ruff check . 2>&1 | head -30
```

### フェーズ 4: テストスイート
```bash
# カバレッジ付きでテストを実行する
npm run test -- --coverage 2>&1 | tail -50

# カバレッジしきい値を確認する
# 目標: 最低 80%
```

報告:
- 総テスト数: X
- 合格: X
- 失敗: X
- カバレッジ: X%

### フェーズ 5: セキュリティスキャン
```bash
# シークレットを確認する
grep -rn "sk-" --include="*.ts" --include="*.js" . 2>/dev/null | head -10
grep -rn "api_key" --include="*.ts" --include="*.js" . 2>/dev/null | head -10

# console.log を確認する
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10
```

### フェーズ 6: Diff レビュー
```bash
# 変更内容を表示する
git diff --stat
git diff HEAD~1 --name-only
```

各変更ファイルを次の観点でレビューする:
- 意図しない変更
- エラーハンドリングの不足
- 潜在的なエッジケース

## 出力形式

すべてのフェーズを実行したら、検証レポートを作成する:

```
VERIFICATION REPORT
==================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Overall:   [READY/NOT READY] for PR

Issues to Fix:
1. ...
2. ...
```

## 継続モード

長時間セッションでは 15 分ごと、または大きな変更の後に検証を実行する:

```markdown
メンタルチェックポイントを設定する:
- 各関数の完了後
- コンポーネントの完了後
- 次のタスクに移る前

実行: /verify
```

## フックとの統合

このスキルは PostToolUse フックを補完するが、より深い検証を提供する。
フックは即時に問題を捕捉し、このスキルは包括的なレビューを行う。
