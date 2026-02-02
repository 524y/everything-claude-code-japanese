---
name: java-coding-standards
description: Spring Boot サービス向けの Java コーディング標準。命名、不変性、Optional の使用、ストリーム、例外、ジェネリクス、プロジェクト構成。
---

# Java コーディング標準

Spring Boot サービスで読みやすく保守しやすい Java (17+) コードの標準である。

## コア原則

- 巧妙さより明確さを優先する
- デフォルトは不変にする。共有の可変状態を最小化する
- 意味のある例外で早期失敗する
- 命名とパッケージ構成を一貫させる

## 命名

```java
// ✅ クラス / レコード: PascalCase
public class MarketService {}
public record Money(BigDecimal amount, Currency currency) {}

// ✅ メソッド / フィールド: camelCase
private final MarketRepository marketRepository;
public Market findBySlug(String slug) {}

// ✅ 定数: UPPER_SNAKE_CASE
private static final int MAX_PAGE_SIZE = 100;
```

## 不変性

```java
// ✅ record と final フィールドを優先する
public record MarketDto(Long id, String name, MarketStatus status) {}

public class Market {
  private final Long id;
  private final String name;
  // getter のみ、setter は作らない
}
```

## Optional の使用

```java
// ✅ find* メソッドは Optional を返す
Optional<Market> market = marketRepository.findBySlug(slug);

// ✅ get() ではなく map/flatMap を使う
return market
    .map(MarketResponse::from)
    .orElseThrow(() -> new EntityNotFoundException("Market not found"));
```

## ストリームのベストプラクティス

```java
// ✅ 変換にはストリームを使い、パイプラインは短く保つ
List<String> names = markets.stream()
    .map(Market::name)
    .filter(Objects::nonNull)
    .toList();

// ❌ 複雑なネストしたストリームは避け、明確さのためループを優先する
```

## 例外

- ドメインエラーには unchecked 例外を使い、技術的例外はコンテキスト付きでラップする
- ドメイン固有の例外を作る（例: `MarketNotFoundException`）
- `catch (Exception ex)` のような広い catch は、再スロー / 中央集約のロギング以外では避ける

```java
throw new MarketNotFoundException(slug);
```

## ジェネリクスと型安全性

- raw 型を避け、ジェネリック パラメータを宣言する
- 再利用可能なユーティリティには境界付きジェネリクスを優先する

```java
public <T extends Identifiable> Map<Long, T> indexById(Collection<T> items) { ... }
```

## プロジェクト構成 (Maven / Gradle)

```
src/main/java/com/example/app/
  config/
  controller/
  service/
  repository/
  domain/
  dto/
  util/
src/main/resources/
  application.yml
src/test/java/... (main をミラー)
```

## フォーマットとスタイル

- 2 または 4 スペースを一貫して使う（プロジェクト標準）
- 1 ファイル 1 public トップレベル型
- メソッドは短く焦点を絞り、ヘルパーに抽出する
- メンバー順序: 定数、フィールド、コンストラクタ、public メソッド、protected、private

## 避けたいコードスメル

- 長い引数リスト → DTO / ビルダーを使う
- 深いネスト → 早期リターン
- マジックナンバー → 名前付き定数
- static の可変状態 → 依存性注入を優先
- 何もしない catch ブロック → ログして対応するか再スローする

## ロギング

```java
private static final Logger log = LoggerFactory.getLogger(MarketService.class);
log.info("fetch_market slug={}", slug);
log.error("failed_fetch_market slug={}", slug, ex);
```

## null の扱い

- やむを得ない場合のみ `@Nullable` を許容し、それ以外は `@NonNull` を使う
- 入力には Bean Validation（`@NotNull`, `@NotBlank`）を使う

## テスト期待値

- JUnit 5 + AssertJ で流暢なアサーション
- モックには Mockito、可能な限り部分モックは避ける
- 決定的なテストを優先し、隠れた sleep は使わない

**注意**: コードは意図的で型付けされ、観測可能に保つ。必要性が証明されない限り、マイクロ最適化より保守性を優先する。
