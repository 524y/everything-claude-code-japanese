# main 同期・翻訳 手順書

この手順書は、main ブランチの更新を japanese ブランチへ翻訳して取り込むための汎用手順である。
翻訳は work-translation/WORK_INSTRUCTIONS.md に従う。

## 前提
- japanese は翻訳ブランチ
- 基点は「japanese が main から最後に取り込んだ commit」
- upstream は本家リポジトリ（初回追加は実行済みのため不要）
- TERM_GLOSSARY.md / TRANSLATION_STATUS.md を更新する

## A. 作業開始前（本家同期 / 作業ブランチ作成）

あらかじめ、以下の作業を行っておく。

- 本家同期
```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

- 翻訳同期 作業ブランチ作成
```bash
git checkout japanese
git pull
git checkout -b japanese-sync-main
```

## B. main の追加コミットを 1 コミットずつ処理

1) 基点の自動取得
```bash
BASE=$(git merge-base main japanese-sync-main)
echo $BASE
```

2) 対象コミットの件数確認
```bash
git log --oneline $BASE..main | wc -l
```

3) 対象コミットの先頭を確認
```bash
git log --oneline $BASE..main | tail -n 1
```

4) 対象コミットを取り込み
```bash
git merge --no-commit --no-ff <COMMIT>
```

5) 翻訳反映（ルール追加込み）
- 作業前に work-translation/WORK_INSTRUCTIONS.md を開き、特にコードブロック翻訳ルールを確認する
- **/*.md / **/*.tmp は全文翻訳
- **/*.js / **/*.sh / **/*.py はコメントのみ翻訳
- **/*.json は description / comment / help / title / _comments の値のみ翻訳
- LICENSE / 画像 / バイナリは除外
- 削除されたファイルは japanese 側も削除
- 改名（リネーム）は japanese 側も追随
- 英語以外は翻訳しない（例: 中国語ドキュメント）
- 翻訳済みファイルは再翻訳しない（差分がある場合のみ追従）
- 新しい用語が出たときは、どのように訳すか候補を提示して、確認待ちにする
- 翻訳後に、Markdown のコードブロック内の自然言語が残っていないか確認する（原文維持が必要な識別子 / 固有名詞 / コマンド / パス / URL / ファイル名は除外）

6) 進捗ファイル更新
- TERM_GLOSSARY.md を更新
- TRANSLATION_STATUS.md の更新は不要

7) commit
- コミットメッセージは「原文 + 日本語訳」
例:
```
feat: add new review flow / レビュー フローを追加
```

8) 修正前後の日本語の確認
- git show で修正前後を日本語を比較する
- 修正前の日本語の方が妥当なものは、修正前の日本語の訳し方に見習って訳し直す
- 新しい内容や、内容が修正されているものは、それらの変更点は削除しないこと
- 最後に git commit --amend する

9) コミット後の確認
- 人間が翻訳内容の確認（レビュー・確認）を行う
- 問題があれば、作業を中止して、コミットを取り消して、削除する

10) 作業継続の確認
- ここで作業を中断して、継続可否を確認する。
- 現在のコンテキスト量から「このまま継続が良いか / 新しいセッションが良いか」を提案する
- 継続する場合は、B-2 から続ける

## C. japanese-sync-main を japanese に取り込む

- 確認
```bash
BASE=$(git merge-base main japanese)
git range-diff $BASE..main $BASE..japanese-sync-main
```

- 取り込み
```bash
git checkout japanese
git merge --no-ff japanese-sync-main
```

- ここで作業を中断して、作業を継続するかの指示待ちにする

- push
```bash
git push origin japanese
```
