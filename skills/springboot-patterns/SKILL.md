---
name: springboot-patterns
description: Spring Boot のアーキテクチャ パターン、REST API 設計、レイヤード サービス、データアクセス、キャッシュ、非同期処理、ロギング。Java Spring Boot バックエンド作業で使う。
---

# Spring Boot 開発パターン

スケーラブルで本番品質のサービスのための Spring Boot アーキテクチャと API パターンである。

## REST API 構成

```java
@RestController
@RequestMapping("/api/markets")
@Validated
class MarketController {
  private final MarketService marketService;

  MarketController(MarketService marketService) {
    this.marketService = marketService;
  }

  @GetMapping
  ResponseEntity<Page<MarketResponse>> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Page<Market> markets = marketService.list(PageRequest.of(page, size));
    return ResponseEntity.ok(markets.map(MarketResponse::from));
  }

  @PostMapping
  ResponseEntity<MarketResponse> create(@Valid @RequestBody CreateMarketRequest request) {
    Market market = marketService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(MarketResponse.from(market));
  }
}
```

## リポジトリ パターン (Spring Data JPA)

```java
public interface MarketRepository extends JpaRepository<MarketEntity, Long> {
  @Query("select m from MarketEntity m where m.status = :status order by m.volume desc")
  List<MarketEntity> findActive(@Param("status") MarketStatus status, Pageable pageable);
}
```

## トランザクション付きのサービス層

```java
@Service
public class MarketService {
  private final MarketRepository repo;

  public MarketService(MarketRepository repo) {
    this.repo = repo;
  }

  @Transactional
  public Market create(CreateMarketRequest request) {
    MarketEntity entity = MarketEntity.from(request);
    MarketEntity saved = repo.save(entity);
    return Market.from(saved);
  }
}
```

## DTO とバリデーション

```java
public record CreateMarketRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Size(max = 2000) String description,
    @NotNull @FutureOrPresent Instant endDate,
    @NotEmpty List<@NotBlank String> categories) {}

public record MarketResponse(Long id, String name, MarketStatus status) {
  static MarketResponse from(Market market) {
    return new MarketResponse(market.id(), market.name(), market.status());
  }
}
```

## 例外処理

```java
@ControllerAdvice
class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().stream()
        .map(e -> e.getField() + ": " + e.getDefaultMessage())
        .collect(Collectors.joining(", "));
    return ResponseEntity.badRequest().body(ApiError.validation(message));
  }

  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<ApiError> handleAccessDenied() {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of("Forbidden"));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> handleGeneric(Exception ex) {
    // 想定外エラーはスタックトレース付きでログする
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiError.of("Internal server error"));
  }
}
```

## キャッシュ

設定クラスに `@EnableCaching` が必要である。

```java
@Service
public class MarketCacheService {
  private final MarketRepository repo;

  public MarketCacheService(MarketRepository repo) {
    this.repo = repo;
  }

  @Cacheable(value = "market", key = "#id")
  public Market getById(Long id) {
    return repo.findById(id)
        .map(Market::from)
        .orElseThrow(() -> new EntityNotFoundException("Market not found"));
  }

  @CacheEvict(value = "market", key = "#id")
  public void evict(Long id) {}
}
```

## 非同期処理

設定クラスに `@EnableAsync` が必要である。

```java
@Service
public class NotificationService {
  @Async
  public CompletableFuture<Void> sendAsync(Notification notification) {
    // メール / SMS を送る
    return CompletableFuture.completedFuture(null);
  }
}
```

## ロギング (SLF4J)

```java
@Service
public class ReportService {
  private static final Logger log = LoggerFactory.getLogger(ReportService.class);

  public Report generate(Long marketId) {
    log.info("generate_report marketId={}", marketId);
    try {
      // ロジック
    } catch (Exception ex) {
      log.error("generate_report_failed marketId={}", marketId, ex);
      throw ex;
    }
    return new Report();
  }
}
```

## ミドルウェア / フィルタ

```java
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
  private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    long start = System.currentTimeMillis();
    try {
      filterChain.doFilter(request, response);
    } finally {
      long duration = System.currentTimeMillis() - start;
      log.info("req method={} uri={} status={} durationMs={}",
          request.getMethod(), request.getRequestURI(), response.getStatus(), duration);
    }
  }
}
```

## ページネーションとソート

```java
PageRequest page = PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").descending());
Page<Market> results = marketService.list(page);
```

## 外部呼び出しの耐障害性

```java
public <T> T withRetry(Supplier<T> supplier, int maxRetries) {
  int attempts = 0;
  while (true) {
    try {
      return supplier.get();
    } catch (Exception ex) {
      attempts++;
      if (attempts >= maxRetries) {
        throw ex;
      }
      try {
        Thread.sleep((long) Math.pow(2, attempts) * 100L);
      } catch (InterruptedException ie) {
        Thread.currentThread().interrupt();
        throw ex;
      }
    }
  }
}
```

## レートリミット (Filter + Bucket4j)

**セキュリティ注意**: `X-Forwarded-For` ヘッダーはクライアントが偽装できるため、デフォルトでは信用しない。
次の場合のみ転送ヘッダーを使う:
1. アプリが信頼できるリバースプロキシ (nginx, AWS ALB など) の背後にある
2. `ForwardedHeaderFilter` を Bean として登録している
3. application properties に `server.forward-headers-strategy=NATIVE` または `FRAMEWORK` を設定している
4. プロキシが `X-Forwarded-For` ヘッダーを上書きするよう設定している（追記ではない）

`ForwardedHeaderFilter` が正しく設定されていれば、`request.getRemoteAddr()` は転送ヘッダーから正しいクライアント IP を自動で返す。
この設定がない場合は `request.getRemoteAddr()` を直接使う。これは直近の接続 IP を返し、唯一信頼できる値である。

```java
@Component
public class RateLimitFilter extends OncePerRequestFilter {
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  /*
   * SECURITY: このフィルタはレートリミットのために request.getRemoteAddr() を使って
   * クライアントを識別する。
   *
   * アプリがリバースプロキシ (nginx, AWS ALB など) の背後にある場合、正確なクライアント IP
   * 検出のために Spring で転送ヘッダーを正しく処理する設定が必須である。
   *
   * 1. application.properties/yaml に server.forward-headers-strategy=NATIVE (クラウド向け)
   *    または FRAMEWORK を設定する
   * 2. FRAMEWORK 戦略を使う場合、ForwardedHeaderFilter を登録する:
   *
   *    @Bean
   *    ForwardedHeaderFilter forwardedHeaderFilter() {
   *        return new ForwardedHeaderFilter();
   *    }
   *
   * 3. X-Forwarded-For ヘッダーを上書きする（追記しない）ようプロキシを設定し、偽装を防ぐ
   * 4. server.tomcat.remoteip.trusted-proxies など、コンテナ向けの設定を行う
   *
   * この設定がない場合、request.getRemoteAddr() はクライアント IP ではなくプロキシ IP を返す。
   * X-Forwarded-For を直接読むのは絶対に避ける。信頼できるプロキシ処理がないと容易に偽装される。
   */
  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    // ForwardedHeaderFilter が設定されていれば正しいクライアント IP を返し、
    // 未設定なら直近の接続 IP を返す getRemoteAddr() を使う。
    // 適切なプロキシ設定なしに X-Forwarded-For ヘッダーを直接信用しない。
    String clientIp = request.getRemoteAddr();

    Bucket bucket = buckets.computeIfAbsent(clientIp,
        k -> Bucket.builder()
            .addLimit(Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1))))
            .build());

    if (bucket.tryConsume(1)) {
      filterChain.doFilter(request, response);
    } else {
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    }
  }
}
```

## バックグラウンドジョブ

Spring の `@Scheduled` を使うか、キュー (例: Kafka, SQS, RabbitMQ) と統合する。ハンドラは冪等かつ観測可能に保つ。

## 可観測性

- Logback encoder による構造化ログ (JSON)
- メトリクス: Micrometer + Prometheus / OTel
- トレーシング: OpenTelemetry または Brave バックエンドの Micrometer Tracing

## 本番向けデフォルト

- コンストラクタ注入を優先し、フィールド注入は避ける
- RFC 7807 エラーに `spring.mvc.problemdetails.enabled=true` を有効化する (Spring Boot 3+)
- ワークロードに合わせて HikariCP プールサイズを設定し、タイムアウトを調整する
- クエリには `@Transactional(readOnly = true)` を使う
- `@NonNull` と `Optional` で null 安全性を強制する

**注意**: コントローラは薄く、サービスは集中させ、リポジトリは簡潔に保ち、エラーは中央で処理する。保守性とテスト容易性を最優先にする。
