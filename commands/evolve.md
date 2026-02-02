---
name: evolve
description: 関連するインスティンクトを skills / commands / agents にまとめる
command: true
---

# Evolve コマンド

## 実装

プラグイン ルート パスを使って instinct CLI を実行する:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve [--generate]
```

`CLAUDE_PLUGIN_ROOT` が未設定の場合（手動インストール時）は次を使う:

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve [--generate]
```

インスティンクトを分析し、関連するものを上位構造へまとめる:
- **コマンド**: ユーザーが明示的に呼び出す行動を表す場合
- **スキル**: 自動トリガーされる振る舞いを表す場合
- **エージェント**: 複雑で多段のプロセスを表す場合

## 使用方法

```
/evolve                    # すべてのインスティンクトを解析して進化候補を提案
/evolve --domain testing   # testing ドメインだけを進化
/evolve --dry-run          # 作成せずに提案だけ表示
/evolve --threshold 5      # 関連インスティンクトが 5 件以上でクラスター化
```

## 進化ルール

### → Command（ユーザーが呼び出す）
ユーザーが明示的に依頼しそうな行動をインスティンクトが示す場合:
- 「ユーザーが〜と依頼したら」のようなインスティンクトが複数ある
- 「新しい X を作るとき」のようなトリガーがある
- 反復可能な一連の手順になっている

例:
- `new-table-step1`: 「テーブル追加時は migration を作る」
- `new-table-step2`: 「テーブル追加時は schema を更新する」
- `new-table-step3`: 「テーブル追加時は types を再生成する」

→ 作成されるもの: `/new-table` コマンド

### → Skill（自動トリガー）
自動的に実行されるべき振る舞いをインスティンクトが示す場合:
- パターンマッチで発火するトリガー
- エラーハンドリングの応答
- コードスタイルの強制

例:
- `prefer-functional`: 「関数を書くときは関数型を優先」
- `use-immutable`: 「状態変更では immutable パターンを使う」
- `avoid-classes`: 「モジュール設計では class を避ける」

→ 作成されるもの: `functional-patterns` スキル

### → Agent（深さ / 隔離が必要）
複雑で多段のプロセスをインスティンクトが示す場合:
- デバッグのワークフロー
- リファクタの手順
- リサーチ系のタスク

例:
- `debug-step1`: 「デバッグ時はまずログを確認」
- `debug-step2`: 「デバッグ時は障害コンポーネントを切り分け」
- `debug-step3`: 「デバッグ時は最小再現を作成」
- `debug-step4`: 「デバッグ時はテストで修正を検証」

→ 作成されるもの: `debugger` エージェント

## やること

1. `~/.claude/homunculus/instincts/` から全インスティンクトを読み込む
2. 次の観点でグルーピングする:
   - ドメインの近さ
   - トリガー パターンの重なり
   - アクションの連続性
3. 関連インスティンクトが 3 件以上あるクラスターごとに:
   - 進化タイプ（command/skill/agent）を決定
   - 対応するファイルを生成
   - `~/.claude/homunculus/evolved/{commands,skills,agents}/` に保存
4. 進化した構造と元インスティンクトを紐づける

## 出力フォーマット

```
🧬 Evolve 分析
==================

進化対象のクラスターを 3 件検出:

## クラスター 1: データベース移行ワークフロー
インスティンクト: new-table-migration, update-schema, regenerate-types
タイプ: Command
信頼度: 85%（12 件の観測に基づく）

作成予定: /new-table コマンド
ファイル:
  - ~/.claude/homunculus/evolved/commands/new-table.md

## クラスター 2: 関数型コードスタイル
インスティンクト: prefer-functional, use-immutable, avoid-classes, pure-functions
タイプ: Skill
信頼度: 78%（8 件の観測に基づく）

作成予定: functional-patterns スキル
ファイル:
  - ~/.claude/homunculus/evolved/skills/functional-patterns.md

## クラスター 3: デバッグ プロセス
インスティンクト: debug-check-logs, debug-isolate, debug-reproduce, debug-verify
タイプ: Agent
信頼度: 72%（6 件の観測に基づく）

作成予定: debugger エージェント
ファイル:
  - ~/.claude/homunculus/evolved/agents/debugger.md

---
これらのファイルを作成するには `/evolve --execute` を実行する。
```

## フラグ

- `--execute`: 進化構造を実際に作成（デフォルトはプレビュー）
- `--dry-run`: 作成せずにプレビュー
- `--domain <name>`: 指定ドメインのインスティンクトのみ進化
- `--threshold <n>`: クラスター化に必要な最小インスティンクト数（デフォルト: 3）
- `--type <command|skill|agent>`: 指定タイプだけを作成

## 生成ファイル フォーマット

### Command
```markdown
---
name: new-table
description: 新しいデータベース テーブルを作成し、マイグレーション / スキーマ更新 / 型生成を実行
command: /new-table
evolved_from:
  - new-table-migration
  - update-schema
  - regenerate-types
---

# New Table コマンド

[クラスター化されたインスティンクトに基づき生成された内容]

## 手順
1. ...
2. ...
```

### Skill
```markdown
---
name: functional-patterns
description: 関数型プログラミング パターンを強制
evolved_from:
  - prefer-functional
  - use-immutable
  - avoid-classes
---

# Functional Patterns スキル

[クラスター化されたインスティンクトに基づき生成された内容]
```

### Agent
```markdown
---
name: debugger
description: 体系的なデバッグ エージェント
model: sonnet
evolved_from:
  - debug-check-logs
  - debug-isolate
  - debug-reproduce
---

# Debugger エージェント

[クラスター化されたインスティンクトに基づき生成された内容]
```
