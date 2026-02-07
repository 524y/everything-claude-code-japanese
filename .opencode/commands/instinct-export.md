---
name: instinct-export
description: 共有や他プロジェクト向けにインスティンクトをエクスポートする
command: /instinct-export
---

# Instinct Export コマンド

インスティンクトを共有可能な形式へエクスポートする。用途:
- チームへの共有
- 新しいマシンへの移行
- プロジェクトの規約への貢献

## 使用方法

```
/instinct-export                           # 個人インスティンクトをすべてエクスポート
/instinct-export --domain testing          # testing ドメインだけをエクスポート
/instinct-export --min-confidence 0.7      # 信頼度の高いインスティンクトのみをエクスポート
/instinct-export --output team-instincts.yaml
```

## やること

1. `~/.claude/homunculus/instincts/personal/` からインスティンクトを読み込む
2. フラグに応じてフィルタリングする
3. 機密情報を除去する:
   - セッション ID を削除
   - ファイルパスを削除（パターンのみ保持）
   - 「先週」より古いタイムスタンプを削除
4. エクスポート ファイルを生成する

## 出力フォーマット

YAML ファイルを作成:

```yaml
# Instincts エクスポート
# 生成日: 2025-01-22
# ソース: personal
# 件数: 12 インスティンクト

version: "2.0"
exported_by: "continuous-learning-v2"
export_date: "2025-01-22T10:30:00Z"

instincts:
  - id: prefer-functional-style
    trigger: "新しい関数を書くとき"
    action: "クラスではなく関数型パターンを使う"
    confidence: 0.8
    domain: code-style
    observations: 8

  - id: test-first-workflow
    trigger: "新しい機能を追加するとき"
    action: "テストを先に書き、次に実装する"
    confidence: 0.9
    domain: testing
    observations: 12

  - id: grep-before-edit
    trigger: "コードを変更するとき"
    action: "Grep で検索し、Read で確認してから Edit する"
    confidence: 0.7
    domain: workflow
    observations: 6
```

## プライバシー面の注意

エクスポートに含まれるもの:
- ✅ トリガー パターン
- ✅ アクション
- ✅ 信頼度
- ✅ ドメイン
- ✅ 観測回数

エクスポートに含まれないもの:
- ❌ 実際のコード断片
- ❌ ファイルパス
- ❌ セッションの転記
- ❌ 個人識別情報

## フラグ

- `--domain <name>`: 指定ドメインのみエクスポート
- `--min-confidence <n>`: 信頼度の最小閾値（デフォルト: 0.3）
- `--output <file>`: 出力ファイル パス（デフォルト: instincts-export-YYYYMMDD.yaml）
- `--format <yaml|json|md>`: 出力フォーマット（デフォルト: yaml）
- `--include-evidence`: エビデンス テキストを含める（デフォルト: 含めない）
