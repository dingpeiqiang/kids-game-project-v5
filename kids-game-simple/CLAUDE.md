# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Principles (Karpathy-Inspired)

### 1. Think Before Coding
- **Don't assume. Don't hide confusion. Surface tradeoffs.**
- If uncertain, ask rather than guess
- Don't pick silently when ambiguity exists
- Name what's unclear and ask for clarification

### 2. Simplicity First
- **Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked
- No abstractions for single-use code
- No "flexibility" or "configurability" that wasn't requested
- If 200 lines could be 50, rewrite it

**The test**: Would a senior engineer say this is overcomplicated? If yes, simplify.

### 3. Surgical Changes
- **Touch only what you must. Clean up only your own mess.**
- Don't "improve" adjacent code, comments, or formatting
- Don't refactor things that aren't broken
- Match existing style, even if you'd do it differently
- If you notice unrelated dead code, mention it — don't delete it

When your changes create orphans:
- Remove imports/variables/functions YOUR changes made unused
- Don't remove pre-existing dead code unless asked

**The test**: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
- **Define success criteria. Loop until verified.**
- Transform vague tasks into verifiable goals:
  | Instead of... | Transform to... |
  |---------------|-----------------|
  | "Add validation" | "Write tests for invalid inputs, then make them pass" |
  | "Fix the bug" | "Write a test that reproduces it, then make it pass" |
  | "Refactor X" | "Ensure tests pass before and after" |

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

## Project Overview

kids-game-simple — 儿童向多游戏合集（30+），主工程在 `kids-game-simple/`。

| 维度 | 技术 |
|------|------|
| **2D** | Phaser 3 + 部分历史 Canvas 2D（保留，新 2D 优先 Phaser 或目录化脚手架） |
| **3D（新）** | **Babylon.js** + 共用 `src/engine3d/`；旧 **Three.js 3D 废弃重做**，勿再修补 |
| **壳** | Vite、TypeScript、Capacitor（Android） |

**设计取向**：轻松、好看、易上手；全站规范以仓库根目录 [AGENTS.md](../AGENTS.md) 为准。

**3D 上架**：未通过 AGENTS.md §7.3 的 3D 在 `GAME_DISPLAY_CONFIG` 中保持 `visible: false`。

## Build Commands

```bash
cd kids-game-simple
npm install          # Install dependencies
npm run dev          # Start dev server (port 5100)
npm run build        # Build for production
npm test             # Run tests (jest)
```

## Architecture

### Game Structure
- 游戏目录：`src/games/<gameId>/`（推荐）或历史单文件 `src/games/xxx.ts`
- **运行期入口**：`src/games/gameRegistry.ts` 的 `GAME_REGISTRY[id].init(engine, onEnd)`
- 模块可导出 `initXxx(engine, onEnd)`；App **不**直接扫 `index.ts`，以 Registry 为准
- 3D / Phaser 必须在 Registry 提供 **`destroy`**，切换游戏时释放 WebGL/引擎

### Core Services (`src/services/`)
- `gameEngine.ts` - Score, combo, buff system. All games should use this.
- `audio.ts` - Sound effects (click, win, pop, etc.)
- `storage.ts` - LocalStorage wrapper for user data
- `userService.ts` - User management

### Game Types
- **Canvas 2D** — 自管 `requestAnimationFrame`（历史游戏）
- **Phaser 3** — `spaceShooter`、`towerDefense` 等
- **3D（重做）** — Babylon + `engine3d`；勿新增 Three 游戏

### Data & config
- `src/data/games.ts` — `GAMES`、`GAME_GUIDES`（与 Registry 的 `game.id` 一致）
- `src/games/gameRegistry.ts` — `GAME_REGISTRY`、`GAME_DISPLAY_CONFIG`（可见性、排序、角标）
- `src/data/powerups.ts` — 道具定义

## Development Patterns

### Adding a New Game
1. 创建 `src/games/<gameId>/`（`index.ts` 导出 `initXxx(engine, onEnd)`，3D 加 `destroyXxx`）
2. 在 `GAME_REGISTRY` 增加条目（`init` 内 `await import('./<gameId>')`）
3. 更新 `GAME_DISPLAY_CONFIG`（未完成则 `visible: false`）
4. 同步 `src/data/games.ts` 的 `GAMES` / `GAME_GUIDES`
5. 可选：`src/games/index.ts` 再导出（非必须，Registry 已懒加载）
6. `npm run type-check`

### Game Loop Pattern (Canvas 2D)
```typescript
let lastTime = 0
function gameLoop(timestamp) {
  const dt = Math.min(0.033, (timestamp - lastTime) / 1000) // Cap at 30fps equivalent
  lastTime = timestamp

  // Update
  updateEntities(dt)
  spawnEnemies()

  // Render
  renderBackground()
  renderEntities()
  renderHUD()

  requestAnimationFrame(gameLoop)
}
```

### Performance Limits (Enforced)
- MAX_PARTICLES: 200
- MAX_BULLETS: 50
- MAX_POWERUPS: 10
- MAX_FLOAT_TEXTS: 30

### Dragon/Enemy Routes
For dragon-shooter style games, routes are predefined paths:
- `wave` - S-curve, beginner
- `sweep` - Left-right sweep, intermediate
- `spiral` - Small spirals, intermediate
- `dive` - Fast zigzag, advanced
- `boss` - Slow S-curve with pauses, boss levels

## Common Issues

### Touch/Mouse Input
Use unified handler pattern:
```typescript
function getPos(e: MouseEvent | Touch) {
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}
```

### Type Errors with TouchEvent
When adding both mouse and touch listeners, use explicit type guards:
```typescript
canvas.addEventListener('touchstart', (e: TouchEvent) => {
  e.preventDefault()
  const pos = getPos(e.touches[0])
  // ...
}, { passive: false })
```

## Testing

Tests are in `tests/` directory using Jest. Run specific test:
```bash
npm test -- --testPathPattern=dragonShooter
```

## Key Files to Know

- `src/App.ts` — 大厅、开局/结束、容器布局
- `src/games/gameRegistry.ts` — 游戏注册与展示配置（真相源）
- `src/services/gameEngine.ts` — 积分/连击/Buff
- `src/data/games.ts` — 目录文案与引导
- `src/engine3d/` — 新 3D 共用层（Babylon，随重做落地）

## Game Quality Checklist

Before completing a game feature, verify:

- [ ] **Balance**: Enemy HP/damage/speed scales appropriately with level
- [ ] **Feedback**: Hit effects, explosions, score popups are satisfying
- [ ] **Difficulty curve**: Easy start, gradual challenge increase
- [ ] **Performance**: Particle counts capped, no memory leaks
- [ ] **Mobile-friendly**: Touch controls responsive, no double-tap zoom
- [ ] **Win/lose conditions**: Clear and fair

## Dragon Shooter-Specific Guidelines

- Routes must be predefined paths (wave/sweep/spiral/dive/boss)
- Dragon death: segments retract inward, don't split into new dragons
- Progress 0→1 = top to bottom of screen
- Safe X boundaries: 100 to BASE_W - 100
- Speed units: verticalSpeed as progress/second (e.g., 0.08 = 12.5s to cross)