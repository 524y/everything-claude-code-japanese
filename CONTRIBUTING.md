# Everything Claude Code への貢献

貢献したいと思ってくれてありがとう。このリポジトリは Claude Code ユーザーのためのコミュニティ資源である。

## 求めているもの

### エージェント

特定のタスクをうまく扱う新しいエージェント:
- 言語別レビュー担当（Python、Go、Rust）
- フレームワーク専門家（Django、Rails、Laravel、Spring）
- DevOps 専門家（Kubernetes、Terraform、CI/CD）
- ドメイン専門家（ML パイプライン、データエンジニアリング、モバイル）

### スキル

ワークフロー定義とドメイン知識:
- 言語のベストプラクティス
- フレームワークのパターン
- テスト戦略
- アーキテクチャガイド
- ドメイン固有の知識

### コマンド

有用なワークフローを呼び出すスラッシュコマンド:
- デプロイコマンド
- テストコマンド
- ドキュメントコマンド
- コード生成コマンド

### フック

有用な自動化:
- Linting/formatting フック
- セキュリティチェック
- バリデーションフック
- 通知フック

### ルール

常に守るガイドライン:
- セキュリティルール
- コードスタイルルール
- テスト要件
- 命名規約

### MCP 設定

新規または改善された MCP サーバー設定:
- データベース連携
- クラウドプロバイダー MCP
- 監視ツール
- 通信ツール

---

## 貢献方法

### 1. リポジトリをフォークする

```bash
git clone https://github.com/YOUR_USERNAME/everything-claude-code.git
cd everything-claude-code
```

### 2. ブランチを作成する

```bash
git checkout -b add-python-reviewer
```

### 3. 貢献内容を追加する

適切なディレクトリにファイルを配置する:
- `agents/` は新しいエージェント向け
- `skills/` はスキル向け（単一の .md またはディレクトリ）
- `commands/` はスラッシュコマンド向け
- `rules/` はルールファイル向け
- `hooks/` はフック設定向け
- `mcp-configs/` は MCP サーバー設定向け

### 4. 形式に従う

**エージェント** はフロントマターを持つこと:

```markdown
---
name: agent-name
description: 何をするか
tools: Read, Grep, Glob, Bash
model: sonnet
---

ここに指示を書く...
```

**スキル** は明確で実行可能であること:

```markdown
# スキル名

## 使う場面

...

## 仕組み

...

## 例

...
```

**コマンド** は何を行うかを説明すること:

```markdown
---
description: コマンドの短い説明
---

# コマンド名

詳細な指示...
```

**フック** は説明を含めること:

```json
{
  "matcher": "...",
  "hooks": [...],
  "description": "What this hook does"
}
```

### 5. 貢献内容をテストする

提出前に Claude Code で設定が動作することを確認する。

### 6. PR を提出する

```bash
git add .
git commit -m "Add Python code reviewer agent"
git push origin add-python-reviewer
```

次の内容を含めて PR を作成する:
- 追加した内容
- 有用である理由
- テスト方法

---

## ガイドライン

### すべきこと

- 設定を集中させ、モジュール化する
- 明確な説明を含める
- 提出前にテストする
- 既存のパターンに従う
- 依存関係があれば記載する

### してはいけないこと

- 機密データ（API キー、トークン、パス）を含める
- 過度に複雑またはニッチな設定を追加する
- テストしていない設定を提出する
- 重複した機能を作成する
- 代替手段がない有料サービス専用の設定を追加する

---

## ファイル命名

- ハイフン区切りの小文字を使う: `python-reviewer.md`
- 具体的にする: `workflow.md` ではなく `tdd-workflow.md`
- エージェント / スキル名とファイル名を一致させる

---

## 質問がある場合

Issue を開くか、X で連絡する: [@affaanmustafa](https://x.com/affaanmustafa)

---

貢献してくれてありがとう。一緒に素晴らしい資源を作ろう。
