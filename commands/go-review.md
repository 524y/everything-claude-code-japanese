---
description: Go の慣用パターン、並行処理の安全性、エラーハンドリング、セキュリティの包括的レビューを行う。go-reviewer エージェントを呼び出す。
---

# Go Code Review

このコマンドは **go-reviewer** エージェントを呼び出し、Go 固有の包括的なコードレビューを行う。

## このコマンドの内容

1. **Go 変更の特定**: `git diff` で変更された `.go` ファイルを見つける
2. **静的解析の実行**: `go vet`、`staticcheck`、`golangci-lint` を実行
3. **セキュリティスキャン**: SQL injection、コマンドインジェクション、レースコンディションを確認
4. **並行処理レビュー**: goroutine の安全性、channel 使用、mutex パターン
5. **Go 慣用チェック**: Go の規約とベストプラクティスを検証
6. **レポート生成**: 重要度ごとに分類

## 使用するタイミング

`/go-review` を使う場面:
- Go コードを書いた / 変更した後
- Go の変更を commit する前
- Go コードを含む PR をレビューする
- 新しい Go コードベースにオンボードする
- Go の慣用パターンを学ぶ

## レビュー区分

### CRITICAL（必ず修正）
- SQL/Command injection 脆弱性
- 同期なしのレースコンディション
- goroutine リーク
- ハードコードされた認証情報
- 安全でないポインタ使用
- 重要パスでのエラー無視

### HIGH（修正推奨）
- コンテキスト付きエラーラップ不足
- エラー返却の代わりに panic
- context が伝播されていない
- デッドロックを招く unbuffered channel
- interface 不一致エラー
- mutex 保護の不足

### MEDIUM（検討）
- 非慣用なコードパターン
- export に godoc コメントがない
- 非効率な文字列連結
- slice の事前確保がない
- table-driven テスト未使用

## 実行する自動チェック

```bash
# 静的解析
go vet ./...

# 追加のチェック（インストール済みなら）
staticcheck ./...
golangci-lint run

# レース検知
go build -race ./...

# セキュリティ脆弱性
govulncheck ./...
```

## 使用例

```text
ユーザー: /go-review

エージェント:
# Go コードレビュー レポート

## レビュー対象ファイル
- internal/handler/user.go（変更済み）
- internal/service/auth.go（変更済み）

## 静的解析の結果
✓ go vet: 問題なし
✓ staticcheck: 問題なし

## 発見された問題

[CRITICAL] レースコンディション
ファイル: internal/service/auth.go:45
問題: 共有 map が同期なしでアクセスされている
```go
var cache = map[string]*Session{}  // 同時アクセス!

func GetSession(id string) *Session {
    return cache[id]  // レースコンディション
}
```
修正: sync.RWMutex または sync.Map を使う
```go
var (
    cache   = map[string]*Session{}
    cacheMu sync.RWMutex
)

func GetSession(id string) *Session {
    cacheMu.RLock()
    defer cacheMu.RUnlock()
    return cache[id]
}
```

[HIGH] エラーコンテキスト不足
ファイル: internal/handler/user.go:28
問題: コンテキストなしでエラーを返している
```go
return err  // コンテキストなし
```
修正: コンテキスト付きで wrap する
```go
return fmt.Errorf("get user %s: %w", userID, err)
```

## サマリー
- CRITICAL: 1
- HIGH: 1
- MEDIUM: 0

推奨: ❌ CRITICAL の問題が修正されるまで Block
```

## 承認基準

| ステータス | 条件 |
|--------|------|
| ✅ Approve | CRITICAL または HIGH の問題がない |
| ⚠️ Warning | MEDIUM の問題のみ（注意して merge 可能） |
| ❌ Block | CRITICAL または HIGH の問題がある |

## 他コマンドとの連携

- `/go-test` を先に実行してテストが通ることを確認
- build エラーがある場合は `/go-build`
- commit 前に `/go-review`
- Go 以外の観点は `/code-review` を使う

## 関連

- Agent: `agents/go-reviewer.md`
- Skills: `skills/golang-patterns/`, `skills/golang-testing/`
