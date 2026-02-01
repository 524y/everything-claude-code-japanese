# Verification コマンド

現在のコードベースの状態に対して包括的な検証を実行する。

## 指示

次の順序を厳守して検証を実行する:

1. **ビルドチェック**
   - このプロジェクトのビルドコマンドを実行する
   - 失敗した場合はエラーを報告して停止する

2. **型チェック**
   - TypeScript/type checker を実行する
   - file:line 付きで全エラーを報告する

3. **Lint チェック**
   - linter を実行する
   - warning と error を報告する

4. **テストスイート**
   - 全テストを実行する
   - pass/fail の件数を報告する
   - coverage の割合を報告する

5. **Console.log 監査**
   - source ファイル内の console.log を検索する
   - 位置を報告する

6. **Git ステータス**
   - 未コミットの変更を表示する
   - 最後のコミット以降に変更されたファイルを表示する

## 出力

簡潔な検証レポートを出力する:

```
VERIFICATION: [PASS/FAIL]

Build:    [OK/FAIL]
Types:    [OK/X errors]
Lint:     [OK/X issues]
Tests:    [X/Y passed, Z% coverage]
Secrets:  [OK/X found]
Logs:     [OK/X console.logs]

Ready for PR: [YES/NO]
```

重大な問題がある場合は、修正案を添えて列挙する。

## 引数

$ARGUMENTS に指定できる値:
- `quick` - build と types のみ
- `full` - 全チェック（デフォルト）
- `pre-commit` - commit 向けのチェック
- `pre-pr` - security scan を追加したフルチェック
