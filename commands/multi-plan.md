# Plan - マルチモデル協調プランニング

マルチモデル協調プランニング。Context 取得 + 2 モデル分析で、段階的な実装計画を生成する。

$ARGUMENTS

---

## Core Protocols

- **Language Protocol**: ツール / モデルとは **English**、ユーザーにはユーザー言語で返答
- **Mandatory Parallel**: Codex / Gemini 呼び出しは `run_in_background: true` を必須（単一モデルでも同様）
- **Code Sovereignty**: 外部モデルの filesystem 書き込み権限は **ゼロ**
- **Stop-Loss Mechanism**: 現フェーズの検証前に次フェーズへ進まない
- **Planning Only**: 文脈読込と `.claude/plan/*` への書き込みのみ許可。本番コードは **絶対に変更しない**

---

## Multi-Model Call Specification

**Call Syntax**（並列は `run_in_background: true`）:

```
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|gemini> {{GEMINI_MODEL_FLAG}}- \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement>
Context: <retrieved project context>
</TASK>
OUTPUT: Step-by-step implementation plan with pseudo-code. DO NOT modify any files.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Brief description"
})
```

**Model Parameter Notes**:
- `{{GEMINI_MODEL_FLAG}}`: `--backend gemini` のとき `--gemini-model gemini-3-pro-preview ` を指定（末尾スペース維持）。codex は空文字。

**Role Prompts**:

| Phase | Codex | Gemini |
|-------|-------|--------|
| Analysis | `~/.claude/.ccg/prompts/codex/analyzer.md` | `~/.claude/.ccg/prompts/gemini/analyzer.md` |
| Planning | `~/.claude/.ccg/prompts/codex/architect.md` | `~/.claude/.ccg/prompts/gemini/architect.md` |

**Session Reuse**: 各呼び出しは `SESSION_ID: xxx` を返す。後続 `/ccg:execute` 用に **必ず保存**する。

**Wait for Background Tasks**（最大 600000ms = 10 分）:

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**IMPORTANT**:
- `timeout: 600000` を必ず指定
- 10 分超なら `TaskOutput` でポーリング継続し、**絶対に kill しない**
- timeout で待機継続不能なら、**`AskUserQuestion` で待機継続か kill かを必ず確認**

---

## Execution Workflow

**Planning Task**: $ARGUMENTS

### Phase 1: Full Context Retrieval

`[Mode: Research]`

#### 1.1 Prompt Enhancement（最初に必須実行）

**`mcp__ace-tool__enhance_prompt` を必ず呼ぶ**:

```
mcp__ace-tool__enhance_prompt({
  prompt: "$ARGUMENTS",
  conversation_history: "<last 5-10 conversation turns>",
  project_root_path: "$PWD"
})
```

拡張結果を待ち、**以降は元の $ARGUMENTS ではなく拡張結果を使用**する。

#### 1.2 Context Retrieval

**`mcp__ace-tool__search_context` を呼ぶ**:

```
mcp__ace-tool__search_context({
  query: "<semantic query based on enhanced requirement>",
  project_root_path: "$PWD"
})
```

- 自然言語（Where / What / How）で semantic query を構築
- **推測ベースで回答しない**
- MCP が使えない場合は Glob + Grep へフォールバック

#### 1.3 Completeness Check

- 関連クラス / 関数 / 変数の **完全な定義とシグネチャ** を取得する
- 文脈不足なら **再帰取得** を実行
- 出力は「entry file + line number + key symbol」を優先し、必要最小限のコード断片のみ添付

#### 1.4 Requirement Alignment

- 要件の曖昧さが残る場合は、**必ず** ユーザー向け確認質問を出す
- 境界が明確になるまで継続（不足なし、重複なし）

### Phase 2: Multi-Model Collaborative Analysis

`[Mode: Analysis]`

#### 2.1 Distribute Inputs

**Codex と Gemini を並列呼び出し**（`run_in_background: true`）:

先入観なしの **元要件** を両モデルへ配る。

1. **Codex Backend Analysis**:
   - ROLE_FILE: `~/.claude/.ccg/prompts/codex/analyzer.md`
   - Focus: 技術実現性、設計影響、性能考慮、潜在リスク
   - OUTPUT: 複数案 + pros/cons

2. **Gemini Frontend Analysis**:
   - ROLE_FILE: `~/.claude/.ccg/prompts/gemini/analyzer.md`
   - Focus: UI / UX 影響、ユーザー体験、視覚設計
   - OUTPUT: 複数案 + pros/cons

`TaskOutput` で双方完了を待ち、`CODEX_SESSION` と `GEMINI_SESSION` を保存する。

#### 2.2 Cross-Validation

統合時は次を実施:

1. **合意点** を抽出（強いシグナル）
2. **相違点** を抽出（要判断）
3. **相補性** を活用（Backend は Codex、Frontend は Gemini）
4. **論理検証** で穴を潰す

#### 2.3（任意推奨）Dual-Model Plan Draft

Claude 統合案の抜け漏れを減らすため、両モデルに計画草案出力を依頼できる（**ファイル変更は禁止**）:

1. **Codex Plan Draft**（Backend authority）
2. **Gemini Plan Draft**（Frontend authority）

`TaskOutput` で双方完了を待ち、提案差分を記録する。

#### 2.4 Generate Implementation Plan（Claude 最終版）

2 モデル分析を統合し、**Step-by-step Implementation Plan** を生成する。

### Phase 2 End: Plan Delivery（実装しない）

**`/ccg:plan` はここで終了し、以下を必ず実施**:

1. 擬似コードを含む実装計画をユーザーへ提示
2. `.claude/plan/<feature-name>.md` に保存
3. 太字で次案内を出す（保存実パスを使用）:

   ---
   **Plan generated and saved to `.claude/plan/actual-feature-name.md`**

   **Please review the plan above. You can:**
   - **Modify plan**: Tell me what needs adjustment, I'll update the plan
   - **Execute plan**: Copy the following command to a new session

   ```
   /ccg:execute .claude/plan/actual-feature-name.md
   ```
   ---

4. **即時に応答終了**（ここで停止、追加 tool call なし）

**ABSOLUTELY FORBIDDEN**:
- Y / N を聞いて自動実行
- 本番コードへの書き込み
- `/ccg:execute` の自動起動
- ユーザー未依頼の追加モデル呼び出し

---

## Plan Saving

- 初回: `.claude/plan/<feature-name>.md`
- 改訂: `.claude/plan/<feature-name>-v2.md`, `-v3.md` ...

保存を完了してからユーザーへ提示する。

---

## Plan Modification Flow

1. フィードバックに基づき計画更新
2. `.claude/plan/<feature-name>.md` を更新
3. 再提示
4. 再レビューまたは実行を促す

---

## Next Steps

ユーザー承認後、手動で次を実行:

```bash
/ccg:execute .claude/plan/<feature-name>.md
```

---

## Key Rules

1. **Plan only, no implementation**
2. **No Y/N prompts**（計画提示のみ）
3. **Trust Rules**（Backend は Codex、Frontend は Gemini）
4. 外部モデルに filesystem 書き込み権限は **ゼロ**
5. **SESSION_ID Handoff**（末尾に `CODEX_SESSION` / `GEMINI_SESSION` を必ず含める）
