# Everything Claude Code ロングフォームガイド

![Header: The Longform Guide to Everything Claude Code](./assets/images/longform/01-header.png)

---

> **前提条件**: このガイドは [Everything Claude Code ショートフォームガイド](./the-shortform-guide.md) を前提にしている。スキル、フック、サブエージェント、MCP、プラグインを設定していない場合は先に読むこと。

![Reference to Shorthand Guide](./assets/images/longform/02-shortform-reference.png)
*ショートフォームガイド - 先に読むこと*

ショートフォームガイドでは、基礎的なセットアップを扱った。スキルとコマンド、フック、サブエージェント、MCP、プラグイン、そして Claude Code ワークフローの背骨となる設定パターンである。これはセットアップガイドであり、基盤のインフラである。

このロングフォームガイドでは、成果が出るセッションと無駄なセッションを分ける技術に踏み込む。ショートフォームガイドを読んでいないなら、先に戻って設定を完了してほしい。ここから先はスキル、エージェント、フック、MCP がすでに設定され、動作していることを前提とする。

ここで扱うテーマは、トークン経済、メモリ永続化、検証パターン、並列化戦略、再利用可能なワークフローを構築することで生まれる複利効果である。ここにあるパターンは、日次の利用を 10+ か月続けて洗練したものであり、最初の 1 時間でコンテキスト劣化に悩む状態と、数時間にわたって生産性を維持できる状態の差を生む。

ショートフォーム / ロングフォーム両ガイドの内容は GitHub の `github.com/affaan-m/everything-claude-code` に公開されている。

---

## Tips and Tricks

### MCP は置き換えられるものがある。コンテキストウィンドウを節約できる

バージョン管理 (GitHub)、データベース (Supabase)、デプロイ (Vercel, Railway) などの MCP は、多くが既存 CLI をラップしているだけである。MCP は便利なラッパーだが、その分コストがある。

MCP を使わずに CLI を MCP っぽく動かしたい場合は、機能をスキルとコマンドに束ねるとよい。MCP が公開している「便利にするためのツール」を削ぎ落とし、それらをコマンド化する。

例: GitHub MCP を常時ロードするのではなく、`gh pr create` を好みのオプションでラップした `/gh-pr` コマンドを作る。Supabase MCP のコンテキスト消費を避けるなら、Supabase CLI を直接使うスキルを作る。

遅延読み込みを使えば、コンテキストウィンドウの問題はほぼ解決できる。しかしトークン使用量とコストは同じ方法では解決しない。CLI + スキルのアプローチは、今でもトークン最適化の有効な方法である。

---

## 重要事項

### コンテキストとメモリ管理

セッション間でメモリを共有するなら、進捗を要約して確認し、`.claude` フォルダの `.tmp` ファイルに保存し、セッション終了まで追記するスキルやコマンドが最善である。翌日はそのファイルをコンテキストとして使い、続きから再開する。古いコンテキストが新しい作業に混ざらないよう、セッションごとに新しいファイルを作ること。

![Session Storage File Tree](./assets/images/longform/03-session-storage.png)
*セッション保存の例 -> https://github.com/affaan-m/everything-claude-code/tree/main/examples/sessions*

Claude が現在状態の要約ファイルを作成する。必要ならレビューし、修正を依頼してから新しいセッションを開始する。新しい会話では、そのファイルパスを渡せばよい。特に、コンテキスト上限に到達して複雑な作業を続ける必要がある場合に有効である。これらのファイルに含めるべき内容:
- うまくいったアプローチ (証拠付きで検証できること)
- 試したがうまくいかなかったアプローチ
- まだ試していないアプローチと残タスク

**戦略的なコンテキストクリア:**

計画を確定し、コンテキストをクリアしたら (Claude Code の plan mode のデフォルトでもある)、その計画に沿って作業を進められる。実行フェーズに不要な探索コンテキストが大量に積み上がったときに有効である。戦略的コンパクトを行うなら、自動コンパクトを無効化し、論理的な区切りで手動コンパクトするか、専用スキルを作る。

**高度: 動的システムプロンプト注入**

気づいたパターンの 1 つは、CLAUDE.md (ユーザースコープ) や `.claude/rules/` (プロジェクトスコープ) にすべてを置くのではなく、CLI フラグで動的にコンテキストを注入する方法である。これらは毎回ロードされる。

```bash
claude --system-prompt "$(cat memory.md)"
```

これにより、どのコンテキストをいつ読み込むかを精密に制御できる。システムプロンプトはユーザーメッセージより優先度が高く、ユーザーメッセージはツール結果より優先度が高い。

**実用的な設定:**

```bash
# 日次開発
alias claude-dev='claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"'

# PR レビューモード
alias claude-review='claude --system-prompt "$(cat ~/.claude/contexts/review.md)"'

# リサーチ / 探索モード
alias claude-research='claude --system-prompt "$(cat ~/.claude/contexts/research.md)"'
```

**高度: メモリ永続フック**

多くの人が知らないメモリ向けフックがある:

- **PreCompact フック**: コンテキスト圧縮の前に重要な状態をファイルへ保存する
- **Stop フック (Session End)**: セッション終了時に学びをファイルへ永続化する
- **SessionStart フック**: 新しいセッションで以前のコンテキストを自動ロードする

これらのフックは構築済みで、`github.com/affaan-m/everything-claude-code/tree/main/hooks/memory-persistence` にある。

---

### 継続学習 / メモリ

同じプロンプトを何度も繰り返し、Claude が同じ問題にぶつかったり、前に見た回答を返してきた場合、そのパターンはスキルに追記すべきである。

**問題:** トークンの浪費、コンテキストの浪費、時間の浪費。

**解決策:** Claude Code が自明ではないものを発見したら (デバッグ手法、回避策、プロジェクト固有パターンなど)、その知識を新しいスキルとして保存する。次に似た問題が来たとき、そのスキルが自動でロードされる。

これを実現する継続学習スキルがある: `github.com/affaan-m/everything-claude-code/tree/main/skills/continuous-learning`

**Stop フックを使う理由 (UserPromptSubmit ではない):**

設計上の重要な判断は **Stop フック** を使うことにある。UserPromptSubmit は全メッセージで動くため、すべてのプロンプトにレイテンシを追加する。Stop はセッション終了時に 1 回だけ動くため軽量で、セッション中の体験を遅くしない。

---

### トークン最適化

**主戦略: サブエージェントアーキテクチャ**

使うツールを最適化し、タスクに十分な最小コストのモデルへ委譲するよう設計されたサブエージェントアーキテクチャを構築する。

**モデル選定クイックリファレンス:**

![Model Selection Table](./assets/images/longform/04-model-selection.png)
*一般的なタスクに対するサブエージェント構成の仮説例と、その選択理由*

| タスク種別                | モデル | 理由                                           |
| ------------------------- | ------ | ---------------------------------------------- |
| 探索 / 検索               | Haiku  | 速い、安い、ファイル探索に十分                 |
| シンプル編集              | Haiku  | 単一ファイル変更、指示が明確                   |
| 複数ファイル実装          | Sonnet | コーディングのバランスが良い                   |
| 複雑なアーキテクチャ      | Opus   | 深い推論が必要                                 |
| PR レビュー               | Sonnet | コンテキスト理解とニュアンス把握               |
| セキュリティ分析          | Opus   | 脆弱性を見逃せない                             |
| ドキュメント作成          | Haiku  | 構造が単純                                     |
| 複雑バグのデバッグ         | Opus   | システム全体を保持する必要がある               |

コーディングタスクの 90% は Sonnet をデフォルトにする。最初の試みが失敗したとき、タスクが 5+ ファイルにまたがるとき、アーキテクチャ判断が必要なとき、セキュリティクリティカルなコードのときは Opus に上げる。

**料金リファレンス:**

![Claude Model Pricing](./assets/images/longform/05-pricing-table.png)
*Source: https://platform.claude.com/docs/en/about-claude/pricing*

**ツール別の最適化:**

grep を mgrep に置き換えると、従来の grep や ripgrep と比べて平均で ~50% のトークン削減になる:

![mgrep Benchmark](./assets/images/longform/06-mgrep-benchmark.png)
*50 タスクのベンチマークでは、mgrep + Claude Code が grep ベースのワークフローに比べて ~2 倍少ないトークンで、同等かそれ以上の品質を実現した。Source: https://github.com/mixedbread-ai/mgrep*

**モジュール化されたコードベースの利点:**

メインファイルを数千行ではなく数百行に抑えるようなモジュール化されたコードベースは、トークン最適化コストにも、最初の試行でタスクを正しく完了させる点にも有利である。

---

### 検証ループと eval

**ベンチマークワークフロー:**

スキル有無で同じ依頼を比較し、出力差分を確認する:

会話をフォークし、片方ではスキルなしの新しい worktree を起動する。最後に diff を見て、何が記録されたかを確認する。

**Eval パターンの種類:**

- **チェックポイント型 Eval**: 明示的なチェックポイントを設定し、定義済み基準で検証し、先に進む前に修正する
- **継続的 Eval**: N 分ごと、または大きな変更の後に実行する。フルテストスイート + lint

**主要指標:**

```
pass@k: k 回の試行のうち少なくとも 1 回成功
        k=1: 70%  k=3: 91%  k=5: 97%

pass^k: k 回の試行がすべて成功
        k=1: 70%  k=3: 34%  k=5: 17%
```

とにかく動けばよいときは **pass@k** を使う。安定性が重要なときは **pass^k** を使う。

---

## 並列化

マルチ Claude ターミナルで会話をフォークするときは、フォーク先と元の会話で行う作業のスコープを明確にする。コード変更に関しては、できるだけ重ならないようにする。

**推奨パターン:**

メインチャットはコード変更用、フォークはコードベースや現状に関する質問、外部サービスの調査に使う。

**任意のターミナル数について:**

![Boris on Parallel Terminals](./assets/images/longform/07-boris-parallel.png)
*Boris (Anthropic) による複数 Claude インスタンス運用*

Boris は並列化についてのヒントを持っている。5 つの Claude インスタンスをローカルで動かし、さらに 5 つを上流で動かすような提案もある。私は任意のターミナル数を設定することには反対である。ターミナルの追加は本当に必要なときにだけ行うべきだ。

目的は **最小限の並列化でどれだけの成果を出せるか** である。

**並列インスタンスの Git worktree:**

```bash
# 並列作業用の worktree を作成する
git worktree add ../project-feature-a feature-a
git worktree add ../project-feature-b feature-b
git worktree add ../project-refactor refactor-branch

# 各 worktree ごとに Claude インスタンスを起動する
cd ../project-feature-a && claude
```
