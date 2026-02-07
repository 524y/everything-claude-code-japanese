---
description: Go の TDD ワークフローを徹底する。まず table-driven テストを書き、次に実装する。go test -cover で 80% 以上のカバレッジを確認する。
---

# Go TDD コマンド

このコマンドは、Go コードに対して Go の慣用的なテストパターンを使い、テスト駆動開発を徹底する。

## このコマンドの内容

1. **type/interface を定義**: まず関数シグネチャをスキャフォールドする
2. **テーブル駆動テストを書く**: 包括的なテストケースを作成（RED）
3. **テストを実行**: 正しい理由で失敗することを確認
4. **コードを実装**: 最小限のコードで通す（GREEN）
5. **リファクタリング**: テストを維持しながら改善
6. **カバレッジ確認**: 80% 以上を確認

## 使用するタイミング

`/go-test` を使う場面:
- 新しい Go 関数を実装する
- 既存コードにテストカバレッジを追加する
- バグ修正（まず失敗テストを書く）
- 重要なビジネスロジックを構築する
- Go の TDD ワークフローを学ぶ

## TDD サイクル

```
RED     → 失敗する table-driven テストを書く
GREEN   → 最小限の実装で通す
REFACTOR → 改善してもテストは green を維持
REPEAT  → 次のテストケースへ
```

## 例セッション

````
ユーザー: /go-test メールアドレス検証の関数が必要

エージェント:
# TDD セッション: メールバリデータ

## ステップ 1: interface を定義

```go
// validator/email.go
package validator

// ValidateEmail は指定した文字列が有効なメールアドレスかを確認する。
// 有効なら nil、無効なら内容を示す error を返す。
func ValidateEmail(email string) error {
    panic("not implemented")
}
```

## ステップ 2: テーブル駆動テストを書く（RED）

```go
// validator/email_test.go
package validator

import (
    "testing"
)

func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
    }{
        // 有効なメール
        {"simple email", "user@example.com", false},
        {"with subdomain", "user@mail.example.com", false},
        {"with plus", "user+tag@example.com", false},
        {"with dots", "first.last@example.com", false},

        // 無効なメール
        {"empty string", "", true},
        {"no at sign", "userexample.com", true},
        {"no domain", "user@", true},
        {"no local part", "@example.com", true},
        {"double at", "user@@example.com", true},
        {"spaces", "user @example.com", true},
        {"no tld", "user@example", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateEmail(tt.email)
            if tt.wantErr && err == nil {
                t.Errorf("ValidateEmail(%q) = nil; want error", tt.email)
            }
            if !tt.wantErr && err != nil {
                t.Errorf("ValidateEmail(%q) = %v; want nil", tt.email, err)
            }
        })
    }
}
```

## ステップ 3: テストを実行（失敗を確認）

```bash
$ go test ./validator/...

--- FAIL: TestValidateEmail (0.00s)
    --- FAIL: TestValidateEmail/simple_email (0.00s)
        panic: not implemented

FAIL
```

✓ テストは想定通り失敗（panic）。

## ステップ 4: 最小限の実装を書く（GREEN）

```go
// validator/email.go
package validator

import (
    "errors"
    "regexp"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

var (
    ErrEmailEmpty   = errors.New("email cannot be empty")
    ErrEmailInvalid = errors.New("email format is invalid")
)

func ValidateEmail(email string) error {
    if email == "" {
        return ErrEmailEmpty
    }
    if !emailRegex.MatchString(email) {
        return ErrEmailInvalid
    }
    return nil
}
```

## ステップ 5: テストを実行（成功を確認）

```bash
$ go test ./validator/...

PASS
ok      project/validator    0.003s
```

✓ すべてのテストが成功!

## ステップ 6: カバレッジを確認

```bash
$ go test -cover ./validator/...

PASS
coverage: 100.0% of statements
ok      project/validator    0.003s
```

✓ カバレッジ: 100%

## TDD 完了!
````

## テストパターン

### テーブル駆動テスト
```go
tests := []struct {
    name     string
    input    InputType
    want     OutputType
    wantErr  bool
}{
    {"case 1", input1, want1, false},
    {"case 2", input2, want2, true},
}

for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        got, err := Function(tt.input)
        // アサーション
    })
}
```

### 並列テスト
```go
for _, tt := range tests {
    tt := tt // キャプチャ
    t.Run(tt.name, func(t *testing.T) {
        t.Parallel()
        // テスト本体
    })
}
```

### テストヘルパー
```go
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()
    db := createDB()
    t.Cleanup(func() { db.Close() })
    return db
}
```

## カバレッジコマンド

```bash
# 基本のカバレッジ
go test -cover ./...

# カバレッジプロファイル
go test -coverprofile=coverage.out ./...

# ブラウザで見る
go tool cover -html=coverage.out

# 関数ごとのカバレッジ
go tool cover -func=coverage.out

# レース検知付き
go test -race -cover ./...
```

## カバレッジ目標

| コードタイプ | 目標 |
|-----------|------|
| 重要なビジネスロジック | 100% |
| 公開 API | 90% + |
| 一般コード | 80% + |
