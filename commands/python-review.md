---
description: PEP 8 準拠、型ヒント、セキュリティ、Python 的な慣用表現の包括的な Python コードレビューを行う。python-reviewer エージェントを呼び出す。
---

# Python Code Review

このコマンドは **python-reviewer** エージェントを呼び出し、Python 固有の包括的なコードレビューを行う。

## このコマンドの内容

1. **Python 変更の特定**: `git diff` で変更された `.py` ファイルを見つける
2. **静的解析の実行**: `ruff`、`mypy`、`pylint`、`black --check` を実行
3. **セキュリティスキャン**: SQL injection、コマンドインジェクション、安全でないデシリアライズを確認
4. **型安全性レビュー**: 型ヒントと mypy エラーを分析する
5. **Pythonic Code チェック**: PEP 8 と Python ベストプラクティスの遵守を検証
6. **レポート生成**: 重要度ごとに分類する

## 使用するタイミング

`/python-review` を使う場面:
- Python コードを書いた / 変更した後
- Python の変更を commit する前
- Python コードを含む PR をレビューする
- 新しい Python コードベースにオンボードする
- Python 的なパターンやイディオムを学ぶ

## レビュー区分

### CRITICAL（必ず修正）
- SQL/Command injection 脆弱性
- 安全でない eval/exec の使用
- pickle の安全でないデシリアライズ
- ハードコードされた認証情報
- YAML の unsafe load
- 裸の except でエラーを隠す

### HIGH（修正推奨）
- 公開関数に型ヒントがない
- 可変なデフォルト引数
- 例外の黙殺
- リソース管理にコンテキストマネージャを使っていない
- 内包表記ではなく C 風ループを使っている
- isinstance ではなく type() を使っている
- ロックなしのレースコンディション

### MEDIUM（検討）
- PEP 8 フォーマット違反
- 公開関数に docstring がない
- logging の代わりに print を使っている
- 非効率な文字列操作
- 名前付き定数のないマジックナンバー
- f-string ではないフォーマット
- 不要なリスト生成

## 実行する自動チェック

```bash
# 型チェック
mypy .

# Lint とフォーマット
ruff check .
black --check .
isort --check-only .

# セキュリティスキャン
bandit -r .

# 依存関係監査
pip-audit
safety check

# テスト
pytest --cov=app --cov-report=term-missing
```

## 使用例

```text
ユーザー: /python-review

エージェント:
# Python コードレビュー レポート

## レビュー対象ファイル
- app/routes/user.py (変更済み)
- app/services/auth.py (変更済み)

## 静的解析の結果
✓ ruff: 問題なし
✓ mypy: エラーなし
⚠️ black: 2 ファイルの再フォーマットが必要
✓ bandit: セキュリティ問題なし

## 発見された問題

[CRITICAL] SQL Injection 脆弱性
ファイル: app/routes/user.py:42
問題: ユーザー入力を SQL クエリに直接埋め込んでいる
```python
query = f"SELECT * FROM users WHERE id = {user_id}"  # Bad
```
修正: パラメータ化クエリを使う
```python
query = "SELECT * FROM users WHERE id = %s"  # Good
cursor.execute(query, (user_id,))
```

[HIGH] 可変なデフォルト引数
ファイル: app/services/auth.py:18
問題: 可変なデフォルト引数により状態が共有される
```python
def process_items(items=[]):  # Bad
    items.append("new")
    return items
```
修正: デフォルトに None を使う
```python
def process_items(items=None):  # Good
    if items is None:
        items = []
    items.append("new")
    return items
```

[MEDIUM] 型ヒント不足
ファイル: app/services/auth.py:25
問題: 公開関数に型注釈がない
```python
def get_user(user_id):  # Bad
    return db.find(user_id)
```
修正: 型ヒントを追加する
```python
def get_user(user_id: str) -> Optional[User]:  # Good
    return db.find(user_id)
```

[MEDIUM] コンテキストマネージャ未使用
ファイル: app/routes/user.py:55
問題: 例外時にファイルが閉じない
```python
f = open("config.json")  # Bad
data = f.read()
f.close()
```
修正: コンテキストマネージャを使う
```python
with open("config.json") as f:  # Good
    data = f.read()
```

## サマリー
- CRITICAL: 1
- HIGH: 1
- MEDIUM: 2

Recommendation: ❌ Block merge until CRITICAL issue is fixed

## フォーマットが必要
実行: `black app/routes/user.py app/services/auth.py`
```

## 承認基準

| ステータス | 条件 |
| ✅ Approve | CRITICAL または HIGH がない |
| ⚠️ Warning | MEDIUM のみ（注意してマージ） |
| ❌ Block | CRITICAL または HIGH がある |

## 他コマンドとの連携

- `/python-test` を先に使いテスト通過を確認する
- 非 Python の観点は `/code-review` を使う
- commit 前に `/python-review` を使う
- 静的解析ツールが失敗したら `/build-fix` を使う

## フレームワーク別レビュー

### Django プロジェクト
レビュアーは次を確認する:
- N+1 クエリ（`select_related` / `prefetch_related`）
- モデル変更のマイグレーション不足
- ORM で済むところの生 SQL 使用
- 複数ステップ操作の `transaction.atomic()` 不足

### FastAPI プロジェクト
レビュアーは次を確認する:
- CORS 設定ミス
- リクエスト バリデーション用の Pydantic モデル
- レスポンス モデルの妥当性
- async/await の適切な使用
- 依存性注入パターン

### Flask プロジェクト
レビュアーは次を確認する:
- コンテキスト管理（app context、request context）
- 適切なエラーハンドリング
- Blueprint の構成
