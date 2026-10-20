# Porting act content from Python to TypeScript

How a Python act module under `src/retroquest/act<N>/` becomes TypeScript under
`web/src/act<N>/`. The engine it targets lives in `web/src/engine/` (read `index.ts` and
the class you extend before porting). Keep every narrative string and every piece of
`[markup]` exactly as it is in Python: the web UI and the tests depend on the text.

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
spells) as `{ Name }` entries; `Act1` passes it as `classes` so saves can name them.
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
