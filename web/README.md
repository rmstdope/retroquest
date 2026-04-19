# RetroQuest Web Frontend

Browser-based frontend for RetroQuest, running the Python game engine in-browser via Pyodide.

## Tech Stack

| Tool | Purpose |
|---|---|
| [Vue 3](https://vuejs.org/) | UI framework (Composition API, `<script setup>`) |
| [Vite](https://vite.dev/) | Build tool and dev server |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Pinia](https://pinia.vuejs.org/) | State management |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [Pyodide](https://pyodide.org/) | Python runtime in the browser (via CDN) |
| [Vitest](https://vitest.dev/) | Unit tests |
| [Playwright](https://playwright.dev/) | End-to-end tests |
| [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) | Linting and formatting |

## Prerequisites

- Node.js 22 LTS or later
- npm 10 or later

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server (opens browser automatically)
npm run dev
```

The game loads at `http://localhost:5173`. Pyodide and the Python source files are fetched on first load — this takes 30–60 seconds depending on network speed.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check and build for production (output: `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests (starts dev server automatically) |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Project Structure

```
web/
├── src/
│   ├── assets/          # Global CSS (Tailwind theme)
│   ├── components/      # Vue components
│   ├── composables/     # Reusable logic (useBridge, useMusic, useEntityMenu)
│   ├── stores/          # Pinia store (useGameStore)
│   └── utils/           # Shared utilities (theme)
├── e2e/                 # Playwright E2E tests
├── vite-plugins/        # Custom Vite plugin (serves Python source files)
├── index.html           # Entry point
├── vite.config.ts
└── playwright.config.ts
```

## How It Works

The Python game engine runs entirely in the browser via [Pyodide](https://pyodide.org/). On startup, `useBridge.ts` fetches the Python source tree from `/python-src/` (served by `pythonSourcePlugin`) and loads it into Pyodide's virtual filesystem. Commands typed in the UI are passed to `GameController` running in Python, and the output is rendered as HTML.
