# Instructions

This document outlines the design rules and guidelines for both the game story and the implementation the game, focusing on key design patterns, technical considerations, and content guidelines to ensure a cohesive and engaging player experience.

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

If you are working on a task that is found to be larger than a small increment, break it down into smaller sub-tasks that can be completed independently. Each sub-task should have its own issue in the issue tracker and should be linked back to the main task issue for traceability. Prefix the sub-issues with ""Sub-issue (<<issue-number>>):"" to clearly indicate their relationship to the main feature issue. <<issue-number>> should be replaced with the main issue number.
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

Use the comand line command 'gh' for interacting with github issues. Be careful with quoting when using gh. NEVER use backticks in the text with gh and use real newlines instead of \n.
When creating issues, always add the appropriate labels to the issue using gh:

- bug - for all bugs
- enhancement - for any feature development
- games - for anything that has to do with a specific game or games
- mapper - for anything that has to do with a specific mapper or mappers
- refactoring - for anything that has to do with refactoring the codebase
- testing - for anything that has to do with testing
- enhanced - for issues created or updated with AI assistance workflows

### Definition of Done

For any completed issue workflow task, the following is mandatory:

- After creating a GitHub issue, ALWAYS run a `self-learning-skills` retrospective automatically.
- After an issue is merged and closed, ALWAYS run a `self-learning-skills` retrospective automatically.
- In that retrospective, ALWAYS ask the navigator for feedback and update skill documentation immediately when improvements are identified.

## Hard Formatting & Static Rules (Enforced)

These MUST be satisfied for every Python file. Pull requests must explicitly state:
"Formatting constraints verified".

1. Maximum physical line length: 99 characters (count all characters including indentation).
2. Prefer keeping narrative lines ≤95 chars to allow safe future edits.
3. No tabs; indentation is 4 spaces.
4. No trailing whitespace anywhere.
5. Exactly one newline at end of file.
6. One-line module docstring for single-class modules (strictly one line, no wrapping).
7. All overridden methods (e.g., search, get_exits, gating helpers) require docstrings.
8. Unused parameters must be prefixed with an underscore (e.g., \_game_state, \_target).
9. Long prose must be wrapped by splitting into multiple adjacent string literals inside parentheses.
10. Avoid lines ending at 99 if possible; leave a small buffer for later wording refinements.

Violation of any item is grounds for rejection in code review / CI.

### Wrapping Guidance

When writing long narrative or return strings:

- Wrap inside a parenthesized block using multiple string literals.
- Break on sentence or clause boundaries; never split inside a word.
- Keep each physical line ≤99 chars including indentation.
- For f-strings nearing the limit, extract dynamic segments to variables first.

Example:

```
description = (
		"The hall extends into shadow, banners stirring in a draft that smells of old "
		"parchment and steel. A faint glow outlines a sealed archway ahead."
)
```

### Developer Completion Checklist (Must Pass Before Commit)

For every Python file, ensure:

- [ ] All lines ≤99 chars (`python scripts/check_line_length.py`).
- [ ] No tabs / no trailing whitespace.
- [ ] One-line module docstring where required.
- [ ] All custom overrides documented.
- [ ] Unused parameters underscored.
- [ ] Docstrings updated to reflect changes.

### Pre-merge Checklist (Must Pass Before Creating a PR)

Before creating a pull request, run **all** of the checks below locally — they mirror the CI pipeline in `.github/workflows/ci.yml` exactly. NEVER open a PR or request a merge if any of these fail.

#### Python (run when `src/`, `tests/`, or `pyproject.toml` changed)

```sh
# Run tests
pytest
```

#### Web (run when anything under `web/` changed)

```sh
cd web

# Lint
npx eslint .

# Format check
npx prettier --check "src/**/*.{ts,vue}" "vite-plugins/**/*.ts" "*.config.*"

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

If in doubt whether a check is relevant, run it anyway.

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

### Technical Considerations

These instructions are mandatory for all code contributions to ensure consistency, maintainability, and quality across the codebase. It shall be taken into account when doing any edits in any python file.

- Ensure integration with existing systems, such as Game.py, GameState.py, and Quest.py base classes.
- Maintain compatibility with the user interface system and save/load functionality.
- Uses object-oriented programming principles to encapsulate game logic and data.
- Create one class per file and name files according to the class they contain.
- Use descriptive names for classes, methods, and variables to enhance readability and maintainability.
- Use type hints for all function signatures to improve code clarity and facilitate static analysis.
- Include docstrings for all modules, classes, functions and methods to explain their purpose and usage.
- Follow PEP 8 style guidelines for Python code to ensure consistency across the codebase.
- Do not share code between acts; each act should be self-contained. All common functionality should be implemented in the engine module.
- Always update docstrings and comments to reflect any changes made to the code.
- For files with multiple classes or functions, provide a somewhat more detailed module docstring explaining the overall purpose and functionality of the module.
- Never use pylint inline directives in the code. All pylint configuration should be global.
- When mixing strings and variables, prioritize using f-strings when constructing messages or dialogues.

### Testing

- All components in the engine should have extensive unit tests.
- Every component in every act should also have unit tests. These tests should test the dynamics and behavior of the component, e.g. dynamic dialogues and things that change in the component depending on actions. Try to mock as little as possible and instead use the real implementations where feasible. The component tests should be placed in a similar structure to the code, ie. tests/retroquest/act<num>/rooms for rooms.
- Use integration tests to verify that all steps in the golden path of the act works as expected, that the act can be completed successfully and that all quests are properly integrated.

### Details

- Try to use isinstance when checking types, as it is more robust than comparing types directly. Avoid circular imports by doing local imports inside functions if needed.
- Avoid using magic strings or numbers; instead, use constants or enums to represent important values.
- When using multi-line strings, align the lines so that they match the indentation of the surrounding code.

## Chat

In the chat, try to be concise when describing what you are about to do, what you are doing and what you have done. Avoid unnecessary verbosity. Focus on the key changes or additions you are making to the codebase. This helps in maintaining clarity and efficiency in communication.

## Communication with user

When asking questions to the user, always try to use the question UI/tool with pre-defined answers. This makes communication more efficient and reduces the risk of misunderstandings. If the question cannot be answered with predefined options there also need to be a free text option to use.
