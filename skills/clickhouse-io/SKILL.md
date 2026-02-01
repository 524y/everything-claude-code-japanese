---
name: clickhouse-io
description: ClickHouse データベースのパターン、クエリ最適化、アナリティクス、および高性能な分析ワークロード向けのデータエンジニアリングのベストプラクティス。
---

# ClickHouse 分析パターン

高性能な分析とデータエンジニアリング向けの ClickHouse 固有パターン。

## 概要

ClickHouse はオンライン分析処理 (OLAP) 向けのカラム指向データベース管理システム (DBMS) である。大規模データセットに対する高速な分析クエリに最適化されている。

**主要機能:**
- カラム指向ストレージ
- データ圧縮
- 並列クエリ実行
- 分散クエリ
- リアルタイム分析

## テーブル設計パターン

### MergeTree エンジン (最も一般的)

```sql
CREATE TABLE markets_analytics (
    date Date,
    market_id String,
    market_name String,
    volume UInt64,
    trades UInt32,
    unique_traders UInt32,
    avg_trade_size Float64,
    created_at DateTime
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, market_id)
SETTINGS index_granularity = 8192;
```

### ReplacingMergeTree (重複排除)

```sql
-- 重複が発生しうるデータ向け (例: 複数ソースからの取り込み)
CREATE TABLE user_events (
    event_id String,
    user_id String,
    event_type String,
    timestamp DateTime,
    properties String
) ENGINE = ReplacingMergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (user_id, event_id, timestamp)
PRIMARY KEY (user_id, event_id);
```

### AggregatingMergeTree (事前集計)

```sql
-- 集計メトリクスを維持するため
CREATE TABLE market_stats_hourly (
    hour DateTime,
    market_id String,
    total_volume AggregateFunction(sum, UInt64),
    total_trades AggregateFunction(count, UInt32),
    unique_users AggregateFunction(uniq, String)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, market_id);

-- 集計済みデータのクエリ
SELECT
    hour,
    market_id,
    sumMerge(total_volume) AS volume,
    countMerge(total_trades) AS trades,
    uniqMerge(unique_users) AS users
FROM market_stats_hourly
WHERE hour >= toStartOfHour(now() - INTERVAL 24 HOUR)
GROUP BY hour, market_id
ORDER BY hour DESC;
```

## クエリ最適化パターン

### 効率的なフィルタリング

```sql
-- ✅ GOOD: インデックス付き列を先に使う
SELECT *
FROM markets_analytics
WHERE date >= '2025-01-01'
  AND market_id = 'market-123'
  AND volume > 1000
ORDER BY date DESC
LIMIT 100;

-- ❌ BAD: 非インデックス列から先にフィルタする
SELECT *
FROM markets_analytics
WHERE volume > 1000
  AND market_name LIKE '%election%'
  AND date >= '2025-01-01';
```

### 集計

```sql
-- ✅ GOOD: ClickHouse 固有の集計関数を使う
SELECT
    toStartOfDay(created_at) AS day,
    market_id,
    sum(volume) AS total_volume,
    count() AS total_trades,
    uniq(trader_id) AS unique_traders,
    avg(trade_size) AS avg_size
FROM trades
WHERE created_at >= today() - INTERVAL 7 DAY
GROUP BY day, market_id
ORDER BY day DESC, total_volume DESC;

-- ✅ パーセンタイルには quantile を使う (percentile より効率的)
SELECT
    quantile(0.50)(trade_size) AS median,
    quantile(0.95)(trade_size) AS p95,
    quantile(0.99)(trade_size) AS p99
FROM trades
WHERE created_at >= now() - INTERVAL 1 HOUR;
```

### ウィンドウ関数

```sql
-- 累積合計を計算する
SELECT
    date,
    market_id,
    volume,
    sum(volume) OVER (
        PARTITION BY market_id
        ORDER BY date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_volume
FROM markets_analytics
WHERE date >= today() - INTERVAL 30 DAY
ORDER BY market_id, date;
```

## データ挿入パターン

### バルク挿入 (推奨)

```typescript
import { ClickHouse } from 'clickhouse'

const clickhouse = new ClickHouse({
  url: process.env.CLICKHOUSE_URL,
  port: 8123,
  basicAuth: {
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD
  }
})

// ✅ バッチ挿入 (効率的)
async function bulkInsertTrades(trades: Trade[]) {
  const values = trades.map(trade => `(
    '${trade.id}',
    '${trade.market_id}',
    '${trade.user_id}',
    ${trade.amount},
    '${trade.timestamp.toISOString()}'
  )`).join(',')

  await clickhouse.query(`
    INSERT INTO trades (id, market_id, user_id, amount, timestamp)
    VALUES ${values}
  `).toPromise()
}

// ❌ 個別挿入 (遅い)
async function insertTrade(trade: Trade) {
  // ループ内でこれをやらない!
  await clickhouse.query(`
    INSERT INTO trades VALUES ('${trade.id}', ...)
  `).toPromise()
}
```

### ストリーミング挿入

```typescript
// 継続的なデータ取り込み向け
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

async function streamInserts() {
  const stream = clickhouse.insert('trades').stream()

  for await (const batch of dataSource) {
    stream.write(batch)
  }

  await stream.end()
}
```

## マテリアライズドビュー

### リアルタイム集計

```sql
-- 時間別統計のためのマテリアライズドビューを作成する
CREATE MATERIALIZED VIEW market_stats_hourly_mv
TO market_stats_hourly
AS SELECT
    toStartOfHour(timestamp) AS hour,
    market_id,
    sumState(amount) AS total_volume,
    countState() AS total_trades,
    uniqState(user_id) AS unique_users
FROM trades
GROUP BY hour, market_id;

-- マテリアライズドビューをクエリする
SELECT
    hour,
    market_id,
    sumMerge(total_volume) AS volume,
    countMerge(total_trades) AS trades,
    uniqMerge(unique_users) AS users
FROM market_stats_hourly
WHERE hour >= now() - INTERVAL 24 HOUR
GROUP BY hour, market_id;
```

## パフォーマンス監視

### クエリパフォーマンス

```sql
-- 遅いクエリを確認する
SELECT
    query_id,
    user,
    query,
    query_duration_ms,
    read_rows,
    read_bytes,
    memory_usage
FROM system.query_log
WHERE type = 'QueryFinish'
  AND query_duration_ms > 1000
  AND event_time >= now() - INTERVAL 1 HOUR
ORDER BY query_duration_ms DESC
LIMIT 10;
```

### テーブル統計

```sql
-- テーブルサイズを確認する
SELECT
    database,
    table,
    formatReadableSize(sum(bytes)) AS size,
    sum(rows) AS rows,
    max(modification_time) AS latest_modification
FROM system.parts
WHERE active
GROUP BY database, table
ORDER BY sum(bytes) DESC;
```

## 共通分析クエリ

### 時系列分析

```sql
-- 日次アクティブユーザー
SELECT
    toDate(timestamp) AS date,
    uniq(user_id) AS daily_active_users
FROM events
WHERE timestamp >= today() - INTERVAL 30 DAY
GROUP BY date
ORDER BY date;

-- リテンション分析
SELECT
    signup_date,
    countIf(days_since_signup = 0) AS day_0,
    countIf(days_since_signup = 1) AS day_1,
    countIf(days_since_signup = 7) AS day_7,
    countIf(days_since_signup = 30) AS day_30
FROM (
    SELECT
        user_id,
        min(toDate(timestamp)) AS signup_date,
        toDate(timestamp) AS activity_date,
        dateDiff('day', signup_date, activity_date) AS days_since_signup
    FROM events
    GROUP BY user_id, activity_date
)
GROUP BY signup_date
ORDER BY signup_date DESC;
```

### ファネル分析

```sql
-- コンバージョンファネル
SELECT
    countIf(step = 'viewed_market') AS viewed,
    countIf(step = 'clicked_trade') AS clicked,
    countIf(step = 'completed_trade') AS completed,
    round(clicked / viewed * 100, 2) AS view_to_click_rate,
    round(completed / clicked * 100, 2) AS click_to_completion_rate
FROM (
    SELECT
        user_id,
        session_id,
        event_type AS step
    FROM events
    WHERE event_date = today()
)
GROUP BY session_id;
```

### コホート分析

```sql
-- サインアップ月別のユーザーコホート
SELECT
    toStartOfMonth(signup_date) AS cohort,
    toStartOfMonth(activity_date) AS month,
    dateDiff('month', cohort, month) AS months_since_signup,
    count(DISTINCT user_id) AS active_users
FROM (
    SELECT
        user_id,
        min(toDate(timestamp)) OVER (PARTITION BY user_id) AS signup_date,
        toDate(timestamp) AS activity_date
    FROM events
)
GROUP BY cohort, month, months_since_signup
ORDER BY cohort, months_since_signup;
```

## データパイプラインパターン

### ETL パターン

```typescript
// 抽出、変換、ロード
async function etlPipeline() {
  // 1. ソースから抽出する
  const rawData = await extractFromPostgres()

  // 2. 変換する
  const transformed = rawData.map(row => ({
    date: new Date(row.created_at).toISOString().split('T')[0],
    market_id: row.market_slug,
    volume: parseFloat(row.total_volume),
    trades: parseInt(row.trade_count)
  }))

  // 3. ClickHouse にロードする
  await bulkInsertToClickHouse(transformed)
}

// 定期実行する
setInterval(etlPipeline, 60 * 60 * 1000)  // 1 時間ごと
```

### 変更データキャプチャ (CDC)

```typescript
// PostgreSQL の変更を監視し、ClickHouse に同期する
import { Client } from 'pg'

const pgClient = new Client({ connectionString: process.env.DATABASE_URL })

pgClient.query('LISTEN market_updates')

pgClient.on('notification', async (msg) => {
  const update = JSON.parse(msg.payload)

  await clickhouse.insert('market_updates', [
    {
      market_id: update.id,
      event_type: update.operation,  // INSERT, UPDATE, DELETE
      timestamp: new Date(),
      data: JSON.stringify(update.new_data)
    }
  ])
})
```

## ベストプラクティス

### 1. パーティショニング戦略
- 時間でパーティション分割する (通常は月または日)
- パーティション数を増やしすぎない (性能に影響)
- パーティションキーに Date type を使う

### 2. 並び替えキー
- 最も頻繁にフィルタされる列を先に置く
- カーディナリティを考慮する (高カーディナリティを先に)
- 並び順は圧縮に影響する

### 3. データ型
- 最小限に適切な type を使う (UInt32 vs UInt64)
- 繰り返し文字列には LowCardinality を使う
- カテゴリデータには Enum を使う

### 4. 避けること
- SELECT * (列を指定する)
- FINAL (代わりにクエリ前にマージする)
- JOIN が多すぎる (分析向けに非正規化する)
- 小さく頻繁な挿入 (代わりにバッチ)

### 5. 監視
- クエリパフォーマンスを追跡する
- ディスク使用量を監視する
- マージ処理を確認する
- 遅いクエリログをレビューする

**注意**: ClickHouse は分析ワークロードに強い。クエリパターンに合わせてテーブルを設計し、バッチ挿入を行い、リアルタイム集計にはマテリアライズドビューを活用する。
