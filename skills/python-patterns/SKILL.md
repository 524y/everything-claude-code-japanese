---
name: python-patterns
description: 堅牢で効率的かつ保守しやすい Python アプリケーションを構築するための Python 的な慣用表現、PEP 8 標準、型ヒント、ベストプラクティス。
---

# Python 開発パターン

堅牢で効率的かつ保守しやすいアプリケーションを構築するための Python 的なパターンとベストプラクティスである。

## 使うタイミング

- 新しい Python コードを書くとき
- Python コードをレビューするとき
- 既存の Python コードをリファクタするとき
- Python パッケージ / モジュールを設計するとき

## コア原則

### 1. Readability Counts

Python は可読性を優先する。コードは明白で理解しやすいべきである。

```python
# Good: 明確で読みやすい
def get_active_users(users: list[User]) -> list[User]:
    """提供されたリストからアクティブなユーザーのみを返す。"""
    return [user for user in users if user.is_active]


# Bad: 巧妙だが分かりにくい
def get_active_users(u):
    return [x for x in u if x.a]
```

### 2. Explicit is Better Than Implicit

魔法のような挙動は避け、コードが何をしているかを明確にする。

```python
# Good: 明示的な設定
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Bad: 隠れた副作用
import some_module
some_module.setup()  # これは何をするのか?
```

### 3. EAFP - Easier to Ask Forgiveness Than Permission

Python は条件チェックより例外処理を好む。

```python
# Good: EAFP スタイル
def get_value(dictionary: dict, key: str) -> Any:
    try:
        return dictionary[key]
    except KeyError:
        return default_value

# Bad: LBYL (Look Before You Leap) スタイル
def get_value(dictionary: dict, key: str) -> Any:
    if key in dictionary:
        return dictionary[key]
    else:
        return default_value
```

## 型ヒント

### 基本の型アノテーション

```python
from typing import Optional, List, Dict, Any

def process_user(
    user_id: str,
    data: Dict[str, Any],
    active: bool = True
) -> Optional[User]:
    """ユーザーを処理し、更新された User または None を返す。"""
    if not active:
        return None
    return User(user_id, data)
```

### モダンな型ヒント (Python 3.9+)

```python
# Python 3.9+ - 組み込み型を使う
def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# Python 3.8 以前 - typing モジュールを使う
from typing import List, Dict

def process_items(items: List[str]) -> Dict[str, int]:
    return {item: len(item) for item in items}
```

### 型エイリアスと TypeVar

```python
from typing import TypeVar, Union

# 複雑な型の型エイリアス
JSON = Union[dict[str, Any], list[Any], str, int, float, bool, None]

def parse_json(data: str) -> JSON:
    return json.loads(data)

# ジェネリック型
T = TypeVar('T')

def first(items: list[T]) -> T | None:
    """リストが空なら None、そうでなければ先頭要素を返す。"""
    return items[0] if items else None
```

### Protocol ベースのダックタイピング

```python
from typing import Protocol

class Renderable(Protocol):
    def render(self) -> str:
        """オブジェクトを文字列へ描画する。"""

def render_all(items: list[Renderable]) -> str:
    """Renderable プロトコルを実装するアイテムをすべて描画する。"""
    return "\n".join(item.render() for item in items)
```

## エラーハンドリング パターン

### 具体的な例外ハンドリング

```python
# Good: 具体的な例外を捕捉する
def load_config(path: str) -> Config:
    try:
        with open(path) as f:
            return Config.from_json(f.read())
    except FileNotFoundError as e:
        raise ConfigError(f"設定ファイルが見つからない: {path}") from e
    except json.JSONDecodeError as e:
        raise ConfigError(f"設定 JSON が不正: {path}") from e

# Bad: 裸の except
def load_config(path: str) -> Config:
    try:
        with open(path) as f:
            return Config.from_json(f.read())
    except:
        return None  # 黙って失敗する!
```

### 例外チェーン

```python
def process_data(data: str) -> Result:
    try:
        parsed = json.loads(data)
    except json.JSONDecodeError as e:
        # トレースバックを保持するために例外を連鎖させる
        raise ValueError(f"データの解析に失敗: {data}") from e
```

### カスタム例外階層

```python
class AppError(Exception):
    """アプリケーション エラーの基底例外。"""
    pass

class ValidationError(AppError):
    """入力バリデーションが失敗したときに送出する。"""
    pass

class NotFoundError(AppError):
    """要求されたリソースが見つからないときに送出する。"""
    pass

# 使用例
def get_user(user_id: str) -> User:
    user = db.find_user(user_id)
    if not user:
        raise NotFoundError(f"ユーザーが見つからない: {user_id}")
    return user
```

## コンテキストマネージャ

### リソース管理

```python
# Good: コンテキストマネージャを使う
def process_file(path: str) -> str:
    with open(path, 'r') as f:
        return f.read()

# Bad: 手動でリソース管理する
def process_file(path: str) -> str:
    f = open(path, 'r')
    try:
        return f.read()
    finally:
        f.close()
```

### カスタム コンテキストマネージャ

```python
from contextlib import contextmanager

@contextmanager
def timer(name: str):
    """コード ブロックを計測するコンテキストマネージャ。"""
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    print(f"{name} は {elapsed:.4f} 秒かかった")

# 使用例
with timer("data processing"):
    process_large_dataset()
```

### コンテキストマネージャ クラス

```python
class DatabaseTransaction:
    def __init__(self, connection):
        self.connection = connection

    def __enter__(self):
        self.connection.begin_transaction()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.connection.commit()
        else:
            self.connection.rollback()
        return False  # 例外を抑制しない

# 使用例
with DatabaseTransaction(conn):
    user = conn.create_user(user_data)
    conn.create_profile(user.id, profile_data)
```

## 内包表記とジェネレータ

### リスト内包表記

```python
# Good: 単純な変換にはリスト内包表記を使う
names = [user.name for user in users if user.is_active]

# Bad: 手動ループ
names = []
for user in users:
    if user.is_active:
        names.append(user.name)

# 複雑な内包表記は展開する
# Bad: 複雑すぎる
result = [x * 2 for x in items if x > 0 if x % 2 == 0]

# Good: ジェネレータ関数を使う
def filter_and_transform(items: Iterable[int]) -> list[int]:
    result = []
    for x in items:
        if x > 0 and x % 2 == 0:
            result.append(x * 2)
    return result
```

### ジェネレータ式

```python
# Good: 遅延評価のためのジェネレータ
total = sum(x * x for x in range(1_000_000))

# Bad: 大きな中間リストを作る
total = sum([x * x for x in range(1_000_000)])
```

### ジェネレータ関数

```python
def read_large_file(path: str) -> Iterator[str]:
    """大きなファイルを 1 行ずつ読む。"""
    with open(path) as f:
        for line in f:
            yield line.strip()

# 使用例
for line in read_large_file("huge.txt"):
    process(line)
```

## データクラスと named tuple

### データクラス

```python
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class User:
    """__init__、__repr__、__eq__ を自動生成するユーザー エンティティ。"""
    id: str
    name: str
    email: str
    created_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True

# 使用例
user = User(
    id="123",
    name="Alice",
    email="alice@example.com"
)
```

### バリデーション付きデータクラス

```python
@dataclass
class User:
    email: str
    age: int

    def __post_init__(self):
        # email 形式を検証する
        if "@" not in self.email:
            raise ValueError(f"無効な email: {self.email}")
        # 年齢の範囲を検証する
        if self.age < 0 or self.age > 150:
            raise ValueError(f"無効な年齢: {self.age}")
```

### named tuple

```python
from typing import NamedTuple

class Point(NamedTuple):
    """不変の 2D 点。"""
    x: float
    y: float

    def distance(self, other: 'Point') -> float:
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5

# 使用例
p1 = Point(0, 0)
p2 = Point(3, 4)
print(p1.distance(p2))  # 5.0
```

## デコレータ

### 関数デコレータ

```python
import functools
import time

def timer(func: Callable) -> Callable:
    """関数実行時間を計測するデコレータ。"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} は {elapsed:.4f}s かかった")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)

# slow_function() は: slow_function took 1.0012s を出力する
```

### パラメータ付きデコレータ

```python
def repeat(times: int):
    """関数を複数回実行するデコレータ。"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            results = []
            for _ in range(times):
                results.append(func(*args, **kwargs))
            return results
        return wrapper
    return decorator

@repeat(times=3)
def greet(name: str) -> str:
    return f"Hello, {name}!"

# greet("Alice") は ["Hello, Alice!", "Hello, Alice!", "Hello, Alice!"] を返す
```

### クラスベース デコレータ

```python
class CountCalls:
    """関数が呼ばれた回数をカウントするデコレータ。"""
    def __init__(self, func: Callable):
        functools.update_wrapper(self, func)
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        print(f"{self.func.__name__} は {self.count} 回呼ばれた")
        return self.func(*args, **kwargs)

@CountCalls
def process():
    pass

# process() を呼ぶたびに回数を出力する
```

## 並行処理パターン

### I/O バウンドタスク向けの threading

```python
import concurrent.futures
import threading

def fetch_url(url: str) -> str:
    """URL を取得する (I/O バウンド操作)。"""
    import urllib.request
    with urllib.request.urlopen(url) as response:
        return response.read().decode()

def fetch_all_urls(urls: list[str]) -> dict[str, str]:
    """スレッドで複数の URL を並行取得する。"""
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_url = {executor.submit(fetch_url, url): url for url in urls}
        results = {}
        for future in concurrent.futures.as_completed(future_to_url):
            url = future_to_url[future]
            try:
                results[url] = future.result()
            except Exception as e:
                results[url] = f"エラー: {e}"
    return results
```

### CPU バウンドタスク向けの multiprocessing

```python
def process_data(data: list[int]) -> int:
    """CPU 集約計算。"""
    return sum(x ** 2 for x in data)

def process_all(datasets: list[list[int]]) -> list[int]:
    """複数プロセスで複数データセットを処理する。"""
    with concurrent.futures.ProcessPoolExecutor() as executor:
        results = list(executor.map(process_data, datasets))
    return results
```

### I/O 並行処理向けの async/await

```python
import asyncio

async def fetch_async(url: str) -> str:
    """URL を非同期に取得する。"""
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()

async def fetch_all(urls: list[str]) -> dict[str, str]:
    """複数の URL を並行取得する。"""
    tasks = [fetch_async(url) for url in urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return dict(zip(urls, results))
```

## パッケージ構成

### 標準のプロジェクト レイアウト

```
myproject/
├── src/
│   └── mypackage/
│       ├── __init__.py
│       ├── main.py
│       ├── api/
│       │   ├── __init__.py
│       │   └── routes.py
│       ├── models/
│       │   ├── __init__.py
│       │   └── user.py
│       └── utils/
│           ├── __init__.py
│           └── helpers.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_api.py
│   └── test_models.py
├── pyproject.toml
├── README.md
└── .gitignore
```

### import の規約

```python
# Good: import 順 - stdlib、サードパーティ、ローカル
import os
import sys
from pathlib import Path

import requests
from fastapi import FastAPI

from mypackage.models import User
from mypackage.utils import format_name

# Good: import の自動整列には isort を使う
# pip install isort
```

### パッケージ公開のための __init__.py

```python
# mypackage/__init__.py
"""mypackage - サンプル Python パッケージ。"""

__version__ = "1.0.0"

# パッケージ レベルで主要クラス / 関数を公開する
from mypackage.models import User, Post
from mypackage.utils import format_name

__all__ = ["User", "Post", "format_name"]
```

## メモリとパフォーマンス

### __slots__ を使ったメモリ効率

```python
# Bad: 通常クラスは __dict__ を使う (メモリが多い)
class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

# Good: __slots__ でメモリ使用量を削減する
class Point:
    __slots__ = ['x', 'y']

    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y
```

### 大量データ向けジェネレータ

```python
# Bad: メモリに全リストを返す
def read_lines(path: str) -> list[str]:
    with open(path) as f:
        return [line.strip() for line in f]

# Good: 1 行ずつ yield する
def read_lines(path: str) -> Iterator[str]:
    with open(path) as f:
        for line in f:
            yield line.strip()
```

### ループでの文字列連結を避ける

```python
# Bad: 文字列が不変なため O(n²)
result = ""
for item in items:
    result += str(item)

# Good: join で O(n)
result = "".join(str(item) for item in items)

# Good: StringIO で組み立てる
from io import StringIO

buffer = StringIO()
for item in items:
    buffer.write(str(item))
result = buffer.getvalue()
```

## Python ツール連携

### 必須コマンド

```bash
# コードフォーマット
black .
isort .

# Lint
ruff check .
pylint mypackage/

# 型チェック
mypy .

# テスト
pytest --cov=mypackage --cov-report=html

# セキュリティスキャン
bandit -r .

# 依存関係管理
pip-audit
safety check
```

### pyproject.toml 設定

```toml
[project]
name = "mypackage"
version = "1.0.0"
requires-python = ">=3.9"
dependencies = [
    "requests>=2.31.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
    "mypy>=1.5.0",
]

[tool.black]
line-length = 88
target-version = ['py39']

[tool.ruff]
line-length = 88
select = ["E", "F", "I", "N", "W"]

[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--cov=mypackage --cov-report=term-missing"
```

## クイックリファレンス: Python イディオム

| イディオム | 説明 |
|-------|-------------|
| EAFP | Easier to Ask Forgiveness than Permission |
| Context managers | リソース管理に `with` を使う |
| List comprehensions | 単純な変換に使う |
| Generators | 遅延評価と大規模データ向け |
| Type hints | 関数シグネチャに注釈を付ける |
| Dataclasses | 自動生成メソッド付きのデータ コンテナ |
| `__slots__` | メモリ最適化 |
| f-strings | 文字列フォーマット (Python 3.6+) |
| `pathlib.Path` | パス操作 (Python 3.4+) |
| `enumerate` | ループのインデックスと要素を得る |

## 避けるべきアンチパターン

```python
# Bad: 可変なデフォルト引数
def append_to(item, items=[]):
    items.append(item)
    return items

# Good: None を使って新しいリストを作る
def append_to(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

# Bad: type() で型チェック
if type(obj) == list:
    process(obj)

# Good: isinstance を使う
if isinstance(obj, list):
    process(obj)

# Bad: None を == で比較
if value == None:
    process()

# Good: is を使う
if value is None:
    process()

# Bad: from module import *
from os.path import *

# Good: 明示的 import
from os.path import join, exists

# Bad: 裸の except
try:
    risky_operation()
except:
    pass

# Good: 具体的な例外
try:
    risky_operation()
except SpecificError as e:
    logger.error(f"処理に失敗: {e}")
```

__注意__: Python コードは読みやすく、明示的で、驚き最小の原則に従うべきである。迷ったら巧妙さより明確さを優先する。
