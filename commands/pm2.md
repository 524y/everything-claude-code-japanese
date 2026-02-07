# PM2 Init

プロジェクトを自動解析し、PM2 サービスコマンドを生成する。

**Command**: `$ARGUMENTS`

---

## Workflow

1. PM2 を確認（未導入なら `npm install -g pm2`）
2. プロジェクトを走査しサービスを特定（frontend / backend / database）
3. 設定ファイルと個別コマンドファイルを生成

---

## Service Detection

| Type | Detection | Default Port |
|------|-----------|--------------|
| Vite | vite.config.* | 5173 |
| Next.js | next.config.* | 3000 |
| Nuxt | nuxt.config.* | 3000 |
| CRA | react-scripts in package.json | 3000 |
| Express / Node | server/backend/api directory + package.json | 3000 |
| FastAPI / Flask | requirements.txt / pyproject.toml | 8000 |
| Go | go.mod / main.go | 8080 |

**Port Detection Priority**: ユーザー指定 > .env > config file > scripts args > default port

---

## Generated Files

```
project/
├── ecosystem.config.cjs              # PM2 config
├── {backend}/start.cjs               # Python wrapper (if applicable)
└── .claude/
    ├── commands/
    │   ├── pm2-all.md                # Start all + monit
    │   ├── pm2-all-stop.md           # Stop all
    │   ├── pm2-all-restart.md        # Restart all
    │   ├── pm2-{port}.md             # Start single + logs
    │   ├── pm2-{port}-stop.md        # Stop single
    │   ├── pm2-{port}-restart.md     # Restart single
    │   ├── pm2-logs.md               # View all logs
    │   └── pm2-status.md             # View status
    └── scripts/
        ├── pm2-logs-{port}.ps1       # Single service logs
        └── pm2-monit.ps1             # PM2 monitor
```

---

## Windows Configuration（IMPORTANT）

### ecosystem.config.cjs

**拡張子は `.cjs` を必ず使用すること**

```javascript
module.exports = {
  apps: [
    // Node.js (Vite/Next/Nuxt)
    {
      name: 'project-3000',
      cwd: './packages/web',
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 3000',
      interpreter: 'C:/Program Files/nodejs/node.exe',
      env: { NODE_ENV: 'development' }
    },
    // Python
    {
      name: 'project-8000',
      cwd: './backend',
      script: 'start.cjs',
      interpreter: 'C:/Program Files/nodejs/node.exe',
      env: { PYTHONUNBUFFERED: '1' }
    }
  ]
}
```

**Framework script paths:**

| Framework | script | args |
|-----------|--------|------|
| Vite | `node_modules/vite/bin/vite.js` | `--port {port}` |
| Next.js | `node_modules/next/dist/bin/next` | `dev -p {port}` |
| Nuxt | `node_modules/nuxt/bin/nuxt.mjs` | `dev --port {port}` |
| Express | `src/index.js` or `server.js` | - |

### Python Wrapper Script（start.cjs）

```javascript
const { spawn } = require('child_process');
const proc = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
  cwd: __dirname, stdio: 'inherit', windowsHide: true
});
proc.on('close', (code) => process.exit(code));
```

---

## Command File Templates（Minimal Content）

### pm2-all.md（Start all + monit）
```markdown
すべてのサービスを起動し、PM2 monitor を開く。
\`\`\`bash
cd "{PROJECT_ROOT}" && pm2 start ecosystem.config.cjs && start wt.exe -d "{PROJECT_ROOT}" pwsh -NoExit -c "pm2 monit"
\`\`\`
```

### pm2-all-stop.md
```markdown
すべてのサービスを停止する。
\`\`\`bash
cd "{PROJECT_ROOT}" && pm2 stop all
\`\`\`
```

### pm2-all-restart.md
```markdown
すべてのサービスを再起動する。
\`\`\`bash
cd "{PROJECT_ROOT}" && pm2 restart all
\`\`\`
```

### pm2-{port}.md（Start single + logs）
```markdown
{name}（{port}）を起動し、ログを開く。
\`\`\`bash
cd "{PROJECT_ROOT}" && pm2 start ecosystem.config.cjs --only {name} && start wt.exe -d "{PROJECT_ROOT}" pwsh -NoExit -c "pm2 logs {name}"
\`\`\`
```

### pm2-{port}-stop.md
```markdown
{name}（{port}）を停止する。
\`\`\`bash
cd "{PROJECT_ROOT}" && pm2 stop {name}
\`\`\`
```

### pm2-{port}-restart.md
```markdown
{name}（{port}）を再起動する。
\`\`\`bash
cd "{PROJECT_ROOT}" && pm2 restart {name}
\`\`\`
```

### pm2-logs.md
```markdown
全 PM2 ログを表示する。
\`\`\`bash
cd "{PROJECT_ROOT}" && pm2 logs
\`\`\`
```

### pm2-status.md
```markdown
PM2 ステータスを表示する。
\`\`\`bash
cd "{PROJECT_ROOT}" && pm2 status
\`\`\`
```

### PowerShell Scripts（pm2-logs-{port}.ps1）
```powershell
Set-Location "{PROJECT_ROOT}"
pm2 logs {name}
```

### PowerShell Scripts（pm2-monit.ps1）
```powershell
Set-Location "{PROJECT_ROOT}"
pm2 monit
```

---

## Key Rules

1. **Config file**: `ecosystem.config.cjs`（`.js` ではない）
2. **Node.js**: bin path を直接指定 + interpreter を明示
3. **Python**: Node.js wrapper script + `windowsHide: true`
4. **Open new window**: `start wt.exe -d "{path}" pwsh -NoExit -c "command"`
5. **Minimal content**: 各コマンドファイルは 1-2 行説明 + bash block
6. **Direct execution**: AI 解析不要、bash コマンドをそのまま実行

---

## Execute

`$ARGUMENTS` に基づき init を実行する:

1. サービスを走査
2. `ecosystem.config.cjs` を生成
3. Python サービス向け `{backend}/start.cjs` を生成（必要時）
4. `.claude/commands/` にコマンドファイルを生成
5. `.claude/scripts/` にスクリプトファイルを生成
6. **プロジェクトの CLAUDE.md に PM2 情報を更新**（下記）
7. **完了サマリーをターミナルコマンド付きで表示**

---

## Post-Init: Update CLAUDE.md

ファイル生成後、プロジェクト `CLAUDE.md` に PM2 セクションを追記（無ければ作成）:

```markdown
## PM2 Services

| Port | Name | Type |
|------|------|------|
| {port} | {name} | {type} |

**Terminal Commands:**
\`\`\`bash
pm2 start ecosystem.config.cjs   # First time
pm2 start all                    # After first time
pm2 stop all / pm2 restart all
pm2 start {name} / pm2 stop {name}
pm2 logs / pm2 status / pm2 monit
pm2 save                         # Save process list
pm2 resurrect                    # Restore saved list
\`\`\`
```

**Rules for CLAUDE.md update:**
- PM2 セクションが既存なら置換
- 無ければ末尾に追記
- 内容は最小限かつ本質のみ

---

## Post-Init: Display Summary

すべてのファイル生成後、次を出力:

```
## PM2 Init Complete

**Services:**
| Port | Name | Type |
|------|------|------|
| {port} | {name} | {type} |

**Claude Commands:** /pm2-all, /pm2-all-stop, /pm2-{port}, /pm2-{port}-stop, /pm2-logs, /pm2-status

**Terminal Commands:**
# First time (with config file)
pm2 start ecosystem.config.cjs && pm2 save

# After first time (simplified)
pm2 start all          # Start all
pm2 stop all           # Stop all
pm2 restart all        # Restart all
pm2 start {name}       # Start single
pm2 stop {name}        # Stop single
pm2 logs               # View logs
pm2 monit              # Monitor panel
pm2 resurrect          # Restore saved processes

**Tip:** Run `pm2 save` after first start to enable simplified commands.
```
