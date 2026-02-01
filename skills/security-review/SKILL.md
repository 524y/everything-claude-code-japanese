---
name: security-review
description: 認証を追加する、ユーザー入力を扱う、シークレットを扱う、API エンドポイントを作成する、または支払い / 機密機能を実装する際にこのスキルを使う。包括的なセキュリティチェックリストとパターンを提供する。
---

# セキュリティレビュースキル

このスキルは、すべてのコードがセキュリティのベストプラクティスに従い、潜在的な脆弱性を特定できるようにする。

## いつ使うか

- 認証または認可を実装するとき
- ユーザー入力やファイルアップロードを扱うとき
- 新しい API エンドポイントを作成するとき
- シークレットやクレデンシャルを扱うとき
- 支払い機能を実装するとき
- 機密データを保存または送信するとき
- サードパーティ API を統合するとき

## セキュリティチェックリスト

### 1. シークレット管理

#### ❌ 絶対にやってはいけない
```typescript
const apiKey = "sk-proj-xxxxx"  // ハードコードされたシークレット
const dbPassword = "password123" // ソースコード内
```

#### ✅ 常に行う
```typescript
const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL

// シークレットの存在を確認する
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

#### 検証手順
- [ ] ハードコードされた API キー、トークン、パスワードがない
- [ ] すべてのシークレットは環境変数にある
- [ ] `.env.local` が .gitignore に入っている
- [ ] git 履歴にシークレットがない
- [ ] 本番シークレットはホスティングプラットフォーム (Vercel, Railway) にある

### 2. 入力バリデーション

#### ユーザー入力は必ずバリデーションする
```typescript
import { z } from 'zod'

// バリデーションスキーマを定義する
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150)
})

// 処理前にバリデーションする
export async function createUser(input: unknown) {
  try {
    const validated = CreateUserSchema.parse(input)
    return await db.users.create(validated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    throw error
  }
}
```

#### ファイルアップロードのバリデーション
```typescript
function validateFileUpload(file: File) {
  // サイズチェック (最大 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('File too large (max 5MB)')
  }

  // タイプチェック
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // 拡張子チェック
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension')
  }

  return true
}
```

#### 検証手順
- [ ] すべてのユーザー入力はスキーマでバリデーションする
- [ ] ファイルアップロードを制限する (サイズ、タイプ、拡張子)
- [ ] クエリでユーザー入力を直接使わない
- [ ] ブラックリストではなくホワイトリストでバリデーションする
- [ ] エラーメッセージに機密情報を漏らさない

### 3. SQL インジェクション対策

#### ❌ SQL を連結しない
```typescript
// DANGEROUS - SQL インジェクションの脆弱性
const query = `SELECT * FROM users WHERE email = '${userEmail}'`
await db.query(query)
```

#### ✅ パラメータ化クエリを使う
```typescript
// 安全 - パラメータ化クエリ
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail)

// 生 SQL の場合
await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
)
```

#### 検証手順
- [ ] すべてのデータベースクエリはパラメータ化クエリを使う
- [ ] SQL に文字列連結を使わない
- [ ] ORM / クエリビルダーを正しく使う
- [ ] Supabase クエリが適切にサニタイズされている

### 4. 認証と認可

#### JWT トークンの取り扱い
```typescript
// ❌ WRONG: localStorage (XSS に弱い)
localStorage.setItem('token', token)

// ✅ CORRECT: httpOnly cookies
res.setHeader('Set-Cookie',
  `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`)
```

#### 認可チェック
```typescript
export async function deleteUser(userId: string, requesterId: string) {
  // 認可は常に先に確認する
  const requester = await db.users.findUnique({
    where: { id: requesterId }
  })

  if (requester.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  // 削除を続行する
  await db.users.delete({ where: { id: userId } })
}
```

#### Row Level Security (Supabase)
```sql
-- すべてのテーブルで RLS を有効化する
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "Users view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "Users update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### 検証手順
- [ ] トークンは httpOnly クッキーに保存する (localStorage ではない)
- [ ] 機密操作の前に認可チェックを行う
- [ ] Supabase で Row Level Security を有効化する
- [ ] ロールベースのアクセス制御を実装する
- [ ] セッション管理が安全である

### 5. XSS 対策

#### HTML をサニタイズする
```typescript
import DOMPurify from 'isomorphic-dompurify'

// ユーザー提供 HTML は常にサニタイズする
function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

#### コンテンツセキュリティポリシー
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.example.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]
```

#### 検証手順
- [ ] ユーザー提供 HTML をサニタイズする
- [ ] CSP ヘッダーを設定する
- [ ] 未検証の動的コンテンツを描画しない
- [ ] React の組み込み XSS 防止を使う

### 6. CSRF 対策

#### CSRF トークン
```typescript
import { csrf } from '@/lib/csrf'

export async function POST(request: Request) {
  const token = request.headers.get('X-CSRF-Token')

  if (!csrf.verify(token)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // リクエストを処理する
}
```

#### SameSite クッキー
```typescript
res.setHeader('Set-Cookie',
  `session=${sessionId}; HttpOnly; Secure; SameSite=Strict`)
```

#### 検証手順
- [ ] 状態変更操作に CSRF トークンを使う
- [ ] すべてのクッキーに SameSite=Strict を設定する
- [ ] ダブルサブミットクッキーパターンを実装する

### 7. レートリミット

#### API レートリミット
```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分
  max: 100, // ウィンドウあたり 100 リクエスト
  message: 'Too many requests'
})

// ルートに適用する
app.use('/api/', limiter)
```

#### 高コストな操作
```typescript
// 検索には厳しいレートリミットを設定する
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分
  max: 10, // 1 分あたり 10 リクエスト
  message: 'Too many search requests'
})

app.use('/api/search', searchLimiter)
```

#### 検証手順
- [ ] すべての API エンドポイントでレートリミットを有効化する
- [ ] 高コストな操作にはより厳しい制限を設定する
- [ ] IP ベースのレートリミットを使う
- [ ] ユーザーベースのレートリミットを使う (認証済み)

### 8. 機密データの露出

#### ログ
```typescript
// ❌ WRONG: 機密データをログに出す
console.log('User login:', { email, password })
console.log('Payment:', { cardNumber, cvv })

// ✅ CORRECT: 機密データをマスクする
console.log('User login:', { email, userId })
console.log('Payment:', { last4: card.last4, userId })
```

#### エラーメッセージ
```typescript
// ❌ WRONG: 内部情報を露出する
catch (error) {
  return NextResponse.json(
    { error: error.message, stack: error.stack },
    { status: 500 }
  )
}

// ✅ CORRECT: 一般的なエラーメッセージ
catch (error) {
  console.error('Internal error:', error)
  return NextResponse.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  )
}
```

#### 検証手順
- [ ] パスワード、トークン、シークレットがログに出ない
- [ ] ユーザー向けのエラーメッセージは一般化する
- [ ] 詳細エラーはサーバーログのみに出す
- [ ] スタックトレースをユーザーに露出しない

### 9. ブロックチェーンセキュリティ (Solana)

#### ウォレット検証
```typescript
import { verify } from '@solana/web3.js'

async function verifyWalletOwnership(
  publicKey: string,
  signature: string,
  message: string
) {
  try {
    const isValid = verify(
      Buffer.from(message),
      Buffer.from(signature, 'base64'),
      Buffer.from(publicKey, 'base64')
    )
    return isValid
  } catch (error) {
    return false
  }
}
```

#### トランザクション検証
```typescript
async function verifyTransaction(transaction: Transaction) {
  // 受取人を検証する
  if (transaction.to !== expectedRecipient) {
    throw new Error('Invalid recipient')
  }

  // 金額を検証する
  if (transaction.amount > maxAmount) {
    throw new Error('Amount exceeds limit')
  }

  // ユーザーに十分な残高があるか確認する
  const balance = await getBalance(transaction.from)
  if (balance < transaction.amount) {
    throw new Error('Insufficient balance')
  }

  return true
}
```

#### 検証手順
- [ ] ウォレット署名を検証する
- [ ] トランザクションの詳細をバリデーションする
- [ ] トランザクション前に残高を確認する
- [ ] 盲目的なトランザクション署名をしない

### 10. 依存関係のセキュリティ

#### 定期更新
```bash
# 脆弱性を確認する
npm audit

# 自動修復できる問題を修正する
npm audit fix

# 依存関係を更新する
npm update

# 古いパッケージを確認する
npm outdated
```

#### ロックファイル
```bash
# ロックファイルは必ずコミットする
git add package-lock.json

# 再現性のあるビルドのために CI/CD で使う
npm ci  # npm install の代わり
```

#### 検証手順
- [ ] 依存関係が最新である
- [ ] 既知の脆弱性がない (npm audit clean)
- [ ] ロックファイルをコミットしている
- [ ] GitHub で Dependabot を有効化している
- [ ] 定期的なセキュリティ更新がある

## セキュリティテスト

### 自動セキュリティテスト
```typescript
// 認証をテストする
test('requires authentication', async () => {
  const response = await fetch('/api/protected')
  expect(response.status).toBe(401)
})

// 認可をテストする
test('requires admin role', async () => {
  const response = await fetch('/api/admin', {
    headers: { Authorization: `Bearer ${userToken}` }
  })
  expect(response.status).toBe(403)
})

// 入力バリデーションをテストする
test('rejects invalid input', async () => {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ email: 'not-an-email' })
  })
  expect(response.status).toBe(400)
})

// レートリミットをテストする
test('enforces rate limits', async () => {
  const requests = Array(101).fill(null).map(() =>
    fetch('/api/endpoint')
  )

  const responses = await Promise.all(requests)
  const tooManyRequests = responses.filter(r => r.status === 429)

  expect(tooManyRequests.length).toBeGreaterThan(0)
})
```

## デプロイ前のセキュリティチェックリスト

本番デプロイの前に必ず確認する:

- [ ] **シークレット**: ハードコードされたシークレットがなく、すべて env 変数にある
- [ ] **入力バリデーション**: すべてのユーザー入力をバリデーションしている
- [ ] **SQL インジェクション**: すべてのクエリがパラメータ化されている
- [ ] **XSS**: ユーザーコンテンツがサニタイズされている
- [ ] **CSRF**: 保護が有効化されている
- [ ] **認証**: 適切なトークン処理
- [ ] **認可**: ロールチェックがある
- [ ] **レートリミット**: すべてのエンドポイントで有効
- [ ] **HTTPS**: 本番で強制
- [ ] **セキュリティヘッダー**: CSP、X-Frame-Options を設定している
- [ ] **エラーハンドリング**: エラーに機密データが含まれない
- [ ] **ログ**: 機密データをログに出さない
- [ ] **依存関係**: 最新で脆弱性がない
- [ ] **Row Level Security**: Supabase で有効化済み
- [ ] **CORS**: 適切に設定されている
- [ ] **ファイルアップロード**: バリデーション済み (サイズ、タイプ)
- [ ] **ウォレット署名**: 検証済み (ブロックチェーンの場合)

## リソース

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [Web Security Academy](https://portswigger.net/web-security)

---

**Remember**: セキュリティは任意ではない。1 つの脆弱性がプラットフォーム全体を侵害する可能性がある。迷ったら、慎重側に倒すこと。
