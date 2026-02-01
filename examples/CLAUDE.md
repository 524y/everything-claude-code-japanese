# 例: プロジェクト CLAUDE.md

これはプロジェクトレベルの CLAUDE.md の例である。プロジェクトのルートに配置する。

## プロジェクト概要

[プロジェクトの簡単な説明 - 何をするか、技術スタック]

## 重要ルール

### 1. コード構成

- 大きなファイルより小さなファイルを多くする
- 高凝集、低結合
- 1 ファイルは通常 200-400 行、最大 800 行
- 型ではなく機能/ドメインで整理する

### 2. コードスタイル

- コード、コメント、ドキュメントに絵文字を入れない
- 常に不変性 - オブジェクトや配列を変更しない
- 本番コードに console.log を入れない
- try/catch で適切にエラー処理する
- Zod などで入力バリデーションを行う

### 3. テスト

- TDD: テストを先に書く
- 最低80%のカバレッジ
- ユーティリティのユニットテスト
- API の統合テスト
- 重要フローの E2E テスト

### 4. セキュリティ

- シークレットをハードコードしない
- 機密データは環境変数で扱う
- すべてのユーザー入力を検証する
- パラメータ化クエリのみ使用する
- CSRF 保護を有効にする

## ファイル構成

```
src/
|-- app/              # Next.js app router
|-- components/       # 再利用可能な UI コンポーネント
|-- hooks/            # カスタム React hooks
|-- lib/              # ユーティリティライブラリ
|-- types/            # TypeScript 定義
```

## 主要パターン

### API レスポンス形式

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### エラー処理

```typescript
try {
  const result = await operation()
  return { success: true, data: result }
} catch (error) {
  console.error('Operation failed:', error)
  return { success: false, error: 'User-friendly message' }
}
```

## 環境変数

```bash
# 必須
DATABASE_URL=
API_KEY=

# 任意
DEBUG=false
```

## 利用可能なコマンド

- `/tdd` - テスト駆動開発ワークフロー
- `/plan` - 実装計画を作成する
- `/code-review` - コード品質をレビューする
- `/build-fix` - ビルドエラーを修正する

## Git ワークフロー

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- main に直接コミットしない
- PR にはレビューが必要
- マージ前にすべてのテストを通す
