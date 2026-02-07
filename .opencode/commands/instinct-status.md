---
name: instinct-status
description: 学習済みインスティンクトと信頼度を一覧表示する
command: true
---

# Instinct Status コマンド

学習済みインスティンクトとその信頼度を、ドメイン別に一覧表示する。

## 実装

プラグイン ルート パスを使って instinct CLI を実行する:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" status
```

`CLAUDE_PLUGIN_ROOT` が未設定の場合（手動インストール時）は次を使う:

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py status
```

## 使用方法

```
/instinct-status
/instinct-status --domain code-style
/instinct-status --low-confidence
```

## やること

1. `~/.claude/homunculus/instincts/personal/` から個人インスティンクトを読み込む
2. `~/.claude/homunculus/instincts/inherited/` から継承インスティンクトを読み込む
3. ドメイン別にグループ化し、信頼度バー付きで表示

## 出力フォーマット

```
📊 インスティンクト ステータス
==================

## コードスタイル（4 インスティンクト）

### prefer-functional-style
トリガー: 新しい関数を書くとき
アクション: クラスではなく関数型パターンを使う
信頼度: ████████░░ 80%
ソース: session-observation | 最終更新: 2025-01-22

### use-path-aliases
トリガー: モジュールをインポートするとき
アクション: 相対 import ではなく @/ パス エイリアスを使う
信頼度: ██████░░░░ 60%
ソース: repo-analysis (github.com/acme/webapp)

## テスト（2 インスティンクト）

### test-first-workflow
トリガー: 新しい機能を追加するとき
アクション: テストを先に書き、次に実装する
信頼度: █████████░ 90%
ソース: session-observation

## ワークフロー（3 インスティンクト）

### grep-before-edit
トリガー: コードを変更するとき
アクション: Grep で検索し、Read で確認してから Edit する
信頼度: ███████░░░ 70%
ソース: session-observation

---
合計: 9 インスティンクト（personal 4 件、inherited 5 件）
Observer: 稼働中（最終解析: 5 min 前）
```

## フラグ

- `--domain <name>`: 指定ドメインでフィルタ（code-style, testing, git など）
- `--low-confidence`: 信頼度が 0.5 未満のみ表示
- `--high-confidence`: 信頼度が 0.7 以上のみ表示
- `--source <type>`: ソースでフィルタ（session-observation, repo-analysis, inherited）
- `--json`: JSON 形式で出力
