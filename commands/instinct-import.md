---
name: instinct-import
description: チームメイト、Skill Creator、または他ソースからインスティンクトを取り込む
command: /instinct-import
implementation: python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py import <file>
---

# Instinct Import コマンド

## 実装

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py import <file-or-url> [--dry-run] [--force] [--min-confidence 0.7]
```

取り込み対象:
- チームメイトのエクスポート
- Skill Creator（リポジトリ分析）
- コミュニティ収集物
- 以前のマシンのバックアップ

## 使用方法

```
/instinct-import team-instincts.yaml
/instinct-import https://github.com/org/repo/instincts.yaml
/instinct-import --from-skill-creator acme/webapp
```

## やること

1. インスティンクト ファイルを取得（ローカル パスまたは URL）
2. フォーマットをパースして検証
3. 既存インスティンクトとの重複を確認
4. マージまたは新規追加
5. `~/.claude/homunculus/instincts/inherited/` に保存

## 取り込みプロセス

```
📥 Importing instincts from: team-instincts.yaml
================================================

Found 12 instincts to import.

Analyzing conflicts...

## New Instincts (8)
These will be added:
  ✓ use-zod-validation (confidence: 0.7)
  ✓ prefer-named-exports (confidence: 0.65)
  ✓ test-async-functions (confidence: 0.8)
  ...

## Duplicate Instincts (3)
Already have similar instincts:
  ⚠️ prefer-functional-style
     Local: 0.8 confidence, 12 observations
     Import: 0.7 confidence
     → Keep local (higher confidence)

  ⚠️ test-first-workflow
     Local: 0.75 confidence
     Import: 0.9 confidence
     → Update to import (higher confidence)

## Conflicting Instincts (1)
These contradict local instincts:
  ❌ use-classes-for-services
     Conflicts with: avoid-classes
     → Skip (requires manual resolution)

---
Import 8 new, update 1, skip 3?
```

## マージ戦略

### 重複の場合
既存と一致するインスティンクトを取り込む場合:
- **信頼度が高い方を優先**: 信頼度の高いものを残す
- **エビデンスを統合**: 観測回数を合算
- **タイムスタンプを更新**: 最新の検証として更新

### 競合の場合
既存と矛盾するインスティンクトを取り込む場合:
- **デフォルトはスキップ**: 競合インスティンクトは取り込まない
- **レビュー待ちにする**: 両方を要確認としてマーク
- **手動解決**: ユーザーがどちらを残すか決める

## ソース追跡

取り込んだインスティンクトには次を付与する:
```yaml
source: "inherited"
imported_from: "team-instincts.yaml"
imported_at: "2025-01-22T10:30:00Z"
original_source: "session-observation"  # または "repo-analysis"
```

## Skill Creator 連携

Skill Creator から取り込む場合:

```
/instinct-import --from-skill-creator acme/webapp
```

これにより、リポジトリ分析で生成されたインスティンクトを取得する:
- source: `repo-analysis`
- 初期信頼度が高い（0.7+）
- 元のリポジトリに紐づく

## フラグ

- `--dry-run`: 取り込まずにプレビュー
- `--force`: 競合があっても取り込む
- `--merge-strategy <higher|local|import>`: 重複時の扱い
- `--from-skill-creator <owner/repo>`: Skill Creator の分析から取り込む
- `--min-confidence <n>`: 指定値以上の信頼度のみ取り込む

## 出力

取り込み後:
```
✅ Import complete!

Added: 8 instincts
Updated: 1 instinct
Skipped: 3 instincts (2 duplicates, 1 conflict)

New instincts saved to: ~/.claude/homunculus/instincts/inherited/

Run /instinct-status to see all instincts.
```
