---
name: django-patterns
description: Django アーキテクチャ パターン、DRF を使った REST API 設計、ORM ベストプラクティス、キャッシュ、シグナル、ミドルウェア、本番向け Django アプリ。
---

# Django 開発パターン

スケーラブルで保守しやすいアプリケーションのための本番品質 Django アーキテクチャ パターンである。

## 使うタイミング

- Django Web アプリを構築するとき
- Django REST Framework API を設計するとき
- Django ORM とモデルを扱うとき
- Django プロジェクト構成を整えるとき
- キャッシュ、シグナル、ミドルウェアを実装するとき

## プロジェクト構成

### 推奨レイアウト

```
myproject/
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py          # 基本設定
│   │   ├── development.py   # 開発設定
│   │   ├── production.py    # 本番設定
│   │   └── test.py          # テスト設定
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── manage.py
└── apps/
    ├── __init__.py
    ├── users/
    │   ├── __init__.py
    │   ├── models.py
    │   ├── views.py
    │   ├── serializers.py
    │   ├── urls.py
    │   ├── permissions.py
    │   ├── filters.py
    │   ├── services.py
    │   └── tests/
    └── products/
        └── ...
```

### 設定分割パターン

```python
# config/settings/base.py
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = env('DJANGO_SECRET_KEY')
DEBUG = False
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    # ローカルアプリ
    'apps.users',
    'apps.products',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

# config/settings/development.py
from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

DATABASES['default']['NAME'] = 'myproject_dev'

INSTALLED_APPS += ['debug_toolbar']

MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# config/settings/production.py
from .base import *

DEBUG = False
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ログ設定
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': True,
        },
    },
}
```

## モデル設計パターン

### モデル ベストプラクティス

```python
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    """AbstractUser を拡張したカスタム user モデル。"""
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

class Product(models.Model):
    """適切なフィールド設定の Product モデル。"""
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=250)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    category = models.ForeignKey(
        'Category',
        on_delete=models.CASCADE,
        related_name='products'
    )
    tags = models.ManyToManyField('Tag', blank=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['category', 'is_active']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gte=0),
                name='price_non_negative'
            )
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
```

### QuerySet ベストプラクティス

```python
from django.db import models

class ProductQuerySet(models.QuerySet):
    """Product モデル向けのカスタム QuerySet。"""

    def active(self):
        """アクティブな商品だけ返す。"""
        return self.filter(is_active=True)

    def with_category(self):
        """N+1 を避けるため category を select_related する。"""
        return self.select_related('category')

    def with_tags(self):
        """多対多の tags を prefetch する。"""
        return self.prefetch_related('tags')

    def in_stock(self):
        """在庫が 0 より大きい商品を返す。"""
        return self.filter(stock__gt=0)

    def search(self, query):
        """名前または説明で商品検索する。"""
        return self.filter(
            models.Q(name__icontains=query) |
            models.Q(description__icontains=query)
        )

class Product(models.Model):
    # ... fields ...

    objects = ProductQuerySet.as_manager()  # カスタム QuerySet を使う

# 使用例
Product.objects.active().with_category().in_stock()
```

### Manager メソッド

```python
class ProductManager(models.Manager):
    """複雑なクエリ向けのカスタム manager。"""

    def get_or_none(self, **kwargs):
        """DoesNotExist の代わりに None を返す。"""
        try:
            return self.get(**kwargs)
        except self.model.DoesNotExist:
            return None

    def create_with_tags(self, name, price, tag_names):
        """タグ付きの商品を作成する。"""
        product = self.create(name=name, price=price)
        tags = [Tag.objects.get_or_create(name=name)[0] for name in tag_names]
        product.tags.set(tags)
        return product

    def bulk_update_stock(self, product_ids, quantity):
        """複数商品の在庫を一括更新する。"""
        return self.filter(id__in=product_ids).update(stock=quantity)

# モデル側
class Product(models.Model):
    # ... fields ...
    custom = ProductManager()
```

## Django REST Framework パターン

### Serializer パターン

```python
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Product, User

class ProductSerializer(serializers.ModelSerializer):
    """Product モデルの serializer。"""

    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    discount_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price',
            'discount_price', 'stock', 'category_name',
            'average_rating', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at']

    def get_discount_price(self, obj):
        """必要なら割引価格を計算する。"""
        if hasattr(obj, 'discount') and obj.discount:
            return obj.price * (1 - obj.discount.percent / 100)
        return obj.price

    def validate_price(self, value):
        """価格が 0 未満でないことを保証する。"""
        if value < 0:
            raise serializers.ValidationError("価格は負にできない。")
        return value

class ProductCreateSerializer(serializers.ModelSerializer):
    """商品作成用 serializer。"""

    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'stock', 'category']

    def validate(self, data):
        """複数フィールドに対するカスタム検証。"""
        if data['price'] > 10000 and data['stock'] > 100:
            raise serializers.ValidationError(
                "高額商品と大量在庫を同時に設定できない。"
            )
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    """ユーザー登録用 serializer。"""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm']

    def validate(self, data):
        """パスワードが一致することを検証する。"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                "password_confirm": "パスワードが一致しない。"
            })
        return data

    def create(self, validated_data):
        """ハッシュ化パスワードでユーザーを作成する。"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user
```

### ViewSet パターン

```python
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductSerializer, ProductCreateSerializer
from .permissions import IsOwnerOrReadOnly
from .filters import ProductFilter
from .services import ProductService

class ProductViewSet(viewsets.ModelViewSet):
    """Product モデルの ViewSet。"""

    queryset = Product.objects.select_related('category').prefetch_related('tags')
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """action に応じた serializer を返す。"""
        if self.action == 'create':
            return ProductCreateSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        """ユーザー コンテキスト付きで保存する。"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """注目商品を返す。"""
        featured = self.queryset.filter(is_featured=True)[:10]
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def purchase(self, request, pk=None):
        """商品を購入する。"""
        product = self.get_object()
        service = ProductService()
        result = service.purchase(product, request.user)
        return Response(result, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_products(self, request):
        """現在のユーザーが作成した商品を返す。"""
        products = self.queryset.filter(created_by=request.user)
        page = self.paginate_queryset(products)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
```

### カスタムアクション

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """ユーザーのカートに商品を追加する。"""
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': '商品が見つからない。'},
            status=status.HTTP_404_NOT_FOUND
        )

    cart, _ = Cart.objects.get_or_create(user=request.user)
    CartItem.objects.create(
        cart=cart,
        product=product,
        quantity=quantity
    )

    return Response({'message': 'カートに追加した。'}, status=status.HTTP_201_CREATED)
```

## サービス層パターン

```python
# apps/orders/services.py
from typing import Optional
from django.db import transaction
from .models import Order, OrderItem

class OrderService:
    """注文関連のビジネス ロジック向けサービス層。"""

    @staticmethod
    @transaction.atomic
    def create_order(user, cart: Cart) -> Order:
        """カートから注文を作成する。"""
        order = Order.objects.create(
            user=user,
            total_price=cart.total_price
        )

        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        # カートを空にする
        cart.items.all().delete()

        return order

    @staticmethod
    def process_payment(order: Order, payment_data: dict) -> bool:
        """注文の支払いを処理する。"""
        # 決済ゲートウェイとの連携
        payment = PaymentGateway.charge(
            amount=order.total_price,
            token=payment_data['token']
        )

        if payment.success:
            order.status = Order.Status.PAID
            order.save()
            # 確認メールを送信する
            OrderService.send_confirmation_email(order)
            return True

        return False

    @staticmethod
    def send_confirmation_email(order: Order):
        """注文確認メールを送信する。"""
        # メール送信ロジック
        pass
```

## キャッシュ戦略

### ビュー レベル キャッシュ

```python
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 15), name='dispatch')  # 15 分
class ProductListView(generic.ListView):
    model = Product
    template_name = 'products/list.html'
    context_object_name = 'products'
```

### テンプレート フラグメント キャッシュ

```django
{% load cache %}
{% cache 500 sidebar %}
    ... expensive sidebar content ...
{% endcache %}
```

### 低レベル キャッシュ

```python
from django.core.cache import cache

def get_featured_products():
    """キャッシュ付きで注目商品を取得する。"""
    cache_key = 'featured_products'
    products = cache.get(cache_key)

    if products is None:
        products = list(Product.objects.filter(is_featured=True))
        cache.set(cache_key, products, timeout=60 * 15)  # 15 分

    return products
```

### QuerySet キャッシュ

```python
from django.core.cache import cache

def get_popular_categories():
    cache_key = 'popular_categories'
    categories = cache.get(cache_key)

    if categories is None:
        categories = list(Category.objects.annotate(
            product_count=Count('products')
        ).filter(product_count__gt=10).order_by('-product_count')[:20])
        cache.set(cache_key, categories, timeout=60 * 60)  # 1 時間

    return categories
```

## シグナル

### シグナル パターン

```python
# apps/users/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """ユーザー作成時にプロフィールを作成する。"""
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """ユーザー保存時にプロフィールを保存する。"""
    instance.profile.save()

# apps/users/apps.py
from django.apps import AppConfig

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        """アプリ準備完了時に signals を import する。"""
        import apps.users.signals
```

## ミドルウェア

### カスタム ミドルウェア

```python
# middleware/active_user_middleware.py
import time
from django.utils.deprecation import MiddlewareMixin

class ActiveUserMiddleware(MiddlewareMixin):
    """アクティブユーザーを追跡するミドルウェア。"""

    def process_request(self, request):
        """受信リクエストを処理する。"""
        if request.user.is_authenticated:
            # 最終アクティブ時刻を更新する
            request.user.last_active = timezone.now()
            request.user.save(update_fields=['last_active'])

class RequestLoggingMiddleware(MiddlewareMixin):
    """リクエストをログするミドルウェア。"""

    def process_request(self, request):
        """リクエスト開始時刻を記録する。"""
        request.start_time = time.time()

    def process_response(self, request, response):
        """リクエストの所要時間をログする。"""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(f'{request.method} {request.path} - {response.status_code} - {duration:.3f}s')
        return response
```

## パフォーマンス最適化

### N+1 クエリの防止

```python
# Bad - N+1 クエリ
products = Product.objects.all()
for product in products:
    print(product.category.name)  # 各商品で別クエリ

# Good - select_related で単一クエリ
products = Product.objects.select_related('category').all()
for product in products:
    print(product.category.name)

# Good - 多対多は prefetch
products = Product.objects.prefetch_related('tags').all()
for product in products:
    for tag in product.tags.all():
        print(tag.name)
```

### データベース インデックス

```python
class Product(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['category', 'created_at']),
        ]
```

### バルク操作

```python
# バルク作成
Product.objects.bulk_create([
    Product(name=f'Product {i}', price=10.00)
    for i in range(1000)
])

# バルク更新
products = Product.objects.all()[:100]
for product in products:
    product.is_active = True
Product.objects.bulk_update(products, ['is_active'])

# バルク削除
Product.objects.filter(stock=0).delete()
```

## クイックリファレンス

| パターン | 説明 |
|---------|-------------|
| 設定分割 | dev / prod / test の設定を分離する |
| カスタム QuerySet | 再利用できるクエリメソッド |
| サービス層 | ビジネス ロジックを分離する |
| ViewSet | REST API エンドポイント |
| Serializer バリデーション | リクエスト / レスポンス変換 |
| select_related | 外部キー最適化 |
| prefetch_related | 多対多の最適化 |
| キャッシュ優先 | 高コスト処理をキャッシュする |
| シグナル | イベント駆動アクション |
| ミドルウェア | リクエスト / レスポンス処理 |

注意: Django には多くの近道があるが、本番アプリでは簡潔さより構造と整理が重要である。保守性を最優先に設計する。
