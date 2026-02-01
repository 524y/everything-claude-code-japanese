# プラグインとマーケットプレイス

プラグインは Claude Code に新しいツールと機能を追加する。このガイドはインストールのみを扱う。使うタイミングと理由は [全文記事](https://x.com/affaanmustafa/status/2012378465664745795) を参照する。

---

## マーケットプレイス

マーケットプレイスはインストール可能なプラグインのリポジトリである。

### マーケットプレイスの追加

```bash
# 公式 Anthropic マーケットプレイスを追加する
claude plugin marketplace add https://github.com/anthropics/claude-plugins-official

# コミュニティマーケットプレイスを追加する
claude plugin marketplace add https://github.com/mixedbread-ai/mgrep
```

### 推奨マーケットプレイス

| マーケットプレイス | ソース |
|-------------|--------|
| claude-plugins-official | `anthropics/claude-plugins-official` |
| claude-code-plugins | `anthropics/claude-code` |
| Mixedbread-Grep | `mixedbread-ai/mgrep` |

---

## プラグインのインストール

```bash
# プラグインブラウザを開く
/plugins

# または直接インストールする
claude plugin install typescript-lsp@claude-plugins-official
```

### 推奨プラグイン

**開発:**
- `typescript-lsp` - TypeScript インテリジェンス
- `pyright-lsp` - Python 型チェック
- `hookify` - 会話でフックを作成する
- `code-simplifier` - コードをリファクタする

**コード品質:**
- `code-review` - コードレビュー
- `pr-review-toolkit` - PR 自動化
- `security-guidance` - セキュリティチェック

**検索:**
- `mgrep` - 強化検索（ripgrep より優れる）
- `context7` - ライブドキュメント参照

**ワークフロー:**
- `commit-commands` - Git ワークフロー
- `frontend-design` - UI パターン
- `feature-dev` - 機能開発

---

## クイックセットアップ

```bash
# マーケットプレイスを追加する
claude plugin marketplace add https://github.com/anthropics/claude-plugins-official
claude plugin marketplace add https://github.com/mixedbread-ai/mgrep

# /plugins を開いて必要なものをインストールする
```

---

## プラグインファイルの場所

```
~/.claude/plugins/
|-- cache/                    # ダウンロード済みプラグイン
|-- installed_plugins.json    # インストール済み一覧
|-- known_marketplaces.json   # 追加済みマーケットプレイス
|-- marketplaces/             # マーケットプレイスデータ
```
