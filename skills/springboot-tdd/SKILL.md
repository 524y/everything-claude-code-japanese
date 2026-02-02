---
name: springboot-tdd
description: JUnit 5、Mockito、MockMvc、Testcontainers、JaCoCo を使った Spring Boot のテスト駆動開発。機能追加、バグ修正、リファクタ時に使う。
---

# Spring Boot TDD ワークフロー

80% + カバレッジ (ユニット + 統合) を目指す Spring Boot サービスの TDD 指針である。

## 使いどころ

- 新規機能やエンドポイント
- バグ修正やリファクタ
- データアクセス ロジックやセキュリティ ルールの追加

## ワークフロー

1) テストを先に書く（失敗すること）
2) 通る最小実装を行う
3) テストを緑にしたままリファクタする
4) カバレッジを強制する (JaCoCo)

## ユニットテスト (JUnit 5 + Mockito)

```java
@ExtendWith(MockitoExtension.class)
class MarketServiceTest {
  @Mock MarketRepository repo;
  @InjectMocks MarketService service;

  @Test
  void createsMarket() {
    CreateMarketRequest req = new CreateMarketRequest("name", "desc", Instant.now(), List.of("cat"));
    when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

    Market result = service.create(req);

    assertThat(result.name()).isEqualTo("name");
    verify(repo).save(any());
  }
}
```

パターン:
- Arrange-Act-Assert
- 部分モックは避け、明示的なスタブを使う
- 変種には `@ParameterizedTest` を使う

## Web 層テスト (MockMvc)

```java
@WebMvcTest(MarketController.class)
class MarketControllerTest {
  @Autowired MockMvc mockMvc;
  @MockBean MarketService marketService;

  @Test
  void returnsMarkets() throws Exception {
    when(marketService.list(any())).thenReturn(Page.empty());

    mockMvc.perform(get("/api/markets"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content").isArray());
  }
}
```

## 統合テスト (SpringBootTest)

```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketIntegrationTest {
  @Autowired MockMvc mockMvc;

  @Test
  void createsMarket() throws Exception {
    mockMvc.perform(post("/api/markets")
        .contentType(MediaType.APPLICATION_JSON)
        .content("""
          {"name":"Test","description":"Desc","endDate":"2030-01-01T00:00:00Z","categories":["general"]}
        """))
      .andExpect(status().isCreated());
  }
}
```

## 永続化テスト (DataJpaTest)

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestContainersConfig.class)
class MarketRepositoryTest {
  @Autowired MarketRepository repo;

  @Test
  void savesAndFinds() {
    MarketEntity entity = new MarketEntity();
    entity.setName("Test");
    repo.save(entity);

    Optional<MarketEntity> found = repo.findByName("Test");
    assertThat(found).isPresent();
  }
}
```

## Testcontainers

- 本番に近づけるため Postgres / Redis の再利用可能コンテナを使う
- `@DynamicPropertySource` で JDBC URL を Spring コンテキストへ注入する

## カバレッジ (JaCoCo)

Maven 例:
```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.14</version>
  <executions>
    <execution>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>verify</phase>
      <goals><goal>report</goal></goals>
    </execution>
  </executions>
</plugin>
```

## アサーション

- 読みやすさのため AssertJ (`assertThat`) を優先する
- JSON レスポンスには `jsonPath` を使う
- 例外には `assertThatThrownBy(...)` を使う

## テストデータビルダー

```java
class MarketBuilder {
  private String name = "Test";
  MarketBuilder withName(String name) { this.name = name; return this; }
  Market build() { return new Market(null, name, MarketStatus.ACTIVE); }
}
```

## CI コマンド

- Maven: `mvn -T 4 test` または `mvn verify`
- Gradle: `./gradlew test jacocoTestReport`

**注意**: テストは速く、分離され、決定的であるべきだ。実装詳細ではなく振る舞いをテストする。
