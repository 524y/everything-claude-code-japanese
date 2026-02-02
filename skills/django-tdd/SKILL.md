---
name: django-tdd
description: pytest-django、TDD 手法、factory_boy、モック、カバレッジ、Django REST Framework API テストを用いた Django テスト戦略。
---

# Django TDD テスト

pytest、factory_boy、Django REST Framework を使った Django アプリのテスト駆動開発である。

## 使うタイミング

- 新しい Django アプリを書くとき
- Django REST Framework API を実装するとき
- Django モデル / ビュー / serializer をテストするとき
- Django プロジェクトのテスト基盤を整えるとき

## Django 向け TDD ワークフロー

### Red-Green-Refactor サイクル

```python
# Step 1: RED - 失敗するテストを書く
def test_user_creation():
    user = User.objects.create_user(email='test@example.com', password='testpass123')
    assert user.email == 'test@example.com'
    assert user.check_password('testpass123')
    assert not user.is_staff

# Step 2: GREEN - テストを通す
# User モデルまたは factory を作成する

# Step 3: REFACTOR - テストを緑のまま改善する
```

## セットアップ

### pytest 設定

```ini
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --reuse-db
    --nomigrations
    --cov=apps
    --cov-report=html
    --cov-report=term-missing
    --strict-markers
markers =
    slow: marks tests as slow
    integration: marks tests as integration tests
```

### テスト設定

```python
# config/settings/test.py
from .base import *

DEBUG = True
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# 速度向上のためマイグレーションを無効化
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# パスワードハッシュを高速化
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Email backend
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Celery を常時 eager
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
```

### conftest.py

```python
# tests/conftest.py
import pytest
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture(autouse=True)
def timezone_settings(settings):
    """タイムゾーンを統一する。"""
    settings.TIME_ZONE = 'UTC'

@pytest.fixture
def user(db):
    """テストユーザーを作成する。"""
    return User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        username='testuser'
    )

@pytest.fixture
def admin_user(db):
    """管理者ユーザーを作成する。"""
    return User.objects.create_superuser(
        email='admin@example.com',
        password='adminpass123',
        username='admin'
    )

@pytest.fixture
def authenticated_client(client, user):
    """認証済み client を返す。"""
    client.force_login(user)
    return client

@pytest.fixture
def api_client():
    """DRF API client を返す。"""
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def authenticated_api_client(api_client, user):
    """認証済み API client を返す。"""
    api_client.force_authenticate(user=user)
    return api_client
```

## Factory Boy

### Factory 設定

```python
# tests/factories.py
import factory
from factory import fuzzy
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from apps.products.models import Product, Category

User = get_user_model()

class UserFactory(factory.django.DjangoModelFactory):
    """User モデルの factory。"""

    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    username = factory.Sequence(lambda n: f"user{n}")
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    is_active = True

class CategoryFactory(factory.django.DjangoModelFactory):
    """Category モデルの factory。"""

    class Meta:
        model = Category

    name = factory.Faker('word')
    slug = factory.LazyAttribute(lambda obj: obj.name.lower())
    description = factory.Faker('text')

class ProductFactory(factory.django.DjangoModelFactory):
    """Product モデルの factory。"""

    class Meta:
        model = Product

    name = factory.Faker('sentence', nb_words=3)
    slug = factory.LazyAttribute(lambda obj: obj.name.lower().replace(' ', '-'))
    description = factory.Faker('text')
    price = fuzzy.FuzzyDecimal(10.00, 1000.00, 2)
    stock = fuzzy.FuzzyInteger(0, 100)
    is_active = True
    category = factory.SubFactory(CategoryFactory)
    created_by = factory.SubFactory(UserFactory)

    @factory.post_generation
    def tags(self, create, extracted, **kwargs):
        """商品にタグを追加する。"""
        if not create:
            return
        if extracted:
            for tag in extracted:
                self.tags.add(tag)
```

### Factory の使用

```python
# tests/test_models.py
import pytest
from tests.factories import ProductFactory, UserFactory

def test_product_creation():
    """factory を使った商品作成をテストする。"""
    product = ProductFactory(price=100.00, stock=50)
    assert product.price == 100.00
    assert product.stock == 50
    assert product.is_active is True

def test_product_with_tags():
    """タグ付き商品をテストする。"""
    tags = [TagFactory(name='electronics'), TagFactory(name='new')]
    product = ProductFactory(tags=tags)
    assert product.tags.count() == 2

def test_multiple_products():
    """複数商品の作成をテストする。"""
    products = ProductFactory.create_batch(10)
    assert len(products) == 10
```

## モデルテスト

### モデル テスト

```python
# tests/test_models.py
import pytest
from django.core.exceptions import ValidationError
from tests.factories import UserFactory, ProductFactory

class TestUserModel:
    """User モデルのテスト。"""

    def test_create_user(self, db):
        """通常ユーザー作成をテストする。"""
        user = UserFactory(email='test@example.com')
        assert user.email == 'test@example.com'
        assert user.check_password('testpass123')
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_superuser(self, db):
        """スーパーユーザー作成をテストする。"""
        user = UserFactory(
            email='admin@example.com',
            is_staff=True,
            is_superuser=True
        )
        assert user.is_staff
        assert user.is_superuser

    def test_user_str(self, db):
        """user の文字列表現をテストする。"""
        user = UserFactory(email='test@example.com')
        assert str(user) == 'test@example.com'

class TestProductModel:
    """Product モデルのテスト。"""

    def test_product_creation(self, db):
        """商品作成をテストする。"""
        product = ProductFactory()
        assert product.id is not None
        assert product.is_active is True
        assert product.created_at is not None

    def test_product_slug_generation(self, db):
        """slug の自動生成をテストする。"""
        product = ProductFactory(name='Test Product')
        assert product.slug == 'test-product'

    def test_product_price_validation(self, db):
        """価格が負にならないことをテストする。"""
        product = ProductFactory(price=-10)
        with pytest.raises(ValidationError):
            product.full_clean()

    def test_product_manager_active(self, db):
        """active manager メソッドをテストする。"""
        ProductFactory.create_batch(5, is_active=True)
        ProductFactory.create_batch(3, is_active=False)

        active_count = Product.objects.active().count()
        assert active_count == 5

    def test_product_stock_management(self, db):
        """在庫管理をテストする。"""
        product = ProductFactory(stock=10)
        product.reduce_stock(5)
        product.refresh_from_db()
        assert product.stock == 5

        with pytest.raises(ValueError):
            product.reduce_stock(10)  # 在庫不足
```

## ビューテスト

### Django ビュー テスト

```python
# tests/test_views.py
import pytest
from django.urls import reverse
from tests.factories import ProductFactory, UserFactory

class TestProductViews:
    """商品ビューのテスト。"""

    def test_product_list(self, client, db):
        """商品一覧ビューをテストする。"""
        ProductFactory.create_batch(10)

        response = client.get(reverse('products:list'))

        assert response.status_code == 200
        assert len(response.context['products']) == 10

    def test_product_detail(self, client, db):
        """商品詳細ビューをテストする。"""
        product = ProductFactory()

        response = client.get(reverse('products:detail', kwargs={'slug': product.slug}))

        assert response.status_code == 200
        assert response.context['product'] == product

    def test_product_create_requires_login(self, client, db):
        """商品作成に認証が必要なことをテストする。"""
        response = client.get(reverse('products:create'))

        assert response.status_code == 302
        assert response.url.startswith('/accounts/login/')

    def test_product_create_authenticated(self, authenticated_client, db):
        """認証済みユーザーの作成画面をテストする。"""
        response = authenticated_client.get(reverse('products:create'))

        assert response.status_code == 200

    def test_product_create_post(self, authenticated_client, db, category):
        """POST で商品作成をテストする。"""
        data = {
            'name': 'Test Product',
            'description': 'A test product',
            'price': '99.99',
            'stock': 10,
            'category': category.id,
        }

        response = authenticated_client.post(reverse('products:create'), data)

        assert response.status_code == 302
        assert Product.objects.filter(name='Test Product').exists()
```

## DRF API テスト

### Serializer テスト

```python
# tests/test_serializers.py
import pytest
from rest_framework.exceptions import ValidationError
from apps.products.serializers import ProductSerializer
from tests.factories import ProductFactory

class TestProductSerializer:
    """ProductSerializer のテスト。"""

    def test_serialize_product(self, db):
        """商品シリアライズをテストする。"""
        product = ProductFactory()
        serializer = ProductSerializer(product)

        data = serializer.data

        assert data['id'] == product.id
        assert data['name'] == product.name
        assert data['price'] == str(product.price)

    def test_deserialize_product(self, db):
        """商品データのデシリアライズをテストする。"""
        data = {
            'name': 'Test Product',
            'description': 'Test description',
            'price': '99.99',
            'stock': 10,
            'category': 1,
        }

        serializer = ProductSerializer(data=data)

        assert serializer.is_valid()
        product = serializer.save()

        assert product.name == 'Test Product'
        assert float(product.price) == 99.99

    def test_price_validation(self, db):
        """価格バリデーションをテストする。"""
        data = {
            'name': 'Test Product',
            'price': '-10.00',
            'stock': 10,
        }

        serializer = ProductSerializer(data=data)

        assert not serializer.is_valid()
        assert 'price' in serializer.errors

    def test_stock_validation(self, db):
        """在庫が負にならないことをテストする。"""
        data = {
            'name': 'Test Product',
            'price': '99.99',
            'stock': -5,
        }

        serializer = ProductSerializer(data=data)

        assert not serializer.is_valid()
        assert 'stock' in serializer.errors
```

### API ViewSet テスト

```python
# tests/test_api.py
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from tests.factories import ProductFactory, UserFactory

class TestProductAPI:
    """Product API エンドポイントのテスト。"""

    @pytest.fixture
    def api_client(self):
        """API client を返す。"""
        return APIClient()

    def test_list_products(self, api_client, db):
        """商品一覧をテストする。"""
        ProductFactory.create_batch(10)

        url = reverse('api:product-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 10

    def test_retrieve_product(self, api_client, db):
        """商品取得をテストする。"""
        product = ProductFactory()

        url = reverse('api:product-detail', kwargs={'pk': product.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == product.id

    def test_create_product_unauthorized(self, api_client, db):
        """未認証での商品作成をテストする。"""
        url = reverse('api:product-list')
        data = {'name': 'Test Product', 'price': '99.99'}

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_product_authorized(self, authenticated_api_client, db):
        """認証済みユーザーの商品作成をテストする。"""
        url = reverse('api:product-list')
        data = {
            'name': 'Test Product',
            'description': 'Test',
            'price': '99.99',
            'stock': 10,
        }

        response = authenticated_api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Test Product'

    def test_update_product(self, authenticated_api_client, db):
        """商品更新をテストする。"""
        product = ProductFactory(created_by=authenticated_api_client.user)

        url = reverse('api:product-detail', kwargs={'pk': product.id})
        data = {'name': 'Updated Product'}

        response = authenticated_api_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Product'

    def test_delete_product(self, authenticated_api_client, db):
        """商品削除をテストする。"""
        product = ProductFactory(created_by=authenticated_api_client.user)

        url = reverse('api:product-detail', kwargs={'pk': product.id})
        response = authenticated_api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_filter_products_by_price(self, api_client, db):
        """価格でのフィルタをテストする。"""
        ProductFactory(price=50)
        ProductFactory(price=150)

        url = reverse('api:product-list')
        response = api_client.get(url, {'price_min': 100})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_search_products(self, api_client, db):
        """商品検索をテストする。"""
        ProductFactory(name='Apple iPhone')
        ProductFactory(name='Samsung Galaxy')

        url = reverse('api:product-list')
        response = api_client.get(url, {'search': 'Apple'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
```

## モックとパッチ

### 外部サービスのモック

```python
# tests/test_views.py
from unittest.mock import patch, Mock
import pytest

class TestPaymentView:
    """決済ゲートウェイをモックした支払いビューのテスト。"""

    @patch('apps.payments.services.stripe')
    def test_successful_payment(self, mock_stripe, client, user, product):
        """Stripe をモックして成功支払いをテストする。"""
        # モックを設定
        mock_stripe.Charge.create.return_value = {
            'id': 'ch_123',
            'status': 'succeeded',
            'amount': 9999,
        }

        client.force_login(user)
        response = client.post(reverse('payments:process'), {
            'product_id': product.id,
            'token': 'tok_visa',
        })

        assert response.status_code == 302
        mock_stripe.Charge.create.assert_called_once()

    @patch('apps.payments.services.stripe')
    def test_failed_payment(self, mock_stripe, client, user, product):
        """失敗した支払いをテストする。"""
        mock_stripe.Charge.create.side_effect = Exception('カードが拒否された')

        client.force_login(user)
        response = client.post(reverse('payments:process'), {
            'product_id': product.id,
            'token': 'tok_visa',
        })

        assert response.status_code == 302
        assert 'error' in response.url
```

### メール送信のモック

```python
# tests/test_email.py
from django.core import mail
from django.test import override_settings

@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
def test_order_confirmation_email(db, order):
    """注文確認メールをテストする。"""
    order.send_confirmation_email()

    assert len(mail.outbox) == 1
    assert order.user.email in mail.outbox[0].to
    assert '注文確認' in mail.outbox[0].subject
```

## 統合テスト

### フルフロー テスト

```python
# tests/test_integration.py
import pytest
from django.urls import reverse
from tests.factories import UserFactory, ProductFactory

class TestCheckoutFlow:
    """完全な購入フローのテスト。"""

    def test_guest_to_purchase_flow(self, client, db):
        """ゲストから購入までの一連フローをテストする。"""
        # Step 1: 登録
        response = client.post(reverse('users:register'), {
            'email': 'test@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
        })
        assert response.status_code == 302

        # Step 2: ログイン
        response = client.post(reverse('users:login'), {
            'email': 'test@example.com',
            'password': 'testpass123',
        })
        assert response.status_code == 302

        # Step 3: 商品閲覧
        product = ProductFactory(price=100)
        response = client.get(reverse('products:detail', kwargs={'slug': product.slug}))
        assert response.status_code == 200

        # Step 4: カート追加
        response = client.post(reverse('cart:add'), {
            'product_id': product.id,
            'quantity': 1,
        })
        assert response.status_code == 302

        # Step 5: チェックアウト
        response = client.get(reverse('checkout:review'))
        assert response.status_code == 200
        assert product.name in response.content.decode()

        # Step 6: 購入完了
        with patch('apps.checkout.services.process_payment') as mock_payment:
            mock_payment.return_value = True
            response = client.post(reverse('checkout:complete'))

        assert response.status_code == 302
        assert Order.objects.filter(user__email='test@example.com').exists()
```

## テスト ベストプラクティス

### DO

- **factory を使う**: 手作業のオブジェクト作成を避ける
- **1 テスト 1 目的**: テストは集中させる
- **説明的なテスト名**: `test_user_cannot_delete_others_post`
- **エッジケースをテスト**: 空入力、None、境界条件
- **外部サービスをモック**: 外部 API 依存を避ける
- **フィクスチャを使う**: 重複を排除する
- **パーミッションをテスト**: 認可が機能することを確認する
- **テストを速く保つ**: `--reuse-db` と `--nomigrations` を使う

### DON'T

- **Django 内部をテストしない**: Django を信頼する
- **サードパーティをテストしない**: ライブラリを信頼する
- **失敗テストを無視しない**: すべてのテストは通す
- **テストを依存させない**: 任意順序で実行できるようにする
- **過剰にモックしない**: 外部依存のみモックする
- **private メソッドをテストしない**: 公開インターフェースをテストする
- **本番 DB を使わない**: 必ずテスト DB を使う

## カバレッジ

### カバレッジ設定

```bash
# カバレッジ付きでテストを実行
pytest --cov=apps --cov-report=html --cov-report=term-missing

# HTML レポートを生成
open htmlcov/index.html
```

### カバレッジ目標

| コンポーネント | 目標カバレッジ |
|-----------|-----------------|
| Models | 90%+ |
| Serializers | 85%+ |
| Views | 80%+ |
| Services | 90%+ |
| Utilities | 80%+ |
| Overall | 80%+ |

## クイックリファレンス

| パターン | 使いどころ |
|---------|-------|
| `@pytest.mark.django_db` | データベースアクセスを有効化 |
| `client` | Django テスト client |
| `api_client` | DRF API client |
| `factory.create_batch(n)` | 複数オブジェクト作成 |
| `patch('module.function')` | 外部依存をモック |
| `override_settings` | 設定を一時変更 |
| `force_authenticate()` | テストで認証をバイパス |
| `assertRedirects` | リダイレクト確認 |
| `assertTemplateUsed` | テンプレート利用確認 |
| `mail.outbox` | 送信メールの確認 |

注意: テストはドキュメントでもある。良いテストはコードの動作を説明する。シンプルで読みやすく、保守しやすく保つ。
