# セキュリティガイドライン

## 必須セキュリティチェック

あらゆるコミット前に:
- [ ] ハードコードされたシークレットがない (API key、パスワード、トークン)
- [ ] すべてのユーザー入力がバリデーションされている
- [ ] SQL インジェクション対策 (パラメータ化クエリ)
- [ ] XSS 対策 (サニタイズされた HTML)
- [ ] CSRF 保護が有効化されている
- [ ] 認証 / 認可が検証されている
- [ ] すべてのエンドポイントでレートリミット
- [ ] エラーメッセージが機密データを漏らさない

## シークレット管理

```typescript
// NEVER: ハードコードされたシークレット
const apiKey = "sk-proj-xxxxx"

// ALWAYS: 環境変数
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

## セキュリティ対応プロトコル

セキュリティ問題を見つけた場合:
1. 直ちに STOP する
2. **security-reviewer** エージェントを使う
3. 継続する前に CRITICAL の問題を修正する
4. 露出したシークレットをローテーションする
5. 類似問題のためにコードベース全体をレビューする
