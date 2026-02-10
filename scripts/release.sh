#!/usr/bin/env bash
set -euo pipefail

# plugin version を更新するリリース スクリプト
# 使い方: ./scripts/release.sh VERSION

VERSION="${1:-}"
PLUGIN_JSON=".claude-plugin/plugin.json"

# 使い方を表示する関数
usage() {
  echo "Usage: $0 VERSION"
  echo "Example: $0 1.5.0"
  exit 1
}

# VERSION 引数の有無を検証する
if [[ -z "$VERSION" ]]; then
  echo "Error: VERSION argument is required"
  usage
fi

# VERSION が semver 形式（X.Y.Z）か検証する
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: VERSION must be in semver format (e.g., 1.5.0)"
  exit 1
fi

# 現在のブランチが main か確認する
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: Must be on main branch (currently on $CURRENT_BRANCH)"
  exit 1
fi

# working tree がクリーンか確認する
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: Working tree is not clean. Commit or stash changes first."
  exit 1
fi

# plugin.json の存在を確認する
if [[ ! -f "$PLUGIN_JSON" ]]; then
  echo "Error: $PLUGIN_JSON not found"
  exit 1
fi

# 現在の version を取得する
OLD_VERSION=$(grep -oE '"version": *"[^"]*"' "$PLUGIN_JSON" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
echo "Bumping version: $OLD_VERSION -> $VERSION"

# plugin.json の version を更新する（cross-platform sed）
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/\"version\": *\"[^\"]*\"/\"version\": \"$VERSION\"/" "$PLUGIN_JSON"
else
  # Linux
  sed -i "s/\"version\": *\"[^\"]*\"/\"version\": \"$VERSION\"/" "$PLUGIN_JSON"
fi

# stage、commit、tag、push を実行する
git add "$PLUGIN_JSON"
git commit -m "chore: bump plugin version to $VERSION"
git tag "v$VERSION"
git push origin main "v$VERSION"

echo "Released v$VERSION"
