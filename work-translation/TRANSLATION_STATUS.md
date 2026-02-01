# 翻訳進捗

## 目的
このファイルは、翻訳の進捗とセッションごとの作業内容を記録する。

## 記録ルール
- セッションごとに追記する
- 対象ファイル一覧を必ず書く
- 未完了がある場合は理由を書く
- 用語表の更新有無を明記する
- 次セッションの開始点を 1 行で示す

## セッションログ

### セッション 1
- 対象ファイル一覧: `UNTRANSLATED_FILES.md` を 参照する
- 完了 / 未完了: 未完了（翻訳 未着手）
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: 形式維持 ルール と コードブロック 非翻訳 を厳守する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` から 対象 を 選んで 翻訳 を開始する

### セッション 2
- 対象ファイル一覧: `en/everything-claude-code/README.md`、`en/everything-claude-code/rules/agents.md`、`en/everything-claude-code/skills/backend-patterns/SKILL.md`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に 追記）
- 翻訳時の注意点: コードブロック 内 は 原文 維持 しつつ コメント は 翻訳 する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` から 次の 対象 を 選ぶ

### セッション 3
- 対象ファイル一覧: `en/everything-claude-code/.claude-plugin/marketplace.json`、`en/everything-claude-code/.claude-plugin/plugin.json`、`en/everything-claude-code/.claude/package-manager.json`、`en/everything-claude-code/CONTRIBUTING.md`、`en/everything-claude-code/agents/architect.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: 日本語同士のスペースを排除し、英語と日本語の間のスペースのみ許可する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 4
- 対象ファイル一覧: `en/everything-claude-code/CONTRIBUTING.md`、`en/everything-claude-code/agents/architect.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: *.md 内の Markdown コードブロックは Markdown ルールに従って翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 5
- 対象ファイル一覧: `en/everything-claude-code/agents/architect.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: Markdown 内の **...** ラベルは翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 6
- 対象ファイル一覧: `en/everything-claude-code/agents/build-error-resolver.md`、`en/everything-claude-code/agents/code-reviewer.md`、`en/everything-claude-code/agents/database-reviewer.md`、`en/everything-claude-code/agents/doc-updater.md`、`en/everything-claude-code/agents/e2e-runner.md`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: Markdown 内の **...** ラベルを翻訳し、*.md 内の Markdown コードブロックは Markdown ルールに従って翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 7
- 対象ファイル一覧: `en/everything-claude-code/agents/build-error-resolver.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: コード内コメントの CORRECT: / WRONG: は原文維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 8
- 対象ファイル一覧: `en/everything-claude-code/agents/build-error-resolver.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: コード内コメントの FIX: / FIX ERROR: は原文維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 9
- 対象ファイル一覧: `en/everything-claude-code/agents/build-error-resolver.md`、`en/everything-claude-code/agents/database-reviewer.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: DB とプログラミング言語の type は原語のまま、SQL でも GOOD/BAD などのキーワードを原文維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 10
- 対象ファイル一覧: `en/everything-claude-code/agents/build-error-resolver.md`、`en/everything-claude-code/agents/database-reviewer.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: データ型名は原語維持し、概念としての「型」は日本語で記載する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 11
- 対象ファイル一覧: `en/everything-claude-code/agents/code-reviewer.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: レビュー出力形式のテンプレ内は本文を日本語化し、ラベル/キーワードは原文維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 12
- 対象ファイル一覧: `en/everything-claude-code/commands/plan.md`、`en/everything-claude-code/commands/verify.md`、`en/everything-claude-code/contexts/review.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: コードブロック内は原文を維持し、テンプレ内のキーワードは原文を維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 13
- 対象ファイル一覧: `en/everything-claude-code/agents/go-build-resolver.md`、`en/everything-claude-code/agents/go-reviewer.md`、`en/everything-claude-code/agents/planner.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: テンプレ内は本文を日本語化し、キーワードは原文を維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 14
- 対象ファイル一覧: `en/everything-claude-code/agents/refactor-cleaner.md`、`en/everything-claude-code/agents/security-reviewer.md`、`en/everything-claude-code/agents/tdd-guide.md`、`en/everything-claude-code/commands/build-fix.md`、`en/everything-claude-code/commands/checkpoint.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: Markdown テンプレ内は本文を日本語化し、キーワードは原文を維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 15
- 対象ファイル一覧: `en/everything-claude-code/commands/code-review.md`、`en/everything-claude-code/commands/e2e.md`、`en/everything-claude-code/commands/eval.md`、`en/everything-claude-code/commands/go-build.md`、`en/everything-claude-code/commands/go-review.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: 使用例のコードブロック内は自然言語を日本語化し、識別子やコマンドは原文維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 16
- 対象ファイル一覧: `en/everything-claude-code/commands/go-test.md`、`en/everything-claude-code/commands/learn.md`、`en/everything-claude-code/commands/orchestrate.md`、`en/everything-claude-code/commands/refactor-clean.md`、`en/everything-claude-code/commands/setup-pm.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: 使用例のコードブロック内は自然言語を日本語化し、識別子やコマンドは原文維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 17
- 対象ファイル一覧: `en/everything-claude-code/commands/tdd.md`、`en/everything-claude-code/commands/test-coverage.md`、`en/everything-claude-code/commands/update-codemaps.md`、`en/everything-claude-code/commands/update-docs.md`、`en/everything-claude-code/contexts/dev.md`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: 日本語同士のスペースを入れず、英語と日本語の間のみスペースを入れる
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 18
- 対象ファイル一覧: `en/everything-claude-code/contexts/research.md`、`en/everything-claude-code/examples/CLAUDE.md`、`en/everything-claude-code/examples/sessions/2026-01-17-debugging-memory.tmp`、`en/everything-claude-code/examples/sessions/2026-01-19-refactor-api.tmp`、`en/everything-claude-code/examples/sessions/2026-01-20-feature-auth.tmp`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: *.tmp のコードブロック内コメントも日本語化する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 19
- 対象ファイル一覧: `en/everything-claude-code/examples/statusline.json`、`en/everything-claude-code/examples/user-CLAUDE.md`、`en/everything-claude-code/hooks/hooks.json`、`en/everything-claude-code/mcp-configs/mcp-servers.json`、`en/everything-claude-code/plugins/README.md`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: *.json は description/comment/title/help の値のみ翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 20
- 対象ファイル一覧: `en/everything-claude-code/rules/coding-style.md`、`en/everything-claude-code/rules/git-workflow.md`、`en/everything-claude-code/rules/hooks.md`、`en/everything-claude-code/rules/patterns.md`、`en/everything-claude-code/rules/performance.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: コードブロック内コメントは翻訳し、キーワードは原文維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 21
- 対象ファイル一覧: `en/everything-claude-code/rules/security.md`、`en/everything-claude-code/rules/testing.md`、`en/everything-claude-code/scripts/hooks/check-console-log.js`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: *.md のコードブロック内コメントのみ翻訳し、*.js はコメントのみ翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 22
- 対象ファイル一覧: `en/everything-claude-code/scripts/hooks/evaluate-session.js`、`en/everything-claude-code/scripts/hooks/pre-compact.js`、`en/everything-claude-code/scripts/hooks/session-end.js`、`en/everything-claude-code/scripts/hooks/session-start.js`、`en/everything-claude-code/scripts/hooks/suggest-compact.js`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: *.js はコメントのみ翻訳し、識別子と文字列は原文維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 23
- 対象ファイル一覧: `en/everything-claude-code/scripts/lib/package-manager.js`、`en/everything-claude-code/scripts/lib/utils.js`、`en/everything-claude-code/scripts/setup-package-manager.js`、`en/everything-claude-code/skills/clickhouse-io/SKILL.md`、`en/everything-claude-code/skills/coding-standards/SKILL.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: *.js はコメントのみ翻訳し、*.md のコードブロック内コメントも翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 24
- 対象ファイル一覧: `en/everything-claude-code/skills/continuous-learning-v2/SKILL.md`、`en/everything-claude-code/skills/continuous-learning-v2/agents/observer.md`、`en/everything-claude-code/skills/continuous-learning-v2/agents/start-observer.sh`、`en/everything-claude-code/skills/continuous-learning-v2/commands/evolve.md`、`en/everything-claude-code/skills/continuous-learning-v2/commands/instinct-export.md`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: *.md のコードブロック内コメントのみ翻訳し、*.sh はコメントのみ翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 25
- 対象ファイル一覧: `en/everything-claude-code/skills/continuous-learning-v2/commands/instinct-import.md`、`en/everything-claude-code/skills/continuous-learning-v2/commands/instinct-status.md`、`en/everything-claude-code/skills/continuous-learning-v2/config.json`、`en/everything-claude-code/skills/continuous-learning-v2/hooks/observe.sh`、`en/everything-claude-code/skills/continuous-learning-v2/scripts/instinct-cli.py`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: *.md のコードブロックは原則として原文維持し、*.sh / *.py はコメントのみ翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 26
- 対象ファイル一覧: `en/everything-claude-code/skills/continuous-learning/SKILL.md`、`en/everything-claude-code/skills/continuous-learning/config.json`、`en/everything-claude-code/skills/continuous-learning/evaluate-session.sh`、`en/everything-claude-code/skills/eval-harness/SKILL.md`、`en/everything-claude-code/skills/frontend-patterns/SKILL.md`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: *.md のコードブロックは原則として原文維持し、テンプレ内の本文とコメントは日本語化する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 27
- 対象ファイル一覧: `en/everything-claude-code/skills/golang-patterns/SKILL.md`、`en/everything-claude-code/skills/golang-testing/SKILL.md`、`en/everything-claude-code/skills/iterative-retrieval/SKILL.md`、`en/everything-claude-code/skills/postgres-patterns/SKILL.md`、`en/everything-claude-code/skills/project-guidelines-example/SKILL.md`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: コードブロック内のコメントは翻訳し、コマンド / 識別子 / 文字列は原文を維持する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 28
- 対象ファイル一覧: `en/everything-claude-code/skills/security-review/SKILL.md`、`en/everything-claude-code/skills/security-review/cloud-infrastructure-security.md`、`en/everything-claude-code/skills/strategic-compact/SKILL.md`、`en/everything-claude-code/skills/strategic-compact/suggest-compact.sh`、`en/everything-claude-code/skills/tdd-workflow/SKILL.md`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: *.md のコードブロック内コメントは翻訳し、*.sh はコメントのみ翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 29
- 対象ファイル一覧: `en/everything-claude-code/skills/verification-loop/SKILL.md`、`en/everything-claude-code/tests/hooks/hooks.test.js`、`en/everything-claude-code/tests/lib/package-manager.test.js`、`en/everything-claude-code/tests/lib/utils.test.js`、`en/everything-claude-code/tests/run-all.js`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: *.md のコードブロック内コメントは翻訳し、*.js はコメントのみ翻訳する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 30
- 対象ファイル一覧: `en/everything-claude-code/the-longform-guide.md`、`en/everything-claude-code/the-shortform-guide.md`
- 完了 / 未完了: 完了
- 用語表の更新: あり（TERM_GLOSSARY.md に追記）
- 翻訳時の注意点: コードブロック内コメントのみ翻訳し、コードや識別子は原文維持する。未翻訳一覧の重複項目を整理する
- 次セッションの開始点: `UNTRANSLATED_FILES.md` の先頭から対象を選ぶ

### セッション 31
- 対象ファイル一覧: `en/everything-claude-code/assets/images/longform/*`、`en/everything-claude-code/assets/images/shortform/*`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: 翻訳不要ファイルは `en/` から `ja/` に同一パスでコピーする。LICENSE は翻訳対象外のため除外する
- 次セッションの開始点: 翻訳 対象 は すべて 完了

### セッション 32
- 対象ファイル一覧: `en/everything-claude-code/LICENSE`
- 完了 / 未完了: 完了
- 用語表の更新: なし
- 翻訳時の注意点: LICENSE も 指示 に従って `en/` から `ja/` に 同一パス で コピーする
- 次セッションの開始点: 翻訳 対象 は すべて 完了
