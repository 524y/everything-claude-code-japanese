# フックシステム

## フック種別

- **PreToolUse**: ツール実行前 (バリデーション、パラメータ変更)
- **PostToolUse**: ツール実行後 (自動フォーマット、チェック)
- **Stop**: セッション終了時 (最終検証)

## 現在のフック (~/.claude/settings.json 内)

### PreToolUse
- **tmux reminder**: 長時間実行コマンドに tmux を提案する (npm, pnpm, yarn, cargo など)
- **git push review**: push 前に Zed を開いてレビューする
- **doc blocker**: 不要な .md/.txt ファイルの作成をブロックする

### PostToolUse
- **PR creation**: PR の URL と GitHub Actions の状態を記録する
- **Prettier**: 編集後に JS/TS ファイルを自動フォーマットする
- **TypeScript check**: .ts/.tsx ファイルの編集後に tsc を実行する
- **console.log warning**: 編集したファイル内の console.log を警告する

### Stop
- **console.log audit**: セッション終了前に変更済みファイルの console.log を全チェックする

## 自動承認権限

注意して使用する:
- 信頼でき、明確に定義された計画で有効化する
- 探索的な作業では無効化する
- dangerously-skip-permissions フラグは絶対に使わない
- 代わりに `~/.claude.json` の `allowedTools` を設定する

## TodoWrite ベストプラクティス

TodoWrite ツールを使って:
- 複数ステップのタスク進捗を追跡する
- 指示の理解を検証する
- リアルタイムの舵取りを可能にする
- 粒度の細かい実装ステップを見せる

Todo リストで分かること:
- 手順の順序ミス
- 抜け漏れ
- 余計な項目
- 粒度の誤り
- 要件の誤解
