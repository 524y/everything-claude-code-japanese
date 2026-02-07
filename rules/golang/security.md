# Go セキュリティ

> This file extends [common/security.md](../common/security.md) with Go specific content.

## シークレット管理

`os.Getenv` で読み取り、未設定時は fail させる。

## セキュリティスキャン

- **gosec** を使う

## Context & Timeouts

`context.WithTimeout` でタイムアウト制御する。
