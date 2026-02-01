---
name: postgres-patterns
description: クエリ最適化、スキーマ設計、インデックス、セキュリティのための PostgreSQL データベースパターン。Supabase のベストプラクティスに基づく。
---

# PostgreSQL パターン

PostgreSQL のベストプラクティスを素早く参照するための資料である。詳細なガイダンスは `database-reviewer` エージェントを使うこと。

## いつ使うか

- SQL クエリやマイグレーションを書くとき
- データベーススキーマを設計するとき
- 遅いクエリをトラブルシューティングするとき
- Row Level Security を実装するとき
- コネクションプーリングを設定するとき

## クイックリファレンス

### インデックスチートシート

| クエリパターン | インデックスタイプ | 例 |
|--------------|------------|---------|
| `WHERE col = value` | B-tree（デフォルト） | `CREATE INDEX idx ON t (col)` |
| `WHERE col > value` | B-tree | `CREATE INDEX idx ON t (col)` |
| `WHERE a = x AND b > y` | 複合 | `CREATE INDEX idx ON t (a, b)` |
| `WHERE jsonb @> '{}'` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| `WHERE tsv @@ query` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| 時系列レンジ | BRIN | `CREATE INDEX idx ON t USING brin (col)` |

### データ型クイックリファレンス

| 利用ケース | 正しい型 | 避ける |
|----------|-------------|-------|
| IDs | `bigint` | `int`, ランダム UUID |
| 文字列 | `text` | `varchar(255)` |
| タイムスタンプ | `timestamptz` | `timestamp` |
| 金額 | `numeric(10,2)` | `float` |
| フラグ | `boolean` | `varchar`, `int` |

### よく使うパターン

**複合インデックスの順序:**
```sql
-- 等値列を先に、次にレンジ列
CREATE INDEX idx ON orders (status, created_at);
-- 例: WHERE status = 'pending' AND created_at > '2024-01-01'
```

**カバリングインデックス:**
```sql
CREATE INDEX idx ON users (email) INCLUDE (name, created_at);
-- SELECT email, name, created_at のテーブル参照を避ける
```

**部分インデックス:**
```sql
CREATE INDEX idx ON users (email) WHERE deleted_at IS NULL;
-- 小さいインデックスで、アクティブユーザーのみ含める
```

**RLS ポリシー（最適化）:**
```sql
CREATE POLICY policy ON orders
  USING ((SELECT auth.uid()) = user_id);  -- SELECT で包む!
```

**UPSERT:**
```sql
INSERT INTO settings (user_id, key, value)
VALUES (123, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value;
```

**カーソルページネーション:**
```sql
SELECT * FROM products WHERE id > $last_id ORDER BY id LIMIT 20;
-- OFFSET は O(n)、こちらは O(1)
```

**キュー処理:**
```sql
UPDATE jobs SET status = 'processing'
WHERE id = (
  SELECT id FROM jobs WHERE status = 'pending'
  ORDER BY created_at LIMIT 1
  FOR UPDATE SKIP LOCKED
) RETURNING *;
```

### アンチパターン検出

```sql
-- インデックスのない外部キーを検出する
SELECT conrelid::regclass, a.attname
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
  );

-- 遅いクエリを検出する
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- テーブル膨張を確認する
SELECT relname, n_dead_tup, last_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

### 設定テンプレート

```sql
-- コネクション上限（RAM に合わせて調整）
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET work_mem = '8MB';

-- タイムアウト
ALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';
ALTER SYSTEM SET statement_timeout = '30s';

-- 監視
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- セキュリティのデフォルト
REVOKE ALL ON SCHEMA public FROM public;

SELECT pg_reload_conf();
```

## 関連

- エージェント: `database-reviewer` - データベースの完全なレビューワークフロー
- スキル: `clickhouse-io` - ClickHouse 分析パターン
- スキル: `backend-patterns` - API とバックエンドパターン

---

* [Supabase Agent Skills](https://github.com/supabase/agent-skills) に基づく（MIT License）*
