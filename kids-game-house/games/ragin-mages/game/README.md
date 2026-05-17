# Ragin' Mages Game

This is Game component of the project. It may be run independently from the server. If the server is not available, only single-player mode will be enabled.

**Note**: This project has been migrated to Vite for faster development and better module support.

## Installing

This project requires [Node.js and npm](https://nodejs.org/).

Install dependencies using npm:

```bash
npm install
```

## Running

### Development Mode (Vite)

The following command will start the Vite development server with hot module replacement:

```bash
npm start
```

The game will be available at http://localhost:3006. Any modifications to files in the `./src` folder will automatically trigger updates without a full page reload.

### Production Build

To build the game for production:

```bash
npm run build
```

The built files will be output to the `./build` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Legacy Commands (Gulp - Deprecated)

The project previously used Gulp as the build tool. These commands are no longer available:
- ~~`yarn start`~~ - Use `npm start` instead
- ~~`yarn build`~~ - Use `npm run build` instead
