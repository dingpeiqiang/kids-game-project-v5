# Agent Town - Vite Migration Guide

## Overview

Agent Town has been successfully migrated from Next.js to Vite + React. This migration provides faster development experience, simpler configuration, and better performance.

## Changes Made

### 1. Build System
- **Before**: Next.js with webpack (internal)
- **After**: Vite with @vitejs/plugin-react

### 2. Entry Point
- **Before**: `app/page.tsx` and `app/layout.tsx` (Next.js App Router)
- **After**: `index.html` → `src/main.tsx` → `src/App.tsx`

### 3. Development Server
- **Before**: `tsx server.ts` (custom Next.js server with WebSocket proxy)
- **After**: `vite` (Vite dev server with built-in HMR)

### 4. Removed Next.js Dependencies
- Removed `next/dynamic` → replaced with React.lazy + Suspense
- Removed `next/image` → replaced with standard `<img>` tags
- Removed `next/font/google` → replaced with Google Fonts CDN link
- Removed Next.js API routes → created utility functions (may need backend implementation)

### 5. Configuration Files
- Added: `vite.config.ts` - Vite configuration with React plugin and proxy settings
- Added: `index.html` - HTML entry point
- Added: `src/main.tsx` - React application entry point
- Added: `src/App.tsx` - Main application component
- Added: `src/vite-env.d.ts` - Vite type declarations
- Updated: `tsconfig.json` - Removed Next.js specific settings
- Updated: `package.json` - Changed scripts and added Vite dependencies

### 6. Environment Variables
- Added: `.env` file for environment configuration
- Updated: `vite.config.ts` to properly handle environment variables

## Running the Application

### Development Mode
```bash
npm run dev
# or
pnpm dev
```

The application will start on http://localhost:3000 (or next available port)

### Build for Production
```bash
npm run build
# or
pnpm build
```

### Preview Production Build
```bash
npm run preview
# or
pnpm preview
```

## Important Notes

### WebSocket Proxy
The Vite configuration includes a proxy for WebSocket connections:
- `/api/gateway` → proxied to `GATEWAY_URL` (default: ws://127.0.0.1:18789/)

### API Routes
Next.js API routes have been converted to utility functions. Some features like agent discovery may require a separate backend server in production.

### Removed Files
The following Next.js-specific files are no longer used but kept for reference:
- `server.ts` - Custom Next.js server
- `server.prod.mjs` - Production server
- `next.config.ts` - Next.js configuration
- `app/layout.tsx` - Next.js layout component
- `app/page.tsx` - Next.js page component

## Migration Checklist

- ✅ Created Vite configuration
- ✅ Updated package.json scripts and dependencies
- ✅ Created HTML entry point
- ✅ Created React entry point (main.tsx)
- ✅ Migrated App component
- ✅ Updated TypeScript configuration
- ✅ Replaced Next.js Image component with standard img
- ✅ Replaced Next.js dynamic imports with React.lazy
- ✅ Added Google Fonts via CDN
- ✅ Configured environment variables
- ✅ Updated CSS to use CDN fonts
- ✅ Tested development server

## Future Improvements

1. **Backend API**: Implement a proper backend API for agent discovery and other server-side operations
2. **Production Deployment**: Configure proper production deployment with a Node.js server if needed
3. **WebSocket Handling**: Consider implementing WebSocket handling in a separate backend service
4. **SSR**: If server-side rendering is needed, consider using a framework like Remix or implementing custom SSR

## Troubleshooting

### Port Already in Use
Vite will automatically try the next available port if 3000 is in use.

### Module Not Found Errors
Make sure all dependencies are installed:
```bash
pnpm install
```

### TypeScript Errors
Clear TypeScript cache and rebuild:
```bash
rm -rf node_modules/.vite
pnpm dev
```

## Support

For issues related to the Vite migration, please check:
- [Vite Documentation](https://vitejs.dev/)
- [Vite React Plugin](https://github.com/vitejs/vite-plugin-react)
