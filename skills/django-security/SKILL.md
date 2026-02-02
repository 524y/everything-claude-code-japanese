---
name: django-security
description: Django セキュリティのベストプラクティス。認証 / 認可、CSRF 対策、SQL injection 対策、XSS 対策、安全なデプロイ設定。
---

# Django セキュリティ ベストプラクティス

Django アプリケーションを一般的な脆弱性から守るための包括的セキュリティ ガイドラインである。

## 使うタイミング

- Django の認証 / 認可を設定するとき
- ユーザー権限とロールを実装するとき
- 本番向けセキュリティ設定を構成するとき
- Django アプリのセキュリティレビューを行うとき
- Django アプリを本番へデプロイするとき

## コア セキュリティ設定

### 本番設定の構成

```python
# settings/production.py
import os

DEBUG = False  # CRITICAL: 本番では True にしない

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# セキュリティヘッダー
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 1 年
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS と Cookie
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# Secret key（環境変数で必ず設定）
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ImproperlyConfigured('DJANGO_SECRET_KEY environment variable is required')

# パスワード検証
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

## 認証

### カスタム user モデル

```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """セキュリティ強化のためのカスタム user モデル。"""

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)

    USERNAME_FIELD = 'email'  # username に email を使う
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

# settings/base.py
AUTH_USER_MODEL = 'users.User'
```

### パスワード ハッシュ

```python
# Django はデフォルトで PBKDF2。より強い設定例:
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]
```

### セッション管理

```python
# セッション設定
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'  # または 'db'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 3600 * 24 * 7  # 1 週間
SESSION_SAVE_EVERY_REQUEST = False
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # UX は良いが安全性は下がる
```

## 認可

### パーミッション

```python
# models.py
from django.db import models
from django.contrib.auth.models import Permission

class Post(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        permissions = [
            ('can_publish', '投稿を公開できる'),
            ('can_edit_others', '他人の投稿を編集できる'),
        ]

    def user_can_edit(self, user):
        """ユーザーが投稿を編集できるか確認する。"""
        return self.author == user or user.has_perm('app.can_edit_others')

# views.py
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin
from django.views.generic import UpdateView

class PostUpdateView(LoginRequiredMixin, PermissionRequiredMixin, UpdateView):
    model = Post
    permission_required = 'app.can_edit_others'
    raise_exception = True  # リダイレクトではなく 403 を返す

    def get_queryset(self):
        """自分の投稿だけ編集できるようにする。"""
        return Post.objects.filter(author=self.request.user)
```

### カスタムパーミッション

```python
# permissions.py
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """所有者のみ編集できるようにする。"""

    def has_object_permission(self, request, view, obj):
        # 読み取りは誰でも許可
        if request.method in permissions.SAFE_METHODS:
            return True

        # 書き込みは所有者のみ
        return obj.author == request.user

class IsAdminOrReadOnly(permissions.BasePermission):
    """管理者はすべて許可、それ以外は読み取りのみ。"""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class IsVerifiedUser(permissions.BasePermission):
    """検証済みユーザーのみ許可する。"""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_verified
```

### ロールベース アクセス制御 (RBAC)

```python
# models.py
from django.contrib.auth.models import AbstractUser, Group

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', '管理者'),
        ('moderator', 'モデレーター'),
        ('user', '一般ユーザー'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    def is_admin(self):
        return self.role == 'admin' or self.is_superuser

    def is_moderator(self):
        return self.role in ['admin', 'moderator']

# Mixins
class AdminRequiredMixin:
    """admin ロールを必須にする mixin。"""

    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_admin():
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied
        return super().dispatch(request, *args, **kwargs)
```

## SQL Injection 対策

### Django ORM の保護

```python
# GOOD: Django ORM はパラメータを自動でエスケープする
def get_user(username):
    return User.objects.get(username=username)  # 安全

# GOOD: raw() でパラメータを使う
def search_users(query):
    return User.objects.raw('SELECT * FROM users WHERE username = %s', [query])

# BAD: ユーザー入力の直接埋め込みは厳禁
def get_user_bad(username):
    return User.objects.raw(f'SELECT * FROM users WHERE username = {username}')  # 脆弱!

# GOOD: filter と適切なエスケープ

def get_users_by_email(email):
    return User.objects.filter(email__iexact=email)  # 安全

# GOOD: 複雑クエリは Q オブジェクト
from django.db.models import Q
def search_users_complex(query):
    return User.objects.filter(
        Q(username__icontains=query) |
        Q(email__icontains=query)
    )  # 安全
```

### raw() 追加対策

```python
# raw SQL を使う場合は必ずパラメータを使う
User.objects.raw(
    'SELECT * FROM users WHERE email = %s AND status = %s',
    [user_input_email, status]
)
```

## XSS 対策

### テンプレート エスケープ

```django
{# Django はデフォルトで自動エスケープ - SAFE #}
{{ user_input }}  {# エスケープ済み HTML #}

{# 信頼できる内容のみ safe を付ける #}
{{ trusted_html|safe }}  {# エスケープされない #}

{# 安全な HTML のためのフィルタ #}
{{ user_input|escape }}  {# デフォルトと同じ #}
{{ user_input|striptags }}  {# HTML タグをすべて削除 #}

{# JavaScript エスケープ #}
<script>
    var username = {{ username|escapejs }};
</script>
```

### 安全な文字列処理

```python
from django.utils.safestring import mark_safe
from django.utils.html import escape

# BAD: エスケープせずに safe を付ける

def render_bad(user_input):
    return mark_safe(user_input)  # 脆弱!

# GOOD: エスケープしてから safe を付ける

def render_good(user_input):
    return mark_safe(escape(user_input))

# GOOD: 変数入り HTML は format_html を使う
from django.utils.html import format_html

def greet_user(username):
    return format_html('<span class="user">{}</span>', escape(username))
```

### HTTP ヘッダー

```python
# settings.py
SECURE_CONTENT_TYPE_NOSNIFF = True  # MIME sniffing を防止
SECURE_BROWSER_XSS_FILTER = True  # XSS フィルタを有効化
X_FRAME_OPTIONS = 'DENY'  # クリックジャッキングを防止

# カスタムミドルウェア
from django.conf import settings

class SecurityHeaderMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Content-Security-Policy'] = "default-src 'self'"
        return response
```

## CSRF 対策

### デフォルトの CSRF 対策

```python
# settings.py - CSRF はデフォルトで有効
CSRF_COOKIE_SECURE = True  # HTTPS のみ送信
CSRF_COOKIE_HTTPONLY = True  # JavaScript アクセスを防止
CSRF_COOKIE_SAMESITE = 'Lax'  # 一部ケースで CSRF を防ぐ
CSRF_TRUSTED_ORIGINS = ['https://example.com']  # 信頼ドメイン

# Template での使用
<form method="post">
    {% csrf_token %}
    {{ form.as_p }}
    <button type="submit">Submit</button>
</form>

# AJAX リクエスト
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

fetch('/api/endpoint/', {
    method: 'POST',
    headers: {
        'X-CSRFToken': getCookie('csrftoken'),
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
});
```

### 例外的に CSRF を除外する（慎重に）

```python
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt  # 本当に必要な場合のみ使う!
def webhook_view(request):
    # 外部サービスからの webhook
    pass
```

## ファイルアップロード セキュリティ

### ファイル検証

```python
import os
from django.core.exceptions import ValidationError

def validate_file_extension(value):
    """ファイル拡張子を検証する。"""
    ext = os.path.splitext(value.name)[1]
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
    if not ext.lower() in valid_extensions:
        raise ValidationError('未対応の拡張子である。')

def validate_file_size(value):
    """ファイルサイズを検証する (最大 5MB)。"""
    filesize = value.size
    if filesize > 5 * 1024 * 1024:
        raise ValidationError('ファイルが大きすぎる。最大 5MB。')

# models.py
class Document(models.Model):
    file = models.FileField(
        upload_to='documents/',
        validators=[validate_file_extension, validate_file_size]
    )
```

### 安全なファイル保存

```python
# settings.py
MEDIA_ROOT = '/var/www/media/'
MEDIA_URL = '/media/'

# 本番ではメディア用に別ドメインを使う
MEDIA_DOMAIN = 'https://media.example.com'

# ユーザーアップロードを直接配信しない
# 静的ファイルは whitenoise か CDN を使う
# メディアは別サーバーまたは S3 を使う
```

## API セキュリティ

### レートリミット

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'upload': '10/hour',
    }
}

# カスタム throttle
from rest_framework.throttling import UserRateThrottle

class BurstRateThrottle(UserRateThrottle):
    scope = 'burst'
    rate = '60/min'

class SustainedRateThrottle(UserRateThrottle):
    scope = 'sustained'
    rate = '1000/day'
```

### API の認証

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    return Response({'message': '認証済みである。'})
```

## セキュリティヘッダー

### Content Security Policy

```python
# settings.py
CSP_DEFAULT_SRC = "'self'"
CSP_SCRIPT_SRC = "'self' https://cdn.example.com"
CSP_STYLE_SRC = "'self' 'unsafe-inline'"
CSP_IMG_SRC = "'self' data: https:"
CSP_CONNECT_SRC = "'self' https://api.example.com"

# Middleware
class CSPMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['Content-Security-Policy'] = (
            f"default-src {CSP_DEFAULT_SRC}; "
            f"script-src {CSP_SCRIPT_SRC}; "
            f"style-src {CSP_STYLE_SRC}; "
            f"img-src {CSP_IMG_SRC}; "
            f"connect-src {CSP_CONNECT_SRC}"
        )
        return response
```

## 環境変数

### シークレット管理

```python
# python-decouple または django-environ を使う
import environ

env = environ.Env(
    # キャストとデフォルト値
    DEBUG=(bool, False)
)

# .env ファイルを読む
environ.Env.read_env()

SECRET_KEY = env('DJANGO_SECRET_KEY')
DATABASE_URL = env('DATABASE_URL')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')

# .env ファイル（コミットしない）
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
ALLOWED_HOSTS=example.com,www.example.com
```

## セキュリティイベントのログ

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/security.log',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['file', 'console'],
            'level': 'WARNING',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}
```

## クイック セキュリティ チェックリスト

| チェック | 説明 |
|-------|-------------|
| `DEBUG = False` | 本番で DEBUG を使わない |
| HTTPS のみ | SSL 強制、secure cookie |
| 強いシークレット | SECRET_KEY は環境変数で管理 |
| パスワード検証 | すべてのバリデータを有効化 |
| CSRF 対策 | デフォルト有効、無効化しない |
| XSS 対策 | Django の自動エスケープを使い、`|safe` を濫用しない |
| SQL injection | ORM を使い、クエリで文字列連結しない |
| ファイルアップロード | ファイル種別とサイズを検証 |
| レートリミット | API エンドポイントを throttle |
| セキュリティヘッダー | CSP、X-Frame-Options、HSTS |
| ログ | セキュリティイベントを記録 |
| 更新 | Django と依存関係を最新に保つ |

注意: セキュリティはプロセスであり、プロダクトではない。定期的に見直し、更新し続ける。
