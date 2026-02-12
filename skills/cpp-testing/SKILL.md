---
name: cpp-testing
description: GoogleTest / GoogleMock、TDD ワークフロー、CMake / CTest、カバレッジ、サニタイザー、実践的なテストパターンを用いた C++ テスト戦略。
---

# C++ テストパターン

GoogleTest / GoogleMock、CMake、CTest を使ったモダン C++（C++17 / 20）向けの、実行可能で具体例中心のテストガイダンスである。

## いつ有効化するか

- 新しい C++ 機能を書くとき、または既存コードをリファクタするとき
- ライブラリやサービス向けのユニットテスト / 統合テストを設計するとき
- テストカバレッジ、CI ゲーティング、リグレッション保護を追加するとき
- 一貫したテスト実行のために CMake / CTest ワークフローを整備するとき

## C++ 向け TDD ワークフロー

### Red-Green-Refactor ループ

1. **RED**: 新しい振る舞いに対する失敗テストを書く
2. **GREEN**: 通すための最小実装を入れる
3. **REFACTOR**: テストを緑のまま設計を改善する

```cpp
// calculator_test.cpp
#include <gtest/gtest.h>

int Add(int a, int b); // Step 1: 振る舞いを宣言する

TEST(CalculatorTest, AddsTwoNumbers) { // Step 1: RED
    EXPECT_EQ(Add(2, 3), 5);
}

// calculator.cpp
int Add(int a, int b) { // Step 2: GREEN
    return a + b;
}

// Step 3: 必要に応じて REFACTOR。テストは緑を維持する
```

## コアパターン

### 基本のテスト構造

```cpp
#include <gtest/gtest.h>

int Clamp(int value, int lo, int hi);

TEST(ClampTest, ReturnsLowerBound) {
    EXPECT_EQ(Clamp(-1, 0, 10), 0);
}

TEST(ClampTest, ReturnsUpperBound) {
    EXPECT_EQ(Clamp(42, 0, 10), 10);
}

TEST(ClampTest, ReturnsValueInRange) {
    EXPECT_EQ(Clamp(5, 0, 10), 5);
}
```

### 共有セットアップ用のフィクスチャ

```cpp
#include <gtest/gtest.h>
#include "user_store.h"

class UserStoreTest : public ::testing::Test {
protected:
    void SetUp() override {
        store = std::make_unique<UserStore>(":memory:");
        store->Seed({{"alice"}, {"bob"}});
    }

    std::unique_ptr<UserStore> store;
};

TEST_F(UserStoreTest, FindsExistingUser) {
    auto user = store->Find("alice");
    ASSERT_TRUE(user.has_value());
    EXPECT_EQ(user->name, "alice");
}
```

### パラメータ化テスト

```cpp
#include <gtest/gtest.h>

struct Case {
    int input;
    int expected;
};

class AbsTest : public ::testing::TestWithParam<Case> {};

TEST_P(AbsTest, HandlesValues) {
    auto [input, expected] = GetParam();
    EXPECT_EQ(std::abs(input), expected);
}

INSTANTIATE_TEST_SUITE_P(
    BasicCases,
    AbsTest,
    ::testing::Values(
        Case{-3, 3},
        Case{0, 0},
        Case{7, 7}
    )
);
```

### Death Test（失敗条件）

```cpp
#include <gtest/gtest.h>

void RequirePositive(int value) {
    if (value <= 0) {
        std::abort();
    }
}

TEST(DeathTest, AbortsOnNonPositive) {
    ASSERT_DEATH(RequirePositive(0), "");
}
```

### 振る舞い検証のための GoogleMock

```cpp
#include <gmock/gmock.h>
#include <gtest/gtest.h>

class Notifier {
public:
    virtual ~Notifier() = default;
    virtual void Send(const std::string &message) = 0;
};

class MockNotifier : public Notifier {
public:
    MOCK_METHOD(void, Send, (const std::string &message), (override));
};

class Service {
public:
    explicit Service(Notifier &notifier) : notifier_(notifier) {}
    void Publish(const std::string &message) {
        notifier_.Send(message);
    }

private:
    Notifier &notifier_;
};

TEST(ServiceTest, SendsNotifications) {
    MockNotifier notifier;
    Service service(notifier);

    EXPECT_CALL(notifier, Send("hello"))
        .Times(1);

    service.Publish("hello");
}
```

### Fake と Mock の使い分け

- **Fake**: ロジック検証のための軽量なメモリ内実装（状態を持つシステムに有効）
- **Mock**: 呼び出しや順序などの相互作用をアサートするために使う

シグナルの高いテストには Fake を優先し、振る舞い自体が契約である場合のみ Mock を使う。

## テスト構成

推奨構成:

```
project/
|-- CMakeLists.txt
|-- include/
|-- src/
|-- tests/
|   |-- unit/
|   |-- integration/
|   |-- testdata/
```

ユニットテストはソース近傍に置き、統合テストは専用ディレクトリに分離し、大きなフィクスチャは `testdata/` に隔離する。

## CMake + CTest ワークフロー

### GoogleTest / GoogleMock のための FetchContent

```cmake
cmake_minimum_required(VERSION 3.20)
project(example LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
)
FetchContent_MakeAvailable(googletest)

add_executable(example_tests
  tests/calculator_test.cpp
  src/calculator.cpp
)

target_link_libraries(example_tests
  GTest::gtest
  GTest::gmock
  GTest::gtest_main
)

enable_testing()
include(GoogleTest)
gtest_discover_tests(example_tests)
```

### 設定 / ビルド / 実行

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build -j
ctest --test-dir build --output-on-failure
```

### テストの一部だけ実行する

```bash
ctest --test-dir build -R ClampTest
ctest --test-dir build -R "UserStoreTest.*" --output-on-failure
```

## カバレッジワークフロー

### GCC + gcov + lcov

```bash
cmake -S . -B build-cov -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="--coverage"
cmake --build build-cov -j
ctest --test-dir build-cov

lcov --capture --directory build-cov --output-file coverage.info
lcov --remove coverage.info '/usr/*' --output-file coverage.info

genhtml coverage.info --output-directory coverage
```

### LLVM / Clang + llvm-cov

```bash
cmake -S . -B build-llvm -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_COMPILER=clang++ \
  -DCMAKE_CXX_FLAGS="-fprofile-instr-generate -fcoverage-mapping"
cmake --build build-llvm -j

LLVM_PROFILE_FILE="build-llvm/default.profraw" \
ctest --test-dir build-llvm

llvm-profdata merge -sparse build-llvm/default.profraw -o build-llvm/default.profdata
llvm-cov report build-llvm/example_tests \
  -instr-profile=build-llvm/default.profdata
```

## サニタイザー

### 共通フラグ

- AddressSanitizer（ASan）: `-fsanitize=address`
- UndefinedBehaviorSanitizer（UBSan）: `-fsanitize=undefined`
- ThreadSanitizer（TSan）: `-fsanitize=thread`

### CMake トグル例

```cmake
option(ENABLE_ASAN "Enable AddressSanitizer" OFF)
option(ENABLE_UBSAN "Enable UndefinedBehaviorSanitizer" OFF)
option(ENABLE_TSAN "Enable ThreadSanitizer" OFF)

if(ENABLE_ASAN)
  add_compile_options(-fsanitize=address -fno-omit-frame-pointer)
  add_link_options(-fsanitize=address)
endif()

if(ENABLE_UBSAN)
  add_compile_options(-fsanitize=undefined -fno-omit-frame-pointer)
  add_link_options(-fsanitize=undefined)
endif()

if(ENABLE_TSAN)
  add_compile_options(-fsanitize=thread)
  add_link_options(-fsanitize=thread)
endif()
```

使い方:

```bash
cmake -S . -B build-asan -DENABLE_ASAN=ON
cmake --build build-asan
ctest --test-dir build-asan --output-on-failure
```

## よくあるシナリオ

### API 風の境界（インターフェース）

```cpp
class Clock {
public:
    virtual ~Clock() = default;
    virtual std::chrono::system_clock::time_point Now() const = 0;
};

class SystemClock : public Clock {
public:
    std::chrono::system_clock::time_point Now() const override {
        return std::chrono::system_clock::now();
    }
};

class Session {
public:
    Session(Clock &clock, std::chrono::seconds ttl)
        : clock_(clock), ttl_(ttl) {}

    bool IsExpired(std::chrono::system_clock::time_point created) const {
        return (clock_.Now() - created) > ttl_;
    }

private:
    Clock &clock_;
    std::chrono::seconds ttl_;
};
```

### ファイルシステムの分離

```cpp
#include <filesystem>
#include <gtest/gtest.h>

TEST(FileTest, WritesOutput) {
    auto temp = std::filesystem::temp_directory_path() / "cpp-testing";
    std::filesystem::create_directories(temp);

    auto file = temp / "output.txt";
    std::ofstream out(file);
    out << "hello";
    out.close();

    std::ifstream in(file);
    std::string content;
    in >> content;

    EXPECT_EQ(content, "hello");

    std::filesystem::remove_all(temp);
}
```

### 時刻依存ロジック

```cpp
class FakeClock : public Clock {
public:
    explicit FakeClock(std::chrono::system_clock::time_point now) : now_(now) {}
    std::chrono::system_clock::time_point Now() const override { return now_; }
    void Advance(std::chrono::seconds delta) { now_ += delta; }

private:
    std::chrono::system_clock::time_point now_;
};
```

### 並行性（決定的テスト）

```cpp
#include <condition_variable>
#include <mutex>
#include <thread>

TEST(WorkerTest, SignalsCompletion) {
    std::mutex mu;
    std::condition_variable cv;
    bool done = false;

    std::thread worker([&] {
        std::lock_guard<std::mutex> lock(mu);
        done = true;
        cv.notify_one();
    });

    std::unique_lock<std::mutex> lock(mu);
    bool ok = cv.wait_for(lock, std::chrono::milliseconds(500), [&] { return done; });

    worker.join();
    ASSERT_TRUE(ok);
}
```

## ベストプラクティス

### DO

- テストを決定的かつ分離可能に保つ
- グローバルより依存性注入を優先する
- 前提確認には `ASSERT_*`、複数検証には `EXPECT_*` を使う
- ユニット / 統合テストを CTest のラベルまたはディレクトリで分離する
- メモリ / 競合検出のため CI でサニタイザーを実行する

### DON'T

- ユニットテストで実時間やネットワークに依存しない
- 条件変数で同期できる場面で sleep を同期手段として使わない
- 単純な値オブジェクトを過剰にモックしない
- 重要でないログに壊れやすい文字列一致を使わない

## GoogleTest の代替

- **Catch2**: ヘッダーオンリーで表現力の高い matcher を持ち、導入が速い
- **doctest**: 軽量で、コンパイルオーバーヘッドが小さい

## Fuzzing と Property Testing

- **libFuzzer**: LLVM と統合し、I / O が少ない純粋関数に集中する
- **RapidCheck**: 多様な入力に対して不変条件を検証するプロパティベースドテスト

最小の libFuzzer ハーネス:

```cpp
extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    std::string input(reinterpret_cast<const char *>(data), size);
    ParseConfig(input);
    return 0;
}
```
