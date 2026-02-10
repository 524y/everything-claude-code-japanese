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

### Option 1: Install Script (Recommended)

```bash
# Install common + one or more language-specific rule sets
./install.sh typescript
./install.sh python
./install.sh golang

# Install multiple languages at once
./install.sh typescript python
```

### Option 2: Manual Installation

> **Important:** Copy entire directories — do NOT flatten with `/*`.
> Common and language-specific directories contain files with the same names.
> Flattening them into one directory causes language-specific files to overwrite
> common rules, and breaks the relative `../common/` references used by
> language-specific files.

```bash
# common rules を導入（全プロジェクトで必須）
cp -r rules/common ~/.claude/rules/common

# プロジェクトの技術スタックに合わせて言語別 rules を導入
cp -r rules/typescript ~/.claude/rules/typescript
cp -r rules/python ~/.claude/rules/python
cp -r rules/golang ~/.claude/rules/golang

# 注意: 必ず実プロジェクト要件に合わせて設定すること（ここでの例はあくまで参考）
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
