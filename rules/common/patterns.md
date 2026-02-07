# 共通パターン

## Skeleton Projects

新機能実装時:
1. 実戦投入済みのスケルトンを探す
2. 並列エージェントで比較（セキュリティ、拡張性、関連度、実装計画）
3. 最適なものを基盤に採用
4. 実証済み構造の中で反復する

## Design Patterns

### Repository Pattern

データアクセスを一貫した interface で抽象化する。

### API Response Format

API レスポンスは一貫した envelope を使う（success、data、error、meta）。
