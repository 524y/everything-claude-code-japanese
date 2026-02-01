# コーディングスタイル

## 不変性 (CRITICAL)

必ず新しいオブジェクトを作成し、決して破壊的変更しない:

```javascript
// WRONG: 破壊的変更
function updateUser(user, name) {
  user.name = name  // 破壊的変更!
  return user
}

// CORRECT: 不変性
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

## ファイル構成

小さなファイル多数 > 大きなファイル少数:
- 高凝集、低結合
- 200-400 行が典型、最大 800 行
- 大きなコンポーネントからユーティリティを抽出する
- 型ではなく、機能 / ドメインで整理する

## エラー処理

常にエラーを包括的に処理する:

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Detailed user-friendly message')
}
```

## 入力バリデーション

常にユーザー入力をバリデーションする:

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## コード品質チェックリスト

作業完了をマークする前に:
- [ ] コードは読みやすく、命名が明確である
- [ ] 関数は小さい (<50 行)
- [ ] ファイルは焦点が明確である (<800 行)
- [ ] 深いネストはない (>4 階層)
- [ ] 適切なエラー処理
- [ ] console.log 文がない
- [ ] ハードコードされた値がない
- [ ] 破壊的変更がない (immutable パターンを使用)
