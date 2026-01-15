# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**Behave Digital Factory** - CEO Command Center for orchestrating development tools, Sprites, and AI agents.

## Commands

```bash
# Development
npm run dev              # Astro dev server (port 4321)
npm run build            # Build to /dist
npm run preview          # Preview production build

# Shadcn Components
npx shadcn@latest add <component>   # Add a component
```

## Architecture

- **Framework**: Astro 5 + React 19 (Islands architecture)
- **Styling**: Tailwind CSS v4
- **Components**: Shadcn/ui (Mira style, emerald theme)
- **Database**: SQLite (dev) → PlanetScale Postgres (prod)

## Key Files

| File | Purpose |
|------|---------|
| `src/pages/index.astro` | Main dashboard page |
| `src/components/Dashboard.tsx` | CEO Command Center React component |
| `src/layouts/Layout.astro` | Base layout with Tailwind |
| `src/styles/global.css` | Tailwind imports |

## Infrastructure

| Service | Purpose | Status |
|---------|---------|--------|
| Fly.io Sprites | VM environments for Coder + workspaces | Active |
| `coder-control-plane` | Coder.com control plane sprite | Configuring |
| PlanetScale | PostgreSQL database | Configuring |
| Vercel | Frontend deployment | Pending |

## Sprite Commands

```bash
sprite list                              # List all sprites
sprite console -s <name>                 # SSH into sprite
sprite -s <name> exec -- <command>       # Run command on sprite
sprite url -s <name>                     # Get sprite URL
sprite create <name>                     # Create new sprite
```

## Current Sprint

1. [IN PROGRESS] Coder.com deployment to Sprites
2. [PENDING] Project/task tracking system (like Behave-Data-Platform)
3. [PENDING] Agent orchestration layer
4. [PENDING] CI/CD pipeline

## Import Aliases

```typescript
import { Component } from '@/components/Component'
import { cn } from '@/lib/utils'
```
