---
description: テスト駆動開発ワークフローを強制する。インターフェースをスキャフォールドし、テストを先に生成し、最小限のコードで通す。80%以上のカバレッジを保証する。
---

# TDD コマンド

このコマンドは、テスト駆動開発の方法論を強制するために **tdd-guide** エージェントを起動する。

## このコマンドが行うこと

1. **インターフェースをスキャフォールド** - 型 / インターフェースを先に定義する
2. **テストを先に生成** - 失敗するテスト（RED）を書く
3. **最小限の実装** - 通るために必要な分だけ書く（GREEN）
4. **リファクタ** - テストを通したまま改善する（REFACTOR）
5. **カバレッジを確認** - テストカバレッジ80%以上を確保する

## 使うタイミング

`/tdd` を使うのは次のときである:
- 新機能の実装
- 新しい関数 / コンポーネントの追加
- バグ修正（先にバグを再現するテストを書く）
- 既存コードのリファクタ
- 重要なビジネスロジックの構築

## 仕組み

tdd-guide エージェントは以下を行う:

1. 入出力の **インターフェースを定義**
2. **失敗するテストを書く**（コードがまだ無いので FAIL する）
3. **テストを実行**し、正しい理由で失敗するか確認
4. **最小実装を書く**ことでテストを通す
5. **テストを実行**し、通ることを確認
6. **リファクタ**しつつテストは通したままにする
7. **カバレッジを確認**し、80%未満なら追加テストを書く

## TDD サイクル

```
RED → GREEN → REFACTOR → REPEAT

RED:      Write a failing test
GREEN:    Write minimal code to pass
REFACTOR: Improve code, keep tests passing
REPEAT:   Next feature/scenario
```

## 使用例

```
User: /tdd I need a function to calculate market liquidity score

Agent (tdd-guide):
# TDD セッション: Market Liquidity Score Calculator

## Step 1: インターフェースを定義（SCAFFOLD）

```typescript
// lib/liquidity.ts
export interface MarketData {
  totalVolume: number
  bidAskSpread: number
  activeTraders: number
  lastTradeTime: Date
}

export function calculateLiquidityScore(market: MarketData): number {
  // TODO: 実装
  throw new Error('Not implemented')
}
```

## Step 2: 失敗するテストを書く（RED）

```typescript
// lib/liquidity.test.ts
import { calculateLiquidityScore } from './liquidity'

describe('calculateLiquidityScore', () => {
  it('should return high score for liquid market', () => {
    const market = {
      totalVolume: 100000,
      bidAskSpread: 0.01,
      activeTraders: 500,
      lastTradeTime: new Date()
    }

    const score = calculateLiquidityScore(market)

    expect(score).toBeGreaterThan(80)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('should return low score for illiquid market', () => {
    const market = {
      totalVolume: 100,
      bidAskSpread: 0.5,
      activeTraders: 2,
      lastTradeTime: new Date(Date.now() - 86400000) // 1 日前
    }

    const score = calculateLiquidityScore(market)

    expect(score).toBeLessThan(30)
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('should handle edge case: zero volume', () => {
    const market = {
      totalVolume: 0,
      bidAskSpread: 0,
      activeTraders: 0,
      lastTradeTime: new Date()
    }

    const score = calculateLiquidityScore(market)

    expect(score).toBe(0)
  })
})
```

## Step 3: テストを実行 - FAIL を確認

```bash
npm test lib/liquidity.test.ts

FAIL lib/liquidity.test.ts
  ✕ should return high score for liquid market (2 ms)
    Error: Not implemented

1 test failed, 0 passed
```

✅ 想定どおりテストは失敗した。実装の準備ができた。

## Step 4: 最小限の実装（GREEN）

```typescript
// lib/liquidity.ts
export function calculateLiquidityScore(market: MarketData): number {
  // ゼロボリュームのエッジケースを処理する
  if (market.totalVolume === 0) {
    return 0
  }

  // 各コンポーネントのスコアを計算する（0-100 スケール）
  const volumeScore = Math.min(market.totalVolume / 1000, 100)
  const spreadScore = Math.max(100 - (market.bidAskSpread * 1000), 0)
  const traderScore = Math.min(market.activeTraders / 10, 100)

  // 最近のアクティビティによるボーナス
  const hoursSinceLastTrade = (Date.now() - market.lastTradeTime.getTime()) / (1000 * 60 * 60)
  const recencyScore = Math.max(100 - (hoursSinceLastTrade * 10), 0)

  // 加重平均
  const score = (
    volumeScore * 0.4 +
    spreadScore * 0.3 +
    traderScore * 0.2 +
    recencyScore * 0.1
  )

  return Math.min(Math.max(score, 0), 100) // 0-100 にクランプ
}
```

## Step 5: テストを実行 - PASS を確認

```bash
npm test lib/liquidity.test.ts

PASS lib/liquidity.test.ts
  ✓ should return high score for liquid market (3 ms)
  ✓ should return low score for illiquid market (2 ms)
  ✓ should handle edge case: zero volume (1 ms)

3 tests passed
```

✅ すべてのテストが通過した。

## Step 6: リファクタ（IMPROVE）

```typescript
// lib/liquidity.ts - 定数化と可読性改善を行ったリファクタ版
const WEIGHTS = {
  VOLUME: 0.4,
  SPREAD: 0.3,
  TRADERS: 0.2,
  RECENCY: 0.1,
} as const

const SCALE_FACTORS = {
  VOLUME: 1000,
  SPREAD: 1000,
  TRADERS: 10,
  RECENCY_PENALTY: 10,
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function calculateLiquidityScore(market: MarketData): number {
  if (market.totalVolume === 0) return 0

  const volumeScore = Math.min(market.totalVolume / SCALE_FACTORS.VOLUME, 100)
  const spreadScore = clamp(100 - (market.bidAskSpread * SCALE_FACTORS.SPREAD), 0, 100)
  const traderScore = Math.min(market.activeTraders / SCALE_FACTORS.TRADERS, 100)

  const hoursSinceLastTrade = (Date.now() - market.lastTradeTime.getTime()) / (1000 * 60 * 60)
  const recencyScore = clamp(100 - (hoursSinceLastTrade * SCALE_FACTORS.RECENCY_PENALTY), 0, 100)

  const weightedScore =
    volumeScore * WEIGHTS.VOLUME +
    spreadScore * WEIGHTS.SPREAD +
    traderScore * WEIGHTS.TRADERS +
    recencyScore * WEIGHTS.RECENCY

  return clamp(weightedScore, 0, 100)
}
```

## Step 7: テストが通り続けることを確認

```bash
npm test lib/liquidity.test.ts

PASS lib/liquidity.test.ts
  ✓ should return high score for liquid market (3 ms)
  ✓ should return low score for illiquid market (2 ms)
  ✓ should handle edge case: zero volume (1 ms)

3 tests passed
```

✅ リファクタ完了。テストも通っている。

## Step 8: カバレッジを確認

```bash
npm test -- --coverage lib/liquidity.test.ts

File           | % Stmts | % Branch | % Funcs | % Lines
---------------|---------|----------|---------|--------
liquidity.ts   |   100   |   100    |   100   |   100

Coverage: 100% ✅ (Target: 80%)
```

✅ TDD セッション完了。
```

## TDD ベストプラクティス

**やること:**
- ✅ 実装より先にテストを書く
- ✅ 実装前にテストを実行し、FAIL を確認する
- ✅ テストを通す最小限のコードを書く
- ✅ テストが green になってからリファクタする
- ✅ エッジケースやエラーシナリオを追加する
- ✅ 80%以上のカバレッジを目標にする（重要コードは100%）

**やってはいけないこと:**
- ❌ テストより先に実装を書く
- ❌ 変更後にテストを走らせない
- ❌ 一度にコードを書きすぎる
- ❌ 失敗したテストを無視する
- ❌ 実装の詳細をテストする（振る舞いをテストする）
- ❌ 何でもモックする（統合テストを優先する）

## 含めるべきテスト種別

**ユニットテスト**（関数レベル）:
- 正常系シナリオ
- エッジケース（空、null、最大値）
- エラー条件
- 境界値

**統合テスト**（コンポーネントレベル）:
- API エンドポイント
- データベース操作
- 外部サービスの呼び出し
- React コンポーネント（hooks 付き）

**E2E テスト**（`/e2e` コマンドを使う）:
- 重要なユーザーフロー
- 複数ステップのプロセス
- フルスタック統合

## カバレッジ要件

- **最低80%** をすべてのコードに適用する
- **100% 必須** の対象:
  - 金融計算
  - 認証ロジック
  - セキュリティ重要コード
  - コアビジネスロジック

## 重要な注意点

**必須**: 実装前にテストを書くこと。TDD サイクルは次のとおりである:

1. **RED** - 失敗するテストを書く
2. **GREEN** - 通すための実装を書く
3. **REFACTOR** - 改善する

RED フェーズを省略しない。テストより先にコードを書かない。

## 他のコマンドとの連携

- `/plan` で最初に作る内容を理解する
- `/tdd` でテスト付き実装を行う
- ビルドエラーが起きたら `/build-and-fix` を使う
- 実装レビューは `/code-review` を使う
- カバレッジ確認は `/test-coverage` を使う

## 関連エージェント

このコマンドは、次の場所にある `tdd-guide` エージェントを起動する:
`~/.claude/agents/tdd-guide.md`

また、次の場所にある `tdd-workflow` スキルを参照できる:
`~/.claude/skills/tdd-workflow/`
