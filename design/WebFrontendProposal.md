# Web Frontend Proposal for RetroQuest

This document presents three prototype designs for a web-based frontend for RetroQuest, along with tech stack recommendations and a final recommendation.

## Table of Contents

- [Current Architecture Analysis](#current-architecture-analysis)
- [Proposal A: Classic Terminal](#proposal-a-classic-terminal)
- [Proposal B: Point-and-Click Hybrid](#proposal-b-point-and-click-hybrid)
- [Proposal C: Storybook / Chat Style](#proposal-c-storybook--chat-style)
- [Interaction Design Comparison](#interaction-design-comparison)
- [Tech Stack Recommendations](#tech-stack-recommendations)
- [Final Recommendation](#final-recommendation)

---

## Current Architecture Analysis

The existing RetroQuest codebase has a clean separation between the game engine and UI layers:

- **Game Engine** (`engine/Game.py`, `engine/GameState.py`, `engine/CommandParser.py`) — handles all game logic, command parsing, room navigation, quests, inventory, and spells.
- **GameController** (`engine/textualui/GameController.py`) — a thin adapter that formats engine data for presentation. Its docstring explicitly notes it was "_kept intentionally thin; avoids UI dependencies so it can be reused by other front ends in future (e.g., web or curses)_."
- **Theme system** (`engine/theme.py`) — maps semantic tags like `[character_name]`, `[item_name]`, `[exits]` to style definitions, which can be translated to CSS classes.

This architecture makes it straightforward to add a web frontend: the game engine and controller remain as the backend, exposed via a lightweight API, with the web frontend consuming that API.

---

## Proposal A: Classic Terminal

**Design philosophy:** Faithful to the text-adventure heritage. A split-pane layout with a terminal-style main area and a persistent sidebar. Feels like a modern terminal emulator running a text adventure.

![Proposal A: Classic Terminal](web-frontend-proposal/proposal-a-classic-terminal.png)

### Layout

| Area | Description |
|------|-------------|
| **Header** | Game title with Save/Load/Help buttons |
| **Room Panel** (top-left) | Current room description with themed characters, items, and exits |
| **Output Panel** (bottom-left) | Scrolling command history with `>` prompts and color-coded responses |
| **Sidebar** (right) | Active quests, inventory, and spells in collapsible sections |
| **Input Bar** (bottom) | Terminal-style `>` prompt with Tab autocomplete hint |

### Interaction Model

- **Keyboard-first**: Type commands in the input bar, press Enter to submit
- **Tab autocomplete**: Mirrors the existing Textual UI `NestedSuggester` — typing `go no` shows a ghost hint `go north` that completes on Tab
- **Command history**: Up/Down arrows recall previous commands
- **Mouse**: Sidebar panels are read-only; buttons in header for Save/Load/Help

### Strengths

- Closest to the existing Textual TUI — low friction for current players
- Monospace font preserves the retro aesthetic
- Very fast for experienced text-adventure players
- Simple to implement; most logic maps 1:1 from the Textual UI

### Weaknesses

- Intimidating for new players unfamiliar with text adventures
- No discoverability — players must know which commands exist
- Pure keyboard interaction may feel dated on mobile/touch devices

---

## Proposal B: Point-and-Click Hybrid

**Design philosophy:** Combines typed commands with clickable elements. Room entities (characters, items) and exits appear as interactive chips/buttons. Right-clicking or clicking an entity opens a context menu with relevant actions.

![Proposal B: Point-and-Click Hybrid](web-frontend-proposal/proposal-b-hybrid.png)

### Layout

| Area | Description |
|------|-------------|
| **Top Bar** | Branded header with navigation buttons |
| **Room Card** (top) | Room narrative in a card with clickable entity chips and exit buttons |
| **Context Menu** | Floating action menu when clicking an entity (Talk, Look, Give, Cast) |
| **Result Area** | Previous actions and their outcomes |
| **Sidebar** (right) | Quests, inventory, spells — items are hoverable/clickable |
| **Quick Actions** | Row of common command buttons (look, search, inventory, help) |
| **Input Bar** | Text input with Send button |

### Interaction Model

- **Click entities**: Clicking "👤 Mira" opens a context menu with actions (Talk to, Look at, Give item, Cast spell on)
- **Click exits**: Exit buttons directly navigate — clicking "↑ Market Road" sends `go north`
- **Quick-action bar**: One-click access to `look`, `search`, `inventory`, `spells`, `help`
- **Keyboard**: Full text input still available for power users
- **Inventory interaction**: Clicking inventory items could trigger `use`, `drop`, or `give` actions
- **Sidebar hover**: Hovering inventory/spell items shows tooltips with descriptions

### Strengths

- **Best discoverability** — new players can explore by clicking; no need to guess commands
- Dual input (mouse + keyboard) caters to both casual and experienced players
- Context menus present only valid actions for each entity
- Exit buttons make navigation intuitive and immediate

### Weaknesses

- More complex to implement — requires mapping entities to clickable elements
- Context menus need dynamic population based on game state
- Risk of feeling "cluttered" if room has many entities

---

## Proposal C: Storybook / Chat Style

**Design philosophy:** The game unfolds as a flowing conversation between player and narrator. Inspired by modern chat interfaces — player commands appear as right-aligned bubbles, game responses as left-aligned story cards. Character dialogue gets special avatar-decorated bubbles.

![Proposal C: Storybook / Chat Style](web-frontend-proposal/proposal-c-storybook.png)

### Layout

| Area | Description |
|------|-------------|
| **Top Bar** | Minimal: logo, current location badge, save/settings icons |
| **Story Flow** (center) | Scrolling chat-like feed with room cards, player bubbles, dialogue bubbles, and notification toasts |
| **Mini Sidebar** (right) | Icon-only sidebar that expands on click (quests, inventory, spells, map, help) |
| **Suggestion Chips** | Context-aware action suggestions above the input |
| **Input Bar** | Rounded chat-style input with send button |

### Interaction Model

- **Chat-style flow**: Each player command and game response is a distinct bubble in a scrolling conversation
- **Suggestion chips**: Dynamically generated based on current room context — e.g., "💬 Talk to Mira", "📜 Read Old Scroll", "🔍 Search fountain"
- **Inline exit buttons**: Exits appear as pill buttons within the room description card
- **Collapsible sidebar**: Icons-only by default; clicking an icon (📜, 🎒, ✨) expands a floating panel
- **Dialogue avatars**: Character dialogue gets special treatment with avatar icons and styled bubbles
- **Success/failure toasts**: Actions like picking up items show as notification-style bubbles

### Strengths

- **Most approachable** — feels like a modern chat app; zero learning curve
- Narrative immersion is strong; the story reads like a book
- Suggestion chips provide excellent discoverability without cluttering the UI
- Collapsible sidebar maximizes story area
- Distinct visual treatment for different response types (narration, dialogue, notifications)
- Mobile-friendly — single-column flow works on any screen size

### Weaknesses

- History can get very long — needs smart auto-scrolling and possibly a "new room" separator
- Room context scrolls out of view as the conversation grows (unlike Proposals A/B where the room panel is fixed)
- Suggestion chips require additional logic to generate context-aware actions

---

## Interaction Design Comparison

| Feature | A: Classic Terminal | B: Hybrid | C: Storybook |
|---------|:------------------:|:---------:|:------------:|
| Keyboard commands | ✅ Primary | ✅ Full | ✅ Full |
| Tab autocomplete | ✅ | ✅ | ✅ |
| Command history (↑↓) | ✅ | ✅ | ✅ |
| Clickable exits | ❌ | ✅ | ✅ |
| Clickable entities | ❌ | ✅ Context menu | ⚡ Suggestion chips |
| Quick-action buttons | ❌ | ✅ | ✅ Suggestion chips |
| Persistent room view | ✅ Fixed panel | ✅ Fixed card | ❌ Scrolls away |
| Mobile friendly | ⚠️ Passable | ⚠️ Sidebar tight | ✅ Excellent |
| New-player friendly | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Power-user efficiency | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Implementation effort | Low | Medium | Medium |

---

## Tech Stack Recommendations

### Option 1: Python Backend + Lightweight JS Frontend (Recommended)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | **FastAPI** (Python) | Async, lightweight, excellent WebSocket support. Wraps the existing `Game` / `GameController` with minimal glue code. |
| **Communication** | **WebSockets** | Real-time bidirectional; supports push notifications for quest events, popup equivalents, etc. |
| **Frontend** | **Vanilla JS + HTML/CSS** or **Alpine.js** | Minimal dependencies, fast to load, easy to maintain. Alpine.js adds reactivity without a build step. |
| **Styling** | **CSS custom properties** | Map the existing `theme.py` semantic tokens to CSS variables. |
| **Bundling** | **None** (or Vite for dev) | Keep it simple — serve static files from FastAPI. |

**Pros:** Stays in the Python ecosystem, reuses the engine directly, minimal new dependencies, fast iteration.
**Cons:** Limited frontend interactivity compared to a full SPA framework.

### Option 2: Python Backend + React/Vue SPA

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | **FastAPI** (Python) | Same as above. |
| **Communication** | **WebSockets** + REST | WebSocket for game events, REST for save/load. |
| **Frontend** | **React** or **Vue 3** | Component-based UI, excellent for complex interactive panels. |
| **Styling** | **Tailwind CSS** | Utility-first, rapid prototyping, consistent design tokens. |
| **Bundling** | **Vite** | Fast dev server, optimized production builds. |

**Pros:** Rich interactivity, strong ecosystem, easier to build complex features (context menus, drag-and-drop inventory).
**Cons:** Heavier toolchain, separate build step, JS/TS expertise required alongside Python.

### Option 3: Full Python with PyScript / Pyodide

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Runtime** | **Pyodide** / **PyScript** | Run the Python game engine directly in the browser via WebAssembly. |
| **Frontend** | **HTML/CSS** + PyScript bindings | Interact with DOM from Python. |

**Pros:** Single language (Python), no backend server needed, can run entirely client-side.
**Cons:** Large initial download (~15MB Pyodide runtime), limited library support (pygame won't work), immature ecosystem, poor performance for complex UIs.

### Option 4: Django + HTMX

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | **Django** or **Flask** | Server-rendered HTML with HTMX for dynamic updates. |
| **Communication** | **HTMX** (Ajax + SSE) | Partial page updates without writing JavaScript. |
| **Frontend** | **Server-rendered HTML** + HTMX attributes | Minimal JS, progressive enhancement. |

**Pros:** Very Pythonic, minimal JavaScript, server-side rendering is simple, good for the classic terminal style.
**Cons:** Less suitable for highly interactive UIs (context menus, drag-and-drop), WebSocket support is less natural.

---

## Final Recommendation

### UI Design: Proposal B (Point-and-Click Hybrid)

**Proposal B** strikes the best balance between discoverability and power:

1. **Easy to get started**: New players can click on characters, items, and exits without knowing any commands. The quick-action bar provides immediate access to common actions.
2. **Scales with expertise**: Experienced players can ignore the mouse entirely and type commands with full autocomplete support.
3. **Preserves the room context**: The fixed room card ensures players always see where they are and what's available, unlike the chat-style scrolling flow.
4. **Adapts to game complexity**: Context menus can dynamically show only valid actions per entity, reducing player confusion.

However, elements from **Proposal C** should be incorporated:
- **Suggestion chips** from Proposal C are excellent for discoverability and should replace or augment the quick-action bar
- **Dialogue avatar bubbles** from Proposal C should be used for character conversations to enhance immersion
- The **collapsible sidebar** concept from Proposal C could be offered as an option for smaller screens

### Tech Stack: Option 1 (FastAPI + Vanilla JS / Alpine.js)

This is recommended because:

1. **Minimal departure from current stack** — the backend is pure Python, directly importing and wrapping the existing game engine
2. **WebSocket-first** — enables real-time quest popups, room transitions, and sound effect triggers
3. **No build step required** — static HTML/CSS/JS files served by FastAPI; Alpine.js adds reactivity via HTML attributes without a bundler
4. **Low barrier to contribution** — no need to learn React/Vue; the frontend stays simple and readable
5. **Future upgrade path** — if the UI grows complex enough to warrant it, migrating to React/Vue later is straightforward since the WebSocket API layer already exists

### Architecture Sketch

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  ┌─────────────────────────────────────────┐ │
│  │     HTML/CSS + Alpine.js Frontend       │ │
│  │  (Room Card, Sidebar, Input, Popups)    │ │
│  └──────────────┬──────────────────────────┘ │
│                 │ WebSocket                   │
└─────────────────┼───────────────────────────┘
                  │
┌─────────────────┼───────────────────────────┐
│  FastAPI Server │                            │
│  ┌──────────────┴──────────────────────────┐ │
│  │     WebSocket Handler / REST API        │ │
│  └──────────────┬──────────────────────────┘ │
│  ┌──────────────┴──────────────────────────┐ │
│  │  GameController (existing, reused)      │ │
│  └──────────────┬──────────────────────────┘ │
│  ┌──────────────┴──────────────────────────┐ │
│  │  Game Engine (Game, GameState, etc.)    │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Next Steps

1. **Add a FastAPI WebSocket server** that wraps `GameController` with a JSON message protocol
2. **Build the Proposal B frontend** as static HTML/CSS/JS with Alpine.js for reactivity
3. **Translate `theme.py`** semantic tokens to CSS custom properties
4. **Implement clickable entities** by parsing room descriptions for character/item/exit tags
5. **Add context menus** that map entity types to valid commands
6. **Wire up quest popups** via WebSocket push messages
7. **Add save/load** via REST endpoints
