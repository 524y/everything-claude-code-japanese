# プロジェクトガイドライン スキル（例）

これはプロジェクト固有スキルの例である。自分のプロジェクト向けテンプレートとして使うこと。

実際の本番アプリケーションに基づく: [Zenith](https://zenith.chat) - AI 駆動のカスタマーディスカバリプラットフォーム。

---

## いつ使うか

設計対象の特定プロジェクトで作業する際にこのスキルを参照する。プロジェクトスキルには次が含まれる:
- アーキテクチャ概要
- ファイル構造
- コードパターン
- テスト要件
- デプロイワークフロー

---

## アーキテクチャ概要

**技術スタック:**
- **Frontend**: Next.js 15（App Router）、TypeScript、React
- **Backend**: FastAPI（Python）、Pydantic モデル
- **Database**: Supabase（PostgreSQL）
- **AI**: Claude API（ツール呼び出しと構造化出力）
- **Deployment**: Google Cloud Run
- **Testing**: Playwright（E2E）、pytest（backend）、React Testing Library

**サービス:**
```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  Next.js 15 + TypeScript + TailwindCSS                     │
│  Deployed: Vercel / Cloud Run                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend                             │
│  FastAPI + Python 3.11 + Pydantic                          │
│  Deployed: Cloud Run                                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ Supabase │   │  Claude  │   │  Redis   │
        │ Database │   │   API    │   │  Cache   │
        └──────────┘   └──────────┘   └──────────┘
```

---

## ファイル構造

```
project/
├── frontend/
│   └── src/
│       ├── app/              # Next.js app router ページ
│       │   ├── api/          # API ルート
│       │   ├── (auth)/       # 認証保護ルート
│       │   └── workspace/    # メインアプリワークスペース
│       ├── components/       # React コンポーネント
│       │   ├── ui/           # ベース UI コンポーネント
│       │   ├── forms/        # フォームコンポーネント
│       │   └── layouts/      # レイアウトコンポーネント
│       ├── hooks/            # カスタム React フック
│       ├── lib/              # ユーティリティ
│       ├── types/            # TypeScript 定義
│       └── config/           # 設定
│
├── backend/
│   ├── routers/              # FastAPI ルートハンドラ
│   ├── models.py             # Pydantic モデル
│   ├── main.py               # FastAPI アプリのエントリ
│   ├── auth_system.py        # 認証
│   ├── database.py           # データベース操作
│   ├── services/             # ビジネスロジック
│   └── tests/                # pytest テスト
│
├── deploy/                   # デプロイ設定
├── docs/                     # ドキュメント
└── scripts/                  # ユーティリティスクリプト
```

---

## コードパターン

### API レスポンス形式（FastAPI）

```python
from pydantic import BaseModel
from typing import Generic, TypeVar, Optional

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None

    @classmethod
    def ok(cls, data: T) -> "ApiResponse[T]":
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: str) -> "ApiResponse[T]":
        return cls(success=False, error=error)
```

### フロントエンド API 呼び出し（TypeScript）

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    return await response.json()
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
```

### Claude AI 連携（構造化出力）

```python
from anthropic import Anthropic
from pydantic import BaseModel

class AnalysisResult(BaseModel):
    summary: str
    key_points: list[str]
    confidence: float

async def analyze_with_claude(content: str) -> AnalysisResult:
    client = Anthropic()

    response = client.messages.create(
        model="claude-sonnet-4-5-20250514",
        max_tokens=1024,
        messages=[{"role": "user", "content": content}],
        tools=[{
            "name": "provide_analysis",
            "description": "Provide structured analysis",
            "input_schema": AnalysisResult.model_json_schema()
        }],
        tool_choice={"type": "tool", "name": "provide_analysis"}
    )

    # ツール使用結果を抽出する
    tool_use = next(
        block for block in response.content
        if block.type == "tool_use"
    )

    return AnalysisResult(**tool_use.input)
```

### カスタムフック（React）

```typescript
import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  fetchFn: () => Promise<ApiResponse<T>>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    const result = await fetchFn()

    if (result.success) {
      setState({ data: result.data!, loading: false, error: null })
    } else {
      setState({ data: null, loading: false, error: result.error! })
    }
  }, [fetchFn])

  return { ...state, execute }
}
```

---

## テスト要件

### Backend（pytest）

```bash
# すべてのテストを実行する
poetry run pytest tests/

# カバレッジ付きで実行する
poetry run pytest tests/ --cov=. --cov-report=html

# 特定のテストファイルを実行する
poetry run pytest tests/test_auth.py -v
```

**テスト構造:**
```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

### Frontend（React Testing Library）

```bash
# テストを実行する
npm run test

# カバレッジ付きで実行する
npm run test -- --coverage

# E2E テストを実行する
npm run test:e2e
```

**テスト構造:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkspacePanel } from './WorkspacePanel'

describe('WorkspacePanel', () => {
  it('renders workspace correctly', () => {
    render(<WorkspacePanel />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('handles session creation', async () => {
    render(<WorkspacePanel />)
    fireEvent.click(screen.getByText('New Session'))
    expect(await screen.findByText('Session created')).toBeInTheDocument()
  })
})
```

---

## デプロイワークフロー

### デプロイ前チェックリスト

- [ ] すべてのテストがローカルで通る
- [ ] `npm run build` が成功する（frontend）
- [ ] `poetry run pytest` が通る（backend）
- [ ] ハードコードされたシークレットがない
- [ ] 環境変数がドキュメント化されている
- [ ] データベースマイグレーションが準備済み

### デプロイコマンド

```bash
# フロントエンドのビルドとデプロイ
cd frontend && npm run build
gcloud run deploy frontend --source .

# バックエンドのビルドとデプロイ
cd backend
gcloud run deploy backend --source .
```

### 環境変数

```bash
# フロントエンド（.env.local）
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# バックエンド（.env）
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
```

---

## 重要ルール

1. コード / コメント / ドキュメントに絵文字を使わない
2. **イミュータビリティ** - オブジェクトや配列を変更しない
3. **TDD** - 実装前にテストを書く
4. **80% カバレッジ** 最低
5. **小さなファイルを多く** - 通常 200-400 行、最大 800 行
6. 本番コードに console.log を入れない
7. try / catch で適切なエラーハンドリングを行う
8. Pydantic / Zod で入力バリデーションを行う

---

## 関連スキル

- `coding-standards.md` - 一般的なコーディングベストプラクティス
- `backend-patterns.md` - API とデータベースパターン
- `frontend-patterns.md` - React と Next.js パターン
- `tdd-workflow/` - テスト駆動開発方法論
