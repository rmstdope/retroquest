# TypeScript engine — implementation plan

Goal: rewrite the Python game engine and the act content in TypeScript so the web
frontend runs the game natively. The Textual/prompt UIs, pygame audio and the Pyodide
loader go away; only the Vue web app remains.

## Ground rules

- Every step is its own branch and PR: tests first (TDD), all pre-merge checks from
  `CLAUDE.md` green, independent review before merge.
- The Python code stays untouched and remains the shipped engine until the bridge is
  switched (step 10). `main` is always shippable.
- The pytest suite is ported alongside the code it covers, so the TS version has the
  same safety net (component tests per room/item/character/quest, golden-path
  integration test per act).
- Engine markup (`[item_name]…[/item_name]` etc.) is unchanged: the web UI already
  parses it (`web/src/utils/theme.ts`).

## Decisions (agreed with the navigator)

- **Layout**: one package, the web app. Engine in `web/src/engine/`, content in
  `web/src/act1/` … `web/src/act4/` (rooms/items/characters/quests/spells like today).
  Tests are colocated (`Foo.test.ts`) as the web code already does.
- **API**: idiomatic TypeScript. camelCase methods (`useWith`, `talkTo`, `castOnItem`,
  `checkTrigger`…); `getName()`/`getShortName()`/`getDescription()` become the fields
  `name`, `shortName`, `description`; `Room.search(gameState)` loses the unused
  `_target` parameter (every room override drops it too); story flags stay string
  constants per act.
- **Save/load**: a generic serializer in the engine walks the `GameState` graph and
  writes JSON (`{version, actIndex, state}`) with a class registry: each act exports
  its classes, objects are written as `{$c: "ClassName", …own fields}` with `$ref`
  for shared objects, and restored with `Object.create(Cls.prototype)` so no
  per-class code is needed. The registry key is explicit (never `constructor.name`,
  which minification breaks). Old pickle saves in browsers are not carried over.
- **Act 4**: the existing stub (rooms/items/one character, no quests, not wired into
  the game) is ported as-is.
- **Removed with the port**: `Audio.py`/pygame (the web plays music from
  the controller's music info), `theme.py` (`apply_theme` was for Rich), `Room.enter()` printing,
  `dev_execute_commands`, listing `.txt` files for completion, pickle files on disk.
  `save`/`load` typed commands validate the name and go to an injectable
  `SaveStorage` (in-memory by default; the bridge keeps using `localStorage`).
  `cheat act N` stays.

## Steps

### Phase 1 · Engine (`web/src/engine/`)

1. Model classes: `Item`, `Character`, `Spell`, `Quest`, `Room`, `Act`, `GameState`
   with tests ported from `tests/retroquest/engine/test_GameState.py` and
   `test_Room.py`.
2. `Game` (run-state machine, commands, completions) and `CommandParser`, tests ported
   from `test_Game.py` and `test_CommandParser.py`.
3. `GameController` (the read model the bridge uses: quests, inventory, room data,
   progress, stats, music), tests from `test_GameController.py`.
4. Save serializer + class registry, round-trip tests, tests from
   `test_GameSaveLoadAct.py`.

### Phase 2 · Content

5. Act 1: story flags, spells, items, characters, rooms, quests, `Act1`, then the
   golden-path integration test. Split into 2–3 PRs if the review gets too large
   (items+spells / characters+rooms / quests+act+integration).
6. Act 2, same shape.
7. Act 3, same shape.
8. Act 4 stub.
9. Registry completeness test: every class file under `web/src/act*/` is in its act's
   registry; each golden path ends with a save/load round-trip.

### Phase 3 · Switch and cleanup

10. `useBridge.ts` runs the TS `Game` directly (no Pyodide, no `/python-src/`,
    no loading screen wait); e2e tests updated; `pythonSourcePlugin` keeps serving
    audio and icons only (renamed). Old pickle saves in storage are discarded with a
    plain message.
11. Delete `src/`, `tests/`, `pyproject.toml`, `MANIFEST.in`, `scripts/check_line_length*`,
    the Python CI job; move audio under `web/`; update `README.md`, `web/README.md`,
    `CLAUDE.md` (Python formatting rules → TS equivalents).
