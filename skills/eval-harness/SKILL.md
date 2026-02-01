---
name: eval-harness
description: Claude Code セッション向けに eval 駆動開発（EDD）原則を実装する正式な評価フレームワーク
tools: Read, Write, Edit, Bash, Grep, Glob
---

# Eval Harness スキル

Claude Code セッション向けの正式な評価フレームワークであり、eval 駆動開発（EDD）原則を実装する。

## 理念

Eval 駆動開発は eval を「AI 開発のユニットテスト」として扱う:
- 実装の前に期待される挙動を定義する
- 開発中は継続的に eval を実行する
- 変更ごとに回帰を追跡する
- 信頼性測定に pass@k 指標を使う

## Eval 種別

### 能力 eval
Claude が以前できなかったことをできるようになったかをテストする:
```markdown
[CAPABILITY EVAL: feature-name]
Task: Claude が達成すべき内容の説明
Success Criteria:
  - [ ] 基準 1
  - [ ] 基準 2
  - [ ] 基準 3
Expected Output: 期待される結果の説明
```

### 回帰 eval
変更が既存機能を壊していないことを確認する:
```markdown
[REGRESSION EVAL: feature-name]
Baseline: SHA または checkpoint 名
Tests:
  - existing-test-1: PASS/FAIL
  - existing-test-2: PASS/FAIL
  - existing-test-3: PASS/FAIL
Result: X/Y 合格（以前は Y/Y）
```

## グレーダー種別

### 1. コードベースのグレーダー
コードによる決定的なチェック:
```bash
# ファイルに期待するパターンが含まれるか確認する
grep -q "export function handleAuth" src/auth.ts && echo "PASS" || echo "FAIL"

# テストが通るか確認する
npm test -- --testPathPattern="auth" && echo "PASS" || echo "FAIL"

# ビルドが成功するか確認する
npm run build && echo "PASS" || echo "FAIL"
```

### 2. モデルベースのグレーダー
Claude を使って自由回答の出力を評価する:
```markdown
[MODEL GRADER PROMPT]
次のコード変更を評価する:
1. 記載された問題を解決しているか?
2. 構造は適切か?
3. エッジケースに対応しているか?
4. エラーハンドリングは適切か?

スコア: 1-5（1=低い、5=優秀）
理由: [説明]
```

### 3. 人手グレーダー
手動レビュー用にフラグする:
```markdown
[HUMAN REVIEW REQUIRED]
変更: 何が変わったかの説明
理由: 手動レビューが必要な理由
リスクレベル: LOW/MEDIUM/HIGH
```

## 指標

### pass@k
「k 回の試行で少なくとも 1 回成功」
- pass@1: 初回成功率
- pass@3: 3 回以内の成功率
- 典型的な目標: pass@3 > 90%

### pass^k
「k 回の試行がすべて成功」
- 信頼性に対するより高い基準
- pass^3: 3 回連続の成功
- 重要なパスに使う

## Eval ワークフロー

### 1. 定義（コーディング前）
```markdown
## EVAL DEFINITION: feature-xyz

### 能力 eval
1. 新規ユーザーアカウントを作成できる
2. メール形式を検証できる
3. パスワードを安全にハッシュ化できる

### 回帰 eval
1. 既存のログインが継続して動作する
2. セッション管理が変わらない
3. ログアウトフローが維持される

### 成功指標
- 能力 eval は pass@3 > 90%
- 回帰 eval は pass^3 = 100%
```

### 2. 実装
定義した eval を通すコードを書く。

### 3. 評価
```bash
# 能力 eval を実行する
[各能力 eval を実行し、PASS/FAIL を記録する]

# 回帰 eval を実行する
npm test -- --testPathPattern="existing"

# レポートを生成する
```

### 4. レポート
```markdown
EVAL REPORT: feature-xyz
========================

能力 eval:
  create-user:     PASS (pass@1)
  validate-email:  PASS (pass@2)
  hash-password:   PASS (pass@1)
  合計:            3/3 合格

回帰 eval:
  login-flow:      PASS
  session-mgmt:    PASS
  logout-flow:     PASS
  合計:            3/3 合格

指標:
  pass@1: 67% (2/3)
  pass@3: 100% (3/3)

ステータス: READY FOR REVIEW
```

## 統合パターン

### 実装前
```
/eval define feature-name
```
`.claude/evals/feature-name.md` に eval 定義ファイルを作成する

### 実装中
```
/eval check feature-name
```
現在の eval を実行し、ステータスを報告する

### 実装後
```
/eval report feature-name
```
完全な eval レポートを生成する

## Eval の保存先

プロジェクト内に eval を保存する:
```
.claude/
  evals/
    feature-xyz.md      # Eval 定義
    feature-xyz.log     # Eval 実行履歴
    baseline.json       # 回帰ベースライン
```

## ベストプラクティス

1. **コーディング前に eval を定義する** - 成功基準を明確に考えることを強制する
2. **eval を頻繁に実行する** - 回帰を早期に検出する
3. **pass@k を継続的に追跡する** - 信頼性の傾向を監視する
4. **可能な場合はコードグレーダーを使う** - 決定的 > 確率的
5. **セキュリティは人手レビュー** - セキュリティチェックを完全に自動化しない
6. **eval は高速に保つ** - 遅い eval は実行されない
7. **コードと一緒に eval をバージョン管理する** - eval は第一級の成果物である

## 例: 認証の追加

```markdown
## EVAL: add-authentication

### フェーズ 1: 定義（10 分）
能力 eval:
- [ ] メール / パスワードでユーザー登録できる
- [ ] 有効な認証情報でログインできる
- [ ] 無効な認証情報を適切なエラーで拒否する
- [ ] ページリロード後もセッションが維持される
- [ ] ログアウトでセッションが消える

回帰 eval:
- [ ] 公開ルートが引き続きアクセス可能
- [ ] API レスポンスが不変
- [ ] データベーススキーマが互換

### フェーズ 2: 実装（変動）
[コードを書く]

### フェーズ 3: 評価
実行: /eval check add-authentication

### フェーズ 4: レポート
EVAL REPORT: add-authentication
==============================
能力: 5/5 合格（pass@3: 100%）
回帰: 3/3 合格（pass^3: 100%）
ステータス: SHIP IT
```
