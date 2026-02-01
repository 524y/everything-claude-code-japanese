---
name: instinct-export
description: チームメイトや他プロジェクトと共有するために instinct をエクスポートする
command: /instinct-export
---

# Instinct Export コマンド

共有可能な形式に instinct をエクスポートする。次に最適:
- チームメイトとの共有
- 新しいマシンへの移行
- プロジェクトの慣習への貢献

## 使い方

```
/instinct-export                           # 個人 instinct をすべてエクスポートする
/instinct-export --domain testing          # testing ドメインの instinct だけエクスポートする
/instinct-export --min-confidence 0.7      # 高信頼度 instinct のみエクスポートする
/instinct-export --output team-instincts.yaml
```

## やること

1. `~/.claude/homunculus/instincts/personal/` から instinct を読む
2. フラグに基づいてフィルタする
3. 機密情報を除去する:
   - セッション ID を除去
   - ファイルパスを除去 (パターンのみ保持)
   - "last week" より古いタイムスタンプを除去
4. エクスポートファイルを生成する

## 出力形式

YAML ファイルを作成する:

```yaml
# Instincts Export
# 生成日: 2025-01-22
# ソース: personal
# 件数: 12 instincts

version: "2.0"
exported_by: "continuous-learning-v2"
export_date: "2025-01-22T10:30:00Z"

instincts:
  - id: prefer-functional-style
    trigger: "when writing new functions"
    action: "Use functional patterns over classes"
    confidence: 0.8
    domain: code-style
    observations: 8

  - id: test-first-workflow
    trigger: "when adding new functionality"
    action: "Write test first, then implementation"
    confidence: 0.9
    domain: testing
    observations: 12

  - id: grep-before-edit
    trigger: "when modifying code"
    action: "Search with Grep, confirm with Read, then Edit"
    confidence: 0.7
    domain: workflow
    observations: 6
```

## プライバシー考慮事項

エクスポートに含まれる:
- ✅ Trigger パターン
- ✅ アクション
- ✅ 信頼度スコア
- ✅ ドメイン
- ✅ 観測数

エクスポートに含まれない:
- ❌ 実際のコード断片
- ❌ ファイルパス
- ❌ セッションのトランスクリプト
- ❌ 個人識別情報

## フラグ

- `--domain <name>`: 指定したドメインのみエクスポートする
- `--min-confidence <n>`: 最低信頼度しきい値 (デフォルト: 0.3)
- `--output <file>`: 出力ファイルパス (デフォルト: instincts-export-YYYYMMDD.yaml)
- `--format <yaml|json|md>`: 出力形式 (デフォルト: yaml)
- `--include-evidence`: 証拠テキストを含める (デフォルト: 除外)
