# Codemap を更新する

コードベース構成を分析し、アーキテクチャドキュメントを更新する:

1. すべてのソースファイルをスキャンし、import / export / 依存関係を抽出する
2. 次の形式で token-lean な codemap を生成する:
   - codemaps/architecture.md - 全体アーキテクチャ
   - codemaps/backend.md - バックエンド構成
   - codemaps/frontend.md - フロントエンド構成
   - codemaps/data.md - データモデルとスキーマ

3. 以前のバージョンとの差分率を算出する
4. 変更が30%を超える場合は、更新前にユーザーの承認を求める
5. 各 codemap に鮮度タイムスタンプを付与する
6. レポートを .reports/codemap-diff.txt に保存する

分析には TypeScript / Node.js を使用する。実装の詳細ではなく、上位の構造に集中する。
