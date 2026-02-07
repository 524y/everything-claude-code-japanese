---
description: 包括的なセキュリティレビューを実行する
agent: security-reviewer
subtask: true
---

# Security Review コマンド

指定されたコードに対して包括的なセキュリティレビューを実行する: $ARGUMENTS

## このコマンドの内容

OWASP ガイドラインとセキュリティベストプラクティスに沿って、脆弱性を体系的に確認する。

## セキュリティチェックリスト

### OWASP Top 10

1. **Injection**（SQL / NoSQL / OS command / LDAP）
   - パラメータ化クエリを利用しているか
   - 入力サニタイズが適切か
   - 動的クエリ生成に危険がないか

2. **Broken Authentication**
   - パスワード保管（bcrypt / argon2）
   - セッション管理
   - 多要素認証
   - パスワードリセット導線

3. **Sensitive Data Exposure**
   - 保存時 / 通信時の暗号化
   - 鍵管理
   - PII 取り扱い

4. **XML External Entities (XXE)**
   - DTD 処理を無効化しているか
   - XML 入力の検証があるか

5. **Broken Access Control**
   - 全エンドポイントで認可チェックしているか
   - ロールベースアクセス制御
   - リソース所有者検証

6. **Security Misconfiguration**
   - デフォルト認証情報の削除
   - エラー情報漏えいの防止
   - セキュリティヘッダー設定

7. **Cross-Site Scripting (XSS)**
   - 出力エンコード
   - Content Security Policy
   - 入力サニタイズ

8. **Insecure Deserialization**
   - シリアライズデータの検証
   - 完全性チェック

9. **Using Components with Known Vulnerabilities**
   - `npm audit` 実行
   - 依存関係の更新状況確認

10. **Insufficient Logging & Monitoring**
    - セキュリティイベント記録
    - ログ内に機密情報が含まれないか
    - アラート設定

### 追加チェック

- [ ] シークレットのハードコード（API キー、パスワード）
- [ ] 環境変数の取り扱い
- [ ] CORS 設定
- [ ] レートリミット
- [ ] CSRF 対策
- [ ] セキュア Cookie フラグ

## レポート形式

### Critical Issues
[即時修正が必要な問題]

### High Priority
[リリース前に修正すべき問題]

### Recommendations
[検討すべき改善事項]

---

**IMPORTANT**: セキュリティ問題はブロッカーである。Critical 問題が解消されるまで作業を進めない。
