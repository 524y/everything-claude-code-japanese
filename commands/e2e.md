---
description: Playwright で E2E テストを生成し実行する。テストジャーニーの作成、テスト実行、スクリーンショット/動画/トレースの取得、成果物のアップロードを行う。
---

# E2E コマンド

このコマンドは **e2e-runner** エージェントを呼び出し、Playwright を使った E2E テストの生成、保守、実行を行う。

## このコマンドの内容

1. **テストジャーニー生成** - ユーザーフローの Playwright テストを作成
2. **E2E テスト実行** - 複数ブラウザでテストを実行
3. **成果物の取得** - 失敗時のスクリーンショット、動画、トレース
4. **結果のアップロード** - HTML レポートと JUnit XML
5. **フレイキーテストの特定** - 不安定なテストを隔離

## 使用するタイミング

`/e2e` を使う場面:
- 重要なユーザージャーニー（ログイン、取引、支払い）をテストする
- 複数ステップのフローを E2E で検証する
- UI 操作とナビゲーションをテストする
- フロントエンドとバックエンドの統合を検証する
- 本番デプロイの準備をする

## 動作の流れ

e2e-runner エージェントは次を行う:

1. **ユーザーフローを分析** してテストシナリオを特定する
2. **Page Object Model** パターンで Playwright テストを生成する
3. **複数ブラウザ**（Chrome、Firefox、Safari）でテストを実行する
4. **失敗時の成果物**（スクリーンショット、動画、トレース）を取得する
5. **結果レポート** を作成し成果物を提示する
6. **フレイキーテスト** を特定し修正を推奨する

## 使用例

```
ユーザー: /e2e market search と view のフローをテストして

エージェント (e2e-runner):
# E2E テスト生成: Market Search and View Flow

## 特定したテストシナリオ

**ユーザージャーニー:** Market Search → View Results → Click Market → View Details

**テストカバレッジ:**
1. markets ページへ移動
2. セマンティック検索を実行
3. 検索結果を検証
4. 最初の結果をクリック
5. 市場詳細ページの表示を確認
6. チャートの描画を確認

## 生成されたテストコード

```typescript
// tests/e2e/markets/search-and-view.spec.ts
import { test, expect } from '@playwright/test'
import { MarketsPage } from '../../pages/MarketsPage'
import { MarketDetailsPage } from '../../pages/MarketDetailsPage'

test.describe('Market Search and View Flow', () => {
  test('user can search markets and view details', async ({ page }) => {
    // 1. markets ページへ移動
    const marketsPage = new MarketsPage(page)
    await marketsPage.goto()

    // ページの読み込み確認
    await expect(page).toHaveTitle(/Markets/)
    await expect(page.locator('h1')).toContainText('Markets')

    // 2. セマンティック検索を実行
    await marketsPage.searchMarkets('election')

    // API レスポンスを待つ
    await page.waitForResponse(resp =>
      resp.url().includes('/api/markets/search') && resp.status() === 200
    )

    // 3. 検索結果を検証
    const marketCards = marketsPage.marketCards
    await expect(marketCards.first()).toBeVisible()
    const resultCount = await marketCards.count()
    expect(resultCount).toBeGreaterThan(0)

    // 検索結果のスクリーンショットを撮る
    await page.screenshot({ path: 'artifacts/search-results.png' })

    // 4. 最初の結果をクリック
    const firstMarketTitle = await marketCards.first().textContent()
    await marketCards.first().click()

    // 5. 市場詳細ページの表示を確認
    await expect(page).toHaveURL(/\/markets\/[a-z0-9-]+/)

    const detailsPage = new MarketDetailsPage(page)
    await expect(detailsPage.marketName).toBeVisible()
    await expect(detailsPage.marketDescription).toBeVisible()

    // 6. チャートの描画を確認
    await expect(detailsPage.priceChart).toBeVisible()

    // 市場名が一致することを確認
    const detailsTitle = await detailsPage.marketName.textContent()
    expect(detailsTitle?.toLowerCase()).toContain(
      firstMarketTitle?.toLowerCase().substring(0, 20) || ''
    )

    // 市場詳細のスクリーンショットを撮る
    await page.screenshot({ path: 'artifacts/market-details.png' })
  })

  test('search with no results shows empty state', async ({ page }) => {
    const marketsPage = new MarketsPage(page)
    await marketsPage.goto()

    // 存在しない市場を検索
    await marketsPage.searchMarkets('xyznonexistentmarket123456')

    // 空状態を確認
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="no-results"]')).toContainText(
      /no.*results|no.*markets/i
    )

    const marketCount = await marketsPage.marketCards.count()
    expect(marketCount).toBe(0)
  })

  test('can clear search and see all markets again', async ({ page }) => {
    const marketsPage = new MarketsPage(page)
    await marketsPage.goto()

    // 初期の市場数
    const initialCount = await marketsPage.marketCards.count()

    // 検索を実行
    await marketsPage.searchMarkets('trump')
    await page.waitForLoadState('networkidle')

    // 絞り込み後の結果を確認
    const filteredCount = await marketsPage.marketCards.count()
    expect(filteredCount).toBeLessThan(initialCount)

    // 検索をクリア
    await marketsPage.searchInput.clear()
    await page.waitForLoadState('networkidle')

    // すべての市場が再表示されることを確認
    const finalCount = await marketsPage.marketCards.count()
    expect(finalCount).toBe(initialCount)
  })
})
```

## テストの実行

```bash
# 生成されたテストを実行
npx playwright test tests/e2e/markets/search-and-view.spec.ts

3 workers で 3 テストを実行

  ✓  [chromium] › search-and-view.spec.ts:5:3 › user can search markets and view details (4.2s)
  ✓  [chromium] › search-and-view.spec.ts:52:3 › search with no results shows empty state (1.8s)
  ✓  [chromium] › search-and-view.spec.ts:67:3 › can clear search and see all markets again (2.9s)

  3 passed (9.1s)

生成された成果物:
- artifacts/search-results.png
- artifacts/market-details.png
- playwright-report/index.html
```

## テストレポート

```
╔══════════════════════════════════════════════════════════════╗
║                    E2E テスト結果                            ║
╠══════════════════════════════════════════════════════════════╣
║ Status:     ✅ すべてのテストが成功                         ║
║ Total:      3 tests                                          ║
║ Passed:     3 (100%)                                         ║
║ Failed:     0                                                ║
║ Flaky:      0                                                ║
║ Duration:   9.1s                                             ║
╚══════════════════════════════════════════════════════════════╝

成果物:
📸 スクリーンショット: 2 ファイル
📹 動画: 0 ファイル（失敗時のみ）
🔍 トレース: 0 ファイル（失敗時のみ）
📊 HTML レポート: playwright-report/index.html

レポートを見る: npx playwright show-report
```

✅ E2E テストスイートは CI/CD 統合の準備ができた!
```

## テスト成果物

テスト実行時、次の成果物を取得する:

**全テストで取得:**
- タイムラインと結果付きの HTML レポート
- CI 連携用の JUnit XML

**失敗時のみ取得:**
- 失敗時点のスクリーンショット
- テストの動画記録
- デバッグ用トレースファイル（手順ごとの再生）
- ネットワークログ
- コンソールログ

## 成果物の確認

```bash
# ブラウザで HTML レポートを見る
npx playwright show-report

# 特定のトレースファイルを見る
npx playwright show-trace artifacts/trace-abc123.zip

# スクリーンショットは artifacts/ ディレクトリに保存
open artifacts/search-results.png
```

## フレイキーテストの検出

テストが断続的に失敗する場合:

```
⚠️  FLAKY TEST DETECTED: tests/e2e/markets/trade.spec.ts

10 回中 7 回成功（成功率 70%）
```

そのテストは隔離し、改善に注力する。
