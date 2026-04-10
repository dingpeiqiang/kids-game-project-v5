# Battle City — Tank 1990

A fully playable replica of the classic **Battle City (Tank 1990)** arcade game built with
**Phaser 3 + React + TypeScript + Vite**.

---

## Quick Start

```bash
npm install
npm run dev          # → http://localhost:3000
npm run build        # Production build → dist/
```

---

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move |
| Space | Fire |
| ESC | Pause / Resume |
| R (pause) | Restart Level |
| M (pause) | Main Menu |

---

## Project Structure

```
tank-1990/
├── public/
│   └── assets/                  # Drop real PNG assets here
│       ├── tanks/
│       │   ├── tank_player.png
│       │   └── tank_basic.png
│       ├── bullets/
│       │   └── bullet.png
│       └── tiles/
│           └── tileset.png
│
├── src/
│   ├── types/
│   │   └── index.ts             # All shared TypeScript enums & interfaces
│   │
│   ├── game/
│   │   ├── config.ts            # Constants, PHASER_CONFIG, enemy stats
│   │   ├── EventBus.ts          # Typed Phaser ↔ React event bus
│   │   ├── TextureFactory.ts    # Procedural sprite generation (no PNG needed)
│   │   │
│   │   ├── scenes/
│   │   │   ├── BootScene.ts          # Generates textures, creates animations
│   │   │   ├── PreloadScene.ts       # Loads real assets (stubs if absent)
│   │   │   ├── MenuScene.ts          # Canvas bg + React MainMenu overlay
│   │   │   ├── GameScene.ts          # Full gameplay loop
│   │   │   └── GameOverScene.ts      # GameOverScene + LevelCompleteScene
│   │   │
│   │   ├── entities/
│   │   │   ├── Player.ts        # Player tank (input, firing, shield, ice)
│   │   │   ├── Enemy.ts         # Enemy tank wrapper + typed data bag
│   │   │   └── Bullet.ts        # Bullet physics image
│   │   │
│   │   ├── ai/
│   │   │   └── EnemyAI.ts       # State machine: Patrol / Chase / Base Rush
│   │   │
│   │   └── levels/
│   │       └── LevelLoader.ts   # 3 level grids + wave definitions
│   │
│   ├── ui/
│   │   ├── HUD.tsx              # In-game HUD (score, lives, enemies, stars)
│   │   ├── MainMenu.tsx         # Start-screen React component
│   │   └── PauseMenu.tsx        # Pause overlay
│   │
│   ├── App.tsx                  # Root: Phaser init + UI state machine
│   └── main.tsx                 # ReactDOM.createRoot entry
│
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Architecture Overview

### Phaser ↔ React Communication

A custom `EventBus` (typed event emitter) bridges the two runtimes:

```
Phaser (emits)           React (listens)
─────────────────────    ──────────────────────
hud-update  ────────────► HUD component re-renders
game-over   ────────────► App shows GameOver UI
game-paused ────────────► App shows PauseMenu
scene-ready ────────────► App updates layer state

React (emits)            Phaser (listens)
─────────────────────    ──────────────────────
resume-game ────────────► GameScene.doResume()
restart-game────────────► GameScene.doRestart()
menu-requested ─────────► GameScene.goMenu()
```

### Phaser Scenes

| Scene | Purpose |
|-------|---------|
| `Boot` | Generates all procedural textures + animations |
| `Preload` | Loads real PNG/JSON assets (stubs out gracefully) |
| `Menu` | Renders canvas BG; React `MainMenu` overlays it |
| `Game` | Core game loop — player, enemies, AI, collisions |
| `LevelComplete` | End-of-stage summary |
| `GameOver` | Final score + high score screen |

### Entity Classes

- **`Player`** — extends `Phaser.Physics.Arcade.Image`. Handles input, grid-snap, ice-sliding, shield timer, upgrades.
- **`Enemy`** — extends `Phaser.Physics.Arcade.Image`. Stores all state in Phaser's `setData()` bag. `takeDamage()` / `getSpriteBase()` as typed helpers.
- **`Bullet`** — thin `Phaser.Physics.Arcade.Image` wrapper. `isOutOfBounds()` used for OOB cleanup.

### Enemy AI (`EnemyAI`)

State-machine with three behaviours selected per-tick via weighted random:

| Behaviour | Trigger | Weight |
|-----------|---------|--------|
| `PATROL` | Default | varies |
| `CHASE` | Player within detection range | `0.28 + level×0.10` |
| `BASE_RUSH` | Random base targeting | `0.50 + level×0.05` |

Stuck detection: if an enemy doesn't move for 25 frames it forces a direction change.

---

## Adding Real Assets

1. Export your spritesheet as `public/assets/tanks/tank_player.png` (16×16 frames).
2. Uncomment the corresponding `this.load.*` lines in `PreloadScene.ts`.
3. Update `Player.ts` / `Enemy.ts` to use the loaded texture keys instead of procedural ones.

For Tiled tilemaps, export JSON to `public/assets/tilemaps/level1.json` and load in `PreloadScene.ts`.

---

## Evaluation Checklist (per assignment spec)

- [x] 3 fully playable levels with progressive difficulty
- [x] 3 enemy types (Basic, Fast, Armored) with distinct stats
- [x] Armored tank visually degrades across 4 hit states
- [x] 5 power-ups (Star, Shield, Bomb, Extra Life, Timer)
- [x] Eagle destruction = instant Game Over
- [x] Lives system (3 lives, carry between levels)
- [x] Enemy AI: Patrol / Chase / Base-Rush / Stuck-avoidance
- [x] All tile types: Brick (2-hit), Steel, Water, Trees, Ice
- [x] React HUD (score, lives, enemies, star level, shield)
- [x] Pause / Resume / Restart / Main Menu
- [x] High score persisted via `localStorage`
- [x] TypeScript with strict mode, no `any`
- [x] Modular architecture — separate files per concern
