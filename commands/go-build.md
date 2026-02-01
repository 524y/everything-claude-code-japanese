---
description: Go の build エラー、go vet の警告、linter の問題を段階的に修正する。go-build-resolver エージェントを呼び出し、最小限の外科的修正を行う。
---

# Go Build and Fix

このコマンドは **go-build-resolver** エージェントを呼び出し、最小限の変更で Go の build エラーを段階的に修正する。

## このコマンドの内容

1. **診断の実行**: `go build`、`go vet`、`staticcheck` を実行
2. **エラー解析**: ファイルごとにまとめて重要度で並べる
3. **段階的に修正**: 1 回に 1 エラーずつ
4. **各修正を検証**: 変更ごとに build を再実行
5. **サマリーを報告**: 修正済みと未解決を提示

## 使用するタイミング

`/go-build` を使う場面:
- `go build ./...` がエラーで失敗する
- `go vet ./...` が問題を報告する
- `golangci-lint run` が警告を出す
- module 依存関係が壊れている
- pull した変更で build が壊れた後

## 実行する診断コマンド

```bash
# 主な build チェック
go build ./...

# 静的解析
go vet ./...

# 拡張 lint（利用可能なら）
staticcheck ./...
golangci-lint run

# module 問題
go mod verify
go mod tidy -v
```

## 例セッション

```text
ユーザー: /go-build

エージェント:
# Go ビルド解決

## 初期診断

```bash
$ go build ./...
internal/service/user.go:25:15: undefined: UserRepository
internal/handler/api.go:42:9: cannot use x (type string) as type int
internal/handler/api.go:58:2: missing return at end of function
```

検出されたエラー: 3

## 修正 1: 未定義識別子

ファイル: internal/service/user.go:25
エラー: undefined: UserRepository
原因: import 不足

```go
// import を追加
import "project/internal/repository"

// 変更前
var repo UserRepository
// 変更後
var repo repository.UserRepository
```

```bash
$ go build ./...
# 残り 2 エラー
```

## 修正 2: 型不一致

ファイル: internal/handler/api.go:42
エラー: cannot use x (type string) as type int

```go
// 変更前
count := params.Get("count")
// 変更後
countStr := params.Get("count")
count, _ := strconv.Atoi(countStr)
```

```bash
$ go build ./...
# 残り 1 エラー
```

## 修正 3: 戻り値不足

ファイル: internal/handler/api.go:58
エラー: missing return at end of function

```go
func GetUser(id string) (*User, error) {
    if id == "" {
        return nil, ErrInvalidID
    }
    user := findUser(id)
    // 追加された戻り値
    return user, nil
}
```

```bash
$ go build ./...
# Build 成功!
```

## 最終検証

```bash
$ go vet ./...
# 問題なし

$ go test ./...
ok      project/internal/service   0.015s
ok      project/internal/handler   0.023s
```

## サマリー

| 指標 | 件数 |
|--------|-------|
| 修正した build エラー | 3 |
| 修正した Vet 警告 | 0 |
| 変更したファイル | 2 |
| 残りの問題 | 0 |

ビルド状態: ✅ SUCCESS
```

## よくあるエラーと修正

| Error | 典型的な修正 |
|-------|-------------|
| `undefined: X` | import を追加するか typo を修正 |
| `cannot use X as Y` | type 変換または代入の修正 |
| `missing return` | return 文を追加 |
| `X does not implement Y` | 不足する method を追加 |
| `import cycle` | パッケージを再構成 |
| `declared but not used` | 変数を削除するか使用する |
| `cannot find package` | `go get` または `go mod tidy` |

## 修正戦略

1. **build エラーを最優先** - コードはコンパイルできる必要がある
2. **vet 警告を次に** - 不審な構文を修正
3. **lint 警告を最後に** - スタイルとベストプラクティス
4. **1 回に 1 つ** - 変更ごとに検証
5. **最小限の変更** - リファクタリングせず修正のみ

## 停止条件

次の場合は停止して報告する:
- 同じエラーが 3 回の試行後も残る
- 修正がさらにエラーを生む
- アーキテクチャ変更が必要
- 外部依存が不足している

## 関連コマンド

- `/go-test` - build 成功後にテストを実行
- `/go-review` - コード品質をレビュー
- `/verify` - フル検証ループ

## 関連

- Agent: `agents/go-build-resolver.md`
- Skill: `skills/golang-patterns/`
