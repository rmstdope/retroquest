---
name: verify-retroquest
description: RetroQuest's verification skill, named by `verification_skill` in .cerebro/project.conf. Psylocke verifies merged beads that change what a player sees or hears by playing the dev build in Chrome. She batches related beads into one look, does the checks herself, hands the navigator the running game for anything only a person can judge (audio, "good enough"), explores near the change, then presents the evidence, a recommended pass or fail per bead, and proposed follow-up beads.
---

# Verifying RetroQuest beads

This skill **extends `verify-bead`; it does not replace it.** Load `verify-bead` first and follow it,
together with `agents/verifier.md`. That covers the candidates, the fresh `origin/main` worktree, the
commit check, `verification=pending`, the port refusal, the sha in every verdict, the report written
onto the bead before asking, the recipes in *Taking the verdict*, and the end of a pass. Where this
file is more specific, this file wins. It adds five things: batching, reaching a game state,
protecting the navigator's saves, human checks, and exploratory testing.

Every question below is the verifier's three-action sandwich: `asking --bead <id> --phase verify`,
the question, then `working --bead <id> --phase verify` before anything else. In a batch, `--bead`
is the first bead of the batch.

## Which beads are looked at

The verifier's classification decides: `app-paths --classify` says `application` for anything under
`web/src/`, `web/public/` or `web/index.html`. Everything it calls `invisible` is marked
`not-needed` silently, as the verifier says. Never widen or narrow that by judgement. If you think a
classified bead changes nothing a player can notice (a test-only change under `web/src/`, say), still
look briefly, and say in the report that the look found nothing visible to check.

## Batch beads into one look

Starting the server and getting the game into a state is the expensive part, so share it. After the
candidate lists are built, and after the epic sweeps (which batch themselves through
`verifier-epic-candidates`), group the ordinary candidates:

- **Batch together** beads that are all in the verification tree at the same `origin/main` sha and
  share a journey: the same act or the same rooms, characters or quest, the same UI surface (the
  settings, the save dialog, the quest log, the chapter page, the narration), or the same game state
  to reach.
- **Keep apart** a bead whose look needs a fresh game, a different save, or wiped storage that would
  spoil the others' state. Keep a reopened `verification:failed` bead apart too: its rebuild deserves
  its own clean look.
- **At most four beads per batch.** The question tool takes four questions per call, and the verdict
  call asks one per bead.

Say each batch and its reason in one line before launching, for example "batch A: rq-mh4.2, rq-mh4.3,
rq-mh4.4, all narration UI, one run at `<short sha>`". Then, per batch:

1. Prepare every bead (verify-bead's *Prepare*): one checklist per bead, criterion by criterion.
2. Launch once (verify-bead's *Launch*), on the declared port.
3. Walk the beads in the order that reaches the game states most cheaply, keeping a separate
   evidence log per bead. A screenshot can serve two beads, but name it in both logs.
4. Collect every human check in the batch into **one** hand-off (below).
5. Explore once for the whole batch (below).
6. Write **one report per bead** onto that bead (`Verification report at <full sha>`, as
   verify-bead says), then ask for the batch's verdicts in **one** call of the question tool, one
   question per bead.

A batch never merges verdicts: each bead passes or fails on its own evidence. If the navigator's
answers split a batch, record each bead by its own recipe.

## Reaching the right game state

The dev server (`launch_web`, `npm run dev`) runs the dev build, so the dev-only commands are there.
Type them into the game's command input:

- **`debug act<N>`** plays act N's golden path as typed commands and stops one step before the act
  ends (Act I stops before `use map`). Each step's answer appears in the story, so you can watch it
  run. It stops at the first failure and names the line. That is itself a finding: the golden path
  is broken at that sha.
- **To reach a later act**, finish the earlier ones: `debug act1`, then its final step, then
  `debug act2`, and so on. The design docs (`design/Act<N>Design.md`) list each act's golden path
  and final step.
- **`debug <name>`** plays `web/debug-scripts/<name>.txt`, one command per line, with `#` comments.
  Write a scratch script there, in the verification tree only, to reach a mid-act state quickly.
  The directory is not ignored by git, so **delete the script when the look is over**. Never commit
  in the verification tree.
- **`cheat act <N>`** plays the same golden path through the engine in one go, without the story
  scrolling past. Use it when you only need the end state.

To close the title page and the act intro, click through them as a player would. Getting past them
is part of the journey a bead may have changed.

## Two environmental snags: file:// and a taken port

Neither is a question for the navigator. Work round both, and say so in the report.

- **A local file Chrome cannot open as `file://`** (a mockup, review page, evidence, anything
  else on disk): serve its directory over http and open that URL instead. From a scratch shell:
  `python3 -m http.server <free port> --bind 127.0.0.1 --directory <dir>`, on a port from the
  range below, then `http://127.0.0.1:<port>/<file>`. Stop only the server you started.
- **5173 occupied** (`lsof -nP -iTCP:5173 -sTCP:LISTEN` prints a listener). This overrides
  verify-bead's rule that an occupied port is a question: do not ask. Never stop, signal or reuse
  whatever holds 5173. Pick the first free port from 5174 to 5199 (below the producers' 5200+
  blocks), checking each with the same `lsof`, and start the declared launch command on it with
  Vite's port flags: `npm run dev --prefix web -- --port <port> --strictPort`. Name the port in
  the report, as "verified on http://localhost:<port> because 5173 was taken". If none of
  5174-5199 is free, that is a blocker to report.
- **Origins differ by port.** `localStorage` belongs to the origin, so the navigator's saves on
  `localhost:5173` are not visible on another port. The game starts empty there; that is expected.
  Snapshot and restore on the origin you actually use (next section), and where a bead needs an
  existing save, build the state with `debug act<N>` instead.

## Protect the navigator's saves

The browser is the navigator's own Chrome, and `localhost:5173` shares its `localStorage` with
every game they have played there. On a fallback port (see above) the origin is new and holds none
of their saves, but snapshot and restore anyway, on that origin. Before the first save, load or settings change in a batch,
snapshot RetroQuest's keys through the Chrome integration's JavaScript tool:

```js
JSON.stringify(Object.fromEntries(Object.keys(localStorage)
  .filter(k => k.startsWith('retroquest_')).map(k => [k, localStorage.getItem(k)])))
```

Keep the snapshot in your scratchpad, and restore it before you end the look, including after a
blocker:

```js
const snap = /* the snapshot */; Object.keys(localStorage)
  .filter(k => k.startsWith('retroquest_')).forEach(k => localStorage.removeItem(k));
Object.entries(snap).forEach(([k, v]) => localStorage.setItem(k, v));
```

A look that needs empty storage (a first visit, old saves) clears the keys **after** the snapshot.
Say in the report that storage was snapshotted and restored.

## The look, for RetroQuest

On top of verify-bead's *Look*, check what the acceptance touches:

- **The mockup.** A bead agreed with a mockup names it in its acceptance. It is committed under
  `web/public/` and served by the dev server at `http://localhost:<port>/<file>.html`, `<port>` being the one you
  launched on (5173 unless it was taken). Open it in a
  second tab and compare it with the game side by side, and screenshot both.
- **Desktop and phone.** "Working" includes reading well on a phone. Look at desktop width, then
  resize the window to phone width (about 390×844) and look again. A bead that changes layout,
  dialogs, the input row or long text always gets both.
- **Light and dark.** The theme follows the device. Where the bead changes colour, contrast or
  imagery, say which theme you saw. If only one theme is reachable, the other is a human check.
- **Saves.** When the bead adds or changes state a player carries (items, flags, quest progress,
  settings), save mid-journey, reload the page, load the save and confirm the state came back.
  The `save`/`load` commands and the save dialog are both player paths. Use whichever the bead
  touched, and the dialog otherwise.
- **The words.** Text the bead changes follows `design/Voice.md`. Quote the line in the log next to
  the screenshot. A clear breach of the voice rules is a finding. Whether a line reads *well* is a
  human check.
- **The console.** Read the console messages after the journey (filtered by a pattern, not dumped
  whole). A new error or warning during the journey is a finding.

## Human checks: hand the navigator the running game

Some criteria have no screenshot that settles them. They go to the navigator, and you prepare
everything first so their part takes a minute:

- **Audio**: narration, music and sound effects play, are the right voice and line, sound clean,
  and keep in step with the read-along highlight. You can show *that* a file loaded (its request in
  the network log, an `audio` element playing). Whether it sounds right is theirs to judge.
- **"Good enough"**: whether prose reads well in the game's voice, whether a layout or animation
  feels right, whether a puzzle's hint lands. The acceptance cannot pin these down.
- **Anything you could not reach**: a real phone, a theme your browser will not show, a state the
  debug commands cannot build.

The hand-off, once per batch, after your own checks and before the verdict:

1. Leave the server running and the game **in the exact state** to judge, in a tab you name.
   Settings such as Narration on and volume up should already be set. Restore their saves only
   after they answer.
2. Write `asking`, then ask in **one** call of the question tool, one question per human check
   (at most four, so split a long list into more calls). Each question says:
   - the URL and tab, and what is on screen right now;
   - what to listen for or judge, in player terms, and what good looks like, quoting the acceptance
     or `## Outcome`;
   - optionally, a few numbered steps to try ("type `talk to mira`, then `ask about the gate`;
     listen for the second line").

   Options: **Good**, **Concern** (works, but worth a follow-up), **Fail** (does not meet what was
   agreed), each with room for a note.
3. Write `working` the instant they answer. Copy each answer and note into the bead's log verbatim,
   attributed to the navigator. A human check left unanswered is a gap, not a pass.

If they are away, the beads stay pending with the report attached, as verify-bead says. The next
pass re-asks from the report without looking again.

## Explore near the change

After the agreed criteria and before the report, spend **about 10–15 minutes per batch** playing near
what changed, as a curious player would. No script; aim at the change's edges:

- the neighbouring commands and spelling variants (`look`, `examine`, `x`, abbreviations, wrong
  case, an extra word, a misspelling), and `hint` and `help` near the change;
- the rooms, characters and items one step away, and talking again after the state changed;
- doing things in the wrong order, repeating them, or undoing them (drop and take, leave and come
  back);
- save and load across the change, and reloading the page mid-dialog or with a dialog open;
- phone width on the screens next to the change, long words wrapping, and the keyboard-only path;
- rapid input while narration or an animation runs.

Log each finding with steps, what appeared and a screenshot. Then sort it:

- **A regression this batch caused** (it worked before this bead's
  commit, and the bead's diff explains the break) counts against that bead's verdict. Say which
  criterion or outcome it breaks.
- **Everything else** (an older defect, a rough edge, an idea) is a proposed follow-up and never
  fails the bead.

When unsure which it is, say so in the report and recommend the follow-up.

## Present the results

The report on each bead follows verify-bead's *Recommend*, with these sections:

- `Verification report at <full sha>`, then the bead's title and its batch;
- the evidence log, one entry per criterion, with the human checks marked as the navigator's
  answers;
- **Exploration**: what you tried, and each finding with its sorting;
- the **gaps**: what nobody could reach;
- the **recommendation**: Passed, Passed with a follow-up, or Failed (build or plan), with the one
  or two facts it turns on;
- the **proposed follow-ups**: for each, a title in *Writing a good bead* form, the outcome for the
  player (or the developer), one acceptance line, and why it is not a defect in this bead. A defect
  in shipped behaviour is proposed as a bug (`--type bug --labels bugfix`), anything else as a task.
  Both are filed at P4, unranked, and only when the navigator approves them.

Then in chat, before the verdict question, give the navigator a short summary per batch: one line per
bead with the recommendation, then the follow-ups. The full evidence is on the beads. Ask for the
verdicts and the follow-ups in one call where they fit in four questions, and in consecutive calls
where they do not. Record only what they answered, by the recipes in `agents/verifier.md`.

## When the look is over

Restore the storage snapshot, delete any scratch debug script, close the tabs you opened, and stop the
server you started, and only that one.
