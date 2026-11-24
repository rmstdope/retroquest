---
name: content-studio-images
description: Work a RetroQuest image (room picture, patch, fine-tune, named area, effect) in Content Studio through its MCP. Use when asked to fine-tune a room's picture, make or check patches, place named areas or motion effects, or compare image takes.
---

# Working images in Content Studio

The images on the game's image list are the navigator's (`CLAUDE.md`, *Images*). You work
them through the studio's MCP **when the navigator asks you to, in a session they are
driving**. Never edit `content-studio/images/*.json` or `web/public/images/generated/` by
hand. A change to the game's patch list or area list (`web/src/lantern/roomPatches.ts`,
`roomAreas/`, and the acts' `roomPatches`) is a bead and a PR, never a studio-side shortcut.

## Connecting

- The tools are `studio_pages` (lists every read path and action), `studio_read`,
  `studio_fetch` (images) and `studio_act`. Call `studio_pages` first; use its paths
  verbatim, with `:names` filled in.
- The studio prints `claude mcp add --transport http content-studio <url>/mcp` only on a
  **fresh start**, not after a hot reload, and picks a random port unless started with
  `--port`. If the tools are missing, ask the navigator for the URL or the port.
  Without the MCP, plain JSON-RPC over curl works: `POST <url>/mcp`, method `tools/call`.
- A step marked `confirm` needs `confirmed: true`, set only after the navigator agreed to
  what it says (it deletes takes or sets aside patches and areas).

## Units: three, never mixed

| What | Unit |
| --- | --- |
| Patch or fine-tune mark / `area` (`{x,y,width,height}`) | the **take's pixels**, 1024 × 576 |
| Named area box and its `point` | **game pixels**, 1920 × 1080 |
| Effect spots (polygons), `mark` | **picture fractions**, 0 to 1 |

A patch take is `{count, area}`. An exit you arrive from is a band along the bottom edge
with a `point`; an exit into the picture is a box on the opening.

## Order of work for a room

1. **Read the room**: its class in `web/src/act<N>/rooms/`, the things it can hold
   (`roomAreas/act<N>RoomAreas.ts`), its patches (`roomPatches` of the act) and their
   `when` rules. The base picture shows the room **as the game starts**.
2. **Look at the picture**: `studio_fetch /api/images/:id/current`.
3. **Fine-tune the base** (`/api/images/:id/fine-tunes`) until it matches the room's text
   and its start state. Fine-tunes go **one at a time**: `fine-tunes/use` makes the take
   the next chosen take and **drops the other fine-tunes**.
4. **Patches** (`/api/images/:id/patches/:patch/takes`): taken / gone / appears / open.
5. **Named areas** (`PUT /api/images/:id/areas/:area`).
6. **Effects** (`PUT /api/images/:id/effects`, zoom).
7. **Accept if out of date** (`/accept`, `/compare` with `keep` or `game`) for pictures whose
   game text changed.
8. **Commit** the studio's files (`content-studio/images/`, generated pictures) only as the
   navigator directs.

Choosing a new base take or un-choosing may set aside patches and areas: finish the base
before the rest.

## The edit model (klein). Don't use qwen-edit (the navigator's call)

- **Removes things reliably.** It cannot "open" or "move" them. Word a way-open patch as
  removing the barrier: "remove the bricks…", "remove the door from its arch".
- **Paints people too large** and **erases neighbouring things** unless the words pin the
  size to something in the picture ("no taller than the woman beside him") and name what
  must stay ("the bench and the barrel stay").
- **Marks under about 50 px change nothing.** Make the mark bigger than the thing.
- **Small magical beings** ("sprites") come out as insects. Describe them as small motes
  of light.
- Say what is seen, never what it means.

## Checking patches together

Patches that can show together must be checked **laid together in the game's order**:
`layer`, then id (declaration order means nothing). Overlaps show only in that order.

- A patch whose picture reaches another's area lies `over` it (`over` and a higher
  `layer`, in the act's patch list: a bead and a PR).
- A thing the picture cannot show is marked `unpatched` with a reason on its named area.
- Fetch `/api/images/:id/patches/:patch/takes/:n/game` (the take as the game shows it) for
  each patch and composite them over the base with ffmpeg, then look at a crop.

## Comparing takes

Fetch the takes, lay them over the chosen take with ffmpeg (`overlay`, then `crop`) and
look at the crop. A **tiny file size means an empty take**. Mark seen takes (`/seen`).

## What you decide and what you ask

- **The navigator chooses** every take and every box, with options, unless they hand the
  choice over. Spending steps (`make-all`, remakes) carry what they cost: say it first.
- You decide: the wording of an edit within what the room's text says, and which take to
  recommend.
- Ask: anything that changes what the room shows beyond its text, any patch to add, split or
  re-layer.
- Never record narration, never touch music, sound-effect or scene files from here (a later
  section of this skill).
