---
name: jpa-patterns
description: Spring Boot 向けの JPA / Hibernate パターン。エンティティ設計、リレーション、クエリ最適化、トランザクション、監査、インデックス、ページネーション、プーリング。
---

# JPA / Hibernate パターン

Spring Boot のデータモデリング、リポジトリ、性能調整に使う。

## エンティティ設計

```java
@Entity
@Table(name = "markets", indexes = {
  @Index(name = "idx_markets_slug", columnList = "slug", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
public class MarketEntity {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(nullable = false, unique = true, length = 120)
  private String slug;

  @Enumerated(EnumType.STRING)
  private MarketStatus status = MarketStatus.ACTIVE;

  @CreatedDate private Instant createdAt;
  @LastModifiedDate private Instant updatedAt;
}
```

監査を有効化:
```java
@Configuration
@EnableJpaAuditing
class JpaConfig {}
```

## リレーションと N+1 防止

```java
@OneToMany(mappedBy = "market", cascade = CascadeType.ALL, orphanRemoval = true)
private List<PositionEntity> positions = new ArrayList<>();
```

- デフォルトは遅延ロードにし、必要時にクエリで `JOIN FETCH` を使う
- コレクションに `EAGER` は避け、読み取り経路には DTO プロジェクションを使う

```java
@Query("select m from MarketEntity m left join fetch m.positions where m.id = :id")
Optional<MarketEntity> findWithPositions(@Param("id") Long id);
```

## リポジトリ パターン

```java
public interface MarketRepository extends JpaRepository<MarketEntity, Long> {
  Optional<MarketEntity> findBySlug(String slug);

  @Query("select m from MarketEntity m where m.status = :status")
  Page<MarketEntity> findByStatus(@Param("status") MarketStatus status, Pageable pageable);
}
```

- 軽量クエリにはプロジェクションを使う:
```java
public interface MarketSummary {
  Long getId();
  String getName();
  MarketStatus getStatus();
}
Page<MarketSummary> findAllBy(Pageable pageable);
```

## トランザクション

- サービスメソッドに `@Transactional` を付ける
- 読み取り経路は `@Transactional(readOnly = true)` を使って最適化する
- 伝播は慎重に選び、長時間トランザクションは避ける

```java
@Transactional
public Market updateStatus(Long id, MarketStatus status) {
  MarketEntity entity = repo.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Market"));
  entity.setStatus(status);
  return Market.from(entity);
}
```

## ページネーション

```java
PageRequest page = PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").descending());
Page<MarketEntity> markets = repo.findByStatus(MarketStatus.ACTIVE, page);
```

カーソル風のページネーションでは、JPQL で順序付けとともに `id > :lastId` を含める。

## インデックスと性能

- よく使うフィルタにインデックスを追加する（`status`, `slug`, 外部キー）
- クエリパターンに合わせた複合インデックスを使う（`status, created_at`）
- `select *` を避け、必要な列だけ投影する
- `saveAll` と `hibernate.jdbc.batch_size` で書き込みをバッチ化する

## コネクションプーリング (HikariCP)

推奨プロパティ:
```
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.validation-timeout=5000
```

PostgreSQL の LOB 取扱いには次を追加:
```
spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation=true
```

## キャッシュ

- 1st レベル キャッシュは EntityManager 単位である。トランザクションを跨いでエンティティを保持しない
- 読み取りが多いエンティティではセカンドレベル キャッシュを慎重に検討し、エビクション戦略を検証する

## マイグレーション

- Flyway または Liquibase を使い、本番では Hibernate の自動 DDL に依存しない
- マイグレーションは冪等かつ追加型にし、計画なしでの列削除は避ける

## データアクセスのテスト

- 本番に近づけるため `@DataJpaTest` と Testcontainers を優先する
- ログで SQL 効率を確認する: `logging.level.org.hibernate.SQL=DEBUG` と `logging.level.org.hibernate.orm.jdbc.bind=TRACE` を設定してパラメータ値を表示する

**注意**: エンティティは小さく保ち、クエリは意図的に設計し、トランザクションは短くする。フェッチ戦略とプロジェクションで N+1 を防ぎ、読み書き経路に合わせてインデックスを張る。
