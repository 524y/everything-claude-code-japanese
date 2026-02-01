---
name: instinct-import
description: チームメイト、Skill Creator、または他のソースからインスティンクトをインポートする
command: /instinct-import
implementation: python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py import <file>
---

# インスティンクトインポートコマンド

## 実装

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py import <file-or-url> [--dry-run] [--force] [--min-confidence 0.7]
```

インポート元:
- チームメイトのエクスポート
- Skill Creator（repo 分析）
- コミュニティのコレクション
- 以前のマシンのバックアップ

## 使い方

```
/instinct-import team-instincts.yaml
/instinct-import https://github.com/org/repo/instincts.yaml
/instinct-import --from-skill-creator acme/webapp
```

## やること

1. インスティンクトファイルを取得する（ローカルパス または URL）
2. 形式を解析し、検証する
3. 既存のインスティンクトとの重複を確認する
4. 新しいインスティンクトをマージするか追加する
5. `~/.claude/homunculus/instincts/inherited/` に保存する

## インポート手順

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
既存のものと一致するインスティンクトをインポートする場合:
- **高い信頼度が優先**: 信頼度が高いほうを保持する
- **エビデンスをマージ**: 観測回数を結合する
- **タイムスタンプを更新**: 最近検証したことを示す

### 競合の場合
既存のものと矛盾するインスティンクトをインポートする場合:
- **デフォルトでスキップ**: 競合するインスティンクトはインポートしない
- **レビュー用にフラグ**: 両方を要注意としてマークする
- **手動解決**: ユーザーがどちらを残すか判断する

## ソース追跡

インポートしたインスティンクトは次のようにマークする:
```yaml
source: "inherited"
imported_from: "team-instincts.yaml"
imported_at: "2025-01-22T10:30:00Z"
original_source: "session-observation"  # or "repo-analysis"
```

## Skill Creator 連携

Skill Creator からインポートする場合:

```
/instinct-import --from-skill-creator acme/webapp
```

これは repo 分析から生成されたインスティンクトを取得する:
- ソース: `repo-analysis`
- 初期の信頼度が高い（0.7+）
- ソースリポジトリに紐付く

## フラグ

- `--dry-run`: インポートせずにプレビューする
- `--force`: 競合があってもインポートする
- `--merge-strategy <higher|local|import>`: 重複の扱い方
- `--from-skill-creator <owner/repo>`: Skill Creator の分析からインポートする
- `--min-confidence <n>`: 閾値以上のインスティンクトのみをインポートする

## 出力

インポート後:
```
✅ Import complete!

Added: 8 instincts
Updated: 1 instinct
Skipped: 3 instincts (2 duplicates, 1 conflict)

New instincts saved to: ~/.claude/homunculus/instincts/inherited/

Run /instinct-status to see all instincts.
```
