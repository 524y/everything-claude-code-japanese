---
name: cpp-testing
description: C++ テストの作成 / 更新 / 修正、GoogleTest / CTest の設定、失敗テストやフレイキーテストの診断、カバレッジ / サニタイザー追加時にのみ使う。
---

# C++ テスト（Agent Skill）

GoogleTest / GoogleMock と CMake / CTest を使う、モダン C++（C++17 / 20）向けの Agent 中心テストワークフローである。

## 使うタイミング

- 新しい C++ テストを書くとき、または既存テストを修正するとき
- C++ コンポーネントのユニット / 統合テストのカバレッジを設計するとき
- テストカバレッジ、CI ゲーティング、リグレッション保護を追加するとき
- 一貫した実行のために CMake / CTest ワークフローを設定するとき
- テスト失敗やフレイキーな挙動を調査するとき
- メモリ / 競合診断のためにサニタイザーを有効化するとき

### 使わないタイミング

- テスト変更を伴わない新機能実装
- テストカバレッジや失敗と無関係な大規模リファクタ
- 回帰検証なしの性能チューニング
- C++ 以外のプロジェクト、またはテスト以外の作業

## コアコンセプト

- **TDD loop**: red → green → refactor（先にテスト、最小修正、その後クリーンアップ）
- **Isolation**: グローバル状態より依存性注入と fake を優先する
- **Test layout**: `tests/unit`、`tests/integration`、`tests/testdata`
- **Mocks vs fakes**: 相互作用の検証は mock、状態を伴う振る舞いは fake
- **CTest discovery**: 安定したテスト検出のため `gtest_discover_tests()` を使う
- **CI signal**: まずサブセット、次に `--output-on-failure` 付きの全体実行

## TDD ワークフロー

RED → GREEN → REFACTOR ループに従う:

1. **RED**: 新しい振る舞いを捉える失敗テストを書く
2. **GREEN**: 通すための最小変更を実装する
3. **REFACTOR**: テストを緑のまま整理する

```cpp
// tests/add_test.cpp
#include <gtest/gtest.h>

int Add(int a, int b); // プロダクションコード側で提供される。

TEST(AddTest, AddsTwoNumbers) { // RED
  EXPECT_EQ(Add(2, 3), 5);
}

// src/add.cpp
int Add(int a, int b) { // GREEN
  return a + b;
}

// REFACTOR: テストが通った後に単純化 / リネームする
```

## コード例

### 基本ユニットテスト（gtest）

```cpp
// tests/calculator_test.cpp
#include <gtest/gtest.h>

int Add(int a, int b); // プロダクションコード側で提供される。

TEST(CalculatorTest, AddsTwoNumbers) {
    EXPECT_EQ(Add(2, 3), 5);
}
```

### フィクスチャ（gtest）

```cpp
// tests/user_store_test.cpp
// 疑似コードスタブ: UserStore / User はプロジェクト型に置き換えること。
#include <gtest/gtest.h>
#include <memory>
#include <optional>
#include <string>

struct User { std::string name; };
class UserStore {
public:
    explicit UserStore(std::string /*path*/) {}
    void Seed(std::initializer_list<User> /*users*/) {}
    std::optional<User> Find(const std::string &/*name*/) { return User{"alice"}; }
};

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

### Mock（gmock）

```cpp
// tests/notifier_test.cpp
#include <gmock/gmock.h>
#include <gtest/gtest.h>
#include <string>

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
    void Publish(const std::string &message) { notifier_.Send(message); }

private:
    Notifier &notifier_;
};

TEST(ServiceTest, SendsNotifications) {
    MockNotifier notifier;
    Service service(notifier);

    EXPECT_CALL(notifier, Send("hello")).Times(1);
    service.Publish("hello");
}
```

### CMake / CTest クイックスタート

```cmake
# CMakeLists.txt（抜粋）
cmake_minimum_required(VERSION 3.20)
project(example LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(FetchContent)
# プロジェクトで固定したバージョンを優先する。tag を使う場合もポリシーに従い固定する。
set(GTEST_VERSION v1.17.0) # プロジェクトポリシーに合わせて調整する。
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/${GTEST_VERSION}.zip
)
FetchContent_MakeAvailable(googletest)

add_executable(example_tests
  tests/calculator_test.cpp
  src/calculator.cpp
)
target_link_libraries(example_tests GTest::gtest GTest::gmock GTest::gtest_main)

enable_testing()
include(GoogleTest)
gtest_discover_tests(example_tests)
```

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build -j
ctest --test-dir build --output-on-failure
```

## テスト実行

```bash
ctest --test-dir build --output-on-failure
ctest --test-dir build -R ClampTest
ctest --test-dir build -R "UserStoreTest.*" --output-on-failure
```

```bash
./build/example_tests --gtest_filter=ClampTest.*
./build/example_tests --gtest_filter=UserStoreTest.FindsExistingUser
```

## 失敗時のデバッグ

1. gtest filter で失敗した単体テストを再実行する
2. 失敗アサーションの周辺にスコープを限定したログを追加する
3. サニタイザーを有効にして再実行する
4. 根本原因を直した後で全体スイートに拡張する

## カバレッジ

グローバルフラグではなく、ターゲット単位の設定を優先する。

```cmake
option(ENABLE_COVERAGE "Enable coverage flags" OFF)

if(ENABLE_COVERAGE)
  if(CMAKE_CXX_COMPILER_ID MATCHES "GNU")
    target_compile_options(example_tests PRIVATE --coverage)
    target_link_options(example_tests PRIVATE --coverage)
  elseif(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    target_compile_options(example_tests PRIVATE -fprofile-instr-generate -fcoverage-mapping)
    target_link_options(example_tests PRIVATE -fprofile-instr-generate)
  endif()
endif()
```

GCC + gcov + lcov:

```bash
cmake -S . -B build-cov -DENABLE_COVERAGE=ON
cmake --build build-cov -j
ctest --test-dir build-cov
lcov --capture --directory build-cov --output-file coverage.info
lcov --remove coverage.info '/usr/*' --output-file coverage.info
genhtml coverage.info --output-directory coverage
```

Clang + llvm-cov:

```bash
cmake -S . -B build-llvm -DENABLE_COVERAGE=ON -DCMAKE_CXX_COMPILER=clang++
cmake --build build-llvm -j
LLVM_PROFILE_FILE="build-llvm/default.profraw" ctest --test-dir build-llvm
llvm-profdata merge -sparse build-llvm/default.profraw -o build-llvm/default.profdata
llvm-cov report build-llvm/example_tests -instr-profile=build-llvm/default.profdata
```

## サニタイザー

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

## フレイキーテストのガードレール

- 同期に `sleep` を使わず、条件変数や latch を使う
- 一時ディレクトリはテストごとに一意にして、必ずクリーンアップする
- ユニットテストで実時間、ネットワーク、ファイルシステム依存を避ける
- ランダム入力は決定的な seed を使う

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

### よくある落とし穴

- **固定の一時パスを使う** → テストごとに一意な一時ディレクトリを生成し、クリーンアップする
- **壁時計時刻に依存する** → clock を注入するか、fake な時刻ソースを使う
- **フレイキーな並行テスト** → 条件変数 / latch と上限付き待機を使う
- **隠れたグローバル状態** → フィクスチャでグローバル状態をリセットするか、グローバルを排除する
- **過剰モック** → 状態を伴う振る舞いは fake を優先し、相互作用のみを mock する
- **サニタイザー実行不足** → CI に ASan / UBSan / TSan ビルドを追加する
- **デバッグ専用ビルドでのみカバレッジ取得** → カバレッジターゲットで一貫したフラグを使う

## オプション付録: Fuzzing / Property Testing

プロジェクトが既に LLVM / libFuzzer またはプロパティテストライブラリをサポートしている場合にのみ使う。

- **libFuzzer**: I / O が少ない純粋関数に最適
- **RapidCheck**: 不変条件を検証するプロパティベースドテスト

最小の libFuzzer ハーネス（疑似コード: ParseConfig は置き換える）:

```cpp
#include <cstddef>
#include <cstdint>
#include <string>

extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    std::string input(reinterpret_cast<const char *>(data), size);
    // ParseConfig(input); // project function
    return 0;
}
```

## GoogleTest の代替

- **Catch2**: ヘッダーオンリーで表現力の高い matcher を持つ
- **doctest**: 軽量で、コンパイルオーバーヘッドが小さい
