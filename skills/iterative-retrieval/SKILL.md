---
name: iterative-retrieval
description: サブエージェントのコンテキスト問題を解決するために、コンテキスト取得を段階的に洗練するパターン
---

# 反復的リトリーバルパターン

サブエージェントが作業を始めるまで必要なコンテキストが分からない、多エージェントワークフローの「コンテキスト問題」を解決する。

## 問題

サブエージェントは限られたコンテキストで起動される。以下が分からない:
- どのファイルに関連コードがあるか
- コードベースにどのパターンが存在するか
- プロジェクトがどの用語を使うか

標準的なアプローチは失敗する:
- **すべて送る**: コンテキスト上限を超える
- **何も送らない**: エージェントに重要情報がない
- **必要なものを推測する**: たいてい外れる

## 解決策: 反復的リトリーバル

コンテキストを段階的に洗練する 4 フェーズのループ:

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌──────────┐      ┌──────────┐            │
│   │ DISPATCH │─────▶│ EVALUATE │            │
│   └──────────┘      └──────────┘            │
│        ▲                  │                 │
│        │                  ▼                 │
│   ┌──────────┐      ┌──────────┐            │
│   │   LOOP   │◀─────│  REFINE  │            │
│   └──────────┘      └──────────┘            │
│                                             │
│        Max 3 cycles, then proceed           │
└─────────────────────────────────────────────┘
```

### フェーズ 1: DISPATCH

候補ファイルを集めるための初期の広いクエリ:

```javascript
// 高レベルの意図から開始する
const initialQuery = {
  patterns: ['src/**/*.ts', 'lib/**/*.ts'],
  keywords: ['authentication', 'user', 'session'],
  excludes: ['*.test.ts', '*.spec.ts']
};

// リトリーバルエージェントにディスパッチする
const candidates = await retrieveFiles(initialQuery);
```

### フェーズ 2: EVALUATE

取得した内容の関連性を評価する:

```javascript
function evaluateRelevance(files, task) {
  return files.map(file => ({
    path: file.path,
    relevance: scoreRelevance(file.content, task),
    reason: explainRelevance(file.content, task),
    missingContext: identifyGaps(file.content, task)
  }));
}
```

スコア基準:
- **高 (0.8-1.0)**: 目的の機能を直接実装している
- **中 (0.5-0.7)**: 関連パターンや型が含まれる
- **低 (0.2-0.4)**: 周辺的に関連する
- **なし (0-0.2)**: 関連なし、除外

### フェーズ 3: REFINE

評価結果に基づいて検索条件を更新する:

```javascript
function refineQuery(evaluation, previousQuery) {
  return {
    // 高関連ファイルで見つかった新しいパターンを追加する
    patterns: [...previousQuery.patterns, ...extractPatterns(evaluation)],

    // コードベースで見つかった用語を追加する
    keywords: [...previousQuery.keywords, ...extractKeywords(evaluation)],

    // 無関係と確定したパスを除外する
    excludes: [...previousQuery.excludes, ...evaluation
      .filter(e => e.relevance < 0.2)
      .map(e => e.path)
    ],

    // 特定の不足を狙う
    focusAreas: evaluation
      .flatMap(e => e.missingContext)
      .filter(unique)
  };
}
```

### フェーズ 4: LOOP

洗練した条件で繰り返す（最大 3 回）:

```javascript
async function iterativeRetrieve(task, maxCycles = 3) {
  let query = createInitialQuery(task);
  let bestContext = [];

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    const candidates = await retrieveFiles(query);
    const evaluation = evaluateRelevance(candidates, task);

    // 十分なコンテキストが得られたか確認する
    const highRelevance = evaluation.filter(e => e.relevance >= 0.7);
    if (highRelevance.length >= 3 && !hasCriticalGaps(evaluation)) {
      return highRelevance;
    }

    // 洗練して続行する
    query = refineQuery(evaluation, query);
    bestContext = mergeContext(bestContext, highRelevance);
  }

  return bestContext;
}
```

## 実践例

### 例 1: バグ修正のコンテキスト

```
タスク: "認証トークンの有効期限バグを修正する"

サイクル 1:
  DISPATCH: src/** で "token", "auth", "expiry" を検索
  EVALUATE: auth.ts (0.9), tokens.ts (0.8), user.ts (0.3) を発見
  REFINE: "refresh", "jwt" を追加し、user.ts を除外

サイクル 2:
  DISPATCH: 洗練後の語で検索
  EVALUATE: session-manager.ts (0.95), jwt-utils.ts (0.85) を発見
  REFINE: コンテキスト十分（高関連 2 ファイル）

結果: auth.ts, tokens.ts, session-manager.ts, jwt-utils.ts
```

### 例 2: 機能実装

```
タスク: "API エンドポイントにレートリミットを追加する"

サイクル 1:
  DISPATCH: routes/** で "rate", "limit", "api" を検索
  EVALUATE: 該当なし - コードベースは "throttle" 用語を使う
  REFINE: "throttle", "middleware" を追加

サイクル 2:
  DISPATCH: 洗練後の語で検索
  EVALUATE: throttle.ts (0.9), middleware/index.ts (0.7) を発見
  REFINE: router のパターンが必要

サイクル 3:
  DISPATCH: "router", "express" のパターンを検索
  EVALUATE: router-setup.ts (0.8) を発見
  REFINE: コンテキスト十分

結果: throttle.ts, middleware/index.ts, router-setup.ts
```

## エージェントへの統合

エージェントプロンプトで使う:

```markdown
このタスクのコンテキストを取得する場合:
1. 広いキーワード検索から始める
2. 各ファイルの関連性を評価する（0-1 スケール）
3. まだ不足しているコンテキストを特定する
4. 検索条件を洗練し、最大 3 回まで繰り返す
5. 関連性が 0.7 以上のファイルを返す
```

## ベストプラクティス

1. **広く始めて徐々に絞る** - 初期クエリを過度に絞り込まない
2. **コードベースの用語を学ぶ** - 最初のサイクルで命名規約が分かる
3. **不足点を追跡する** - 明示的に不足を特定すると洗練が進む
4. **十分で止める** - 高関連 3 ファイルは平凡な 10 ファイルより良い
5. **確信を持って除外する** - 低関連ファイルが後で関連することはない

## 関連

- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - サブエージェントのオーケストレーション節
