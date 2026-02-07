---
description: 要件を言い換え、リスクを評価し、段階的な実装計画を作成する。ユーザーの CONFIRM を受け取るまで一切のコードに触れない。
---

# Plan コマンド

このコマンドは **planner** エージェントを呼び出し、コードを書く前に包括的な実装計画を作成する。

## このコマンドの内容

1. **要件の言い換え** - 何を作る必要があるかを明確化する
2. **リスクの特定** - 想定される問題やブロッカーを表面化する
3. **段階的な計画作成** - 実装をフェーズごとに分解する
4. **確認待ち** - 進める前にユーザーの承認を必ず受ける

## 使用するタイミング

`/plan` を使う場面:
- 新しい機能に着手する時
- 大きなアーキテクチャ変更を行う時
- 複雑なリファクタリングに取り組む時
- 複数のファイルやコンポーネントに影響が及ぶ時
- 要件が不明確または曖昧な時

## 動作の流れ

planner エージェントは次を行う:

1. **依頼を分析する** ため、要件を明確な言葉で言い換える
2. **フェーズに分解する** ため、具体的で実行可能な手順を作る
3. **依存関係を特定する** ため、コンポーネント間の関係を整理する
4. **リスクを評価する** ため、潜在的なブロッカーを示す
5. **複雑性を見積もる**（High/Medium/Low）
6. **計画を提示する** そして明示的な確認を待つ

## 使用例

```
User: /plan 市場が解決した時にリアルタイム通知を追加したい

Agent (planner):
# 実装計画: 市場解決時のリアルタイム通知

## 要件の言い換え
- 監視中の市場が解決した時にユーザーへ通知を送る
- 複数の通知チャネル（in-app、email、webhook）に対応する
- 通知が確実に配信されるようにする
- 市場の結果とユーザーのポジション結果を含める

## 実装フェーズ

### Phase 1: Database スキーマ
- notifications テーブルに columns: id, user_id, market_id, type, status, created_at を追加する
- チャネルの設定用に user_notification_preferences テーブルを追加する
- パフォーマンスのために user_id と market_id に index を作成する

### Phase 2: 通知サービス
- lib/notifications.ts に通知サービスを作成する
- BullMQ/Redis を使った通知キューを実装する
- 配信失敗の再試行ロジックを追加する
- 通知テンプレートを作成する

### Phase 3: 連携ポイント
- 市場の解決ロジックにフックする（status が "resolved" に変わった時）
- 市場内のポジションを持つ全ユーザーを取得する
- 各ユーザーの通知をキューに入れる

### Phase 4: フロントエンドコンポーネント
- header に NotificationBell コンポーネントを作成する
- NotificationList モーダルを追加する
- Supabase の subscriptions でリアルタイム更新を実装する
- 通知設定ページを追加する

## 依存関係
- Redis（キュー用）
- Email サービス（SendGrid/Resend）
- Supabase のリアルタイム subscriptions

## リスク
- HIGH: Email の到達率（SPF/DKIM が必要）
- MEDIUM: 市場あたり 1000+ ユーザーの性能
- MEDIUM: 市場の解決が多い場合の通知スパム
- LOW: リアルタイム subscription のオーバーヘッド

## 見積もり複雑性: MEDIUM
- Backend: 4-6 hours
- Frontend: 3-4 hours
- Testing: 2-3 hours
- Total: 9-13 hours

**WAITING FOR CONFIRMATION**: この計画で進めますか? (yes/no/modify)
```

## 重要な注意点

**CRITICAL**: planner エージェントは、あなたが "yes" や "proceed" などの肯定的な返答で計画を明示的に確認するまで、コードを一切書かない。

変更したい場合は、次のように返答する:
- "modify: [your changes]"
- "different approach: [alternative]"
- "skip phase 2 and do phase 3 first"

## 他コマンドとの連携

計画の後は:
- `/tdd` を使ってテスト駆動開発で実装する
- ビルドエラーが起きたら `/build-and-fix` を使う
- 実装が終わったら `/code-review` を使ってレビューする

## 関連エージェント

このコマンドは次の `planner` エージェントを呼び出す:
`~/.claude/agents/planner.md`
