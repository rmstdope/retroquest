# Instructions

This document outlines the design rules and guidelines for both the game story and the implementation of the game, focusing on key design patterns, technical considerations, and content guidelines to ensure a cohesive and engaging player experience.

RetroQuest is a TypeScript web application. The game engine (`web/src/engine/`), the acts (`web/src/act1/` … `web/src/act4/`) and the Vue 3 user interface (`web/src/components/`, `web/src/stores/`, `web/src/composables/`) all live under `web/` and run in the browser. There is no server-side code.

## Skills Usage

Always select the appropriate skill for a specific task. Be sure to ALWAYS explicitly write in the chat what skills that are currently being used. Always follow the instructions in the skills to the letter.

## Development Practices

### Small Increments

The application shall ALWAYS be developed in very small, manageable increments that can be delivered independently. Each increment should add a specific feature or improvement to the application. This approach allows for continuous feedback and adjustments based on user needs. The code base should ALWAYS have a great safety net of tests to ensure that new changes do not break existing functionality.

### Test-driven Development (TDD)

In the development process, the application should be developed using Test-driven Development (TDD) principles. Always use the test-driven-development skill when writing code. This means that you should write tests before writing the actual implementation code. This should be the case also when fixing bugs. First write a test that reproduces the bug, then fix the bug and verify that the test passes along with all existing tests.
However, when trying to pinpoint a bug, you are free to add any traces, try fixes or anything else without having to write tests for that immediately. But once the issue has been pinpointed, either update existing tests or add a new test that triggers the error before applying the fix. This ensures no unnecessary modifications are done and helps to prevent regressions in the future.

### Collaboration

Always seek clarification from the navigator when requirements are ambiguous. Use the question UI/tool with predefined answers when possible, and a free-text option when necessary.

### Design

Always prefer simple design solutions. Avoid over-engineering. If unsure, ask the navigator for clarification. The design should be easy to change if need be.

### Four eye Principle

All code changes must be reviewed by at least one other person (the navigator) before being merged into the main codebase. This practice helps to catch potential issues, improve code quality, and ensure adherence to coding standards and best practices. No automatic merging of code changes without review is allowed.
Always ensure all pre-merge checks pass before merging any code changes to ensure that new changes do not introduce regressions or break existing functionality. NEVER merge code changes that have not passed all tests.

### Issues and branches

When starting to work on any feature that exists as a github issue, assign that feature to the user that is working on it. Each feature should have a corresponding issue in the issue tracker that describes the work to be done.

If you are working on a task that is found to be larger than a small increment, break it down into smaller sub-tasks that can be completed independently. Each sub-task should have its own issue in the issue tracker and should be linked back to the main task issue for traceability. Prefix the sub-issues with "Sub-issue (<<issue-number>>):" to clearly indicate their relationship to the main feature issue. <<issue-number>> should be replaced with the main issue number.
All sub-issues should be linked back to the main issue in their description to maintain clear traceability. Vice versa, all main issues should reference their sub-issues.

When working on an issue, this is important:

- ALWAYS assign the issue to the developer working on it.
- ALWAYS create a new branch from **the latest main** (unless instructed otherwise) named after the issue number and a short description of the work to be done, e.g., `42-add-user-authentication`. Run `git checkout main && git pull origin main` before branching. Once the work is completed and reviewed, merge the branch back into main using a pull request.
- ALWAYS create a pull request (PR) for merging the sub-issue branch back into main.
- Before creating the PR, ALWAYS make sure all pre-commit checkpoints pass (see "Pre-merge Checklist" below) and ALWAYS ask the navigator to review and approve the PR. Even if any issue existed previously, it shall be fixed before merging. Do not merge any code that has known issues, even if they existed before.
- ALWAYS merge an issue branch back into main before starting to work on another issue. This ensures that the latest changes are always incorporated and reduces the risk of merge conflicts.

When a PR is merged, the issue should be closed and the branch deleted to keep the repository clean and organized. If the issue is a sub-issue of a larger feature, ensure that the main issue is updated with relevant information about the progress made and that it is closed when all sub-issues are completed.
When a sub-issue is closed, the main issue's description should be updated to reflect the completion of that sub-issue and any remaining work that needs to be done on the main issue.

### Github CLI

Use the command line command 'gh' for interacting with github issues. Be careful with quoting when using gh. NEVER use backticks in the text with gh and use real newlines instead of \n.
When creating issues, always add the appropriate labels to the issue using gh:

- bug - for all bugs
- enhancement - for any feature development
- documentation - for changes to docs, design documents or instructions
- engine - for anything in the game engine (web/src/engine)
- act1, act2, act3, act4 - for anything that has to do with a specific act
- story - for story and narrative design
- web - for the Vue user interface
- refactoring - for anything that has to do with refactoring the codebase
- testing - for anything that has to do with testing
- enhanced - for issues created or updated with AI assistance workflows

### Definition of Done

For any completed issue workflow task, the following is mandatory:

- After creating a GitHub issue, ALWAYS run a `self-learning-skills` retrospective automatically.
- After an issue is merged and closed, ALWAYS run a `self-learning-skills` retrospective automatically.
- In that retrospective, ALWAYS ask the navigator for feedback and update skill documentation immediately when improvements are identified.

## Hard Formatting & Static Rules (Enforced)

These MUST be satisfied for every TypeScript and Vue file. Pull requests must explicitly state:
"Formatting constraints verified".

1. Prettier is the formatter. Every file under `web/src/` (and the config files in `web/`) must be formatted exactly as `npx prettier --write` leaves it; CI runs `npx prettier --check` and fails on any difference.
2. ESLint must pass with zero errors and zero warnings (`npx eslint .` in `web/`).
3. The type check must pass (`npx vue-tsc --noEmit` in `web/`). Never use `any` under `web/src/`; prefer precise types, `unknown` with narrowing, or a small type guard.
4. No ESLint or TypeScript inline directives (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`) in the code. All lint and type configuration is global (`web/eslint.config.js`, `web/tsconfig.json`). The single accepted exception is `<!-- eslint-disable vue/no-v-html -->` in a Vue template that renders HTML produced by the engine's markup parser.
5. Unused parameters must be prefixed with an underscore (e.g., `_gameState`), which is the only way ESLint lets them through.
6. Overridden methods are marked `override` (`noImplicitOverride` makes the type check enforce this). New or changed overrides carry a `/** … */` doc comment explaining what the override does differently.
7. Every exported class, function and type has a `/** … */` doc comment; every content file (room, item, character, quest, spell) has a `/** … */` comment directly above its class.
8. Long narrative strings are split on sentence or clause boundaries and joined with `+` (or written as template literals); never split inside a word, and never change existing wording, punctuation or `[markup]` tags unless the change is the point of the task.

Violation of any item is grounds for rejection in code review / CI.

### Developer Completion Checklist (Must Pass Before Commit)

For every TypeScript / Vue file, ensure:

- [ ] Formatted with Prettier (`npm run format` in `web/`).
- [ ] No ESLint errors or warnings.
- [ ] Type check passes.
- [ ] All overrides marked `override` and documented.
- [ ] Unused parameters underscored.
- [ ] Doc comments updated to reflect changes.
- [ ] New or changed behaviour covered by a vitest test next to the code.

### Pre-merge Checklist (Must Pass Before Creating a PR)

Before creating a pull request, run **all** of the checks below locally — they mirror the CI pipeline in `.github/workflows/ci.yml` exactly. NEVER open a PR or request a merge if any of these fail or produce warnings.

```sh
cd web
npm ci

# Lint
npx eslint .

# Format check (mirrors CI — fails if any file is not formatted)
npx prettier --check "src/**/*.{ts,vue}" "*.config.*"
# To auto-fix formatting issues, run the following and commit the result:
# npx prettier --write "src/**/*.{ts,vue}" "*.config.*"

# Type check
npx vue-tsc --noEmit

# Unit tests
npm run test

# E2E tests (requires Playwright browsers installed)
npx playwright install --with-deps chromium
npx playwright test

# Build
npm run build
```

Run each check as its own command and read its exit status; never chain them with `;` or pipe their output through `grep`, since that hides failures. If in doubt whether a check is relevant, run it anyway.

## Game Story Design Rules

### Narrative Structure

- Each act should have a main quest that drives the story forward, with side quests that enrich the world and characters.
- The story should unfold through a series of key events that reveal character backstories, world lore, and the overarching conflict.
- Each act should also have a number of side quests that provide additional context and depth to the main narrative.
- All side quests need to be completed before the main quest can be finished, ensuring players fully engage with the story.
- The design should describe a golden path through the story which contain all the steps needed to complete all quests, including the main quest and side quests.
- The design should also contain additional optional content that can be explored for deeper lore and character development.

### Character Development

- Characters should have distinct personalities, motivations, and arcs that evolve throughout the game.

### Dialogue

- Dialogue should be engaging and reflect the character's personality.
- Dialogue choices should impact relationships and story outcomes, allowing for player agency.

### World-Building

- The world should be rich with lore, with locations, items, and characters that contribute to the overall narrative.
- Locations should be interconnected, with logical transitions and exploration opportunities.

## Implementation Design Rules

### Architecture

- Use a modular architecture that allows for easy expansion and maintenance.
- Follow established design patterns for quest management, character interactions, and spell systems.
- Implement a centralized game state management system to track player progress, story flags, and inventory.
- The engine (`web/src/engine/`) owns all game rules: `Game` (run state, commands, save/load), `GameState`, `CommandParser`, `GameController` (the read model the UI consumes) and the base classes `Act`, `Room`, `Item`, `Character`, `Quest`, `Spell`.
- Each act is a directory `web/src/act<N>/` with `Act<N>.ts`, `Act<N>StoryFlags.ts`, `classes.ts` and the sub-directories `rooms/`, `items/`, `characters/`, `spells/` and (where the act has quests) `quests/`. See `docs/typescript-porting-guide.md` for the conventions in detail.
- The UI talks to the engine only through `GameController` and the `useBridge` composable; Vue components never import act classes (only `useBridge` loads the acts, as separate chunks).

### Quest Management

- Quests should be structured in a way that allows for branching paths and dependencies.
- Use a quest chain architecture where the main quest of an act is built up from all the side quests.
- Each quest should have clear objectives, rewards, and consequences that affect the game world and player choices.

### Spell System

- Spells should be learned through interactions with characters or found in the world.
- Implement a spell learning system that requires specific conditions to be met before a spell can be taught.
- Spells should have logical prerequisites and unlock in a way that feels natural to the player.

### Character Interactions

- Characters should have rich dialogues.
- Character states should change based on quest progress, affecting future interactions and story outcomes.

### Save/Load Compatibility

Saves are JSON produced by the engine's generic serializer and kept in the browser's storage. Every content class must stay serializable:

- Register every class of an act in the act's `classes.ts` (`ACT<N>_CLASSES`); the `classes.test.ts` of each act fails when one is missing.
- Keep all mutable state in declared class fields. TypeScript `private`/`protected` is fine, but never ECMAScript `#private` fields.
- No `Map`, `Set` or `Date` in a field; use plain objects and arrays.
- Fields may reference other content objects (items in rooms, items in wares); shared references and cycles are preserved.
- Changing the shape of engine save data requires bumping `SAVE_VERSION` in `Game.ts`; older saves are then rejected on load unless you add explicit migration for them.

### Technical Considerations

These instructions are mandatory for all code contributions to ensure consistency, maintainability, and quality across the codebase. It shall be taken into account when doing any edits in any TypeScript or Vue file.

- Ensure integration with existing systems, such as the `Game`, `GameState` and `Quest` base classes in `web/src/engine/`.
- Maintain compatibility with the user interface system and save/load functionality.
- Use object-oriented programming principles to encapsulate game logic and data.
- Create one class per file and name files according to the class they contain, exported as a named export (`export class Mira extends Character`).
- Import engine classes and types from `@/engine`; use relative paths for siblings inside an act. Use `import type` only when nothing is needed as a value (`instanceof` needs the value import).
- Use descriptive names for classes, methods, and variables to enhance readability and maintainability. Classes are `PascalCase`, methods, fields and variables `camelCase`, constants `UPPER_SNAKE_CASE`.
- Type every function signature (parameters and return type) explicitly; rely on inference only for local variables.
- Include `/** … */` doc comments for all modules, classes, functions and methods to explain their purpose and usage.
- Do not share code between acts; each act should be self-contained. All common functionality should be implemented in the engine module.
- Always update doc comments and other comments to reflect any changes made to the code.
- For files with multiple classes or functions, provide a somewhat more detailed file-level comment explaining the overall purpose and functionality of the module.
- Never use ESLint or TypeScript inline directives in the code (apart from the `vue/no-v-html` exception above). All lint configuration should be global.
- When mixing strings and variables, prioritize using template literals when constructing messages or dialogues.
- Methods that only some content classes implement (for example `receiveSpell` on a character) are detected with a structural check (a structural type assertion or an `in` check plus a `typeof` guard), never with `any`.

### Testing

- Tests use vitest and live next to the code they cover (`Foo.ts` → `Foo.test.ts`); Playwright end-to-end tests live in `web/e2e/`.
- All components in the engine should have extensive unit tests.
- Every component in every act should also have unit tests. These tests should test the dynamics and behavior of the component, e.g. dynamic dialogues and things that change in the component depending on actions. Try to mock as little as possible and instead use the real implementations where feasible; drive the real engine through `new Game([new Act1()])` and the helpers in `web/src/testing/gameHelpers.ts`.
- Use integration tests (`Act<N>.integration.test.ts`) to verify that all steps in the golden path of the act work as expected, that the act can be completed successfully and that all quests are properly integrated.
- Every act has a `classes.test.ts` that checks the class registry, and its integration tests should include a save/load round-trip through `Game.toSaveData`.

### Details

- Use `instanceof` when checking types, as it is more robust than comparing names or strings. Import the class as a value for that.
- Avoid using magic strings or numbers; instead, use constants (story flags live in `Act<N>StoryFlags.ts`) or enums to represent important values.
- Do not write prose as multi-line template literals (the indentation ends up in the text); split it into `+`-joined literals as rule 8 describes.

## Chat

In the chat, try to be concise when describing what you are about to do, what you are doing and what you have done. Avoid unnecessary verbosity. Focus on the key changes or additions you are making to the codebase. This helps in maintaining clarity and efficiency in communication.

## Communication with user

When asking questions to the user, always try to use the question UI/tool with pre-defined answers. This makes communication more efficient and reduces the risk of misunderstandings. If the question cannot be answered with predefined options there also need to be a free text option to use.
