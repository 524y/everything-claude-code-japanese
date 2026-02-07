# Workflow - マルチモデル協調開発

マルチモデル協調開発ワークフロー（Research → Ideation → Plan → Execute → Optimize → Review）。Frontend は Gemini、Backend は Codex へルーティングする。

品質ゲート、MCP サービス、マルチモデル連携を含む構造化フロー。

## Usage

```bash
/workflow <task description>
```

## Context

- 開発タスク: $ARGUMENTS
- 品質ゲート付き 6 フェーズワークフロー
- マルチモデル連携: Codex（backend）+ Gemini（frontend）+ Claude（orchestration）
- 拡張機能として ace-tool MCP を利用

## Your Role

あなたは **Orchestrator** として、マルチモデル協調システムを調整する。経験者向けに簡潔かつ実務的にコミュニケーションする。

**Collaborative Models**:
- **ace-tool MCP** – コード検索 + プロンプト拡張
- **Codex** – バックエンドロジック、アルゴリズム、デバッグ（**Backend authority**）
- **Gemini** – フロントエンド UI / UX、視覚設計（**Frontend expert**）
- **Claude (self)** – オーケストレーション、計画、実行、納品

---

## Multi-Model Call Specification

**Call syntax**（parallel: `run_in_background: true`, sequential: `false`）:

```
# New session call
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}- \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context and analysis from previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Brief description"
})

# Resume session call
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}resume <SESSION_ID> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context and analysis from previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Brief description"
})
```

**Model Parameter Notes**:
- `{{GEMINI_MODEL_FLAG}}`: gemini 使用時は `--gemini-model gemini-3-pro-preview `（末尾スペース維持）、codex は空文字

**Role Prompts**:

| Phase | Codex | Gemini |
|-------|-------|--------|
| Analysis | `~/.claude/.ccg/prompts/codex/analyzer.md` | `~/.claude/.ccg/prompts/gemini/analyzer.md` |
| Planning | `~/.claude/.ccg/prompts/codex/architect.md` | `~/.claude/.ccg/prompts/gemini/architect.md` |
| Review | `~/.claude/.ccg/prompts/codex/reviewer.md` | `~/.claude/.ccg/prompts/gemini/reviewer.md` |

**Session Reuse**: 各呼び出しは `SESSION_ID: xxx` を返す。後続フェーズは `resume xxx` を使う（`--resume` ではない）。

**Parallel Calls**: `run_in_background: true` で開始し、`TaskOutput` で待機。**全モデル完了前に次フェーズへ進まない**。

**Wait for Background Tasks**（最大 600000ms = 10 分）:

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**IMPORTANT**:
- `timeout: 600000` を必ず指定
- 10 分超なら `TaskOutput` で継続ポーリングし、**絶対に kill しない**
- timeout で待機継続不能なら、**`AskUserQuestion` で継続 / kill を確認する**

---

## Communication Guidelines

1. 返答は `[Mode: X]` で開始（初期値 `[Mode: Research]`）
2. `Research → Ideation → Plan → Execute → Optimize → Review` を厳守
3. 各フェーズ完了時にユーザー確認を求める
4. スコア < 7 または未承認なら強制停止
5. 必要時は `AskUserQuestion` を使う

---

## Execution Workflow

**Task Description**: $ARGUMENTS

### Phase 1: Research & Analysis

`[Mode: Research]`

1. **Prompt Enhancement**: `mcp__ace-tool__enhance_prompt` を呼び、以降の呼び出しは拡張要件を使う
2. **Context Retrieval**: `mcp__ace-tool__search_context`
3. **Requirement Completeness Score**（0-10）:
   - 目標明確性（0-3）、期待成果（0-3）、スコープ境界（0-2）、制約（0-2）
   - 7 以上で継続、7 未満で停止して追加質問

### Phase 2: Solution Ideation

`[Mode: Ideation]`

**並列呼び出し**（`run_in_background: true`）:
- Codex: 技術実現性、解決案、リスク
- Gemini: UI 実現性、解決案、UX 評価

`TaskOutput` で待機し、`CODEX_SESSION` / `GEMINI_SESSION` を保存する。

両分析を統合して最低 2 案を提示し、ユーザー選択を待つ。

### Phase 3: Detailed Planning

`[Mode: Plan]`

**並列呼び出し**（`resume <SESSION_ID>`）:
- Codex: backend 設計
- Gemini: frontend 設計

`TaskOutput` で待機。

Claude が Codex backend 計画 + Gemini frontend 計画を統合し、承認後 `.claude/plan/task-name.md` へ保存する。

### Phase 4: Implementation

`[Mode: Execute]`

- 承認済み計画に厳密に従う
- 既存コード規約を遵守
- 主要マイルストーンでフィードバックを取る

### Phase 5: Code Optimization

`[Mode: Optimize]`

**並列レビュー**:
- Codex: セキュリティ、性能、エラーハンドリング
- Gemini: アクセシビリティ、デザイン整合性

`TaskOutput` で待機し、レビュー結果を統合して修正する。

### Phase 6: Quality Review

`[Mode: Review]`

- 計画との整合確認
- テスト実行で機能検証
- 課題と推奨事項を報告
- 最終確認をユーザーに依頼

---

## Key Rules

1. フェーズ順序はスキップ不可（ユーザー明示指示がある場合を除く）
2. 外部モデルに filesystem 書き込み権限は **ゼロ**
3. スコア < 7 または未承認なら **強制停止**
