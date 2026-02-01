---
name: golang-testing
description: テーブル駆動テスト、サブテスト、ベンチマーク、ファジング、テストカバレッジを含む Go テストパターン。Go らしい実践で TDD 方法論に従う。
---

# Go テストパターン

TDD 方法論に従い、信頼性が高く保守しやすいテストを書くための包括的な Go テストパターンである。

## いつ使うか

- 新しい Go 関数 / メソッドを書くとき
- 既存コードにテストカバレッジを追加するとき
- パフォーマンス重要箇所のベンチマークを作るとき
- 入力バリデーションのためにファズテストを実装するとき
- Go プロジェクトで TDD ワークフローに従うとき

## Go 向け TDD ワークフロー

### RED-GREEN-REFACTOR サイクル

```
RED     → まず失敗するテストを書く
GREEN   → テストが通る最小限のコードを書く
REFACTOR → テストを保ったままコードを改善する
REPEAT  → 次の要件に進む
```

### Go での TDD 手順

```go
// Step 1: インターフェース / シグネチャを定義する
// calculator.go
package calculator

func Add(a, b int) int {
    panic("not implemented") // プレースホルダー
}

// Step 2: 失敗するテストを書く（RED）
// calculator_test.go
package calculator

import "testing"

func TestAdd(t *testing.T) {
    got := Add(2, 3)
    want := 5
    if got != want {
        t.Errorf("Add(2, 3) = %d; want %d", got, want)
    }
}

// Step 3: テストを実行して FAIL を確認する
// $ go test
// --- FAIL: TestAdd (0.00s)
// panic: not implemented

// Step 4: 最小限のコードを実装する（GREEN）
func Add(a, b int) int {
    return a + b
}

// Step 5: テストを実行して PASS を確認する
// $ go test
// PASS

// Step 6: 必要ならリファクタし、テストが通ることを確認する
```

## テーブル駆動テスト

Go テストの標準パターンである。最小限のコードで包括的なカバレッジを実現する。

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"negative numbers", -1, -2, -3},
        {"zero values", 0, 0, 0},
        {"mixed signs", -1, 1, 0},
        {"large numbers", 1000000, 2000000, 3000000},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Add(tt.a, tt.b)
            if got != tt.expected {
                t.Errorf("Add(%d, %d) = %d; want %d",
                    tt.a, tt.b, got, tt.expected)
            }
        })
    }
}
```

### エラーケース付きテーブル駆動テスト

```go
func TestParseConfig(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    *Config
        wantErr bool
    }{
        {
            name:  "valid config",
            input: `{"host": "localhost", "port": 8080}`,
            want:  &Config{Host: "localhost", Port: 8080},
        },
        {
            name:    "invalid JSON",
            input:   `{invalid}`,
            wantErr: true,
        },
        {
            name:    "empty input",
            input:   "",
            wantErr: true,
        },
        {
            name:  "minimal config",
            input: `{}`,
            want:  &Config{}, // ゼロ値の config
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParseConfig(tt.input)

            if tt.wantErr {
                if err == nil {
                    t.Error("expected error, got nil")
                }
                return
            }

            if err != nil {
                t.Fatalf("unexpected error: %v", err)
            }

            if !reflect.DeepEqual(got, tt.want) {
                t.Errorf("got %+v; want %+v", got, tt.want)
            }
        })
    }
}
```

## サブテストとサブベンチマーク

### 関連テストの整理

```go
func TestUser(t *testing.T) {
    // 全サブテスト共通のセットアップ
    db := setupTestDB(t)

    t.Run("Create", func(t *testing.T) {
        user := &User{Name: "Alice"}
        err := db.CreateUser(user)
        if err != nil {
            t.Fatalf("CreateUser failed: %v", err)
        }
        if user.ID == "" {
            t.Error("expected user ID to be set")
        }
    })

    t.Run("Get", func(t *testing.T) {
        user, err := db.GetUser("alice-id")
        if err != nil {
            t.Fatalf("GetUser failed: %v", err)
        }
        if user.Name != "Alice" {
            t.Errorf("got name %q; want %q", user.Name, "Alice")
        }
    })

    t.Run("Update", func(t *testing.T) {
        // ...
    })

    t.Run("Delete", func(t *testing.T) {
        // ...
    })
}
```

### 並列サブテスト

```go
func TestParallel(t *testing.T) {
    tests := []struct {
        name  string
        input string
    }{
        {"case1", "input1"},
        {"case2", "input2"},
        {"case3", "input3"},
    }

    for _, tt := range tests {
        tt := tt // range 変数をキャプチャする
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel() // サブテストを並列で実行する
            result := Process(tt.input)
            // アサーション...
            _ = result
        })
    }
}
```

## テストヘルパー

### ヘルパー関数

```go
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper() // ヘルパー関数としてマークする

    db, err := sql.Open("sqlite3", ":memory:")
    if err != nil {
        t.Fatalf("failed to open database: %v", err)
    }

    // テスト終了時にクリーンアップする
    t.Cleanup(func() {
        db.Close()
    })

    // マイグレーションを実行する
    if _, err := db.Exec(schema); err != nil {
        t.Fatalf("failed to create schema: %v", err)
    }

    return db
}

func assertNoError(t *testing.T, err error) {
    t.Helper()
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
}

func assertEqual[T comparable](t *testing.T, got, want T) {
    t.Helper()
    if got != want {
        t.Errorf("got %v; want %v", got, want)
    }
}
```

### 一時ファイル / ディレクトリ

```go
func TestFileProcessing(t *testing.T) {
    // 一時ディレクトリを作成する - 自動でクリーンアップされる
    tmpDir := t.TempDir()

    // テストファイルを作成する
    testFile := filepath.Join(tmpDir, "test.txt")
    err := os.WriteFile(testFile, []byte("test content"), 0644)
    if err != nil {
        t.Fatalf("failed to create test file: %v", err)
    }

    // テストを実行する
    result, err := ProcessFile(testFile)
    if err != nil {
        t.Fatalf("ProcessFile failed: %v", err)
    }

    // アサーション...
    _ = result
}
```

## ゴールデンファイル

`testdata/` に保存した期待出力ファイルと比較する。

```go
var update = flag.Bool("update", false, "update golden files")

func TestRender(t *testing.T) {
    tests := []struct {
        name  string
        input Template
    }{
        {"simple", Template{Name: "test"}},
        {"complex", Template{Name: "test", Items: []string{"a", "b"}}},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := Render(tt.input)

            golden := filepath.Join("testdata", tt.name+".golden")

            if *update {
                // ゴールデンファイルを更新する: go test -update
                err := os.WriteFile(golden, got, 0644)
                if err != nil {
                    t.Fatalf("failed to update golden file: %v", err)
                }
            }

            want, err := os.ReadFile(golden)
            if err != nil {
                t.Fatalf("failed to read golden file: %v", err)
            }

            if !bytes.Equal(got, want) {
                t.Errorf("output mismatch:\ngot:\n%s\nwant:\n%s", got, want)
            }
        })
    }
}
```

## インターフェースによるモック

### インターフェースベースのモック

```go
// 依存関係のインターフェースを定義する
type UserRepository interface {
    GetUser(id string) (*User, error)
    SaveUser(user *User) error
}

// 本番実装
type PostgresUserRepository struct {
    db *sql.DB
}

func (r *PostgresUserRepository) GetUser(id string) (*User, error) {
    // 実際の DB クエリ
}

// テスト用のモック実装
type MockUserRepository struct {
    GetUserFunc  func(id string) (*User, error)
    SaveUserFunc func(user *User) error
}

func (m *MockUserRepository) GetUser(id string) (*User, error) {
    return m.GetUserFunc(id)
}

func (m *MockUserRepository) SaveUser(user *User) error {
    return m.SaveUserFunc(user)
}

// モックを使ったテスト
func TestUserService(t *testing.T) {
    mock := &MockUserRepository{
        GetUserFunc: func(id string) (*User, error) {
            if id == "123" {
                return &User{ID: "123", Name: "Alice"}, nil
            }
            return nil, ErrNotFound
        },
    }

    service := NewUserService(mock)

    user, err := service.GetUserProfile("123")
    if err != nil {
        t.Fatalf("unexpected error: %v", err)
    }
    if user.Name != "Alice" {
        t.Errorf("got name %q; want %q", user.Name, "Alice")
    }
}
```

## ベンチマーク

### 基本ベンチマーク

```go
func BenchmarkProcess(b *testing.B) {
    data := generateTestData(1000)
    b.ResetTimer() // セットアップ時間を計測しない

    for i := 0; i < b.N; i++ {
        Process(data)
    }
}

// 実行: go test -bench=BenchmarkProcess -benchmem
// 出力: BenchmarkProcess-8   10000   105234 ns/op   4096 B/op   10 allocs/op
```

### 異なるサイズでのベンチマーク

```go
func BenchmarkSort(b *testing.B) {
    sizes := []int{100, 1000, 10000, 100000}

    for _, size := range sizes {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            data := generateRandomSlice(size)
            b.ResetTimer()

            for i := 0; i < b.N; i++ {
                // 既にソート済みのデータを避けるためにコピーする
                tmp := make([]int, len(data))
                copy(tmp, data)
                sort.Ints(tmp)
            }
        })
    }
}
```

### メモリアロケーションベンチマーク

```go
func BenchmarkStringConcat(b *testing.B) {
    parts := []string{"hello", "world", "foo", "bar", "baz"}

    b.Run("plus", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            var s string
            for _, p := range parts {
                s += p
            }
            _ = s
        }
    })

    b.Run("builder", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            var sb strings.Builder
            for _, p := range parts {
                sb.WriteString(p)
            }
            _ = sb.String()
        }
    })

    b.Run("join", func(b *testing.B) {
        for i := 0; i < b.N; i++ {
            _ = strings.Join(parts, "")
        }
    })
}
```

## ファジング（Go 1.18+）

### 基本のファズテスト

```go
func FuzzParseJSON(f *testing.F) {
    // シードコーパスを追加する
    f.Add(`{"name": "test"}`)
    f.Add(`{"count": 123}`)
    f.Add(`[]`)
    f.Add(`""`)

    f.Fuzz(func(t *testing.T, input string) {
        var result map[string]interface{}
        err := json.Unmarshal([]byte(input), &result)

        if err != nil {
            // ランダム入力のため不正な JSON は想定内
            return
        }

        // 解析に成功したなら再エンコードも成功するはず
        _, err = json.Marshal(result)
        if err != nil {
            t.Errorf("Marshal failed after successful Unmarshal: %v", err)
        }
    })
}

// 実行: go test -fuzz=FuzzParseJSON -fuzztime=30s
```

### 複数入力のファズテスト

```go
func FuzzCompare(f *testing.F) {
    f.Add("hello", "world")
    f.Add("", "")
    f.Add("abc", "abc")

    f.Fuzz(func(t *testing.T, a, b string) {
        result := Compare(a, b)

        // 性質: Compare(a, a) は常に 0 のはず
        if a == b && result != 0 {
            t.Errorf("Compare(%q, %q) = %d; want 0", a, b, result)
        }

        // 性質: Compare(a, b) と Compare(b, a) は符号が逆になるはず
        reverse := Compare(b, a)
        if (result > 0 && reverse >= 0) || (result < 0 && reverse <= 0) {
            if result != 0 || reverse != 0 {
                t.Errorf("Compare(%q, %q) = %d, Compare(%q, %q) = %d; inconsistent",
                    a, b, result, b, a, reverse)
            }
        }
    })
}
```

## テストカバレッジ

### カバレッジの実行

```bash
# 基本カバレッジ
go test -cover ./...

# カバレッジプロファイルを生成する
go test -coverprofile=coverage.out ./...

# ブラウザでカバレッジを表示する
go tool cover -html=coverage.out

# 関数ごとのカバレッジを表示する
go tool cover -func=coverage.out

# race 検出付きカバレッジ
go test -race -coverprofile=coverage.out ./...
```

### カバレッジ目標

| コード種別 | 目標 |
|-----------|--------|
| 重要なビジネスロジック | 100% |
| 公開 API | 90%+ |
| 一般コード | 80%+ |
| 生成コード | 除外 |

### 生成コードをカバレッジから除外する

```go
//go:generate mockgen -source=interface.go -destination=mock_interface.go

// カバレッジプロファイルではビルドタグで除外する:
// go test -cover -tags=!generate ./...
```

## HTTP ハンドラーテスト

```go
func TestHealthHandler(t *testing.T) {
    // リクエストを作成する
    req := httptest.NewRequest(http.MethodGet, "/health", nil)
    w := httptest.NewRecorder()

    // ハンドラーを呼び出す
    HealthHandler(w, req)

    // レスポンスを確認する
    resp := w.Result()
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        t.Errorf("got status %d; want %d", resp.StatusCode, http.StatusOK)
    }

    body, _ := io.ReadAll(resp.Body)
    if string(body) != "OK" {
        t.Errorf("got body %q; want %q", body, "OK")
    }
}

func TestAPIHandler(t *testing.T) {
    tests := []struct {
        name       string
        method     string
        path       string
        body       string
        wantStatus int
        wantBody   string
    }{
        {
            name:       "get user",
            method:     http.MethodGet,
            path:       "/users/123",
            wantStatus: http.StatusOK,
            wantBody:   `{"id":"123","name":"Alice"}`,
        },
        {
            name:       "not found",
            method:     http.MethodGet,
            path:       "/users/999",
            wantStatus: http.StatusNotFound,
        },
        {
            name:       "create user",
            method:     http.MethodPost,
            path:       "/users",
            body:       `{"name":"Bob"}`,
            wantStatus: http.StatusCreated,
        },
    }

    handler := NewAPIHandler()

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            var body io.Reader
            if tt.body != "" {
                body = strings.NewReader(tt.body)
            }

            req := httptest.NewRequest(tt.method, tt.path, body)
            req.Header.Set("Content-Type", "application/json")
            w := httptest.NewRecorder()

            handler.ServeHTTP(w, req)

            if w.Code != tt.wantStatus {
                t.Errorf("got status %d; want %d", w.Code, tt.wantStatus)
            }

            if tt.wantBody != "" && w.Body.String() != tt.wantBody {
                t.Errorf("got body %q; want %q", w.Body.String(), tt.wantBody)
            }
        })
    }
}
```

## テストコマンド

```bash
# すべてのテストを実行する
go test ./...

# 詳細出力でテストを実行する
go test -v ./...

# 特定のテストを実行する
go test -run TestAdd ./...

# パターンに一致するテストを実行する
go test -run "TestUser/Create" ./...

# race ディテクタ付きでテストを実行する
go test -race ./...

# カバレッジ付きでテストを実行する
go test -cover -coverprofile=coverage.out ./...

# short テストのみ実行する
go test -short ./...

# タイムアウト付きでテストを実行する
go test -timeout 30s ./...

# ベンチマークを実行する
go test -bench=. -benchmem ./...

# ファジングを実行する
go test -fuzz=FuzzParse -fuzztime=30s ./...

# テスト実行回数を数える（フレイキーテスト検出用）
go test -count=10 ./...
```

## ベストプラクティス

**DO:**
- テストは FIRST（TDD）
- テーブル駆動テストで包括的なカバレッジを得る
- 実装ではなく挙動をテストする
- ヘルパー関数では `t.Helper()` を使う
- 独立したテストには `t.Parallel()` を使う
- リソースは `t.Cleanup()` でクリーンアップする
- シナリオを表す有意なテスト名を使う

**DON'T:**
- private 関数を直接テストする（公開 API を通してテストする）
- テストで `time.Sleep()` を使う（チャネルや条件を使う）
- フレイキーテストを無視する（修正するか削除する）
- すべてをモックする（可能なら統合テストを優先する）
- エラーパスのテストを省略する

## CI / CD との統合

```yaml
# GitHub Actions の例
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-go@v5
      with:
        go-version: '1.22'

    - name: Run tests
      run: go test -race -coverprofile=coverage.out ./...

    - name: Check coverage
      run: |
        go tool cover -func=coverage.out | grep total | awk '{print $3}' | \
        awk -F'%' '{if ($1 < 80) exit 1}'
```

**覚えておくこと**: テストはドキュメントである。コードの使われ方を示す。明確に書き、最新の状態に保つこと。
