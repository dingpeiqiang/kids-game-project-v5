# Slots-Machine - Lucky Slot Game

A Phaser 3 slot machine game built with modern ES6+ JavaScript and [Vite](https://vitejs.dev/)
that includes hot-reloading for development and production-ready builds.

## 🚀 Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

### Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Start development server with hot-reloading |
| `npm run build` | Build production-ready bundle |
| `npm run preview` | Preview production build locally |
| `npm run clean` | Clean build output directory |

## Requirements

[Node.js](https://nodejs.org) >= 16.0.0 is required to install dependencies and run scripts via `npm`.

## Writing Code

After cloning the repo, run `npm install` from your project directory. Then, you can start the local development
server by running `npm run dev`.

After starting the development server, you can edit any files in the `src` folder
and Vite will automatically recompile and reload your server (available at `http://localhost:3005`
by default).

## Project Structure

```
slots-machine/
├── assets/           # Static assets (images, audio, fonts)
├── src/              # Game source code
│   ├── base_classes/ # Base classes
│   ├── base_scenes/  # Game scenes (Preload, Boot, Game)
│   ├── config.js     # Phaser configuration
│   ├── index.js      # Entry point
│   └── options.js    # Game options
├── dist/             # Build output (auto-generated)
├── index.html        # HTML template
├── vite.config.js    # Vite configuration
└── package.json      # Project configuration
```

## Technology Stack

- **Phaser 3.60.0**: Game engine
- **Vite 4.5**: Build tool and dev server
- **JavaScript (ES6+)**: Programming language

## Migration from Webpack

This project has been migrated from Webpack to Vite for faster development experience.
See [VITE_MIGRATION.md](./VITE_MIGRATION.md) for detailed migration notes.

## Deploying Code

After you run the `npm run build` command, your code will be built into optimized bundles 
located in the `dist/` folder along with all required assets.

If you put the contents of the `dist` folder in a publicly-accessible location 
(say something like `http://mycoolserver.com`), you should be able to open 
`http://mycoolserver.com/index.html` and play your game.
