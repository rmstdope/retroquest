# Porting act content from Python to TypeScript

How a Python act module (formerly under `src/retroquest/act<N>/`, removed in #188) became
TypeScript under `web/src/act<N>/`; the conventions still apply to new content. The engine
it targets lives in `web/src/engine/` (read `index.ts` and the class you extend before
porting). Keep every narrative string and every piece of `[markup]` exactly as it is (the
strings came verbatim from Python): the web UI and the tests depend on the text.

## Layout

```
web/src/act1/
  Act1.ts                 class Act1 extends Act
  Act1StoryFlags.ts       export const FLAG_FOUND_PHOTO = 'found_photo' …
  classes.ts              export const ACT1_CLASSES = { Bread, Mira, EliorsCottage, … }
  items/Bread.ts          one class per file, file named after the class, named export
  characters/Mira.ts
  rooms/EliorsCottage.ts
  quests/HintOfMagic.ts   class HintOfMagicQuest (keep the Python class name)
  spells/LightSpell.ts
  rooms/EliorsCottage.test.ts   tests next to the code (vitest)
  Act1.integration.test.ts      the golden path
```

Imports: `import { Item } from '@/engine'` for engine classes and types, relative paths
for siblings (`import { Key } from './Key'`, `import { Coin } from '../items/Coin'`).
Only import types with `import type` when nothing is used as a value (`instanceof`
needs the value import).

`classes.ts` lists **every** class of the act (items, characters, rooms, quests,
spells) as `{ Name }` entries; `Act1` passes it as `classes` so saves can name them as
`<act name>.<class name>`. The act's `name` is therefore the short id `Act1`, `Act2`, …
(not the Python display title), since it ends up inside every save.
Python classes are never instantiated by the engine directly, so a constructor with no
parameters is all a content class needs.

## Class and method names

| Python | TypeScript |
| --- | --- |
| `super().__init__(name=..., description=..., short_name=..., can_be_carried=True)` | `super({ name, description, shortName, canBeCarried: true })` |
| `Room(name, description, items=[...], characters=[...], exits={...})` | `super({ name, description, items: [...], characters: [...], exits: {...} })` |
| `Quest(name, description, completion)` | `super({ name, description, completion })` |
| `Spell("bless", desc)` / `Act(name, rooms, quests, music_file, music_info)` | options objects: `{ name, description }`, `{ name, rooms, quests, musicFile, musicInfo, classes }` |
| `get_name()` / `get_short_name()` / `get_description()` | `name` / `shortName` / `description` fields |
| `can_be_carried_flag` / `can_be_carried` | `canBeCarried` |
| `is_completed_flag` | `completed` |
| `use`, `use_with(gs, other)`, `use_on_character(gs, c)` | `use`, `useWith`, `useOnCharacter` |
| `examine`, `listen`, `picked_up`, `prevent_pickup`, `open`, `close`, `grow`, `eat`, `drink`, `equip`, `unequip` | same, camelCase (`pickedUp`, `preventPickup`) |
| `talk_to(gs)`, `say_to(words, gs)`, `give_item(gs, item)`, `buy_item(name, gs)` | `talkTo(gs)`, `sayTo(gs, words)`, `giveItem(gs, item)`, `buyItem(gs, name)` — **game state first** |
| `cast_spell`, `cast_on_item`, `cast_on_character` | `castSpell`, `castOnItem`, `castOnCharacter` |
| `check_trigger`, `check_completion`, `check_update`, `is_main`, `complete` | `checkTrigger`, `checkCompletion`, `checkUpdate`, `isMain`, `complete` |
| `get_exits(gs)`, `search(gs, _target=None)`, `rest`, `light`, `on_enter`, `get_ambient_sound` | `getExits(gs)`, `search(gs)` (no target), `rest`, `light`, `onEnter` (returns void), `getAmbientSound` |
| `get_items()` / `get_characters()` / `add_item` / `remove_item` / `get_item_by_name` | `items` / `characters` fields; `addItem`, `removeItem`, `getItemByName` |
| `get_act_intro`, `setup_gamestate`, `is_completed` | `getActIntro`, `setupGameState`, `isCompleted` |

### Hooks the engine added since the port

These have no Python ancestor. Each is an optional override with a documented
default in `web/src/engine/`; content classes override only what they need.

| Class | Hook | What it is for |
| --- | --- | --- |
| `Room` | `blockedExit(gs, direction)` | the in-world line for a direction that is not an open exit (null keeps "You can't go that way") |
| `Room` | `walk(gs, direction)` | take over a move entirely; a non-null result is the story text and the player stays |
| `Room` | `departText(gs, direction)` / `enterText(gs)` | text before "You move …" when leaving, and right after it when arriving (never repeated by `look`) |
| `Room` | `exitLabel(gs, direction)` | what an exit shows instead of its destination's name |
| `Room` | `descriptionFor(gs)` | the description when it changes with the story (the room card reads this) |
| `Room` | `talkToNobody(gs, target)` | the room's answer when the player talks to a name nobody here answers to |
| `Room` | `getAmbientSound(gs)` / `rest(gs)` / `light(gs)` | `listen` with no target, `rest`/`sleep`/`wait`, and `cast light` in the room |
| `Character`, `Item`, `Spell` | `answersTo(name)` | which words the player may use for it (a nickname, "the figure") |
| `Character` | `receiveSpell(gs, spell)` | take over a spell cast on the character before the spell's own `castOnCharacter` |
| `Item` | `listen(gs)` | `listen to <item>` |
| `Spell` | `castOnName(gs, target)` | a cast on a name that is neither an item nor a character in reach |
| `Quest` | `setJournal(earlier, latest)` / `setChecklist(checklist, description)` | the quest log as a journal of stages, or as a checklist; `details()` is what the UI reads |
| `Quest` | `hint(gs)` | the line `hint` gives for this quest; the default is the newest journal entry or the next open checklist item |
| `Act` | `getCompletionHook(gs)` | the line that opens the act-complete page |
| `Act` | `unknownSpell(gs, name)` | the failure for a spell the player does not know, when the story has taken spells away |
| `Act` | `carriedFlags()` | the story flags whose values travel into every later act (virtues always do) |
| `Act` | `afterLoad(gs)` | bring a loaded save up to date; idempotent |
| `Act` | `onRoomChanged(gs, from, to)` | after a walk, before the new room's `onEnter`; lets characters follow |

The `Game` starts an act in the first room of its `rooms` map. A character may
move the player itself (the dream's voice, Mira's teleport) by setting
`currentRoom`, calling the new room's `onEnter` and `markVisited`; the UI shows
the arrival from the room name changing.

Mark overrides with `override`. Unused parameters keep a leading underscore
(`_gameState`). Room/character/item helper methods that the Python code added
(e.g. `unlock()`, `activate_dialogue()`) keep their purpose with camelCase names.

GameState (`web/src/engine/GameState.ts`): `currentRoom`, `allRooms`, `inventory`,
`visitedRooms`, `knownSpells`, `getStoryFlag`, `setStoryFlag`, `hasItem`,
`getItemCount`, `addItemToInventory(item, count)`, `removeItemFromInventory(name, count)`,
`removeAllItemsFromInventory`, `removeItemFromInventoryOrRoom`, `learnSpell`, `hasSpell`,
`getItem`, `getRoom`, `getQuest`, `isQuestCompleted`, `markVisited`. Story flags are
booleans; `get_story_flag` → `getStoryFlag`.

## Python idioms

- `isinstance(x, Cls)` → `x instanceof Cls` (import the class as a value).
- `any(isinstance(i, Vines) for i in self.items)` → `this.items.some((i) => i instanceof Vines)`.
- `"matches" in self.wares` / `del self.wares["matches"]` → `'matches' in this.wares` / `delete this.wares.matches`.
- `random.choice(list)` → `list[Math.floor(Math.random() * list.length)]`.
- `getattr(obj, 'method', None)` → declare the method on the base class or check
  `'method' in obj` with a type guard; avoid `any`.
- Dialogue tables (`self.dialogue_states = {...}`) → `Record<string, string>` fields.
- Merchants keep `wares: Record<string, { item: Item; price: number }>` under exactly
  that name (the controller reads it).
- Long strings: join adjacent string literals with `+`, or template literals; never
  change wording, punctuation or markup. Keep `\n` where Python had them.
- Module docstrings and class docstrings become `/** … */` comments (shortened is fine).

## State the save must keep

Every mutable field is a declared class field (`locked = true`, `dialogueIndex = 0`,
`private received = false`). Rules for the serializer:

- TypeScript `private`/`protected` is fine; **never** ECMAScript `#private` fields.
- No `Map`, `Set` or `Date` in a field; use plain objects and arrays.
- Fields may reference other content objects (items in rooms, items in wares).

## Tests

Port every test under `tests/retroquest/act<N>/` to vitest next to the code it covers
(`FooRoom.test.ts` beside `FooRoom.ts`; `test_Rooms.py` → `rooms/rooms.test.ts`;
`test_Integration.py` → `Act1.integration.test.ts`). Use the real engine and act, no
mocks, through `new Game([new Act1()])`. The shared helpers in
`web/src/testing/gameHelpers.ts` replace `tests/retroquest/utils/utils.py`
(`executeCommands`, `expectItemInInventory`, `expectQuests`, …). Keep every assertion
of the Python test; mirror its structure with `describe`/`it`.

Run before handing over: `cd web && npx prettier --write "src/act1/**/*.ts" && npx eslint src/act1 && npx vue-tsc --noEmit && npx vitest run src/act1`.
