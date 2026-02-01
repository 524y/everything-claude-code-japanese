---
name: tdd-workflow
description: 新機能の実装、バグ修正、リファクタ時にこのスキルを使う。ユニット / 統合 / E2E テストを含む 80% 以上のカバレッジで TDD を徹底する。
---

# テスト駆動開発ワークフロー

このスキルは、すべての開発を TDD 原則と包括的なテストカバレッジで進めることを保証する。

## いつ使うか

- 新機能や機能追加を行うとき
- バグや問題を修正するとき
- 既存コードをリファクタするとき
- API エンドポイントを追加するとき
- 新しいコンポーネントを作成するとき

## コア原則

### 1. コードより先にテスト
常にテストを先に書き、テストが通るように実装する。

### 2. カバレッジ要件
- 最低 80% のカバレッジ (ユニット + 統合 + E2E)
- すべてのエッジケースを網羅する
- エラーシナリオをテストする
- 境界条件を検証する

### 3. テスト種別

#### ユニットテスト
- 個々の関数とユーティリティ
- コンポーネントのロジック
- 純粋関数
- ヘルパーとユーティリティ

#### 統合テスト
- API エンドポイント
- データベース操作
- サービス間連携
- 外部 API 呼び出し

#### E2E テスト (Playwright)
- 重要なユーザーフロー
- 完全なワークフロー
- ブラウザ自動化
- UI インタラクション

## TDD ワークフロー手順

### ステップ 1: ユーザージャーニーを書く
```
[role] として、[action] したい。そうすれば [benefit] を得られる。

例:
ユーザーとして、市場を意味的に検索したい。
そうすれば、正確なキーワードがなくても関連する市場を見つけられる。
```

### ステップ 2: テストケースを作成する
各ユーザージャーニーに対して包括的なテストケースを作成する:

```typescript
describe('Semantic Search', () => {
  it('returns relevant markets for query', async () => {
    // テスト実装
  })

  it('handles empty query gracefully', async () => {
    // エッジケースをテストする
  })

  it('falls back to substring search when Redis unavailable', async () => {
    // フォールバックの挙動をテストする
  })

  it('sorts results by similarity score', async () => {
    // ソートロジックをテストする
  })
})
```

### ステップ 3: テストを実行する (失敗するはず)
```bash
npm test
# テストは失敗するはず - まだ実装していない
```

### ステップ 4: コードを実装する
テストが通る最小限のコードを書く:

```typescript
// テストに導かれた実装
export async function searchMarkets(query: string) {
  // 実装
}
```

### ステップ 5: もう一度テストを実行する
```bash
npm test
# テストは通るはず
```

### ステップ 6: リファクタする
テストをグリーンのまま品質を改善する:
- 重複を削除する
- 命名を改善する
- パフォーマンスを最適化する
- 可読性を高める

### ステップ 7: カバレッジを検証する
```bash
npm run test:coverage
# 80% 以上のカバレッジを確認する
```

## テストパターン

### ユニットテストパターン (Jest / Vitest)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### API 統合テストパターン
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('returns markets successfully', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('handles database errors gracefully', async () => {
    // データベース失敗をモックする
    const request = new NextRequest('http://localhost/api/markets')
    // エラーハンドリングをテストする
  })
})
```

### E2E テストパターン (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('user can search and filter markets', async ({ page }) => {
  // マーケットページへ移動する
  await page.goto('/')
  await page.click('a[href="/markets"]')

  // ページが読み込まれたことを確認する
  await expect(page.locator('h1')).toContainText('Markets')

  // マーケットを検索する
  await page.fill('input[placeholder="Search markets"]', 'election')

  // デバウンスと結果を待つ
  await page.waitForTimeout(600)

  // 検索結果が表示されることを確認する
  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })

  // 検索語が含まれることを確認する
  const firstResult = results.first()
  await expect(firstResult).toContainText('election', { ignoreCase: true })

  // ステータスでフィルタする
  await page.click('button:has-text("Active")')

  // フィルタ結果を確認する
  await expect(results).toHaveCount(3)
})

test('user can create a new market', async ({ page }) => {
  // 先にログインする
  await page.goto('/creator-dashboard')

  // マーケット作成フォームを入力する
  await page.fill('input[name="name"]', 'Test Market')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.fill('input[name="endDate"]', '2025-12-31')

  // フォームを送信する
  await page.click('button[type="submit"]')

  // 成功メッセージを確認する
  await expect(page.locator('text=Market created successfully')).toBeVisible()

  // マーケットページへのリダイレクトを確認する
  await expect(page).toHaveURL(/\/markets\/test-market/)
})
```

## テストファイル構成

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx          # ユニットテスト
│   │   └── Button.stories.tsx       # Storybook
│   └── MarketCard/
│       ├── MarketCard.tsx
│       └── MarketCard.test.tsx
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts         # 統合テスト
└── e2e/
    ├── markets.spec.ts               # E2E テスト
    ├── trading.spec.ts
    └── auth.spec.ts
```

## 外部サービスのモック

### Supabase モック
```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Market' }],
          error: null
        }))
      }))
    }))
  }
}))
```

### Redis モック
```typescript
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() => Promise.resolve([
    { slug: 'test-market', similarity_score: 0.95 }
  ])),
  checkRedisHealth: jest.fn(() => Promise.resolve({ connected: true }))
}))
```

### OpenAI モック
```typescript
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn(() => Promise.resolve(
    new Array(1536).fill(0.1) // 1536 次元の埋め込みをモックする
  ))
}))
```

## テストカバレッジの検証

### カバレッジレポートを実行する
```bash
npm run test:coverage
```

### カバレッジしきい値
```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## よくあるテストのミス

### ❌ WRONG: 実装詳細をテストする
```typescript
// 内部状態をテストしない
expect(component.state.count).toBe(5)
```

### ✅ CORRECT: ユーザーに見える挙動をテストする
```typescript
// ユーザーが見るものをテストする
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### ❌ WRONG: 壊れやすいセレクタ
```typescript
// すぐ壊れる
await page.click('.css-class-xyz')
```

### ✅ CORRECT: セマンティックセレクタ
```typescript
// 変更に強い
await page.click('button:has-text("Submit")')
await page.click('[data-testid="submit-button"]')
```

### ❌ WRONG: テストの分離がない
```typescript
// テスト同士が依存する
test('creates user', () => { /* ... */ })
test('updates same user', () => { /* 前のテストに依存 */ })
```

### ✅ CORRECT: 独立したテスト
```typescript
// 各テストが自分でデータを準備する
test('creates user', () => {
  const user = createTestUser()
  // テストロジック
})

test('updates user', () => {
  const user = createTestUser()
  // 更新ロジック
})
```

## 継続的テスト

### 開発中のウォッチモード
```bash
npm test -- --watch
# ファイル変更時にテストが自動実行される
```

### プリコミットフック
```bash
# コミット前に毎回実行する
npm test && npm run lint
```

### CI/CD 連携
```yaml
# GitHub Actions
- name: Run Tests
  run: npm test -- --coverage
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## ベストプラクティス

1. **テストを先に書く** - 常に TDD
2. **1 テスト 1 アサート** - 単一の挙動に集中する
3. **説明的なテスト名** - 何をテストするかを説明する
4. **Arrange-Act-Assert** - 明確な構造
5. **外部依存をモックする** - ユニットテストを分離する
6. **エッジケースをテストする** - null、undefined、空、巨大
7. **エラーパスをテストする** - ハッピーパスだけではない
8. **テストを高速に保つ** - ユニットテストは 50ms 未満
9. **テスト後にクリーンアップする** - 副作用を残さない
10. **カバレッジレポートをレビューする** - ギャップを特定する

## 成功指標

- 80% 以上のコードカバレッジを達成する
