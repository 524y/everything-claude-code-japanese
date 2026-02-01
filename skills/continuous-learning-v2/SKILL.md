---
name: continuous-learning-v2
description: フックでセッションを観測し、信頼度スコア付きの原子的な instinct を作成し、skills / commands / agents に進化させる instinct ベース学習システム。
version: 2.0.0
---

# Continuous Learning v2 - Instinct ベースアーキテクチャ

高度な学習システム。Claude Code セッションを、信頼度スコア付きの原子的な "instinct" (小さな学習行動) を通じて再利用可能な知識に変換する。

## v2 の新機能

| 機能 | v1 | v2 |
|---------|----|----|
| 観測 | Stop フック (セッション終了) | PreToolUse/PostToolUse (100% 信頼) |
| 分析 | メインコンテキスト | バックグラウンドエージェント (Haiku) |
| 粒度 | 完全なスキル | 原子的 "instinct" |
| 信頼度 | なし | 0.3-0.9 の重み付き |
| 進化 | 直接スキル化 | Instinct → クラスタ → skill/command/agent |
| 共有 | なし | instinct のエクスポート / インポート |

## Instinct モデル

instinct は小さな学習行動:

```yaml
---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7
domain: "code-style"
source: "session-observation"
---

# Prefer Functional Style

## Action
Use functional patterns over classes when appropriate.

## Evidence
- Observed 5 instances of functional pattern preference
- User corrected class-based approach to functional on 2025-01-15
```

**特性:**
- **原子的** — 1 トリガー、1 アクション
- **信頼度付き** — 0.3 = 暫定、0.9 = ほぼ確実
- **ドメインタグ付き** — code-style, testing, git, debugging, workflow など
- **証拠付き** — どの観測が生成したかを追跡する

## 仕組み

```
Session Activity
      │
      │ Hooks capture prompts + tool use (100% reliable)
      ▼
┌─────────────────────────────────────────┐
│         observations.jsonl              │
│   (prompts, tool calls, outcomes)       │
└─────────────────────────────────────────┘
      │
      │ Observer agent reads (background, Haiku)
      ▼
┌─────────────────────────────────────────┐
│          PATTERN DETECTION              │
│   • User corrections → instinct         │
│   • Error resolutions → instinct        │
│   • Repeated workflows → instinct       │
└─────────────────────────────────────────┘
      │
      │ Creates/updates
      ▼
┌─────────────────────────────────────────┐
│         instincts/personal/             │
│   • prefer-functional.md (0.7)          │
│   • always-test-first.md (0.9)          │
│   • use-zod-validation.md (0.6)         │
└─────────────────────────────────────────┘
      │
      │ /evolve clusters
      ▼
┌─────────────────────────────────────────┐
│              evolved/                   │
│   • commands/new-feature.md             │
│   • skills/testing-workflow.md          │
│   • agents/refactor-specialist.md       │
└─────────────────────────────────────────┘
```

## クイックスタート

### 1. 観測フックを有効化する

`~/.claude/settings.json` に追加する:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

### 2. ディレクトリ構成を初期化する

```bash
mkdir -p ~/.claude/homunculus/{instincts/{personal,inherited},evolved/{agents,skills,commands}}
touch ~/.claude/homunculus/observations.jsonl
```

### 3. Observer エージェントを実行する (任意)

Observer はバックグラウンドで観測を分析できる:

```bash
# バックグラウンド observer を開始
~/.claude/skills/continuous-learning-v2/agents/start-observer.sh
```

## コマンド

| コマンド | 説明 |
|---------|-------------|
| `/instinct-status` | 学習済み instinct を信頼度付きで一覧表示する |
| `/evolve` | 関連する instinct を skill/command にクラスタリングする |
| `/instinct-export` | 共有用に instinct をエクスポートする |
| `/instinct-import <file>` | 他者の instinct をインポートする |

## 設定

`config.json` を編集する:

```json
{
  "version": "2.0",
  "observation": {
    "enabled": true,
    "store_path": "~/.claude/homunculus/observations.jsonl",
    "max_file_size_mb": 10,
    "archive_after_days": 7
  },
  "instincts": {
    "personal_path": "~/.claude/homunculus/instincts/personal/",
    "inherited_path": "~/.claude/homunculus/instincts/inherited/",
    "min_confidence": 0.3,
    "auto_approve_threshold": 0.7,
    "confidence_decay_rate": 0.05
  },
  "observer": {
    "enabled": true,
    "model": "haiku",
    "run_interval_minutes": 5,
    "patterns_to_detect": [
      "user_corrections",
      "error_resolutions",
      "repeated_workflows",
      "tool_preferences"
    ]
  },
  "evolution": {
    "cluster_threshold": 3,
    "evolved_path": "~/.claude/homunculus/evolved/"
  }
}
```

## ファイル構成

```
~/.claude/homunculus/
├── identity.json           # プロファイル、技術レベル
├── observations.jsonl      # 現在セッションの観測
├── observations.archive/   # 処理済みの観測
├── instincts/
│   ├── personal/           # 自動学習された instinct
│   └── inherited/          # 他者からのインポート
└── evolved/
    ├── agents/             # 生成された専門エージェント
    ├── skills/             # 生成されたスキル
    └── commands/           # 生成されたコマンド
```

## Skill Creator との統合

[Skill Creator GitHub App](https://skill-creator.app) を使うと、以下の **両方** を生成する:
- 従来の SKILL.md ファイル (後方互換)
- v2 学習システム向け instinct コレクション

リポジトリ分析からの instinct には `source: "repo-analysis"` が付き、ソースリポジトリの URL を含む。

## 信頼度スコアリング

信頼度は時間とともに進化する:

| スコア | 意味 | 振る舞い |
|-------|---------|----------|
| 0.3 | 暫定 | 提案するが強制しない |
| 0.5 | 中程度 | 関連時に適用する |
| 0.7 | 強い | 自動承認で適用する |
| 0.9 | ほぼ確実 | 中核的な振る舞い |

**信頼度が上がる条件**:
- パターンが繰り返し観測される
- ユーザーが提案された振る舞いを修正しない
- 他ソースの類似 instinct と一致する

**信頼度が下がる条件**:
- ユーザーが明示的に振る舞いを修正する
- 長期間パターンが観測されない
- 矛盾する証拠が現れる

## 観測でフックを使う理由 (Skills との比較)

> "v1 relied on skills to observe. Skills are probabilistic—they fire ~50-80% of the time based on Claude's judgment."

フックは **100% 実行** され、決定論的である。つまり:
- すべてのツール呼び出しが観測される
- パターンの取りこぼしがない
- 学習が包括的になる

## 後方互換

v2 は v1 と完全に互換である:
- 既存の `~/.claude/skills/learned/` スキルはそのまま使える
- Stop フックは引き続き実行される (ただし v2 にも供給される)
- 段階的な移行パス: 並行運用が可能

## プライバシー

- 観測は **ローカル** に保存される
- エクスポートできるのは **instinct** (パターン) のみ
- 実際のコードや会話内容は共有されない
- 何をエクスポートするかはあなたが制御する

## 関連

- [Skill Creator](https://skill-creator.app) - リポジトリ履歴から instinct を生成する
- [Homunculus](https://github.com/humanplane/homunculus) - v2 アーキテクチャの着想
- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - Continuous learning のセクション

---

*Instinct ベース学習: 観測を 1 つずつ積み重ね、Claude にあなたのパターンを教える。*
