---
name: django-verification
description: Django プロジェクト向けの検証ループ。マイグレーション、Lint、カバレッジ付きテスト、セキュリティスキャン、デプロイ準備チェックをリリースや PR 前に実施する。
---

# Django 検証ループ

PR 前、重要変更後、デプロイ前に実行して Django アプリの品質とセキュリティを確保する。

## フェーズ 1: 環境チェック

```bash
# Python バージョン確認
python --version  # プロジェクト要件と一致すること

# 仮想環境を確認
which python
pip list --outdated

# 環境変数を確認
python -c "import os; import environ; print('DJANGO_SECRET_KEY set' if os.environ.get('DJANGO_SECRET_KEY') else 'MISSING: DJANGO_SECRET_KEY')"
```

環境が誤っていれば停止して修正する。

## フェーズ 2: コード品質 & フォーマット

```bash
# 型チェック
mypy . --config-file pyproject.toml

# ruff で Lint
ruff check . --fix

# black でフォーマット
black . --check
black .  # 自動修正

# import ソート
isort . --check-only
isort .  # 自動修正

# Django 固有チェック
python manage.py check --deploy
```

よくある問題:
- 公開関数の型ヒント不足
- PEP 8 フォーマット違反
- import 未ソート
- 本番設定に DEBUG が残っている

## フェーズ 3: マイグレーション

```bash
# 未適用マイグレーションの確認
python manage.py showmigrations

# マイグレーション不足の確認
python manage.py makemigrations --check

# マイグレーション適用のドライラン
python manage.py migrate --plan

# マイグレーション適用（テスト環境）
python manage.py migrate

# マイグレーション衝突の確認
python manage.py makemigrations --merge  # 衝突がある場合のみ
```

レポート:
- 未適用マイグレーション数
- マイグレーション衝突の有無
- マイグレーションなしのモデル変更

## フェーズ 4: テスト + カバレッジ

```bash
# pytest で全テスト実行
pytest --cov=apps --cov-report=html --cov-report=term-missing --reuse-db

# 特定アプリのテスト
pytest apps/users/tests/

# マーカー指定
pytest -m "not slow"  # 遅いテストを除外
pytest -m integration  # 統合テストのみ

# カバレッジレポート
open htmlcov/index.html
```

レポート:
- 合計テスト数: X 成功, Y 失敗, Z スキップ
- 全体カバレッジ: XX%
- アプリ別カバレッジ内訳

カバレッジ目標:

| コンポーネント | 目標 |
|-----------|--------|
| Models | 90%+ |
| Serializers | 85%+ |
| Views | 80%+ |
| Services | 90%+ |
| Overall | 80%+ |

## フェーズ 5: セキュリティスキャン

```bash
# 依存関係の脆弱性
pip-audit
safety check --full-report

# Django セキュリティチェック
python manage.py check --deploy

# Bandit セキュリティ Lint
bandit -r . -f json -o bandit-report.json

# シークレットスキャン（gitleaks がある場合）
gitleaks detect --source . --verbose

# 環境変数チェック
python -c "from django.core.exceptions import ImproperlyConfigured; from django.conf import settings; settings.DEBUG"
```

レポート:
- 脆弱な依存関係の検出
- セキュリティ設定の問題
- ハードコードされたシークレット
- DEBUG モード状態（本番は False）

## フェーズ 6: Django 管理コマンド

```bash
# モデル問題の確認
python manage.py check

# 静的ファイルの収集
python manage.py collectstatic --noinput --clear

# スーパーユーザー作成（テストで必要な場合）
echo "from apps.users.models import User; User.objects.create_superuser('admin@example.com', 'admin')" | python manage.py shell

# DB 整合性
python manage.py check --database default

# キャッシュ検証（Redis 使用時）
python -c "from django.core.cache import cache; cache.set('test', 'value', 10); print(cache.get('test'))"
```

## フェーズ 7: パフォーマンス チェック

```bash
# Django Debug Toolbar の出力（N+1 クエリ確認）
# DEBUG=True の開発環境で起動しページにアクセス
# SQL パネルの重複クエリを確認

# クエリ数の分析
django-admin debugsqlshell  # django-debug-sqlshell がある場合

# インデックス不足の確認
python manage.py shell << EOF
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT table_name, index_name FROM information_schema.statistics WHERE table_schema = 'public'")
    print(cursor.fetchall())
EOF
```

レポート:
- ページあたりのクエリ数（通常は < 50）
- データベース インデックス不足
- 重複クエリの検出

## フェーズ 8: 静的アセット

```bash
# npm 依存関係チェック（npm 使用時）
npm audit
npm audit fix

# 静的ファイルのビルド（webpack/vite 使用時）
npm run build

# 静的ファイル確認
ls -la staticfiles/
python manage.py findstatic css/style.css
```

## フェーズ 9: 設定レビュー

```python
# Python shell で設定を検証
python manage.py shell << EOF
from django.conf import settings
import os

# 基本チェック
print(f"DEBUG: {settings.DEBUG}")
print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
print(f"DATABASES: {settings.DATABASES}")
print(f"CACHES: {settings.CACHES}")

# セキュリティチェック
print(f"SECRET_KEY set: {bool(settings.SECRET_KEY)}")
print(f"SECURE_SSL_REDIRECT: {settings.SECURE_SSL_REDIRECT}")
print(f"SESSION_COOKIE_SECURE: {settings.SESSION_COOKIE_SECURE}")
print(f"CSRF_COOKIE_SECURE: {settings.CSRF_COOKIE_SECURE}")
print(f"HSTS: {settings.SECURE_HSTS_SECONDS}")

# 環境チェック
print(f"Environment: {os.environ.get('ENVIRONMENT', 'unknown')}")
EOF
```

レポート:
- DEBUG が False であること
- ALLOWED_HOSTS が適切であること
- 本番セキュリティ設定が有効であること

## フェーズ 10: デプロイ準備

```bash
# 依存関係の freeze
pip freeze > requirements.txt

# マイグレーション確認
python manage.py makemigrations --check

# 収集済みの静的ファイル
python manage.py collectstatic --noinput

# 本番チェック
python manage.py check --deploy
```

## 出力テンプレート

```
検証レポート
===================
環境:        [PASS/FAIL]
品質:        [PASS/FAIL] (mypy/ruff/black)
マイグレーション: [PASS/FAIL]
テスト:      [PASS/FAIL] (X/Y passed, Z% coverage)
セキュリティ: [PASS/FAIL] (CVE findings: N)
パフォーマンス: [PASS/FAIL]
デプロイ:    [PASS/FAIL]

総合:        [READY / NOT READY]

修正すべき問題:
1. ...
2. ...
```

## 継続モード

- 大きな変更や 30–60 分ごとにフェーズを再実行する
- 短いループを保つ: `pytest --cov=apps` + `ruff` で素早いフィードバックを得る

注意: 速いフィードバックは遅い驚きに勝る。ゲートは厳格に保ち、本番システムでは警告も欠陥として扱う。
