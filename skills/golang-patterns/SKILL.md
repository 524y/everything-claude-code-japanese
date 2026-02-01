---
name: golang-patterns
description: 堅牢で効率的かつ保守しやすい Go アプリケーションを構築するための Go らしいパターン、ベストプラクティス、慣習。
---

# Go 開発パターン

堅牢で効率的かつ保守しやすいアプリケーションを構築するための Go らしいパターンとベストプラクティスである。

## いつ使うか

- 新しい Go コードを書くとき
- Go コードをレビューするとき
- 既存の Go コードをリファクタするとき
- Go パッケージ / モジュールを設計するとき

## コア原則

### 1. シンプルさと明快さ

Go は巧妙さよりもシンプルさを重視する。コードは明白で読みやすいべきである。

```go
// Good: 明確で直接的
func GetUser(id string) (*User, error) {
    user, err := db.FindUser(id)
    if err != nil {
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}

// Bad: こねくり回しすぎ
func GetUser(id string) (*User, error) {
    return func() (*User, error) {
        if u, e := db.FindUser(id); e == nil {
            return u, nil
        } else {
            return nil, e
        }
    }()
}
```

### 2. ゼロ値を有用にする

ゼロ値が初期化なしですぐ使えるように型を設計する。

```go
// Good: ゼロ値が有用
type Counter struct {
    mu    sync.Mutex
    count int // ゼロ値は 0 でそのまま使える
}

func (c *Counter) Inc() {
    c.mu.Lock()
    c.count++
    c.mu.Unlock()
}

// Good: bytes.Buffer はゼロ値で使える
var buf bytes.Buffer
buf.WriteString("hello")

// Bad: 初期化が必要
type BadCounter struct {
    counts map[string]int // nil map は panic になる
}
```

### 3. インターフェースを受け取り、構造体を返す

関数はインターフェースを受け取り、具体型を返すべきである。

```go
// Good: インターフェースを受け取り、具体型を返す
func ProcessData(r io.Reader) (*Result, error) {
    data, err := io.ReadAll(r)
    if err != nil {
        return nil, err
    }
    return &Result{Data: data}, nil
}

// Bad: インターフェースを返す（実装詳細を不必要に隠す）
func ProcessData(r io.Reader) (io.Reader, error) {
    // ...
}
```

## エラーハンドリングパターン

### コンテキスト付きのエラーラップ

```go
// Good: コンテキスト付きでエラーをラップする
func LoadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("load config %s: %w", path, err)
    }

    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return nil, fmt.Errorf("parse config %s: %w", path, err)
    }

    return &cfg, nil
}
```

### カスタムエラー型

```go
// ドメイン固有のエラーを定義する
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed on %s: %s", e.Field, e.Message)
}

// よくあるケースのセンチネルエラー
var (
    ErrNotFound     = errors.New("resource not found")
    ErrUnauthorized = errors.New("unauthorized")
    ErrInvalidInput = errors.New("invalid input")
)
```

### errors.Is と errors.As を使ったエラー判定

```go
func HandleError(err error) {
    // 特定のエラーを確認する
    if errors.Is(err, sql.ErrNoRows) {
        log.Println("No records found")
        return
    }

    // エラー型を確認する
    var validationErr *ValidationError
    if errors.As(err, &validationErr) {
        log.Printf("Validation error on field %s: %s",
            validationErr.Field, validationErr.Message)
        return
    }

    // 不明なエラー
    log.Printf("Unexpected error: %v", err)
}
```

### エラーを無視しない

```go
// Bad: 空の識別子でエラーを無視する
result, _ := doSomething()

// Good: 処理するか、無視して安全な理由を明示する
result, err := doSomething()
if err != nil {
    return err
}

// Acceptable: エラーが本当に重要でない場合（稀）
_ = writer.Close() // ベストエフォートのクリーンアップ。エラーは別でログ済み
```

## 並行処理パターン

### ワーカープール

```go
func WorkerPool(jobs <-chan Job, results chan<- Result, numWorkers int) {
    var wg sync.WaitGroup

    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobs {
                results <- process(job)
            }
        }()
    }

    wg.Wait()
    close(results)
}
```

### キャンセルとタイムアウトのための context

```go
func FetchWithTimeout(ctx context.Context, url string) ([]byte, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("create request: %w", err)
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("fetch %s: %w", url, err)
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}
```

### グレースフルシャットダウン

```go
func GracefulShutdown(server *http.Server) {
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    <-quit
    log.Println("Shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Println("Server exited")
}
```

### errgroup による協調ゴルーチン

```go
import "golang.org/x/sync/errgroup"

func FetchAll(ctx context.Context, urls []string) ([][]byte, error) {
    g, ctx := errgroup.WithContext(ctx)
    results := make([][]byte, len(urls))

    for i, url := range urls {
        i, url := i, url // ループ変数をキャプチャする
        g.Go(func() error {
            data, err := FetchWithTimeout(ctx, url)
            if err != nil {
                return err
            }
            results[i] = data
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}
```

### ゴルーチンリークを避ける

```go
// Bad: context がキャンセルされたらゴルーチンリークする
func leakyFetch(ctx context.Context, url string) <-chan []byte {
    ch := make(chan []byte)
    go func() {
        data, _ := fetch(url)
        ch <- data // 受信者がいなければ永遠にブロックする
    }()
    return ch
}

// Good: キャンセルを適切に処理する
func safeFetch(ctx context.Context, url string) <-chan []byte {
    ch := make(chan []byte, 1) // バッファ付きチャネル
    go func() {
        data, err := fetch(url)
        if err != nil {
            return
        }
        select {
        case ch <- data:
        case <-ctx.Done():
        }
    }()
    return ch
}
```

## インターフェース設計

### 小さく、焦点を絞ったインターフェース

```go
// Good: 単一メソッドのインターフェース
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type Closer interface {
    Close() error
}

// 必要に応じてインターフェースを合成する
type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}
```

### 使う側でインターフェースを定義する

```go
// 提供側ではなく利用側のパッケージで定義する
package service

// UserStore はこのサービスが必要とするものを定義する
type UserStore interface {
    GetUser(id string) (*User, error)
    SaveUser(user *User) error
}

type Service struct {
    store UserStore
}

// 具体実装は別パッケージにできる
// このインターフェースを知る必要はない
```

### 型アサーションによる任意の振る舞い

```go
type Flusher interface {
    Flush() error
}

func WriteAndFlush(w io.Writer, data []byte) error {
    if _, err := w.Write(data); err != nil {
        return err
    }

    // 対応していれば flush する
    if f, ok := w.(Flusher); ok {
        return f.Flush()
    }
    return nil
}
```

## パッケージ構成

### 標準的なプロジェクト構成

```text
myproject/
├── cmd/
│   └── myapp/
│       └── main.go           # エントリポイント
├── internal/
│   ├── handler/              # HTTP ハンドラ
│   ├── service/              # ビジネスロジック
│   ├── repository/           # データアクセス
│   └── config/               # 設定
├── pkg/
│   └── client/               # 公開 API クライアント
├── api/
│   └── v1/                   # API 定義（proto, OpenAPI）
├── testdata/                 # テストフィクスチャ
├── go.mod
├── go.sum
└── Makefile
```

### パッケージ命名

```go
// Good: 短く、小文字、アンダースコアなし
package http
package json
package user

// Bad: 冗長、混在ケース、または冗長
package httpHandler
package json_parser
package userService // 冗長な 'Service' サフィックス
```

### パッケージレベルの状態を避ける

```go
// Bad: グローバルな可変状態
var db *sql.DB

func init() {
    db, _ = sql.Open("postgres", os.Getenv("DATABASE_URL"))
}

// Good: 依存性注入
type Server struct {
    db *sql.DB
}

func NewServer(db *sql.DB) *Server {
    return &Server{db: db}
}
```

## 構造体設計

### Functional Options パターン

```go
type Server struct {
    addr    string
    timeout time.Duration
    logger  *log.Logger
}

type Option func(*Server)

func WithTimeout(d time.Duration) Option {
    return func(s *Server) {
        s.timeout = d
    }
}

func WithLogger(l *log.Logger) Option {
    return func(s *Server) {
        s.logger = l
    }
}

func NewServer(addr string, opts ...Option) *Server {
    s := &Server{
        addr:    addr,
        timeout: 30 * time.Second, // デフォルト
        logger:  log.Default(),    // デフォルト
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// 使い方
server := NewServer(":8080",
    WithTimeout(60*time.Second),
    WithLogger(customLogger),
)
```

### 合成のための埋め込み

```go
type Logger struct {
    prefix string
}

func (l *Logger) Log(msg string) {
    fmt.Printf("[%s] %s\n", l.prefix, msg)
}

type Server struct {
    *Logger // 埋め込み - Server は Log メソッドを持つ
    addr    string
}

func NewServer(addr string) *Server {
    return &Server{
        Logger: &Logger{prefix: "SERVER"},
        addr:   addr,
    }
}

// 使い方
s := NewServer(":8080")
s.Log("Starting...") // 埋め込まれた Logger.Log を呼ぶ
```

## メモリとパフォーマンス

### サイズが分かっているときはスライスを事前確保する

```go
// Bad: スライスが何度も拡張される
func processItems(items []Item) []Result {
    var results []Result
    for _, item := range items {
        results = append(results, process(item))
    }
    return results
}

// Good: 1 回の確保で済む
func processItems(items []Item) []Result {
    results := make([]Result, 0, len(items))
    for _, item := range items {
        results = append(results, process(item))
    }
    return results
}
```

### 頻繁な割り当てには sync.Pool を使う

```go
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func ProcessRequest(data []byte) []byte {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()
        bufferPool.Put(buf)
    }()

    buf.Write(data)
    // 処理...
    return buf.Bytes()
}
```

### ループ内の文字列結合を避ける

```go
// Bad: 多数の文字列割り当てを作る
func join(parts []string) string {
    var result string
    for _, p := range parts {
        result += p + ","
    }
    return result
}

// Good: strings.Builder で 1 回の割り当て
func join(parts []string) string {
    var sb strings.Builder
    for i, p := range parts {
        if i > 0 {
            sb.WriteString(",")
        }
        sb.WriteString(p)
    }
    return sb.String()
}

// Best: 標準ライブラリを使う
func join(parts []string) string {
    return strings.Join(parts, ",")
}
```

## Go ツール連携

### 必須コマンド

```bash
# ビルドと実行
go build ./...
go run ./cmd/myapp

# テスト
go test ./...
go test -race ./...
go test -cover ./...

# 静的解析
go vet ./...
staticcheck ./...
golangci-lint run

# モジュール管理
go mod tidy
go mod verify

# フォーマット
gofmt -w .
goimports -w .
```

### 推奨リンター設定（.golangci.yml）

```yaml
linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - unused
    - gofmt
    - goimports
    - misspell
    - unconvert
    - unparam

linters-settings:
  errcheck:
    check-type-assertions: true
  govet:
    check-shadowing: true

issues:
  exclude-use-default: false
```

## クイックリファレンス: Go のイディオム

| イディオム | 説明 |
|-------|-------------|
| Accept interfaces, return structs | 関数はインターフェース引数を受け取り、具体型を返す |
| Errors are values | エラーは例外ではなく第一級の値として扱う |
| Don't communicate by sharing memory | ゴルーチン間の協調にはチャネルを使う |
| Make the zero value useful | 明示的な初期化なしで動く型にする |
| A little copying is better than a little dependency | 不必要な外部依存を避ける |
| Clear is better than clever | 巧妙さより読みやすさを優先する |
| gofmt is no one's favorite but everyone's friend | gofmt / goimports で必ず整形する |
| Return early | エラーは先に処理し、ハッピーパスのインデントを浅く保つ |

## 避けるべきアンチパターン

```go
// Bad: 長い関数での名前付き戻り値
func process() (result int, err error) {
    // ... 50 lines ...
    return // 何が返るのか?
}

// Bad: フロー制御に panic を使う
func GetUser(id string) *User {
    user, err := db.Find(id)
    if err != nil {
        panic(err) // これは避ける
    }
    return user
}

// Bad: 構造体に context を渡す
type Request struct {
    ctx context.Context // Context は最初の引数にする
    ID  string
}

// Good: 最初の引数に context
func ProcessRequest(ctx context.Context, id string) error {
    // ...
}

// Bad: 値レシーバーとポインタレシーバーを混在させる
type Counter struct{ n int }
func (c Counter) Value() int { return c.n }    // 値レシーバー
func (c *Counter) Increment() { c.n++ }        // ポインタレシーバー
// どちらかに統一して一貫させる
```

**覚えておくこと**: Go コードは良い意味で退屈であるべきだ。予測可能で一貫しており、理解しやすいこと。迷ったらシンプルに保つ。
