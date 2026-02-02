# プラグイン マニフェスト スキーマ ノート

このドキュメントは、Claude Code のプラグイン マニフェスト バリデーションで**未ドキュメントだが強制される制約**をまとめたもの。

これらのルールは、実際のインストール失敗、バリデーション挙動、既知の動作するプラグインとの比較に基づく。
サイレントな破綻や再発を防ぐために存在する。

`.claude-plugin/plugin.json` を編集する前に、まずこれを読むこと。

---

## 概要（最初に読む）

Claude プラグイン マニフェスト バリデーションは**厳格で強い前提を持つ**。
公開されているスキーマ参照に完全には記載されていないルールを強制する。

最もよくある失敗は次のとおり:

> マニフェストは妥当に見えるが、バリデーションが次のような曖昧なエラーで拒否する
> `agents: Invalid input`

このドキュメントはその理由を説明する。

---

## 必須フィールド

### `version`（必須）

`version` フィールドは、いくつかの例で省略されていてもバリデーションで必須となる。

欠けていると、マーケットプレイスのインストールや CLI の検証で失敗する可能性がある。

例:

```json
{
  "version": "1.1.0"
}
```

---

## フィールドの形

次のフィールドは**常に配列である必要がある**:

* `agents`
* `commands`
* `skills`
* `hooks`（存在する場合）

1 件しかなくても、**文字列は受け付けられない**。

### 無効

```json
{
  "agents": "./agents"
}
```

### 有効

```json
{
  "agents": ["./agents/planner.md"]
}
```

このルールは、すべてのコンポーネント パスに一貫して適用される。

---

## パス解決ルール（重要）

### agents は明示的なファイル パスが必須

バリデーションは、`agents` に対するディレクトリ パスを**受け付けない**。

次の例でも失敗する:

```json
{
  "agents": ["./agents/"]
}
```

代わりに、エージェント ファイルを明示的に列挙する必要がある:

```json
{
  "agents": [
    "./agents/planner.md",
    "./agents/architect.md",
    "./agents/code-reviewer.md"
  ]
}
```

これは最も多いバリデーション エラーの原因。

### commands と skills

* `commands` と `skills` は、配列で包まれている場合に限りディレクトリ パスを受け付ける
* 明示的なファイル パスのほうが安全で将来性が高い

---

## バリデーション挙動のメモ

* `claude plugin validate` は、一部のマーケットプレイス プレビューより厳格
* ローカルでは通っても、パスが曖昧だとインストール時に失敗する可能性がある
* エラーは多くが一般的（`Invalid input`）で、根本原因を示さない
* クロスプラットフォーム インストール（特に Windows）はパスの前提に厳しい

バリデーションは敵対的かつ厳密だと考えること。

---

## `hooks` フィールド: 追加禁止

> ⚠️ **重要:** `plugin.json` に `"hooks"` フィールドを追加しないこと。リグレッション テストで強制される。

### 重要な理由

Claude Code v2.1+ は、インストールされたプラグインの `hooks/hooks.json` を慣例で**自動読み込み**する。`plugin.json` にも宣言すると次のエラーになる:

```
Duplicate hooks file detected: ./hooks/hooks.json resolves to already-loaded file.
The standard hooks/hooks.json is loaded automatically, so manifest.hooks should
only reference additional hook files.
```

### 繰り返しの追加 / 削除の履歴

このリポジトリでは修正 / リバートのループが発生している:

| Commit | Action | Trigger |
|--------|--------|---------|
| `22ad036` | ADD hooks | Users reported "hooks not loading" |
| `a7bc5f2` | REMOVE hooks | Users reported "duplicate hooks error" (#52) |
| `779085e` | ADD hooks | Users reported "agents not loading" (#88) |
| `e3a1306` | REMOVE hooks | Users reported "duplicate hooks error" (#103) |

**根本原因:** Claude Code CLI の挙動がバージョン間で変化した:
- v2.1 前: `hooks` の明示宣言が必須
- v2.1+: 慣例で自動読み込みし、重複はエラー

### 現行ルール（テストで強制）

`tests/hooks/hooks.test.js` の `plugin.json does NOT have explicit hooks declaration` テストが再導入を防ぐ。

**追加の hook ファイル** ( `hooks/hooks.json` 以外 ) を追加する場合は宣言できるが、標準の `hooks/hooks.json` は宣言してはならない。

---

## 既知の避けるべきパターン

見た目は正しいが拒否される:

* 配列ではなく文字列
* `agents` に対するディレクトリの配列
* `version` の欠落
* 推論されたパスへの依存
* マーケットプレイスの挙動がローカル検証と一致する前提
* **`"hooks": "./hooks/hooks.json"` を追加する** - 慣例で自動読み込みされるため重複エラーになる

小細工は避ける。明示的にする。

---

## 最小の既知の正常例

```json
{
  "version": "1.1.0",
  "agents": [
    "./agents/planner.md",
    "./agents/code-reviewer.md"
  ],
  "commands": ["./commands/"],
  "skills": ["./skills/"]
}
```

この構造は Claude プラグイン バリデーションに対して検証済み。

**Important:** Notice there is NO `"hooks"` field. The `hooks/hooks.json` file is loaded automatically by convention. Adding it explicitly causes a duplicate error.

---

## コントリビューター向けの推奨

`plugin.json` に触れる変更を送る前に:

1. agents は明示的なファイル パスを使う
2. すべてのコンポーネント フィールドを配列にする
3. `version` を含める
4. 次を実行する:

```bash
claude plugin validate .claude-plugin/plugin.json
```

迷うなら、簡潔さより冗長さを選ぶ。

---

## このファイルの目的

このリポジトリは広くフォークされ、参照実装として使われている。

ここでバリデーションの癖を文書化することで:

* 再発を防ぐ
* コントリビューターのフラストレーションを減らす
* エコシステムの変化に合わせてプラグインの安定性を保つ

バリデーションが変わった場合は、まずこのドキュメントを更新する。
