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
📥 インスティンクトを取り込み中: team-instincts.yaml
================================================

取り込み対象のインスティンクトは 12 件。

競合を解析中...

## 新規インスティンクト (8)
次を追加:
  ✓ use-zod-validation (信頼度: 0.7)
  ✓ prefer-named-exports (信頼度: 0.65)
  ✓ test-async-functions (信頼度: 0.8)
  ...

## 重複インスティンクト (3)
既存と類似している:
  ⚠️ prefer-functional-style
     ローカル: 信頼度 0.8、観測 12 件
     取り込み: 信頼度 0.7
     → ローカルを維持（信頼度が高い）

  ⚠️ test-first-workflow
     ローカル: 信頼度 0.75
     取り込み: 信頼度 0.9
     → 取り込み版へ更新（信頼度が高い）

## 競合インスティンクト (1)
既存のインスティンクトと矛盾:
  ❌ use-classes-for-services
     競合: avoid-classes
     → スキップ（手動解決が必要）

---
新規 8 件、更新 1 件、スキップ 3 件でよいか？
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
✅ 取り込み完了!

追加: 8 インスティンクト
更新: 1 インスティンクト
スキップ: 3 インスティンクト（重複 2 件、競合 1 件）

新規インスティンクトの保存先: ~/.claude/homunculus/instincts/inherited/

/instinct-status を実行してすべてのインスティンクトを確認する。
```
