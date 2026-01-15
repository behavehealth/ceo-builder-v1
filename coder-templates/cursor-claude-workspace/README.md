# Cursor + Claude Code Workspace

A Coder workspace template pre-configured with:

- **Claude Code CLI** - AI-powered coding assistant
- **code-server** - VS Code in browser
- **Node.js 20** - JavaScript runtime
- **Git** - Version control

## Usage

### Browser (code-server)
Click the "code-server" button in your workspace to open VS Code in your browser.

### Cursor (Desktop)
1. Install [Cursor](https://cursor.sh) locally
2. Install Coder CLI: `curl -fsSL https://coder.com/install.sh | sh`
3. Login: `coder login https://coder-control-plane-jmur.sprites.app`
4. Connect: `coder ssh <workspace-name>`
5. In Cursor: `Remote-SSH: Connect to Host...` → `<workspace-name>`

### Claude Code
SSH into your workspace and run:
```bash
cd ~/workspace
claude
```

## What's Pre-installed

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x | JavaScript runtime |
| npm | Latest | Package manager |
| Claude Code | Latest | AI coding assistant |
| Git | Latest | Version control |

## Repository

The workspace automatically clones: `https://github.com/behavehealth/ceo-builder-v1.git`
