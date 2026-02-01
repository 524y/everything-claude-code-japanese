---
name: backend-patterns
description: Node.js、Express、Next.js の API routes 向けのバックエンドアーキテクチャパターン、API 設計、データベース最適化、サーバーサイドのベストプラクティス。
---

# バックエンド開発パターン

スケーラブルなサーバーサイドアプリケーションのためのバックエンドアーキテクチャパターンとベストプラクティスである。

## API 設計パターン

### RESTful API 構造

```typescript
// ✅ リソースベースの URL
GET    /api/markets                 # リソース一覧
GET    /api/markets/:id             # 単一リソース取得
POST   /api/markets                 # リソース作成
PUT    /api/markets/:id             # リソース置換
PATCH  /api/markets/:id             # リソース更新
DELETE /api/markets/:id             # リソース削除

// ✅ フィルタリング、ソート、ページネーション用のクエリパラメータ
GET /api/markets?status=active&sort=volume&limit=20&offset=0
```

### リポジトリパターン

```typescript
// データアクセスロジックの抽象化
interface MarketRepository {
  findAll(filters?: MarketFilters): Promise<Market[]>
  findById(id: string): Promise<Market | null>
  create(data: CreateMarketDto): Promise<Market>
  update(id: string, data: UpdateMarketDto): Promise<Market>
  delete(id: string): Promise<void>
}

class SupabaseMarketRepository implements MarketRepository {
  async findAll(filters?: MarketFilters): Promise<Market[]> {
    let query = supabase.from('markets').select('*')

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data
  }

  // 他のメソッド...
}
```

### サービスレイヤーパターン

```typescript
// ビジネスロジックをデータアクセスから分離
class MarketService {
  constructor(private marketRepo: MarketRepository) {}

  async searchMarkets(query: string, limit: number = 10): Promise<Market[]> {
    // ビジネスロジック
    const embedding = await generateEmbedding(query)
    const results = await this.vectorSearch(embedding, limit)

    // 完全なデータを取得
    const markets = await this.marketRepo.findByIds(results.map(r => r.id))

    // 類似度でソート
    return markets.sort((a, b) => {
      const scoreA = results.find(r => r.id === a.id)?.score || 0
      const scoreB = results.find(r => r.id === b.id)?.score || 0
      return scoreA - scoreB
    })
  }

  private async vectorSearch(embedding: number[], limit: number) {
    // ベクトル検索の実装
  }
}
```

### ミドルウェアパターン

```typescript
// リクエスト/レスポンス処理パイプライン
export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const user = await verifyToken(token)
      req.user = user
      return handler(req, res)
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }
}

// 使い方
export default withAuth(async (req, res) => {
  // ハンドラーは req.user にアクセスできる
})
```

## データベースパターン

### クエリ最適化

```typescript
// ✅ GOOD: 必要なカラムだけを選択
const { data } = await supabase
  .from('markets')
  .select('id, name, status, volume')
  .eq('status', 'active')
  .order('volume', { ascending: false })
  .limit(10)

// ❌ BAD: すべて選択
const { data } = await supabase
  .from('markets')
  .select('*')
```

### N+1 クエリ防止

```typescript
// ❌ BAD: N+1 クエリ問題
const markets = await getMarkets()
for (const market of markets) {
  market.creator = await getUser(market.creator_id)  // N クエリ
}

// ✅ GOOD: バッチ取得
const markets = await getMarkets()
const creatorIds = markets.map(m => m.creator_id)
const creators = await getUsers(creatorIds)  // 1 クエリ
const creatorMap = new Map(creators.map(c => [c.id, c]))

markets.forEach(market => {
  market.creator = creatorMap.get(market.creator_id)
})
```

### トランザクションパターン

```typescript
async function createMarketWithPosition(
  marketData: CreateMarketDto,
  positionData: CreatePositionDto
) {
  // Supabase トランザクションを使用
  const { data, error } = await supabase.rpc('create_market_with_position', {
    market_data: marketData,
    position_data: positionData
  })

  if (error) throw new Error('Transaction failed')
  return data
}

// Supabase の SQL 関数
CREATE OR REPLACE FUNCTION create_market_with_position(
  market_data jsonb,
  position_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  -- トランザクションは自動で開始
  INSERT INTO markets VALUES (market_data);
  INSERT INTO positions VALUES (position_data);
  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    -- ロールバックは自動で行われる
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
```

## キャッシュ戦略

### Redis キャッシュレイヤー

```typescript
class CachedMarketRepository implements MarketRepository {
  constructor(
    private baseRepo: MarketRepository,
    private redis: RedisClient
  ) {}

  async findById(id: string): Promise<Market | null> {
    // まずキャッシュを確認
    const cached = await this.redis.get(`market:${id}`)

    if (cached) {
      return JSON.parse(cached)
    }

    // キャッシュミス - データベースから取得
    const market = await this.baseRepo.findById(id)

    if (market) {
      // 5 分間キャッシュ
      await this.redis.setex(`market:${id}`, 300, JSON.stringify(market))
    }

    return market
  }

  async invalidateCache(id: string): Promise<void> {
    await this.redis.del(`market:${id}`)
  }
}
```

### キャッシュアサイドパターン

```typescript
async function getMarketWithCache(id: string): Promise<Market> {
  const cacheKey = `market:${id}`

  // キャッシュを試す
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // キャッシュミス - DB から取得
  const market = await db.markets.findUnique({ where: { id } })

  if (!market) throw new Error('Market not found')

  // キャッシュを更新
  await redis.setex(cacheKey, 300, JSON.stringify(market))

  return market
}
```

## エラー処理パターン

### 集中エラーハンドラー

```typescript
class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export function errorHandler(error: unknown, req: Request): Response {
  if (error instanceof ApiError) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: error.statusCode })
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    }, { status: 400 })
  }

  // 予期しないエラーをログ
  console.error('Unexpected error:', error)

  return NextResponse.json({
    success: false,
    error: 'Internal server error'
  }, { status: 500 })
}

// 使い方
export async function GET(request: Request) {
  try {
    const data = await fetchData()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return errorHandler(error, request)
  }
}
```

### 指数バックオフでのリトライ

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (i < maxRetries - 1) {
        // 指数バックオフ: 1s, 2s, 4s
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

// 使い方
const data = await fetchWithRetry(() => fetchFromAPI())
```

## 認証と認可

### JWT トークン検証

```typescript
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  email: string
  role: 'admin' | 'user'
}

export function verifyToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return payload
  } catch (error) {
    throw new ApiError(401, 'Invalid token')
  }
}

export async function requireAuth(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new ApiError(401, 'Missing authorization token')
  }

  return verifyToken(token)
}

// API route での使い方
export async function GET(request: Request) {
  const user = await requireAuth(request)

  const data = await getDataForUser(user.userId)

  return NextResponse.json({ success: true, data })
}
```

### ロールベースのアクセス制御

```typescript
type Permission = 'read' | 'write' | 'delete' | 'admin'

interface User {
  id: string
  role: 'admin' | 'moderator' | 'user'
}

const rolePermissions: Record<User['role'], Permission[]> = {
  admin: ['read', 'write', 'delete', 'admin'],
  moderator: ['read', 'write', 'delete'],
  user: ['read', 'write']
}

export function hasPermission(user: User, permission: Permission): boolean {
  return rolePermissions[user.role].includes(permission)
}

export function requirePermission(permission: Permission) {
  return (handler: (request: Request, user: User) => Promise<Response>) => {
    return async (request: Request) => {
      const user = await requireAuth(request)

      if (!hasPermission(user, permission)) {
        throw new ApiError(403, 'Insufficient permissions')
      }

      return handler(request, user)
    }
  }
}

// 使い方 - HOF がハンドラーをラップ
export const DELETE = requirePermission('delete')(
  async (request: Request, user: User) => {
    // ハンドラーは認証済みユーザーと権限確認済みの情報を受け取る
    return new Response('Deleted', { status: 200 })
  }
)
```

## レート制限

### シンプルなインメモリレートリミッター

```typescript
class RateLimiter {
  private requests = new Map<string, number[]>()

  async checkLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []

    // ウィンドウ外の古いリクエストを削除
    const recentRequests = requests.filter(time => now - time < windowMs)

    if (recentRequests.length >= maxRequests) {
      return false  // レート制限超過
    }

    // 現在のリクエストを追加
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)

    return true
  }
}

const limiter = new RateLimiter()

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  const allowed = await limiter.checkLimit(ip, 100, 60000)  // 1 分あたり 100 リクエスト

  if (!allowed) {
    return NextResponse.json({
      error: 'Rate limit exceeded'
    }, { status: 429 })
  }

  // リクエストを継続
}
```

## バックグラウンドジョブとキュー

### シンプルなキューパターン

```typescript
class JobQueue<T> {
  private queue: T[] = []
  private processing = false

  async add(job: T): Promise<void> {
    this.queue.push(job)

    if (!this.processing) {
      this.process()
    }
  }

  private async process(): Promise<void> {
    this.processing = true

    while (this.queue.length > 0) {
      const job = this.queue.shift()!

      try {
        await this.execute(job)
      } catch (error) {
        console.error('Job failed:', error)
      }
    }

    this.processing = false
  }

  private async execute(job: T): Promise<void> {
    // ジョブ実行ロジック
  }
}

// markets のインデックス用
interface IndexJob {
  marketId: string
}

const indexQueue = new JobQueue<IndexJob>()

export async function POST(request: Request) {
  const { marketId } = await request.json()

  // ブロックせずにキューへ追加
  await indexQueue.add({ marketId })

  return NextResponse.json({ success: true, message: 'Job queued' })
}
```
