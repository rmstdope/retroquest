# RetroQuest Web Frontend

Browser-based frontend for RetroQuest: the game engine and the acts are TypeScript and run in the page.

## Tech Stack

| Tool | Purpose |
|---|---|
| [Vue 3](https://vuejs.org/) | UI framework (Composition API, `<script setup>`) |
| [Vite](https://vite.dev/) | Build tool and dev server |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Pinia](https://pinia.vuejs.org/) | State management |
| Plain CSS | Styling: scoped styles per component, Lantern tokens in `src/lantern/lantern.css` |
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

The game loads at `http://localhost:5173` and starts at once.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Type-check and build for production (output: `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests (starts its own dev server on `E2E_PORT`, default 5173, and fails if that port is taken; set `E2E_PORT` to run alongside `npm run dev`) |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Project Structure

```
web/
├── src/
│   ├── engine/          # The game engine (Game, GameState, Room, Item, …, saves)
│   ├── act1/ … act4/    # The acts: rooms, items, characters, quests, spells, tests
│   ├── components/      # Vue components (the Lantern UI in lantern/)
│   ├── lantern/         # Lantern tokens and styles (lantern.css), parsers and helpers
│   ├── composables/     # Reusable logic (useBridge, useMusic, useCommandCompletion)
│   ├── stores/          # Pinia store (useGameStore)
│   ├── testing/         # Shared helpers for the act tests
│   └── utils/           # Shared utilities (theme)
├── public/              # Audio tracks, icons and the web manifest
├── e2e/                 # Playwright E2E tests
├── index.html           # Entry point
├── vite.config.ts
└── playwright.config.ts
```

## How It Works

The game engine (`src/engine/`) and the acts (`src/act1/` …) are plain TypeScript classes. `useBridge.ts` creates a `Game` with the acts and a `GameController` (the read model for the UI); commands typed in the UI go through the controller to the command parser, and the engine's markup answers are rendered as HTML. Saves are JSON made by the engine's serializer and kept in the browser's storage (a quick save, eight slots and named saves). See `docs/typescript-engine-plan.md` and `docs/typescript-porting-guide.md` for how the engine and acts were ported from Python.
