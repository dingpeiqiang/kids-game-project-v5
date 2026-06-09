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

kids-game-simple - A collection of 20+ mini-games for children, built with HTML5 Canvas and Phaser 3.

**Design Philosophy**: Casual, fun, visually appealing games with Chinese cultural themes. Games should be easy to pick up but have depth.

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
- Each game is a separate file in `src/games/`
- All games export an `initXxx(engine, onEnd)` function
- Games receive a `GameEngine` instance for score/combo management
- Games call `onEnd()` when finished to return to menu

### Core Services (`src/services/`)
- `gameEngine.ts` - Score, combo, buff system. All games should use this.
- `audio.ts` - Sound effects (click, win, pop, etc.)
- `storage.ts` - LocalStorage wrapper for user data
- `userService.ts` - User management

### Game Types
- **Canvas 2D** (most games) - Pure Canvas API, custom render loop
- **Phaser 3** (spaceShooter, towerDefense) - Phaser game engine with CanvasTexture rendering

### Data Files (`src/data/`)
- `games.ts` - Game metadata (name, description, tags)
- `game-config.ts` - Display configuration (visibility, order, badges)
- `powerups.ts` - Power-up definitions

## Development Patterns

### Adding a New Game
1. Create `src/games/xxx.ts` with `initXxx(engine, onEnd)` export
2. Add to `src/games/index.ts`
3. Add entry to `GAMES` array in `src/data/games.ts`
4. Add to `GAME_DISPLAY_CONFIG` in `src/data/game-config.ts`
5. Add guide to `GAME_GUIDES` in `src/data/games.ts`

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

- `src/App.ts` - Main app, game selection, navigation
- `src/games/dragonShooter.ts` - Dragon shooting game (most recently updated)
- `src/games/spaceShooter.ts` - Space shooter with Phaser
- `src/services/gameEngine.ts` - Score/combo/buff system
- `src/data/games.ts` - Game catalog

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