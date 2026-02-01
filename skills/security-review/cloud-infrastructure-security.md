| 名前 | 説明 |
|------|-------------|
| cloud-infrastructure-security | クラウドプラットフォームへのデプロイ、インフラ設定、IAM ポリシーの管理、ログ / 監視の設定、または CI/CD パイプラインの実装時にこのスキルを使う。ベストプラクティスに沿ったクラウドセキュリティチェックリストを提供する。 |

# クラウド / インフラセキュリティスキル

このスキルは、クラウドインフラ、CI/CD パイプライン、デプロイ設定がセキュリティベストプラクティスに従い、業界標準に準拠するようにする。

## いつ使うか

- クラウドプラットフォーム (AWS, Vercel, Railway, Cloudflare) にアプリケーションをデプロイするとき
- IAM ロールや権限を設定するとき
- CI/CD パイプラインを設定するとき
- Infrastructure as Code (Terraform, CloudFormation) を実装するとき
- ログと監視を設定するとき
- クラウド環境でシークレットを管理するとき
- CDN とエッジセキュリティを設定するとき
- 災害復旧とバックアップ戦略を実装するとき

## クラウドセキュリティチェックリスト

### 1. IAM とアクセス制御

#### 最小権限の原則

```yaml
# ✅ CORRECT: 最小権限
iam_role:
  permissions:
    - s3:GetObject  # 読み取り専用
    - s3:ListBucket
  resources:
    - arn:aws:s3:::my-bucket/*  # 特定バケットのみ

# ❌ WRONG: 過度に広い権限
iam_role:
  permissions:
    - s3:*  # すべての S3 アクション
  resources:
    - "*"  # すべてのリソース
```

#### 多要素認証 (MFA)

```bash
# ルート / 管理者アカウントでは必ず MFA を有効化する
aws iam enable-mfa-device \
  --user-name admin \
  --serial-number arn:aws:iam::123456789:mfa/admin \
  --authentication-code1 123456 \
  --authentication-code2 789012
```

#### 検証手順

- [ ] 本番でルートアカウントを使わない
- [ ] すべての特権アカウントで MFA を有効化する
- [ ] サービスアカウントは長期クレデンシャルではなくロールを使う
- [ ] IAM ポリシーが最小権限になっている
- [ ] 定期的なアクセスレビューを実施する
- [ ] 未使用のクレデンシャルをローテーションまたは削除する

### 2. シークレット管理

#### クラウドシークレットマネージャー

```typescript
// ✅ CORRECT: クラウドシークレットマネージャーを使う
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });
const secret = await client.getSecretValue({ SecretId: 'prod/api-key' });
const apiKey = JSON.parse(secret.SecretString).key;

// ❌ WRONG: ハードコードまたは環境変数のみ
const apiKey = process.env.API_KEY; // ローテーションも監査もされない
```

#### シークレットローテーション

```bash
# データベースクレデンシャルの自動ローテーションを設定する
aws secretsmanager rotate-secret \
  --secret-id prod/db-password \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:rotate \
  --rotation-rules AutomaticallyAfterDays=30
```

#### 検証手順

- [ ] すべてのシークレットはクラウドシークレットマネージャー (AWS Secrets Manager, Vercel Secrets) に保存されている
- [ ] データベースクレデンシャルの自動ローテーションが有効
- [ ] API キーは四半期ごとにローテーションされる
- [ ] コード、ログ、エラーメッセージにシークレットがない
- [ ] シークレットアクセスの監査ログが有効

### 3. ネットワークセキュリティ

#### VPC とファイアウォール設定

```terraform
# ✅ CORRECT: 制限されたセキュリティグループ
resource "aws_security_group" "app" {
  name = "app-sg"
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # 内部 VPC のみ
  }
  
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # HTTPS のアウトバウンドのみ
  }
}

# ❌ WRONG: インターネットに公開
resource "aws_security_group" "bad" {
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # 全ポート、全 IP!
  }
}
```

#### 検証手順

- [ ] データベースが公開されていない
- [ ] SSH / RDP ポートは VPN / 踏み台のみ
- [ ] セキュリティグループが最小権限
- [ ] ネットワーク ACL が設定されている
- [ ] VPC フローログが有効

### 4. ログと監視

#### CloudWatch / ログ設定

```typescript
// ✅ CORRECT: 包括的なロギング
import { CloudWatchLogsClient, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';

const logSecurityEvent = async (event: SecurityEvent) => {
  await cloudwatch.putLogEvents({
    logGroupName: '/aws/security/events',
    logStreamName: 'authentication',
    logEvents: [{
      timestamp: Date.now(),
      message: JSON.stringify({
        type: event.type,
        userId: event.userId,
        ip: event.ip,
        result: event.result,
        // 機密データは絶対にログに出さない
      })
    }]
  });
};
```

#### 検証手順

- [ ] CloudWatch / ログが全サービスで有効
- [ ] 認証失敗がログに残る
- [ ] 管理者操作が監査される
- [ ] ログ保持が設定されている (コンプライアンス用に 90 日以上)
- [ ] 不審な活動に対するアラートが設定されている
- [ ] ログが集中管理され改ざん耐性がある

### 5. CI/CD パイプラインセキュリティ

#### 安全なパイプライン設定

```yaml
# ✅ CORRECT: 安全な GitHub Actions ワークフロー
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read  # 最小権限
      
    steps:
      - uses: actions/checkout@v4
      
      # シークレットをスキャンする
      - name: Secret scanning
        uses: trufflesecurity/trufflehog@main
        
      # 依存関係の監査
      - name: Audit dependencies
        run: npm audit --audit-level=high
        
      # OIDC を使い、長期トークンは使わない
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActionsRole
          aws-region: us-east-1
```

#### サプライチェーンセキュリティ

```json
// package.json - ロックファイルと整合性チェックを使う
{
  "scripts": {
    "install": "npm ci",  // 再現性のあるビルドには ci を使う
    "audit": "npm audit --audit-level=moderate",
    "check": "npm outdated"
  }
}
```

#### 検証手順

- [ ] 長期クレデンシャルではなく OIDC を使う
- [ ] パイプラインでシークレットスキャンを実行する
- [ ] 依存関係の脆弱性スキャンを行う
- [ ] コンテナイメージのスキャン (該当する場合)
- [ ] ブランチ保護ルールを強制する
- [ ] マージ前にコードレビューが必要
- [ ] 署名コミットを強制する

### 6. Cloudflare / CDN セキュリティ

#### Cloudflare セキュリティ設定

```typescript
// ✅ CORRECT: セキュリティヘッダー付き Cloudflare Workers
export default {
  async fetch(request: Request): Promise<Response> {
    const response = await fetch(request);
    
    // セキュリティヘッダーを追加する
    const headers = new Headers(response.headers);
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Permissions-Policy', 'geolocation=(), microphone=()');
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  }
};
```

#### WAF ルール

```bash
# Cloudflare WAF のマネージドルールを有効化する
# - OWASP Core Ruleset
# - Cloudflare Managed Ruleset
# - レートリミットルール
# - ボット保護
```

#### 検証手順

- [ ] OWASP ルールで WAF を有効化する
- [ ] レートリミットを設定する
- [ ] ボット保護を有効化する
- [ ] DDoS 保護を有効化する
- [ ] セキュリティヘッダーを設定する
- [ ] SSL/TLS の strict モードを有効化する

### 7. バックアップと災害復旧

#### 自動バックアップ

```terraform
# ✅ CORRECT: 自動 RDS バックアップ
resource "aws_db_instance" "main" {
  allocated_storage     = 20
  engine               = "postgres"
  
  backup_retention_period = 30  # 30 日の保持
  backup_window          = "03:00-04:00"
  maintenance_window     = "mon:04:00-mon:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  deletion_protection = true  # 誤削除を防止する
}
```

#### 検証手順

- [ ] 日次の自動バックアップが設定されている
- [ ] バックアップ保持がコンプライアンス要件を満たす
- [ ] ポイントインタイムリカバリが有効
- [ ] バックアップテストを四半期ごとに実施する
- [ ] 災害復旧計画が文書化されている
- [ ] RPO と RTO を定義してテストする

## デプロイ前のクラウドセキュリティチェックリスト

本番クラウドデプロイの前に必ず確認する:

- [ ] **IAM**: ルートアカウントを使わず、MFA を有効化し、最小権限のポリシーを適用する
- [ ] **シークレット**: すべてのシークレットがクラウドシークレットマネージャーにあり、ローテーションされる
- [ ] **ネットワーク**: セキュリティグループが制限され、公開データベースがない
- [ ] **ログ**: CloudWatch / ログが保持付きで有効
- [ ] **監視**: 異常検知のアラートが設定されている
- [ ] **CI/CD**: OIDC 認証、シークレットスキャン、依存関係監査を実施する
- [ ] **CDN/WAF**: Cloudflare WAF が OWASP ルールで有効
- [ ] **暗号化**: 保存時 / 送信時のデータ暗号化
- [ ] **バックアップ**: 自動バックアップと復旧テスト
- [ ] **コンプライアンス**: GDPR/HIPAA 要件を満たす (該当する場合)
- [ ] **ドキュメント**: インフラを文書化し、ランブックを作成する
- [ ] **インシデント対応**: セキュリティインシデント計画がある

## よくあるクラウドセキュリティ設定ミス

### S3 バケットの露出

```bash
# ❌ WRONG: 公開バケット
aws s3api put-bucket-acl --bucket my-bucket --acl public-read

# ✅ CORRECT: 特定アクセスのプライベートバケット
aws s3api put-bucket-acl --bucket my-bucket --acl private
aws s3api put-bucket-policy --bucket my-bucket --policy file://policy.json
```

### RDS 公開アクセス

```terraform
# ❌ WRONG
resource "aws_db_instance" "bad" {
  publicly_accessible = true  # 絶対にやってはいけない!
}

# ✅ CORRECT
resource "aws_db_instance" "good" {
  publicly_accessible = false
  vpc_security_group_ids = [aws_security_group.db.id]
}
```

## リソース

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)
- [Cloudflare Security Documentation](https://developers.cloudflare.com/security/)
- [OWASP Cloud Security](https://owasp.org/www-project-cloud-security/)
- [Terraform Security Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/)

**Remember**: クラウド設定ミスはデータ侵害の主要原因である。公開された S3 バケットや過度に許可された IAM ポリシー 1 つで、インフラ全体が侵害される可能性がある。常に最小権限と多層防御の原則に従うこと。
