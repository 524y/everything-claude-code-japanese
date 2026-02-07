# フックシステム

## フック種別

- **PreToolUse**: 実行前（バリデーション、入力調整）
- **PostToolUse**: 実行後（整形、チェック）
- **Stop**: セッション終了時（最終検証）

## 自動承認権限

注意して運用する:
- 信頼できる明確な計画でのみ有効化
- 探索的作業では無効化
- `dangerously-skip-permissions` は使わない
- 代わりに `~/.claude.json` の `allowedTools` を設定

## TodoWrite ベストプラクティス

TodoWrite で:
- 複数ステップ進捗の追跡
- 指示理解の検証
- リアルタイムな舵取り
- 実装粒度の可視化
