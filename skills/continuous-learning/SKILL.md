---
name: continuous-learning
description: Claude Code セッションから再利用可能なパターンを自動抽出し、将来利用のために学習済みスキルとして保存する。
---

# Continuous Learning スキル

セッション終了時に Claude Code セッションを自動評価し、学習済みスキルとして保存できる再利用可能なパターンを抽出する。

## 仕組み

このスキルは各セッション終了時に **Stop フック** として実行する:

1. **セッション評価**: セッションに十分なメッセージがあるか確認する（デフォルト: 10 件以上）
2. **パターン検出**: セッションから抽出可能なパターンを特定する
3. **スキル抽出**: 有用なパターンを `~/.claude/skills/learned/` に保存する

## 設定

`config.json` を編集してカスタマイズする:

```json
{
  "min_session_length": 10,
  "extraction_threshold": "medium",
  "auto_approve": false,
  "learned_skills_path": "~/.claude/skills/learned/",
  "patterns_to_detect": [
    "error_resolution",
    "user_corrections",
    "workarounds",
    "debugging_techniques",
    "project_specific"
  ],
  "ignore_patterns": [
    "simple_typos",
    "one_time_fixes",
    "external_api_issues"
  ]
}
```

## パターン種別

| パターン | 説明 |
|---------|-------------|
| `error_resolution` | 特定のエラーをどう解決したか |
| `user_corrections` | ユーザーの修正から得られたパターン |
| `workarounds` | フレームワーク / ライブラリ固有の癖に対する解決策 |
| `debugging_techniques` | 効果的なデバッグ手法 |
| `project_specific` | プロジェクト固有の規約 |

## フック設定

次を `~/.claude/settings.json` に追加する:

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning/evaluate-session.sh"
      }]
    }]
  }
}
```

## なぜ Stop フック なのか?

- **軽量**: セッション終了時に 1 回だけ実行する
- **ノンブロッキング**: すべてのメッセージにレイテンシを追加しない
- **完全なコンテキスト**: セッションの完全な書き起こしにアクセスできる

## 関連

- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - continuous learning のセクション
- `/learn` コマンド - セッション途中の手動パターン抽出

---

## 比較メモ（調査: 2025 年 1 月）

### Homunculus との比較（github.com/humanplane/homunculus）

Homunculus v2 はより高度なアプローチを取る:

| 機能 | 本アプローチ | Homunculus v2 |
|---------|--------------|---------------|
| 観測 | Stop フック（セッション終了時） | PreToolUse / PostToolUse フック（100% 信頼できる） |
| 分析 | メインコンテキスト | バックグラウンドエージェント（Haiku） |
| 粒度 | 完全なスキル | 原子的なインスティンクト |
| 信頼度 | なし | 0.3-0.9 の重み付き |
| 進化 | 直接スキルへ | インスティンクト → クラスタ → スキル / コマンド / エージェント |
| 共有 | なし | インスティンクトのエクスポート / インポート |

**Homunculus からの重要な示唆:**
> 「v1 は観測にスキルを使っていた。スキルは確率的で、発火率はおよそ 50-80% である。v2 は観測にフックを使う（100% 信頼できる）うえ、学習済み挙動の原子的な単位としてインスティンクトを使う。」

### v2 の潜在的な強化点

1. **インスティンクトベースの学習** - 信頼度スコア付きの小さな原子的挙動
2. **バックグラウンドオブザーバー** - Haiku エージェントが並列で解析する
3. **信頼度の減衰** - 反証されるとインスティンクトの信頼度が下がる
4. **ドメインタグ付け** - code-style、testing、git、debugging など
5. **進化パス** - 関連するインスティンクトをクラスタ化してスキル / コマンドへ

詳細な仕様は `/Users/affoon/Documents/tasks/12-continuous-learning-v2.md` を参照する。
