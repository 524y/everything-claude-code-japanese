---
name: python-testing
description: pytest、TDD 手法、フィクスチャ、モック、パラメータ化、カバレッジ要件を用いた Python テスト戦略。
---

# Python テストパターン

pytest、TDD 手法、ベストプラクティスを使った Python アプリケーションの包括的なテスト戦略である。

## 使うタイミング

- 新しい Python コードを書くとき（TDD: red, green, refactor）
- Python プロジェクトのテストスイートを設計するとき
- Python テストカバレッジをレビューするとき
- テスト基盤を整備するとき

## コア テスト思想

### テスト駆動開発 (TDD)

常に TDD サイクルに従う:

1. **RED**: 期待する振る舞いの失敗テストを書く
2. **GREEN**: 最小の実装でテストを通す
3. **REFACTOR**: テストを緑のまま改善する

```python
# Step 1: 失敗するテストを書く (RED)
def test_add_numbers():
    result = add(2, 3)
    assert result == 5

# Step 2: 最小実装を書く (GREEN)
def add(a, b):
    return a + b

# Step 3: 必要ならリファクタ (REFACTOR)
```

### カバレッジ要件

- **目標**: 80% + カバレッジ
- **重要経路**: 100% カバレッジ必須
- `pytest --cov` でカバレッジを計測する

```bash
pytest --cov=mypackage --cov-report=term-missing --cov-report=html
```

## pytest の基礎

### 基本のテスト構造

```python
import pytest

def test_addition():
    """基本的な加算をテストする。"""
    assert 2 + 2 == 4

def test_string_uppercase():
    """文字列の大文字化をテストする。"""
    text = "hello"
    assert text.upper() == "HELLO"

def test_list_append():
    """リストの append をテストする。"""
    items = [1, 2, 3]
    items.append(4)
    assert 4 in items
    assert len(items) == 4
```

### アサーション

```python
# 等価
assert result == expected

# 不等
assert result != unexpected

# 真偽
assert result  # Truthy
assert not result  # Falsy
assert result is True  # 厳密に True
assert result is False  # 厳密に False
assert result is None  # 厳密に None

# 包含
assert item in collection
assert item not in collection

# 比較
assert result > 0
assert 0 <= result <= 100

# 型チェック
assert isinstance(result, str)

# 例外テスト（推奨）
with pytest.raises(ValueError):
    raise ValueError("error message")

# 例外メッセージの確認
with pytest.raises(ValueError, match="invalid input"):
    raise ValueError("invalid input provided")

# 例外属性の確認
with pytest.raises(ValueError) as exc_info:
    raise ValueError("error message")
assert str(exc_info.value) == "error message"
```

## フィクスチャ

### 基本のフィクスチャ

```python
import pytest

@pytest.fixture
def sample_data():
    """サンプルデータを提供するフィクスチャ。"""
    return {"name": "Alice", "age": 30}

def test_sample_data(sample_data):
    """フィクスチャを使ったテスト。"""
    assert sample_data["name"] == "Alice"
    assert sample_data["age"] == 30
```

### セットアップ / ティアダウン付きフィクスチャ

```python
@pytest.fixture
def database():
    """セットアップ / ティアダウン付きフィクスチャ。"""
    # Setup
    db = Database(":memory:")
    db.create_tables()
    db.insert_test_data()

    yield db  # テストに提供

    # Teardown
    db.close()

def test_database_query(database):
    """データベース操作のテスト。"""
    result = database.query("SELECT * FROM users")
    assert len(result) > 0
```

### フィクスチャのスコープ

```python
# Function スコープ (デフォルト) - 各テストで実行
@pytest.fixture
def temp_file():
    with open("temp.txt", "w") as f:
        yield f
    os.remove("temp.txt")

# Module スコープ - モジュールごとに 1 回
@pytest.fixture(scope="module")
def module_db():
    db = Database(":memory:")
    db.create_tables()
    yield db
    db.close()

# Session スコープ - テストセッションごとに 1 回
@pytest.fixture(scope="session")
def shared_resource():
    resource = ExpensiveResource()
    yield resource
    resource.cleanup()
```

### パラメータ付きフィクスチャ

```python
@pytest.fixture(params=[1, 2, 3])
def number(request):
    """パラメータ化フィクスチャ。"""
    return request.param

def test_numbers(number):
    """パラメータごとに 3 回実行される。"""
    assert number > 0
```

### 複数フィクスチャの使用

```python
@pytest.fixture
def user():
    return User(id=1, name="Alice")

@pytest.fixture
def admin():
    return User(id=2, name="Admin", role="admin")

def test_user_admin_interaction(user, admin):
    """複数フィクスチャを使ったテスト。"""
    assert admin.can_manage(user)
```

### Autouse フィクスチャ

```python
@pytest.fixture(autouse=True)
def reset_config():
    """各テストの前に自動実行する。"""
    Config.reset()
    yield
    Config.cleanup()

def test_without_fixture_call():
    # reset_config が自動で実行される
    assert Config.get_setting("debug") is False
```

### 共有フィクスチャのための conftest.py

```python
# tests/conftest.py
import pytest

@pytest.fixture
def client():
    """全テストで共有するフィクスチャ。"""
    app = create_app(testing=True)
    with app.test_client() as client:
        yield client

@pytest.fixture
def auth_headers(client):
    """API テスト用の認証ヘッダーを生成する。"""
    response = client.post("/api/login", json={
        "username": "test",
        "password": "test"
    })
    token = response.json["token"]
    return {"Authorization": f"Bearer {token}"}
```

## パラメータ化

### 基本のパラメータ化

```python
@pytest.mark.parametrize("input,expected", [
    ("hello", "HELLO"),
    ("world", "WORLD"),
    ("PyThOn", "PYTHON"),
])
def test_uppercase(input, expected):
    """異なる入力で 3 回実行される。"""
    assert input.upper() == expected
```

### 複数パラメータ

```python
@pytest.mark.parametrize("a,b,expected", [
    (2, 3, 5),
    (0, 0, 0),
    (-1, 1, 0),
    (100, 200, 300),
])
def test_add(a, b, expected):
    """複数入力で加算をテストする。"""
    assert add(a, b) == expected
```

### ID 付きパラメータ化

```python
@pytest.mark.parametrize("input,expected", [
    ("valid@email.com", True),
    ("invalid", False),
    ("@no-domain.com", False),
], ids=["valid-email", "missing-at", "missing-domain"])
def test_email_validation(input, expected):
    """読みやすいテスト ID で email 検証を行う。"""
    assert is_valid_email(input) is expected
```

### パラメータ化フィクスチャ

```python
@pytest.fixture(params=["sqlite", "postgresql", "mysql"])
def db(request):
    """複数 DB バックエンドでテストする。"""
    if request.param == "sqlite":
        return Database(":memory:")
    elif request.param == "postgresql":
        return Database("postgresql://localhost/test")
    elif request.param == "mysql":
        return Database("mysql://localhost/test")

def test_database_operations(db):
    """DB ごとに 3 回実行される。"""
    result = db.query("SELECT 1")
    assert result is not None
```

## マーカーとテスト選択

### カスタムマーカー

```python
# 遅いテストをマーク
@pytest.mark.slow
def test_slow_operation():
    time.sleep(5)

# 統合テストをマーク
@pytest.mark.integration
def test_api_integration():
    response = requests.get("https://api.example.com")
    assert response.status_code == 200

# ユニットテストをマーク
@pytest.mark.unit
def test_unit_logic():
    assert calculate(2, 3) == 5
```

### 特定のテストだけ実行する

```bash
# 速いテストだけ実行
pytest -m "not slow"

# 統合テストのみ実行
pytest -m integration

# 統合または遅いテスト
pytest -m "integration or slow"

# ユニットテストで遅くないもの
pytest -m "unit and not slow"
```

### pytest.ini でマーカーを設定する

```ini
[pytest]
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
    django: marks tests as requiring Django
```

## モックとパッチ

### 関数のモック

```python
from unittest.mock import patch, Mock

@patch("mypackage.external_api_call")
def test_with_mock(api_call_mock):
    """外部 API をモックしてテストする。"""
    api_call_mock.return_value = {"status": "success"}

    result = my_function()

    api_call_mock.assert_called_once()
    assert result["status"] == "success"
```

### 戻り値のモック

```python
@patch("mypackage.Database.connect")
def test_database_connection(connect_mock):
    """DB 接続をモックしてテストする。"""
    connect_mock.return_value = MockConnection()

    db = Database()
    db.connect()

    connect_mock.assert_called_once_with("localhost")
```

### 例外のモック

```python
@patch("mypackage.api_call")
def test_api_error_handling(api_call_mock):
    """例外をモックしてエラーハンドリングをテストする。"""
    api_call_mock.side_effect = ConnectionError("Network error")

    with pytest.raises(ConnectionError):
        api_call()
        api_call()

    api_call_mock.assert_called_once()
```

### コンテキストマネージャのモック

```python
@patch("builtins.open", new_callable=mock_open)
def test_file_reading(mock_file):
    """open をモックしてファイル読み込みをテストする。"""
    mock_file.return_value.read.return_value = "file content"

    result = read_file("test.txt")

    mock_file.assert_called_once_with("test.txt", "r")
    assert result == "file content"
```

### autospec の使用

```python
@patch("mypackage.DBConnection", autospec=True)
def test_autospec(db_mock):
    """autospec で API 誤用を検出する。"""
    db = db_mock.return_value
    db.query("SELECT * FROM users")

    # DBConnection に query がないと失敗する
    db_mock.assert_called_once()
```

### クラス インスタンスのモック

```python
class TestUserService:
    @patch("mypackage.UserRepository")
    def test_create_user(self, repo_mock):
        """リポジトリをモックしてユーザー作成をテストする。"""
        repo_mock.return_value.save.return_value = User(id=1, name="Alice")

        service = UserService(repo_mock.return_value)
        user = service.create_user(name="Alice")

        assert user.name == "Alice"
        repo_mock.return_value.save.assert_called_once()
```

### プロパティのモック

```python
@pytest.fixture
def mock_config():
    """プロパティ付きモックを作る。"""
    config = Mock()
    type(config).debug = PropertyMock(return_value=True)
    type(config).api_key = PropertyMock(return_value="test-key")
    return config

def test_with_mock_config(mock_config):
    """モックした config プロパティでテストする。"""
    assert mock_config.debug is True
    assert mock_config.api_key == "test-key"
```

## 非同期コードのテスト

### pytest-asyncio での非同期テスト

```python
import pytest

@pytest.mark.asyncio
async def test_async_function():
    """async 関数をテストする。"""
    result = await async_add(2, 3)
    assert result == 5

@pytest.mark.asyncio
async def test_async_with_fixture(async_client):
    """async フィクスチャを使ってテストする。"""
    response = await async_client.get("/api/users")
    assert response.status_code == 200
```

### 非同期フィクスチャ

```python
@pytest.fixture
async def async_client():
    """async テストクライアントを提供するフィクスチャ。"""
    app = create_app()
    async with app.test_client() as client:
        yield client

@pytest.mark.asyncio
async def test_api_endpoint(async_client):
    """async フィクスチャでテストする。"""
    response = await async_client.get("/api/data")
    assert response.status_code == 200
```

### async 関数のモック

```python
@pytest.mark.asyncio
@patch("mypackage.async_api_call")
async def test_async_mock(api_call_mock):
    """async 関数をモックしてテストする。"""
    api_call_mock.return_value = {"status": "ok"}

    result = await my_async_function()

    api_call_mock.assert_awaited_once()
    assert result["status"] == "ok"
```

## 例外のテスト

### 期待例外のテスト

```python
def test_divide_by_zero():
    """0 で割ると ZeroDivisionError が送出されることをテストする。"""
    with pytest.raises(ZeroDivisionError):
        divide(10, 0)

def test_custom_exception():
    """メッセージ付きのカスタム例外をテストする。"""
    with pytest.raises(ValueError, match="invalid input"):
        validate_input("invalid")
```

### 例外属性のテスト

```python
def test_exception_with_details():
    """カスタム属性を持つ例外をテストする。"""
    with pytest.raises(CustomError) as exc_info:
        raise CustomError("error", code=400)

    assert exc_info.value.code == 400
    assert "error" in str(exc_info.value)
```

## 副作用のテスト

### ファイル操作のテスト

```python
import tempfile
import os

def test_file_processing():
    """一時ファイルでファイル処理をテストする。"""
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
        f.write("test content")
        temp_path = f.name

    try:
        result = process_file(temp_path)
        assert result == "processed: test content"
    finally:
        os.unlink(temp_path)
```

### pytest の tmp_path フィクスチャ

```python
def test_with_tmp_path(tmp_path):
    """pytest 組み込みの一時パス フィクスチャを使う。"""
    test_file = tmp_path / "test.txt"
    test_file.write_text("hello world")

    result = process_file(str(test_file))
    assert result == "hello world"
    # tmp_path は自動でクリーンアップされる
```

### tmpdir フィクスチャ

```python
def test_with_tmpdir(tmpdir):
    """pytest の tmpdir フィクスチャを使う。"""
    test_file = tmpdir.join("test.txt")
    test_file.write("data")

    result = process_file(str(test_file))
    assert result == "data"
```

## テスト構成

### ディレクトリ構成

```
tests/
├── conftest.py                 # 共有フィクスチャ
├── __init__.py
├── unit/                       # ユニットテスト
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_utils.py
│   └── test_services.py
├── integration/                # 統合テスト
│   ├── __init__.py
│   ├── test_api.py
│   └── test_database.py
└── e2e/                        # エンドツーエンド テスト
    ├── __init__.py
    └── test_user_flow.py
```

### テストクラス

```python
class TestUserService:
    """関連するテストをクラスにまとめる。"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """このクラスの各テストの前に setup が走る。"""
        self.service = UserService()

    def test_create_user(self):
        """ユーザー作成をテストする。"""
        user = self.service.create_user("Alice")
        assert user.name == "Alice"

    def test_delete_user(self):
        """ユーザー削除をテストする。"""
        user = User(id=1, name="Bob")
        self.service.delete_user(user)
        assert not self.service.user_exists(1)
```

## ベストプラクティス

### DO

- **TDD を守る**: コードの前にテストを書く (red-green-refactor)
- **1 テスト 1 目的**: 各テストは 1 つの振る舞いだけ確認する
- **説明的な名前**: `test_user_login_with_invalid_credentials_fails`
- **フィクスチャを使う**: フィクスチャで重複を排除する
- **外部依存をモックする**: 外部サービスに依存しない
- **エッジケースをテストする**: 空入力、None、境界条件
- **80% + カバレッジを目指す**: 重要経路に集中する
- **テストを速く保つ**: 遅いテストを分離する

### DON'T

- **実装をテストしない**: 内部ではなく振る舞いをテストする
- **テストで複雑な条件分岐を使わない**: シンプルに保つ
- **テスト失敗を無視しない**: 全テストは通す
- **サードパーティをテストしない**: ライブラリを信頼する
- **テスト間で状態を共有しない**: テストは独立させる
- **例外を握り潰さない**: `pytest.raises` を使う
- **print を使わない**: アサーションと pytest 出力を使う
- **脆いテストを書かない**: 過度に具体的なモックを避ける

## よくあるパターン

### API エンドポイントのテスト (FastAPI / Flask)

```python
@pytest.fixture
def client():
    app = create_app(testing=True)
    return app.test_client()

def test_get_user(client):
    response = client.get("/api/users/1")
    assert response.status_code == 200
    assert response.json["id"] == 1

def test_create_user(client):
    response = client.post("/api/users", json={
        "name": "Alice",
        "email": "alice@example.com"
    })
    assert response.status_code == 201
    assert response.json["name"] == "Alice"
```

### データベース操作のテスト

```python
@pytest.fixture
def db_session():
    """テスト用 DB セッションを作る。"""
    session = Session(bind=engine)
    session.begin_nested()
    yield session
    session.rollback()
    session.close()

def test_create_user(db_session):
    user = User(name="Alice", email="alice@example.com")
    db_session.add(user)
    db_session.commit()

    retrieved = db_session.query(User).filter_by(name="Alice").first()
    assert retrieved.email == "alice@example.com"
```

### クラスメソッドのテスト

```python
class TestCalculator:
    @pytest.fixture
    def calculator(self):
        return Calculator()

    def test_add(self, calculator):
        assert calculator.add(2, 3) == 5

    def test_divide_by_zero(self, calculator):
        with pytest.raises(ZeroDivisionError):
            calculator.divide(10, 0)
```

## pytest 設定

### pytest.ini

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --strict-markers
    --disable-warnings
    --cov=mypackage
    --cov-report=term-missing
    --cov-report=html
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
    unit: marks tests as unit tests
```

### pyproject.toml

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "--strict-markers",
    "--cov=mypackage",
    "--cov-report=term-missing",
    "--cov-report=html",
]
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests",
]
```

## テストの実行

```bash
# すべてのテストを実行
pytest

# 特定ファイルを実行
pytest tests/test_utils.py

# 特定テストを実行
pytest tests/test_utils.py::test_function

# 詳細出力
pytest -v

# カバレッジ付きで実行
pytest --cov=mypackage --cov-report=html

# 速いテストだけ実行
pytest -m "not slow"

# 最初の失敗で停止
pytest -x

# N 件の失敗で停止
pytest --maxfail=3

# 最後に失敗したテストを再実行
pytest --lf

# パターン指定で実行
pytest -k "test_user"

# 失敗時にデバッガ起動
pytest --pdb
```

## クイックリファレンス

| パターン | 使いどころ |
|---------|-------|
| `pytest.raises()` | 期待例外のテスト |
| `@pytest.fixture()` | 再利用可能なテスト フィクスチャ |
| `@pytest.mark.parametrize()` | 複数入力でテストを実行 |
| `@pytest.mark.slow` | 遅いテストのマーク |
| `pytest -m "not slow"` | 遅いテストをスキップ |
| `@patch()` | 関数やクラスのモック |
| `tmp_path` フィクスチャ | 自動の一時ディレクトリ |
| `pytest --cov` | カバレッジ レポート生成 |
| `assert` | シンプルで読みやすいアサーション |

**注意**: テストもコードである。クリーンで読みやすく、保守しやすく保つ。良いテストはバグを捕まえ、優れたテストはそれを未然に防ぐ。
