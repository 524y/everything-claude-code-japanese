---
name: springboot-verification
description: Spring Boot プロジェクト向けの検証ループ。ビルド、静的解析、カバレッジ付きテスト、セキュリティスキャン、差分レビューをリリースや PR 前に実施する。
---

# Spring Boot 検証ループ

PR 前、重要変更後、デプロイ前に実行する。

## フェーズ 1: ビルド

```bash
mvn -T 4 clean verify -DskipTests
# or
./gradlew clean assemble -x test
```

ビルドに失敗したら停止して修正する。

## フェーズ 2: 静的解析

Maven (一般的なプラグイン):
```bash
mvn -T 4 spotbugs:check pmd:check checkstyle:check
```

Gradle (設定済みの場合):
```bash
./gradlew checkstyleMain pmdMain spotbugsMain
```

## フェーズ 3: テスト + カバレッジ

```bash
mvn -T 4 test
mvn jacoco:report   # 80% + カバレッジを確認
# or
./gradlew test jacocoTestReport
```

レポート:
- 合計テスト数、成功 / 失敗
- カバレッジ % (行 / ブランチ)

## フェーズ 4: セキュリティスキャン

```bash
# Dependency CVEs
mvn org.owasp:dependency-check-maven:check
# or
./gradlew dependencyCheckAnalyze

# シークレット (git)
git secrets --scan  # 設定済みの場合
```

## フェーズ 5: Lint / Format (任意のゲート)

```bash
mvn spotless:apply   # Spotless プラグインを使う場合
./gradlew spotlessApply
```

## フェーズ 6: 差分レビュー

```bash
git diff --stat
git diff
```

チェックリスト:
- デバッグログが残っていない (`System.out`、ガードなしの `log.debug`)
- 意味のあるエラーと HTTP ステータス
- 必要なトランザクションとバリデーションがある
- 設定変更が文書化されている

## 出力テンプレート

```
VERIFICATION REPORT
===================
Build:     [PASS/FAIL]
Static:    [PASS/FAIL] (spotbugs/pmd/checkstyle)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (CVE findings: N)
Diff:      [X files changed]

Overall:   [READY / NOT READY]

Issues to Fix:
1. ...
2. ...
```

## 継続モード

- 大きな変更や 30–60 分ごとにフェーズを再実行する
- 短いループを保つ: `mvn -T 4 test` + spotbugs で素早いフィードバックを得る

**注意**: 速いフィードバックは遅い驚きに勝る。ゲートは厳格に保ち、本番システムでは警告も欠陥として扱う。
