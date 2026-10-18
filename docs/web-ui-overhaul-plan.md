# Web UI overhaul — implementation plan

Design: "Lantern" (storybook look, ink/paper palettes, bold amber accent, compact spacing,
tight type). Mockups live on the design canvas
(https://claude.ai/artifact/93cNT4j2wVEyucNtcojcCn).

## Ground rules

- Every step is its own branch and PR: tests first (TDD), all pre-merge checks from
  `CLAUDE.md` green, independent review before merge.
- The new UI is built in parallel behind `?ui=lantern`; the current UI stays the default
  until the new one is complete. `main` is always shippable.
- Fonts (Fraunces, Source Serif 4, DM Sans, DM Mono) are bundled with the app via
  `@fontsource` packages so the game keeps working offline.

## Findings from the current code

- The store only keeps `lastOutput`; there is no story history yet.
- No component tests exist (`@vue/test-utils` is not installed).
- Save slots (8 + quick) are stored in `localStorage` by `useBridge.ts`.
- Dialogue is `[character_name]X[/character_name] … [dialogue]'…'[/dialogue]`; the speaker
  can be taken from the first character name before the `[dialogue]` tag.
- The bridge has no quest totals per act, main-quest flag or act number.
- Only *Preparing for the road* uses `[failure]` as a "not yet" marker.

## Steps

### Phase 0 · Groundwork (no visible change)

1. Add `@vue/test-utils`; first component test for `QuestModal`.
2. Engine `[pending]` tag: add to `engine/theme.py`; *Preparing for the road* marks unmet
   items `[pending]` (`[failure]` stays for real failures). Python tests first; add the tag
   to `THEME_TAGS` and CSS in the web UI.
3. Bridge: quest totals per act, main-quest flag, act number (tests in `useBridge.test.ts`).

### Phase 1 · Settings and tokens

4. Lantern tokens in `main.css`: dark/light palettes (bold amber), compact spacing, tight
   type, new entity colors, bundled fonts.
5. `useSettings`: theme (device/light/dark), text size (S/M/L), music and effects on/off +
   volume, start mode (Actions/Type), reduce motion — persisted, with unit tests.
6. Wire settings: theme attribute on `<html>`, text-size CSS variable, volumes in
   `useMusic`/`useAudio`, reduce motion follows the device by default.

### Phase 2 · Story log (logic first)

7. Turn log in the store (command, answer, room change per turn; keep the last 200).
8. Turn parser (pure function): paragraphs, dialogue with speaker, events, checklists —
   tested on real game text.
9. Gained/lost chips by diffing inventory and spells before/after a turn; tab dots.

### Phase 3 · New layout behind `?ui=lantern`

10. Shell: header with act, quest progress, Aa and theme toggle; Playwright smoke test.
11. Story view: room-change divider, arrival entry with "Here + exits" box, 3-line clamp
    with "Read more" on laptop.
12. Action composer: sentence builder covering every parser command (go, talk, say, give,
    buy, look/examine, search, take/drop, use … with, open/close, cast … on, rest,
    inventory, spells, map, stats, help, save/load); Actions | Type toggle reusing the
    current completion. Unit test per verb → command string.
13. Laptop layout: scene card, story, aside with compass and Bag/Spells/Quests.
14. Phone layout: bottom tabs, dock bar, action sheet capped at 62% height, fold only when an
    answer is too long, long turns open at their start with a "More below" pill.
    Playwright at 390×844, 320×568 and 844×390 (tabs move to the header).

### Phase 4 · Feedback moments

15. New/updated quests as non-blocking cards in the story, with the chime.
16. Quest complete pop-up (bottom sheet on small phones); the card stays in the story.
17. Act intro/complete chapter pages with stats.
18. Failure style + shake (off with reduce motion), event style, save/load toast.

### Phase 5 · Dialogs

19. Dialog shell: centered on laptop, bottom sheet on phone; focus trap, Esc closes.
20. Game menu.
21. Save/load: inline confirm in the slot card; slots store the quest count, and older saves
    still load.
22. Settings dialog.
23. Quest details: journal with folded earlier entries, and checklists.

### Phase 6 · Switch over

24. Make Lantern the default; the old UI stays reachable via `?ui=classic` for one release.
25. Remove the old components and tokens.
