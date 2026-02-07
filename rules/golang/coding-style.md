# Go コーディングスタイル

> This file extends [common/coding-style.md](../common/coding-style.md) with Go specific content.

## Formatting

- **gofmt** と **goimports** を必須にする

## Design Principles

- accept interfaces, return structs
- interface は小さく保つ

## Error Handling

`fmt.Errorf("...: %w", err)` で文脈付きラップする。

## Reference

`golang-patterns` skill を参照。
