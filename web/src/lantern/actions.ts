/**
 * The verbs of the Lantern action composer and how they become engine commands.
 *
 * Each verb lists its slots: where the slot's choices come from (room items,
 * characters, the bag, spells, exits, shop wares and sellers, or free text) and
 * the word that joins it to the previous part ("use X with Y"). Only canonical
 * command forms accepted by the engine's CommandParser are produced. Save, load
 * and quit belong to the game menu, not here.
 */
import type { RoomExits, RoomWare } from '@/types/bridge'
import { displayName } from './displayName'
import { parseCountedName } from './inventoryChanges'

export type TargetSource =
  | 'roomItems'
  | 'characters'
  | 'inventory'
  | 'spells'
  | 'exits'
  | 'wares'
  | 'sellers'
  | 'text'

export interface Slot {
  sources: TargetSource[]
  /** Word placed before this slot's value, e.g. "with". */
  joiner?: string
  optional?: boolean
}

export interface Verb {
  id: string
  label: string
  /** Command words before the first slot, e.g. "talk to". */
  words: string
  slots: Slot[]
  /** "main" verbs are shown first; "more" holds reference commands. */
  group: 'main' | 'more'
}

/** What the player can currently act on (as delivered by the bridge). */
export interface ActionContext {
  roomItems: string[]
  characters: string[]
  /** Bag entries as the bridge lists them, e.g. "[item_name]2 apple[/item_name]". */
  inventory: string[]
  /** Spell entries as the bridge lists them, e.g. "[spell_name]revive[/spell_name]". */
  spells: string[]
  exits: RoomExits
  /** What merchants in the room sell. */
  wares: RoomWare[]
}

export type TargetKind = 'item' | 'character' | 'spell' | 'exit'

export interface Target {
  /** Text placed in the command. */
  value: string
  label: string
  kind: TargetKind
}

const THINGS: TargetSource[] = ['inventory', 'roomItems']
const ANYTHING: TargetSource[] = ['inventory', 'roomItems', 'characters']
/** The engine looks in the room and the bag for things to open or close. */
const THINGS_HERE_FIRST: TargetSource[] = ['roomItems', 'inventory']

export const VERBS: readonly Verb[] = [
  { id: 'look', label: 'Look', words: 'look', slots: [], group: 'main' },
  {
    id: 'examine',
    label: 'Examine',
    words: 'examine',
    slots: [{ sources: ['roomItems', 'characters', 'inventory'] }],
    group: 'main',
  },
  { id: 'search', label: 'Search', words: 'search', slots: [], group: 'main' },
  {
    id: 'take',
    label: 'Take',
    words: 'take',
    slots: [{ sources: ['roomItems'] }],
    group: 'main',
  },
  {
    id: 'drop',
    label: 'Drop',
    words: 'drop',
    slots: [{ sources: ['inventory'] }],
    group: 'main',
  },
  {
    id: 'use',
    label: 'Use',
    words: 'use',
    slots: [
      { sources: THINGS },
      { sources: ANYTHING, joiner: 'with', optional: true },
    ],
    group: 'main',
  },
  {
    id: 'talk',
    label: 'Talk',
    words: 'talk to',
    slots: [{ sources: ['characters'] }],
    group: 'main',
  },
  {
    id: 'say',
    label: 'Say',
    words: 'say',
    slots: [{ sources: ['text'] }, { sources: ['characters'], joiner: 'to' }],
    group: 'main',
  },
  {
    id: 'give',
    label: 'Give',
    words: 'give',
    slots: [
      { sources: ['inventory'] },
      { sources: ['characters'], joiner: 'to' },
    ],
    group: 'main',
  },
  {
    id: 'buy',
    label: 'Buy',
    words: 'buy',
    slots: [
      { sources: ['wares'] },
      // Required: the engine rejects "buy <item>" without "from <seller>".
      { sources: ['sellers'], joiner: 'from' },
    ],
    group: 'main',
  },
  {
    id: 'open',
    label: 'Open',
    words: 'open',
    slots: [{ sources: THINGS_HERE_FIRST }],
    group: 'main',
  },
  {
    id: 'close',
    label: 'Close',
    words: 'close',
    slots: [{ sources: THINGS_HERE_FIRST }],
    group: 'main',
  },
  {
    id: 'cast',
    label: 'Cast',
    words: 'cast',
    slots: [
      { sources: ['spells'] },
      {
        sources: ['characters', 'roomItems', 'inventory'],
        joiner: 'on',
        optional: true,
      },
    ],
    group: 'main',
  },
  {
    id: 'go',
    label: 'Go',
    words: 'go',
    slots: [{ sources: ['exits'] }],
    group: 'main',
  },
  { id: 'rest', label: 'Rest', words: 'rest', slots: [], group: 'main' },
  {
    id: 'inventory',
    label: 'Inventory',
    words: 'inventory',
    slots: [],
    group: 'more',
  },
  { id: 'spells', label: 'Spells', words: 'spells', slots: [], group: 'more' },
  { id: 'map', label: 'Map', words: 'map', slots: [], group: 'more' },
  { id: 'stats', label: 'Stats', words: 'stats', slots: [], group: 'more' },
  { id: 'help', label: 'Help', words: 'help', slots: [], group: 'more' },
]

export function verbById(id: string): Verb {
  const verb = VERBS.find((v) => v.id === id)
  if (!verb) throw new Error(`Unknown verb: ${id}`)
  return verb
}

/**
 * The command for `verb` with one value per slot (null/empty = not chosen),
 * or null while a required slot is still empty.
 */
export function buildCommand(
  verb: Verb,
  args: Array<string | null | undefined>,
): string | null {
  const parts = [verb.words]
  for (const [index, slot] of verb.slots.entries()) {
    const value = args[index]?.trim()
    if (!value) {
      if (slot.optional) continue
      return null
    }
    if (slot.joiner) parts.push(slot.joiner)
    parts.push(value)
  }
  return parts.join(' ')
}

/** The choices for one slot in the current situation (no duplicates). */
export function targetsFor(slot: Slot, context: ActionContext): Target[] {
  const targets: Target[] = []
  const seen = new Set<string>()
  function add(value: string, label: string, kind: TargetKind): void {
    const key = value.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    targets.push({ value, label, kind })
  }
  for (const source of slot.sources) {
    if (source === 'roomItems') {
      for (const name of context.roomItems) add(name, displayName(name), 'item')
    } else if (source === 'characters') {
      for (const name of context.characters)
        add(name, displayName(name), 'character')
    } else if (source === 'inventory') {
      for (const entry of context.inventory) {
        const { name } = parseCountedName(entry)
        add(name, displayName(name), 'item')
      }
    } else if (source === 'spells') {
      for (const entry of context.spells) {
        const { name } = parseCountedName(entry)
        add(name, displayName(name), 'spell')
      }
    } else if (source === 'wares') {
      for (const ware of context.wares) {
        const coins = ware.price === 1 ? 'coin' : 'coins'
        add(
          ware.name,
          `${displayName(ware.name)} · ${ware.price} ${coins}`,
          'item',
        )
      }
    } else if (source === 'sellers') {
      const sellers = new Set(context.wares.map((ware) => ware.seller))
      for (const name of context.characters)
        if (sellers.has(name)) add(name, displayName(name), 'character')
    } else if (source === 'exits') {
      for (const [direction, room] of Object.entries(context.exits))
        add(direction, `${displayName(direction)} · ${room}`, 'exit')
    }
  }
  return targets
}
