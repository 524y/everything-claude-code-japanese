# Everything Claude Code - OpenCode Instructions

本ドキュメントは、Claude Code 設定の中核ルールを OpenCode 向けに統合したものである。

## Security Guidelines（CRITICAL）

### 必須セキュリティチェック

コミット前に必ず確認する:
- [ ] ハードコードされたシークレットがない（API キー / パスワード / トークン）
- [ ] 全ユーザー入力を検証している
- [ ] SQL injection 対策（パラメータ化クエリ）
- [ ] XSS 対策（HTML サニタイズ）
- [ ] CSRF 対策が有効
- [ ] 認証 / 認可を確認済み
- [ ] 全エンドポイントにレートリミット
- [ ] エラーメッセージに機密情報を含めない

### Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-proj-xxxxx"

// ALWAYS: Environment variables
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

### セキュリティ対応プロトコル

セキュリティ問題を検知した場合:
1. 直ちに作業を停止する
2. **security-reviewer** エージェントを使う
3. CRITICAL 問題を修正してから再開する
4. 露出したシークレットをローテーションする
5. 同種問題がないか全コードベースを確認する

---

## Coding Style

### Immutability（CRITICAL）

新しいオブジェクトを作成し、破壊的変更を避ける:

```javascript
// WRONG: Mutation
function updateUser(user, name) {
  user.name = name  // MUTATION!
  return user
}

// CORRECT: Immutability
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

### ファイル構成

少数の巨大ファイルより、責務が明確な小さなファイルを優先する:
- 高凝集 / 低結合
- 200-400 行を目安、最大 800 行
- 大きなコンポーネントから utility を抽出
- 型別ではなく機能 / ドメイン別に整理

### エラーハンドリング

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Detailed user-friendly message')
}
```

### 入力検証

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

### 品質チェックリスト

- [ ] 可読性があり命名が適切
- [ ] 関数は小さい（50 行未満）
- [ ] ファイルは責務集中（800 行未満）
- [ ] 深いネストを避ける（4 段以下）
- [ ] エラーハンドリングが適切
- [ ] 不要な console.log がない
- [ ] ハードコード値を避ける
- [ ] 破壊的変更を避ける

---

## Testing Requirements

### 最低カバレッジ: 80%

必要なテスト種別:
1. **Unit Tests** - 関数 / utility / コンポーネント
2. **Integration Tests** - API / DB 操作
3. **E2E Tests** - 重要ユーザーフロー（Playwright）

### TDD

必須フロー:
1. テストを先に書く（RED）
2. テストを実行して FAIL を確認
3. 最小実装を書く（GREEN）
4. テストを実行して PASS を確認
5. リファクタする（IMPROVE）
6. カバレッジ（80%+）を確認

### テスト失敗時

1. **tdd-guide** エージェントを使う
2. テスト分離を確認する
3. モック設定を確認する
4. テストが誤っていない限り実装側を修正する

---

## Git Workflow

### コミットメッセージ形式

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

### Pull Request フロー

PR 作成時:
1. 最新コミットだけでなく履歴全体を確認する
2. `git diff [base-branch]...HEAD` で全差分を確認する
3. 包括的な PR サマリーを作る
4. TODO を含むテスト計画を書く
5. 新規ブランチなら `-u` 付きで push する

### 機能実装フロー

1. **Plan First**
   - **planner** で実装計画作成
   - 依存関係とリスク特定
   - フェーズ分解

2. **TDD Approach**
   - **tdd-guide** を使用
   - RED → GREEN → IMPROVE
   - 80%+ カバレッジを確認

3. **Code Review**
   - 実装直後に **code-reviewer** を使用
   - CRITICAL / HIGH を解消
   - MEDIUM は可能な限り解消

4. **Commit & Push**
   - 詳細なコミットメッセージ
   - Conventional Commits 準拠

---

## Agent Orchestration

### 利用可能エージェント

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| planner | 実装計画 | 複雑機能 / リファクタ |
| architect | 設計判断 | アーキテクチャ変更 |
| tdd-guide | TDD 実装 | 新機能 / バグ修正 |
| code-reviewer | コードレビュー | 実装直後 |
| security-reviewer | セキュリティ分析 | コミット前 |
| build-error-resolver | ビルド修正 | ビルド失敗時 |
| e2e-runner | E2E テスト | 重要フロー検証 |
| refactor-cleaner | デッドコード整理 | 保守作業 |
| doc-updater | ドキュメント更新 | docs 変更時 |
| go-reviewer | Go レビュー | Go プロジェクト |
| go-build-resolver | Go ビルド修正 | Go ビルド失敗時 |
| database-reviewer | DB 最適化 | SQL / スキーマ設計 |

### 即時利用ルール

1. 複雑機能要求では **planner** を使う
2. コード変更直後は **code-reviewer** を使う
3. バグ修正や新機能では **tdd-guide** を使う
4. 設計判断時は **architect** を使う

---

## Performance Optimization

### モデル選択

**Haiku**（Sonnet の約 90% 能力、低コスト）:
- 頻繁に呼ぶ軽量エージェント
- ペアプロ / コード生成
- マルチエージェントのワーカー

**Sonnet**（コーディング向け主力）:
- メイン実装
- マルチエージェント制御
- 複雑な開発タスク

**Opus**（最大推論）:
- 難易度が高い設計判断
- 深い分析や研究タスク

### コンテキスト管理

コンテキストウィンドウの最後の 20% は次で使わない:
- 大規模リファクタ
- 複数ファイルにまたがる機能実装
- 複雑な相互作用デバッグ

### ビルド失敗時

1. **build-error-resolver** を使う
2. エラー内容を分析する
3. 小さく段階的に修正する
4. 修正ごとに再検証する

---

## Common Patterns

### API Response Format

```typescript
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
```

### Custom Hooks Pattern

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

### Repository Pattern

```typescript
interface Repository<T> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
```

---

## OpenCode 固有メモ

OpenCode でコード編集後に推奨する手動確認:

### コード編集後
- `prettier --write <file>` で JS / TS を整形
- `npx tsc --noEmit` で型エラー確認
- console.log を確認して削除

### コミット前
- セキュリティチェックを手動実施
- シークレット混入がないことを確認
- テストスイートを実行

### 主要コマンド

- `/plan` - 実装計画
- `/tdd` - TDD ワークフロー
- `/code-review` - コードレビュー
- `/security` - セキュリティレビュー
- `/build-fix` - ビルド修正
- `/e2e` - E2E テスト
- `/refactor-clean` - デッドコード整理
- `/orchestrate` - マルチエージェント実行

---

## Success Metrics

次を満たすと成功である:
- 全テストが通る（80%+ カバレッジ）
- セキュリティ脆弱性がない
- 可読性と保守性が高い
- 性能が許容範囲にある
- ユーザー要件を満たしている
