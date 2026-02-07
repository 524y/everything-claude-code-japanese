# TypeScript/JavaScript コーディングスタイル

> This file extends [common/coding-style.md](../common/coding-style.md) with TypeScript/JavaScript specific content.

## Immutability

spread operator で不変更新する。

## Error Handling

async/await + try-catch を使う。

## Input Validation

Zod などでスキーマ検証する。

## Console.log

本番コードに `console.log` を残さない。
