/**
 * The changes of state the game's text describes in a room, met against the
 * room patches: along the golden path of every act, each command that changes
 * a room's description or renames an item staying in it must be listed here,
 * either as covered by patches of that room or as not needing one (and why).
 * Only the text and the item names are compared, so a way opening is found
 * only when the room's text changes with it. Only the golden path is walked;
 * the other endings' states are patched by hand.
 */
import { describe, expect, it } from 'vitest'
import { Act1 } from '@/act1/Act1'
import { Act2 } from '@/act2/Act2'
import { Act3 } from '@/act3/Act3'
import { Act4 } from '@/act4/Act4'
import { Game, type Act } from '@/engine'

/** The answer to one state change: the ids of patches of the room, or the reason it needs none. */
type StateChange = { patches: string[] } | { none: string }

/** What answers each state change along a golden path, by act then `<room> after "<command>"`: a patch of that room, or why it needs none. */
const STATE_CHANGES: Record<string, Record<string, StateChange>> = {
  Act1: {
    'EliorsCottage after "use lantern"': { patches: ['lantern-lit'] },
    'EliorsCottage after "take bread"': { patches: ['bread-taken'] },
    'VegetableField after "take rusty hoe"': { patches: ['rusty-hoe-taken'] },
    'ChickenCoop after "use bread with chicken"': { patches: ['key-appears'] },
    'AbandonedShed after "use key with door"': {
      none: 'the room shows its other picture, the inside, once the door is open (Room.pictureVariant)',
    },
    'GeneralStore after "talk to shopkeeper"': {
      none: "the shutters and the shopkeeper's stance are mood, not a thing in the picture",
    },
    'GeneralStore after "buy rope from shopkeeper"': { patches: ['rope-gone'] },
    'OldMill after "use rope with mechanism"': {
      patches: ['mechanism-jammed'],
    },
    'MirasHut after "take letter"': {
      none: "only the amulet's glow, a line of text",
    },
    'ForestPath after "use sharp knife with vines"': { patches: ['vines-cut'] },
    'VillageChapel after "use candle with matches"': {
      patches: ['candle-lit'],
    },
    'VegetableField after "cast revive on Withered carrot"': {
      patches: ['withered-carrot-fresh'],
    },
    'VillageWell after "cast purify on well"': { patches: ['well-purified'] },
    'HiddenGlade after "cast light"': {
      none: 'the whole clearing turns from gloom to full sun, which is another picture, not a patch',
    },
    'MirasHut after "talk to mira"': { patches: ['ancient-amulet-gone'] },
    'OldMill after "talk to mira"': {
      none: "only the amulet humming in the player's hand, a line of text",
    },
    'HiddenGlade after "talk to mira"': {
      none: "only the amulet glowing in the player's hand, a line of text",
    },
  },
  Act2: {
    'InnRooms after "search"': { patches: ['coins-taken'] },
    'ResidentialQuarter after "search"': {
      patches: ['exit-secret-passage-open'],
    },
    'ForestTransition after "use forest survival kit"': {
      patches: ['exit-east-open'],
    },
    'ForestEntrance after "use protective charm"': {
      patches: ['forest-sprites-aside'],
    },
    'ForestEntrance after "use enhanced lantern"': {
      patches: ['exit-east-open'],
    },
  },
  Act3: {
    'TidalCauseway after "examine letter"': {
      none: 'a line of weather and dead birds; nothing in the picture changes',
    },
    'OuterWards after "cast purify on pillars"': {
      patches: ['warding-pillars-purified'],
    },
    'SubmergedAntechamber after "use moon rune shards with pillars"': {
      none: 'the tide draws back and changes the water of the whole hall, which is another picture, not a patch',
    },
    'SubmergedAntechamber after "use lantern with bracket"': {
      patches: ['lantern-bracket-mounted'],
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
      patches: ['mirror-mount-mended'],
    },
    'MirrorTerraces after "rest"': { patches: ['exit-east-open'] },
    'FumarolePassages after "use vent stone"': {
      none: 'the rhythm of the vents is breath and sound, not something the picture shows',
    },
    'FumarolePassages after "use heat-ward mix"': {
      none: 'the rhythm of the vents is breath and sound, not something the picture shows',
    },
    'FumarolePassages after "rest"': {
      none: 'the rhythm of the vents is breath and sound, not something the picture shows',
    },
    'PhoenixCrater after "rest"': { patches: ['phoenix-appears'] },
    'FumarolePassages after "n"': {
      none: 'the rhythm of the vents is breath and sound, not something the picture shows',
    },
    'CollapsedGalleries after "use wedge blocks with rock"': {
      patches: ['fallen-rock-gone'],
    },
    'DragonsHall after "talk to ancient dragon"': {
      none: 'the dripping stopping is sound, not something the picture shows',
    },
    'DragonsHall after "take dragon\'s scale"': { patches: ['sigils-dimmed'] },
  },
  Act4: {
    'FortressGates after "cast light on right stone"': {
      patches: ['ward-stones-dark'],
    },
    'OuterCourtyard after "cast bless on trapped servants"': {
      patches: ['trapped-servants-freed'],
    },
    'MirrorLabyrinth after "w"': {
      none: 'the corridors of the maze change the whole view, which is another picture, not a patch',
    },
    'MirrorLabyrinth after "e"': { patches: ['true-self-appears'] },
    'HallOfEchoes after "say redemption to knight"': {
      patches: ['knight-of-despair-redeemed'],
    },
    'TowerOfShadows after "say nyx to whispers"': {
      patches: ['whispers-gone'],
    },
    'ChamberOfWhispers after "say understanding to sorceress"': {
      patches: ['sorceress-of-lies-unmasked'],
    },
    'MemoryVault after "use enhanced echo stone with memory orbs"': {
      patches: ['memory-orbs-whole'],
    },
    'MemoryVault after "use ancient amulet on door"': {
      patches: ['exit-east-open'],
    },
    'ParentsVault after "examine memories"': { patches: ['memories-dimmed'] },
    'ThroneChamber after "use ancient amulet"': {
      none: "only the amulet's light filling the chamber, a line of light and text",
    },
    'ThroneChamber after "use lifelight elixir on malakar"': {
      patches: ['malakar-healed'],
    },
    'ThroneChamber after "cast forgiveness on wound"': {
      patches: ['wound-closed', 'crystal-prison-shattered', 'exit-north-open'],
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
        if ('patches' in entry) {
          const room = key.split(' after ')[0]
          for (const patch of entry.patches)
            expect(
              make()
                .roomPatches(room)
                .map((p) => p.id),
              key,
            ).toContain(patch)
        } else expect(entry.none.length, key).toBeGreaterThan(0)
      }
    })
  },
)
