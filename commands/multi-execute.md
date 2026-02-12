# Execute - マルチモデル協調実行

マルチモデル協調実行。計画からプロトタイプ取得 → Claude がリファクタして実装 → マルチモデル監査と納品。

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: ツール / モデルとのやり取りは **English**、ユーザーへの返答はユーザー言語
- **Code Sovereignty**: 外部モデルに filesystem 書き込み権限は **ゼロ**、変更はすべて Claude が実施
- **Dirty Prototype Refactoring**: Codex / Gemini の Unified Diff は「粗いプロトタイプ」と見なし、本番品質へ必ずリファクタ
- **Stop-Loss Mechanism**: 現フェーズの出力検証前に次フェーズへ進まない
- **Prerequisite**: `/ccg:plan` 出力にユーザーが明示的に "Y" 返信した後のみ実行（不明なら要確認）

---

## Multi-Model Call Specification

**Call Syntax**（並列時は `run_in_background: true`）:

```
# Resume session call (recommended) - Implementation Prototype
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}resume <SESSION_ID> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <task description>
Context: <plan content + target files>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Brief description"
})

# New session call - Implementation Prototype
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}- \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <task description>
Context: <plan content + target files>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Brief description"
})
```

**Audit Call Syntax**（Code Review / Audit）:

```
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}resume <SESSION_ID> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Scope: Audit the final code changes.
Inputs:
- The applied patch (git diff / final unified diff)
- The touched files (relevant excerpts if needed)
Constraints:
- Do NOT modify any files.
- Do NOT output tool commands that assume filesystem access.
</TASK>
OUTPUT:
1) A prioritized list of issues (severity, file, rationale)
2) Concrete fixes; if code changes are needed, include a Unified Diff Patch in a fenced code block.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Brief description"
})
```

**Model Parameter Notes**:
- `{{GEMINI_MODEL_FLAG}}`: `--backend gemini` の場合 `--gemini-model gemini-3-pro-preview` を指定する（末尾に半角スペースが必要）。codex は空文字。

**Role Prompts**:

| Phase | Codex | Gemini |
|-------|-------|--------|
| Implementation | `~/.claude/.ccg/prompts/codex/architect.md` | `~/.claude/.ccg/prompts/gemini/frontend.md` |
| Review | `~/.claude/.ccg/prompts/codex/reviewer.md` | `~/.claude/.ccg/prompts/gemini/reviewer.md` |

**Session Reuse**: `/ccg:plan` が SESSION_ID を提供している場合、`resume <SESSION_ID>` で文脈を再利用する。

**Wait for Background Tasks**（最大 600000ms = 10 分）:

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**IMPORTANT**:
- `timeout: 600000` を必ず指定する（既定 30 秒での早期 timeout を防ぐ）
- 10 分で未完了なら `TaskOutput` を継続ポーリングし、**絶対に kill しない**
- timeout により待機継続不能なら、**`AskUserQuestion` で待機継続か kill かを必ず確認**

---

## Execution Workflow

**Execute Task**: $ARGUMENTS

### Phase 0: Read Plan

`[Mode: Prepare]`

1. **入力種別の特定**:
   - 計画ファイルパス（例: `.claude/plan/xxx.md`）
   - 直接のタスク記述

2. **計画内容の読込**:
   - 計画ファイルがあれば読み込み・解析
   - タスク種別、実装手順、キー files、SESSION_ID を抽出

3. **実行前確認**:
   - 入力が直接タスク記述、または計画に `SESSION_ID` / キー files が無い場合は事前確認
   - ユーザーが plan に "Y" 返信済みと確認できない場合は再確認

4. **Task Type Routing**:

   | Task Type | Detection | Route |
   |-----------|-----------|-------|
   | **Frontend** | Pages, components, UI, styles, layout | Gemini |
   | **Backend** | API, interfaces, database, logic, algorithms | Codex |
   | **Fullstack** | Contains both frontend and backend | Codex ∥ Gemini parallel |

---

### Phase 1: Quick Context Retrieval

`[Mode: Retrieval]`

**高速な文脈取得に MCP を必ず使い、ファイルを手作業で順番に読まないこと**

計画の "Key Files" を基に `mcp__ace-tool__search_context` を呼ぶ:

```
mcp__ace-tool__search_context({
  query: "<semantic query based on plan content, including key files, modules, function names>",
  project_root_path: "$PWD"
})
```

**Retrieval Strategy**:
- "Key Files" 表から対象パスを抽出
- エントリファイル、依存モジュール、関連 type 定義を含む semantic query を組み立てる
- 不足時は 1-2 回の再帰取得を追加
- プロジェクト探索に Bash + find / ls を **使わない**

**取得後**:
- 取得コード断片を整理
- 実装に必要な文脈が揃っていることを確認
- Phase 3 へ進む

---

### Phase 3: Prototype Acquisition

`[Mode: Prototype]`

**タスク種別ごとにルーティング**:

#### Route A: Frontend / UI / Styles → Gemini

**上限**: Context < 32k tokens

1. Gemini を呼ぶ（`~/.claude/.ccg/prompts/gemini/frontend.md`）
2. 入力: 計画内容 + 取得コンテキスト + 対象 files
3. OUTPUT: `Unified Diff Patch ONLY. Strictly prohibit any actual modifications.`
4. **Gemini はフロントエンド設計の権威。CSS / React / Vue の提案を最終視覚基準とする**
5. **WARNING**: Gemini のバックエンドロジック提案は採用しない
6. 計画に `GEMINI_SESSION` がある場合は `resume <GEMINI_SESSION>` を優先

#### Route B: Backend / Logic / Algorithms → Codex

1. Codex を呼ぶ（`~/.claude/.ccg/prompts/codex/architect.md`）
2. 入力: 計画内容 + 取得コンテキスト + 対象 files
3. OUTPUT: `Unified Diff Patch ONLY. Strictly prohibit any actual modifications.`
4. **Codex はバックエンドロジックの権威。論理推論とデバッグ能力を活用する**
5. 計画に `CODEX_SESSION` がある場合は `resume <CODEX_SESSION>` を優先

#### Route C: Fullstack → Parallel Calls

1. **並列呼び出し**（`run_in_background: true`）:
   - Gemini: フロントエンド担当
   - Codex: バックエンド担当
2. `TaskOutput` で双方完了を待つ
3. 計画中の対応 `SESSION_ID` を使って `resume`（無い場合は新規）

**上記 Multi-Model Call Specification の `IMPORTANT` を必ず順守すること**

---

### Phase 4: Code Implementation

`[Mode: Implement]`

**Code Sovereign として Claude が以下を実行**:

1. **Diff 読み取り**: Codex / Gemini の Unified Diff Patch を解析
2. **Mental Sandbox**:
   - 対象 files へ適用を頭の中でシミュレーション
   - 論理整合性を確認
   - 競合や副作用を検出
3. **Refactor and Clean**:
   - 粗いプロトタイプを **可読性・保守性・本番品質** のコードへリファクタ
   - 冗長コードを除去
   - 既存規約へ準拠
   - **必要でない限りコメント / docs を追加しない**
4. **Minimal Scope**:
   - 要件スコープ内のみ変更
   - 副作用の **必須レビュー**
   - ピンポイント修正
5. **Apply Changes**:
   - Edit / Write ツールで実変更を適用
   - **必要最小限のみ変更し、既存機能を壊さない**
6. **Self-Verification**（強く推奨）:
   - lint / typecheck / tests を既存設定で実行（関連最小範囲を優先）
   - 失敗時は回帰を先に修正してから Phase 5 へ

---

### Phase 5: Audit and Delivery

`[Mode: Audit]`

#### 5.1 Automatic Audit

**変更適用後、Codex と Gemini に並列で Code Review を即時実行すること（必須）**:

1. **Codex Review**（`run_in_background: true`）:
   - ROLE_FILE: `~/.claude/.ccg/prompts/codex/reviewer.md`
   - Input: 変更 Diff + 対象 files
   - Focus: セキュリティ、性能、エラーハンドリング、ロジック正当性

2. **Gemini Review**（`run_in_background: true`）:
   - ROLE_FILE: `~/.claude/.ccg/prompts/gemini/reviewer.md`
   - Input: 変更 Diff + 対象 files
   - Focus: アクセシビリティ、デザイン整合性、UX

`TaskOutput` で双方レビュー完了を待つ。Phase 3 のセッション（`resume <SESSION_ID>`）再利用を優先する。

#### 5.2 Integrate and Fix

1. Codex + Gemini のレビューを統合
2. 信頼ルールで重み付け（Backend は Codex、Frontend は Gemini）
3. 必要修正を実施
4. 必要に応じて 5.1 を再実行（許容リスクまで）

#### 5.3 Delivery Confirmation

監査通過後は次形式で報告:

```markdown
## Execution Complete

### Change Summary
| File | Operation | Description |
|------|-----------|-------------|
| path/to/file.ts | Modified | Description |

### Audit Results
- Codex: <Passed/Found N issues>
- Gemini: <Passed/Found N issues>

### Recommendations
1. [ ] <Suggested test steps>
2. [ ] <Suggested verification steps>
```

---

## Key Rules

1. **Code Sovereignty** – 変更はすべて Claude。外部モデルの書き込み権限はゼロ
2. **Dirty Prototype Refactoring** – 外部モデル出力は草案として扱い、必ずリファクタ
3. **Trust Rules** – Backend は Codex、Frontend は Gemini
4. **Minimal Changes** – 必要最小限の変更で副作用を抑える
5. **Mandatory Audit** – 変更後にマルチモデル Code Review を必ず実施

---

## Usage

```bash
# Execute plan file
/ccg:execute .claude/plan/feature-name.md

# Execute task directly (for plans already discussed in context)
/ccg:execute implement user authentication based on previous plan
```

---

## Relationship with /ccg:plan

1. `/ccg:plan` が計画と SESSION_ID を生成
2. ユーザーが "Y" で承認
3. `/ccg:execute` が計画を読み、SESSION_ID を再利用して実装
