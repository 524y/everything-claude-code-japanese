---
description: 好みのパッケージマネージャーを設定する（npm/pnpm/yarn/bun）
disable-model-invocation: true
---

# パッケージマネージャー設定

このプロジェクトまたはグローバルで好みのパッケージマネージャーを設定する。

## 使用方法

```bash
# 現在のパッケージマネージャーを検出
node scripts/setup-package-manager.js --detect

# グローバルの優先設定
node scripts/setup-package-manager.js --global pnpm

# プロジェクトの優先設定
node scripts/setup-package-manager.js --project bun

# 利用可能なパッケージマネージャー一覧
node scripts/setup-package-manager.js --list
```

## 検出の優先順位

パッケージマネージャーを判定する際は、次の順でチェックする:

1. **環境変数**: `CLAUDE_PACKAGE_MANAGER`
2. **プロジェクト設定**: `.claude/package-manager.json`
3. **package.json**: `packageManager` フィールド
4. **ロックファイル**: package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb の存在
5. **グローバル設定**: `~/.claude/package-manager.json`
6. **フォールバック**: 最初に利用可能なパッケージマネージャー（pnpm > bun > yarn > npm）

## 設定ファイル

### グローバル設定
```json
// ~/.claude/package-manager.json
{
  "packageManager": "pnpm"
}
```

### プロジェクト設定
```json
// .claude/package-manager.json
{
  "packageManager": "bun"
}
```

### package.json
```json
{
  "packageManager": "pnpm@8.6.0"
}
```

## 環境変数

`CLAUDE_PACKAGE_MANAGER` を設定すると、他の検出方法より優先される:

```bash
# Windows (PowerShell)
$env:CLAUDE_PACKAGE_MANAGER = "pnpm"

# macOS/Linux
export CLAUDE_PACKAGE_MANAGER=pnpm
```

## 検出を実行

現在の検出結果を見るには次を実行:

```bash
node scripts/setup-package-manager.js --detect
```
