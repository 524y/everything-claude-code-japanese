---
name: springboot-security
description: Java Spring Boot サービス向けの Spring Security ベストプラクティス。認証 / 認可、バリデーション、CSRF、シークレット、ヘッダー、レートリミット、依存関係セキュリティ。
---

# Spring Boot セキュリティ レビュー

認証の追加、入力の扱い、エンドポイント作成、シークレット対応時に使う。

## 認証

- 失効リスト付きのステートレス JWT、または不透明トークンを優先する
- セッションには `httpOnly`, `Secure`, `SameSite=Strict` の Cookie を使う
- `OncePerRequestFilter` またはリソースサーバでトークンを検証する

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwtService;

  public JwtAuthFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      Authentication auth = jwtService.authenticate(token);
      SecurityContextHolder.getContext().setAuthentication(auth);
    }
    chain.doFilter(request, response);
  }
}
```

## 認可

- メソッドセキュリティを有効化する: `@EnableMethodSecurity`
- `@PreAuthorize("hasRole('ADMIN')")` または `@PreAuthorize("@authz.canEdit(#id)")` を使う
- デフォルト拒否とし、必要なスコープのみ公開する

## 入力バリデーション

- コントローラに `@Valid` を付けて Bean Validation を使う
- DTO に制約を適用する: `@NotBlank`, `@Email`, `@Size`, カスタムバリデータ
- HTML はホワイトリストでサニタイズしてから表示する

## SQL インジェクション対策

- Spring Data リポジトリまたはパラメータ化クエリを使う
- ネイティブクエリは `:param` バインドを使い、文字列連結はしない

## CSRF 対策

- ブラウザセッション アプリでは CSRF を有効にし、フォーム / ヘッダーにトークンを含める
- Bearer トークンのみの API では CSRF を無効化し、ステートレス認証に頼る

```java
http
  .csrf(csrf -> csrf.disable())
  .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```

## シークレット管理

- ソースにシークレットを置かない。環境変数や vault から読み込む
- `application.yml` に認証情報を置かない。プレースホルダを使う
- トークンと DB 認証情報は定期的にローテーションする

## セキュリティヘッダー

```java
http
  .headers(headers -> headers
    .contentSecurityPolicy(csp -> csp
      .policyDirectives("default-src 'self'"))
    .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
    .xssProtection(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER)));
```

## レートリミット

- Bucket4j またはゲートウェイ レベルの制限をコストの高いエンドポイントに適用する
- バーストをログに残してアラートし、429 をリトライヒント付きで返す

## 依存関係のセキュリティ

- CI で OWASP Dependency Check / Snyk を実行する
- Spring Boot と Spring Security はサポート対象バージョンを使う
- 既知の CVE でビルドを失敗させる

## ロギングと PII

- シークレット、トークン、パスワード、完全な PAN データはログに出さない
- 機微フィールドはマスクし、構造化 JSON ログを使う

## ファイルアップロード

- サイズ、Content-Type、拡張子を検証する
- Web ルート外に保存し、必要に応じてスキャンする

## リリース前チェックリスト

- [ ] 認証トークンが正しく検証・失効されている
- [ ] すべての機密経路に認可ガードがある
- [ ] すべての入力が検証・サニタイズされている
- [ ] 文字列連結 SQL がない
- [ ] アプリ種別に応じた CSRF 方針になっている
- [ ] シークレットが外部化され、コミットされていない
- [ ] セキュリティヘッダーが設定されている
- [ ] API にレートリミットがある
- [ ] 依存関係をスキャンし最新化している
- [ ] ログに機微データがない

**注意**: デフォルト拒否、入力の検証、最小権限、設定ベースの安全性を最優先にする。
