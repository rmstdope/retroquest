/**
 * The changes of state the game's text describes in a room, met against the
 * room patches: along the golden path of every act, each command that changes
 * a room's description or renames an item staying in it must be listed here,
 * either as covered by a patch of that room or as not needing one (and why).
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import { Game, type Act } from '@/engine'
import { declaredPatches } from './roomPatches'

/** The answer to one state change: the id of a patch of the room, or the reason it needs none. */
type StateChange = { patch: string } | { none: string }

/** What answers each state change along a golden path, by act then `<room> after "<command>"`: a patch of that room, or why it needs none. */
const STATE_CHANGES: Record<string, Record<string, StateChange>> = {
  Act1: {
    'EliorsCottage after "use lantern"': { patch: 'lantern-lit' },
    'EliorsCottage after "take bread"': { patch: 'bread-taken' },
    'VegetableField after "take rusty hoe"': { patch: 'rusty-hoe-taken' },
    'ChickenCoop after "use bread with chicken"': { patch: 'key-appears' },
    'AbandonedShed after "use key with door"': { patch: 'shed-door-unlocked' },
    'GeneralStore after "talk to shopkeeper"': {
      none: "the shutters and the shopkeeper's stance are mood, not a thing in the picture",
    },
    'GeneralStore after "buy rope from shopkeeper"': { patch: 'rope-gone' },
    'OldMill after "use rope with mechanism"': { patch: 'mechanism-jammed' },
    'MirasHut after "take letter"': {
      none: "only the amulet's glow, a line of text",
    },
    'ForestPath after "use sharp knife with vines"': { patch: 'vines-cut' },
    'VillageChapel after "use candle with matches"': { patch: 'candle-lit' },
    'VegetableField after "cast revive on Withered carrot"': {
      patch: 'withered-carrot-fresh',
    },
    'VillageWell after "cast purify on well"': { patch: 'well-purified' },
    'HiddenGlade after "cast light"': {
      none: 'the whole clearing turns from gloom to full sun, which is another picture, not a patch',
    },
    'MirasHut after "talk to mira"': { patch: 'ancient-amulet-gone' },
    'OldMill after "talk to mira"': {
      none: "only the amulet humming in the player's hand, a line of text",
    },
    'HiddenGlade after "talk to mira"': {
      none: "only the amulet glowing in the player's hand, a line of text",
    },
  },
  Act2: {
    'InnRooms after "search"': { patch: 'coins-taken' },
    'ResidentialQuarter after "search"': { patch: 'exit-secret-passage-open' },
    'ForestTransition after "use forest survival kit"': {
      patch: 'exit-east-open',
    },
    'ForestEntrance after "use protective charm"': {
      patch: 'forest-sprites-aside',
    },
    'ForestEntrance after "use enhanced lantern"': { patch: 'exit-east-open' },
  },
  Act3: {
    'TidalCauseway after "examine letter"': {
      none: 'a line of weather and dead birds; nothing in the picture changes',
    },
    'OuterWards after "cast purify on pillars"': {
      patch: 'warding-pillars-purified',
    },
    'SubmergedAntechamber after "use moon rune shards with pillars"': {
      none: 'the tide draws back and changes the water of the whole hall, which is another picture, not a patch',
    },
    'SubmergedAntechamber after "use lantern with bracket"': {
      patch: 'lantern-bracket-mounted',
    },
    'SanctumOfTheTide after "e"': {
      none: 'wading in the black water changes the whole view; the crystal is covered by crystal-of-light-appears',
    },
    'SanctumOfTheTide after "say myself to tide-born guardian"': {
      none: 'the whole chamber is shown again as the water parts, which is another picture, not a patch',
    },
    'MirrorTerraces after "examine inscription"': {
      none: 'falling ash and guttered braziers are a mood of the whole view',
    },
    'MirrorTerraces after "cast mend on mirror mount"': {
      patch: 'mirror-mount-mended',
    },
    'MirrorTerraces after "rest"': {
      none: 'only the waiting line of the mended mirrors goes, which mirror-mount-mended already shows',
    },
    'FumarolePassages after "use vent stone"': {
      none: 'the rhythm of the vents is breath and sound, not something the picture shows',
    },
    'FumarolePassages after "use heat-ward mix"': {
      none: 'the rhythm of the vents is breath and sound, not something the picture shows',
    },
    'FumarolePassages after "rest"': {
      none: 'the rhythm of the vents is breath and sound, not something the picture shows',
    },
    'PhoenixCrater after "rest"': { patch: 'phoenix-appears' },
    'FumarolePassages after "n"': {
      none: 'the rhythm of the vents is breath and sound, not something the picture shows',
    },
    'CollapsedGalleries after "use wedge blocks with rock"': {
      patch: 'fallen-rock-gone',
    },
    'DragonsHall after "talk to ancient dragon"': {
      none: 'the dripping stopping is sound, not something the picture shows',
    },
    'DragonsHall after "take dragon\'s scale"': { patch: 'sigils-dimmed' },
  },
  Act4: {
    'FortressGates after "cast light on right stone"': {
      patch: 'ward-stones-dark',
    },
    'OuterCourtyard after "cast bless on trapped servants"': {
      patch: 'trapped-servants-freed',
    },
    'MirrorLabyrinth after "w"': {
      none: 'the corridors of the maze change the whole view, which is another picture, not a patch',
    },
    'MirrorLabyrinth after "e"': { patch: 'true-self-appears' },
    'HallOfEchoes after "say redemption to knight"': {
      patch: 'knight-of-despair-redeemed',
    },
    'TowerOfShadows after "say nyx to whispers"': { patch: 'whispers-gone' },
    'ChamberOfWhispers after "say understanding to sorceress"': {
      patch: 'sorceress-of-lies-unmasked',
    },
    'MemoryVault after "use enhanced echo stone with memory orbs"': {
      patch: 'memory-orbs-whole',
    },
    'MemoryVault after "use ancient amulet on door"': {
      patch: 'exit-east-open',
    },
    'ParentsVault after "examine memories"': { patch: 'memories-dimmed' },
    'ThroneChamber after "use ancient amulet"': {
      none: "only the amulet's light filling the chamber, a line of light and text",
    },
    'ThroneChamber after "use lifelight elixir on malakar"': {
      patch: 'malakar-healed',
    },
    'ThroneChamber after "cast forgiveness on wound"': {
      patch: 'wound-closed',
    },
  },
}

const ACTS: Array<() => Act> = [
  () => new Act1(),
  () => new Act2(),
  () => new Act3(),
  () => new Act4(),
]

/** One room's text and the names of its items by class, to compare before and after a command. */
interface Look {
  text: string
  names: Map<string, string>
}

/** What the player is told of room `key` now. */
function look(act: Act, game: Game, key: string): Look {
  const room = act.rooms[key]
  return {
    text: room.descriptionFor(game.state),
    names: new Map([...room.items].map((i) => [i.constructor.name, i.name])),
  }
}

/** Whether the room's text changed, or an item that stayed was renamed (a thing taken or arriving is the business of the thing patches). */
function changed(before: Look | undefined, after: Look): boolean {
  if (before === undefined) return false
  if (before.text !== after.text) return true
  return [...after.names].some(
    ([cls, name]) => before.names.has(cls) && before.names.get(cls) !== name,
  )
}

/** The `"<room> after <command>"` keys of every state change along the act's golden path. */
function changesAlongGoldenPath(act: Act): string[] {
  const game = new Game([act])
  const keys = new Set<string>()
  const rooms = Object.keys(act.rooms)
  let before = new Map(rooms.map((k) => [k, look(act, game, k)]))
  for (const command of act.goldenPath) {
    game.commandParser.parse(command)
    game.state.settleQuests()
    const after = new Map(rooms.map((k) => [k, look(act, game, k)]))
    for (const k of rooms)
      if (changed(before.get(k), after.get(k) as Look))
        keys.add(`${k} after "${command}"`)
    before = after
  }
  return [...keys]
}

describe.each(ACTS.map((make) => [make().name, make] as const))(
  '%s state changes',
  (name, make) => {
    const table: Record<string, StateChange> = STATE_CHANGES[name] ?? {}

    it('each have a patch of their room or a reason for none', () => {
      const unlisted = changesAlongGoldenPath(make()).filter(
        (k) => !(k in table),
      )
      expect(unlisted).toEqual([])
    })

    it('are listed only when the golden path still makes them, with a real patch or a reason', () => {
      const real = new Set(changesAlongGoldenPath(make()))
      for (const [key, entry] of Object.entries(table)) {
        expect(real, key).toContain(key)
        if ('patch' in entry) {
          const room = key.split(' after ')[0]
          expect(
            declaredPatches(name, room).map((p) => p.id),
            key,
          ).toContain(entry.patch)
        } else expect(entry.none.length, key).toBeGreaterThan(0)
      }
    })
  },
)
