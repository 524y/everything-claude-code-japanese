# 共通パターン

## API レスポンス形式

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

## カスタム Hooks パターン

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

## リポジトリパターン

```typescript
interface Repository<T> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
```

## スケルトンプロジェクト

新しい機能を実装するとき:
1. 実戦で検証されたスケルトンプロジェクトを探す
2. 並列エージェントを使って選択肢を評価する:
   - セキュリティ評価
   - 拡張性分析
   - 関連性スコアリング
   - 実装計画
3. 最適なものをクローンして基盤にする
4. 実証済みの構造内で反復する
