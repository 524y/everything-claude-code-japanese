---
name: nutrient-document-processing
description: Nutrient DWS API を使って、ドキュメントの処理、変換、OCR、抽出、墨消し、署名、フォーム入力を行う。PDF、DOCX、XLSX、PPTX、HTML、画像に対応。
---

# Nutrient ドキュメント処理

[Nutrient DWS Processor API](https://www.nutrient.io/api/) でドキュメントを処理する。形式変換、テキスト / 表の抽出、スキャン文書への OCR、PII の墨消し、透かし追加、電子署名、PDF フォーム入力に対応。

## セットアップ

無料の API キーを **https://dashboard.nutrient.io/sign_up/?product=processor** で取得する。

```bash
export NUTRIENT_API_KEY="pdf_live_..."
```

すべてのリクエストは `instructions` JSON フィールドを含む multipart POST として `https://api.nutrient.io/build` に送信する。

## 操作

### ドキュメント変換

```bash
# DOCX から PDF へ
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "document.docx=@document.docx" \
  -F 'instructions={"parts":[{"file":"document.docx"}]}' \
  -o output.pdf

# PDF から DOCX へ
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "document.pdf=@document.pdf" \
  -F 'instructions={"parts":[{"file":"document.pdf"}],"output":{"type":"docx"}}' \
  -o output.docx

# HTML から PDF へ
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "index.html=@index.html" \
  -F 'instructions={"parts":[{"html":"index.html"}]}' \
  -o output.pdf
```

対応入力形式: PDF, DOCX, XLSX, PPTX, DOC, XLS, PPT, PPS, PPSX, ODT, RTF, HTML, JPG, PNG, TIFF, HEIC, GIF, WebP, SVG, TGA, EPS。

### テキストとデータの抽出

```bash
# プレーンテキストを抽出
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "document.pdf=@document.pdf" \
  -F 'instructions={"parts":[{"file":"document.pdf"}],"output":{"type":"text"}}' \
  -o output.txt

# 表を Excel として抽出
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "document.pdf=@document.pdf" \
  -F 'instructions={"parts":[{"file":"document.pdf"}],"output":{"type":"xlsx"}}' \
  -o tables.xlsx
```

### スキャン文書の OCR

```bash
# 検索可能 PDF へ OCR（100 以上の言語をサポート）
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "scanned.pdf=@scanned.pdf" \
  -F 'instructions={"parts":[{"file":"scanned.pdf"}],"actions":[{"type":"ocr","language":"english"}]}' \
  -o searchable.pdf
```

言語: ISO 639-2 コード（例: `eng`, `deu`, `fra`, `spa`, `jpn`, `kor`, `chi_sim`, `chi_tra`, `ara`, `hin`, `rus`）で 100 以上の言語に対応。`english` や `german` のような完全名も利用可能。対応コードの全一覧は [OCR 言語一覧](https://www.nutrient.io/guides/document-engine/ocr/language-support/) を参照。

### 機密情報の墨消し

```bash
# パターンベース（SSN、email）
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "document.pdf=@document.pdf" \
  -F 'instructions={"parts":[{"file":"document.pdf"}],"actions":[{"type":"redaction","strategy":"preset","strategyOptions":{"preset":"social-security-number"}},{"type":"redaction","strategy":"preset","strategyOptions":{"preset":"email-address"}}]}' \
  -o redacted.pdf

# 正規表現ベース
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "document.pdf=@document.pdf" \
  -F 'instructions={"parts":[{"file":"document.pdf"}],"actions":[{"type":"redaction","strategy":"regex","strategyOptions":{"regex":"\\b[A-Z]{2}\\d{6}\\b"}}]}' \
  -o redacted.pdf
```

プリセット: `social-security-number`, `email-address`, `credit-card-number`, `international-phone-number`, `north-american-phone-number`, `date`, `time`, `url`, `ipv4`, `ipv6`, `mac-address`, `us-zip-code`, `vin`。

### 透かしの追加

```bash
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "document.pdf=@document.pdf" \
  -F 'instructions={"parts":[{"file":"document.pdf"}],"actions":[{"type":"watermark","text":"CONFIDENTIAL","fontSize":72,"opacity":0.3,"rotation":-45}]}' \
  -o watermarked.pdf
```

### 電子署名

```bash
# 自己署名 CMS 署名
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "document.pdf=@document.pdf" \
  -F 'instructions={"parts":[{"file":"document.pdf"}],"actions":[{"type":"sign","signatureType":"cms"}]}' \
  -o signed.pdf
```

### PDF フォーム入力

```bash
curl -X POST https://api.nutrient.io/build \
  -H "Authorization: Bearer $NUTRIENT_API_KEY" \
  -F "form.pdf=@form.pdf" \
  -F 'instructions={"parts":[{"file":"form.pdf"}],"actions":[{"type":"fillForm","formFields":{"name":"Jane Smith","email":"jane@example.com","date":"2026-02-06"}}]}' \
  -o filled.pdf
```

## MCP Server（代替手段）

ネイティブなツール統合を行う場合は、curl の代わりに MCP server を使用する。

```json
{
  "mcpServers": {
    "nutrient-dws": {
      "command": "npx",
      "args": ["-y", "@nutrient-sdk/dws-mcp-server"],
      "env": {
        "NUTRIENT_DWS_API_KEY": "YOUR_API_KEY",
        "SANDBOX_PATH": "/path/to/working/directory"
      }
    }
  }
}
```

## 利用シーン

- 形式間でのドキュメント変換（PDF、DOCX、XLSX、PPTX、HTML、画像）
- PDF からのテキスト、表、key-value ペアの抽出
- スキャン文書や画像への OCR
- 文書共有前の PII 墨消し
- 下書きや機密文書への透かし追加
- 契約書や合意文書への電子署名
- PDF フォームのプログラム入力

## リンク

- [API Playground](https://dashboard.nutrient.io/processor-api/playground/)
- [API ドキュメント全文](https://www.nutrient.io/guides/dws-processor/)
- [Agent Skill リポジトリ](https://github.com/PSPDFKit-labs/nutrient-agent-skill)
- [npm MCP Server](https://www.npmjs.com/package/@nutrient-sdk/dws-mcp-server)
