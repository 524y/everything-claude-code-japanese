---
name: coding-standards
description: TypeScript、JavaScript、React、Node.js 開発向けの普遍的なコーディング標準、ベストプラクティス、パターン。
---

# コーディング標準 & ベストプラクティス

すべてのプロジェクトに適用できる普遍的なコーディング標準。

## コード品質の原則

### 1. 可読性最優先
- コードは書くより読まれる
- 明確な変数名と関数名
- コメントより自己文書化コードを優先する
- 一貫したフォーマット

### 2. KISS (Keep It Simple, Stupid)
- 動く最も単純な解決策
- 過剰設計を避ける
- 早すぎる最適化をしない
- 賢いコードより理解しやすさ

### 3. DRY (Don't Repeat Yourself)
- 共通ロジックを関数に抽出する
- 再利用可能なコンポーネントを作る
- モジュール間でユーティリティを共有する
- コピペ実装を避ける

### 4. YAGNI (You Aren't Gonna Need It)
- 必要になる前に機能を作らない
- 憶測で一般化しない
- 必要なときだけ複雑さを追加する
- まずシンプルに始め、必要になったらリファクタする

## TypeScript / JavaScript 標準

### 変数命名

```typescript
// ✅ GOOD: 説明的な名前
const marketSearchQuery = 'election'
const isUserAuthenticated = true
const totalRevenue = 1000

// ❌ BAD: 不明確な名前
const q = 'election'
const flag = true
const x = 1000
```

### 関数命名

```typescript
// ✅ GOOD: 動詞 + 名詞のパターン
async function fetchMarketData(marketId: string) { }
function calculateSimilarity(a: number[], b: number[]) { }
function isValidEmail(email: string): boolean { }

// ❌ BAD: 不明確または名詞のみ
async function market(id: string) { }
function similarity(a, b) { }
function email(e) { }
```

### 不変性パターン (CRITICAL)

```typescript
// ✅ 常にスプレッド演算子を使う
const updatedUser = {
  ...user,
  name: 'New Name'
}

const updatedArray = [...items, newItem]

// ❌ 直接変更は絶対にしない
user.name = 'New Name'  // BAD
items.push(newItem)     // BAD
```

### エラー処理

```typescript
// ✅ GOOD: 包括的なエラー処理
async function fetchData(url: string) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Fetch failed:', error)
    throw new Error('Failed to fetch data')
  }
}

// ❌ BAD: エラー処理なし
async function fetchData(url) {
  const response = await fetch(url)
  return response.json()
}
```

### Async / Await ベストプラクティス

```typescript
// ✅ GOOD: 可能なら並列実行
const [users, markets, stats] = await Promise.all([
  fetchUsers(),
  fetchMarkets(),
  fetchStats()
])

// ❌ BAD: 不要な逐次実行
const users = await fetchUsers()
const markets = await fetchMarkets()
const stats = await fetchStats()
```

### 型安全性

```typescript
// ✅ GOOD: 適切な型
interface Market {
  id: string
  name: string
  status: 'active' | 'resolved' | 'closed'
  created_at: Date
}

function getMarket(id: string): Promise<Market> {
  // 実装
}

// ❌ BAD: 'any' を使う
function getMarket(id: any): Promise<any> {
  // 実装
}
```

## React ベストプラクティス

### コンポーネント構造

```typescript
// ✅ GOOD: 型付きの関数コンポーネント
interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  )
}

// ❌ BAD: 型なし、構造が不明確
export function Button(props) {
  return <button onClick={props.onClick}>{props.children}</button>
}
```

### カスタム Hooks

```typescript
// ✅ GOOD: 再利用可能なカスタムフック
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// 使用例
const debouncedQuery = useDebounce(searchQuery, 500)
```

### 状態管理

```typescript
// ✅ GOOD: 適切な状態更新
const [count, setCount] = useState(0)

// 直前の状態に基づく関数更新
setCount(prev => prev + 1)

// ❌ BAD: 直接参照
setCount(count + 1)  // 非同期シナリオでは古い可能性がある
```

### 条件レンダリング

```typescript
// ✅ GOOD: 明確な条件レンダリング
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// ❌ BAD: 三項演算子の地獄
{isLoading ? <Spinner /> : error ? <ErrorMessage error={error} /> : data ? <DataDisplay data={data} /> : null}
```

## API 設計標準

### REST API 規約

```
GET    /api/markets              # すべてのマーケットを取得
GET    /api/markets/:id          # 特定のマーケットを取得
POST   /api/markets              # 新規マーケットを作成
PUT    /api/markets/:id          # マーケットを更新 (全体)
PATCH  /api/markets/:id          # マーケットを更新 (部分)
DELETE /api/markets/:id          # マーケットを削除

# フィルタ用クエリパラメータ
GET /api/markets?status=active&limit=10&offset=0
```

### レスポンス形式

```typescript
// ✅ GOOD: 一貫したレスポンス構造
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

// 成功レスポンス
return NextResponse.json({
  success: true,
  data: markets,
  meta: { total: 100, page: 1, limit: 10 }
})

// エラーレスポンス
return NextResponse.json({
  success: false,
  error: 'Invalid request'
}, { status: 400 })
```

### 入力バリデーション

```typescript
import { z } from 'zod'

// ✅ GOOD: スキーマバリデーション
const CreateMarketSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  endDate: z.string().datetime(),
  categories: z.array(z.string()).min(1)
})

export async function POST(request: Request) {
  const body = await request.json()

  try {
    const validated = CreateMarketSchema.parse(body)
    // バリデーション済みデータで進める
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }
  }
}
```

## ファイル構成

### プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API ルート
│   ├── markets/           # マーケットページ
│   └── (auth)/           # 認証ページ (ルートグループ)
├── components/            # React コンポーネント
│   ├── ui/               # 汎用 UI コンポーネント
│   ├── forms/            # フォームコンポーネント
│   └── layouts/          # レイアウトコンポーネント
├── hooks/                # カスタム React フック
├── lib/                  # ユーティリティと設定
│   ├── api/             # API クライアント
│   ├── utils/           # ヘルパー関数
│   └── constants/       # 定数
├── types/                # TypeScript 型
└── styles/              # グローバルスタイル
```

### ファイル命名

```
components/Button.tsx          # コンポーネントは PascalCase
hooks/useAuth.ts              # フックは use 接頭辞付きの camelCase
lib/formatDate.ts             # ユーティリティは camelCase
types/market.types.ts         # .types 接尾辞付きの camelCase
```

## コメント & ドキュメント

### コメントを書くタイミング

```typescript
// ✅ GOOD: WHAT ではなく WHY を説明する
// 障害時に API を過負荷にしないため指数バックオフを使う
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000)

// 大きな配列で性能を確保するため意図的に破壊的変更している
items.push(newItem)

// ❌ BAD: 明白なことを述べる
// カウンターを 1 増やす
count++

// 名前をユーザー名に設定する
name = user.name
```

### 公開 API 向け JSDoc

```typescript
/**
 * セマンティック類似度でマーケットを検索する。
 *
 * @param query - 自然言語の検索クエリ
 * @param limit - 最大結果数 (デフォルト: 10)
 * @returns 類似度スコア順に並んだマーケット配列
 * @throws {Error} OpenAI API が失敗するか Redis が利用できない場合
 *
 * @example
 * ```typescript
 * const results = await searchMarkets('election', 5)
 * console.log(results[0].name) // "Trump vs Biden"
 * ```
 */
export async function searchMarkets(
  query: string,
  limit: number = 10
): Promise<Market[]> {
  // 実装
}
```

## パフォーマンスベストプラクティス

### メモ化

```typescript
import { useMemo, useCallback } from 'react'

// ✅ GOOD: 高コスト計算をメモ化する
const sortedMarkets = useMemo(() => {
  return markets.sort((a, b) => b.volume - a.volume)
}, [markets])

// ✅ GOOD: コールバックをメモ化する
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

### 遅延読み込み

```typescript
import { lazy, Suspense } from 'react'

// ✅ GOOD: 重いコンポーネントを遅延読み込みする
const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  )
}
```

### データベースクエリ

```typescript
// ✅ GOOD: 必要な列だけ選択する
const { data } = await supabase
  .from('markets')
  .select('id, name, status')
  .limit(10)

// ❌ BAD: すべて選択する
const { data } = await supabase
  .from('markets')
  .select('*')
```

## テスト標準

### テスト構造 (AAA パターン)

```typescript
test('calculates similarity correctly', () => {
  // 準備
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // 実行
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // 検証
  expect(similarity).toBe(0)
})
```

### テスト命名

```typescript
// ✅ GOOD: 説明的なテスト名
test('returns empty array when no markets match query', () => { })
test('throws error when OpenAI API key is missing', () => { })
test('falls back to substring search when Redis unavailable', () => { })

// ❌ BAD: 曖昧なテスト名
test('works', () => { })
test('test search', () => { })
```

## コードスメル検出

次のアンチパターンに注意する:

### 1. 長い関数
```typescript
// ❌ BAD: 関数が 50 行超
function processMarketData() {
  // 100 行のコード
}

// ✅ GOOD: 小さな関数に分割する
function processMarketData() {
  const validated = validateData()
  const transformed = transformData(validated)
  return saveData(transformed)
}
```

### 2. 深いネスト
```typescript
// ❌ BAD: 5 階層以上のネスト
if (user) {
  if (user.isAdmin) {
    if (market) {
      if (market.isActive) {
        if (hasPermission) {
          // 何かを実行する
        }
      }
    }
  }
}

// ✅ GOOD: 早期リターン
if (!user) return
if (!user.isAdmin) return
if (!market) return
if (!market.isActive) return
if (!hasPermission) return

// 何かを実行する
```

### 3. マジックナンバー
```typescript
// ❌ BAD: 説明なしの数値
if (retryCount > 3) { }
setTimeout(callback, 500)

// ✅ GOOD: 名前付き定数
const MAX_RETRIES = 3
const DEBOUNCE_DELAY_MS = 500

if (retryCount > MAX_RETRIES) { }
setTimeout(callback, DEBOUNCE_DELAY_MS)
```

**注意**: コード品質は妥協できない。明確で保守しやすいコードは、素早い開発と自信あるリファクタリングを可能にする。
