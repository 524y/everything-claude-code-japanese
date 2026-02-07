# Checkpoint コマンド

ワークフロー内のチェックポイントを作成または検証する。

## 使用方法

`/checkpoint [create|verify|list] [name]`

## チェックポイントを作成

チェックポイントを作成する時:

1. `/verify quick` を実行し、現在の状態がクリーンであることを確認する
2. チェックポイント名付きで git stash または commit を作成する
3. `.claude/checkpoints.log` にチェックポイントを記録する:

```bash
echo "$(date +%Y-%m-%d-%H:%M) | $CHECKPOINT_NAME | $(git rev-parse --short HEAD)" >> .claude/checkpoints.log
```

4. チェックポイント作成を報告する

## チェックポイントを検証

チェックポイントに対して検証する時:

1. ログからチェックポイントを読み取る
2. 現在の状態とチェックポイントを比較する:
   - チェックポイント以降に追加されたファイル
   - チェックポイント以降に変更されたファイル
   - テストの合格数の差分
   - カバレッジの差分

3. レポート:
```
CHECKPOINT COMPARISON: $NAME
============================
Files changed: X
Tests: +Y passed / -Z failed
Coverage: +X% / -Y%
Build: [PASS/FAIL]
```

## チェックポイントの一覧

次を含めてチェックポイントをすべて表示する:
- 名前
- タイムスタンプ
- Git SHA
- ステータス（current、behind、ahead）

## ワークフロー

一般的なチェックポイントの流れ:

```
[Start] --> /checkpoint create "feature-start"
   |
[Implement] --> /checkpoint create "core-done"
   |
[Test] --> /checkpoint verify "core-done"
   |
[Refactor] --> /checkpoint create "refactor-done"
   |
[PR] --> /checkpoint verify "feature-start"
```

## 引数

$ARGUMENTS:
- `create <name>` - 名前付きのチェックポイントを作成する
- `verify <name>` - 名前付きのチェックポイントと比較する
- `list` - チェックポイントを表示する
- `clear` - 古いチェックポイントを削除する（最後の 5 件は残す）
