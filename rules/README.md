# Rules

## 構成

rules は **common** 層と **言語別** ディレクトリで構成する。

```
rules/
├── common/          # 言語非依存の原則（常に導入）
│   ├── coding-style.md
│   ├── git-workflow.md
│   ├── testing.md
│   ├── performance.md
│   ├── patterns.md
│   ├── hooks.md
│   ├── agents.md
│   └── security.md
├── typescript/      # TypeScript / JavaScript 向け
├── python/          # Python 向け
└── golang/          # Go 向け
```

- **common/** は普遍原則を扱う（言語固有コード例は置かない）。
- **言語別ディレクトリ** は common を拡張し、各言語のパターン / ツール / 実例を定義する。

## インストール

```bash
# common rules（全プロジェクトで必須）
cp -r rules/common/* ~/.claude/rules/

# 技術スタックに合わせて言語別 rules を導入
cp -r rules/typescript/* ~/.claude/rules/
cp -r rules/python/* ~/.claude/rules/
cp -r rules/golang/* ~/.claude/rules/
```

## Rules と Skills の違い

- **Rules**: 横断的に守る基準・規約・チェックリスト（例: 80% カバレッジ、シークレット禁止）
- **Skills**（`skills/`）: 特定タスクを実行するための実践的リファレンス

Rules は「何を守るか」、Skills は「どう実装するか」を担う。

## 新言語の追加

新しい言語（例: `rust/`）を追加する場合:

1. `rules/rust/` を作成
2. common 拡張ファイルを追加
3. 各ファイル冒頭に次を記載
   ```
   > This file extends [common/xxx.md](../common/xxx.md) with <Language> specific content.
   ```
4. 既存 skill を参照するか、必要なら `skills/` に新規 skill を追加
