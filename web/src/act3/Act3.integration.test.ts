import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from './Act3'
import { DarkPool } from './items/DarkPool'
import { StillwaterPhial } from './items/StillwaterPhial'
import { FortressGates } from './items/FortressGates'
import { LifelightElixir } from './items/LifelightElixir'
import { FortressEntrance } from './rooms/FortressEntrance'
import { Miners } from './characters/Miners'
import { WanderingPhantoms } from './characters/WanderingPhantoms'
import { PolishedShell } from './items/PolishedShell'
import { QuietCharm } from './items/QuietCharm'
import { ACT3_COMPLETING_COMMANDS, ACT3_GOLDEN_PATH } from './Act3GoldenPath'
import { playDebugScript } from '@/utils/debugScript'
import {
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_PHANTOMS_HEARD,
  FLAG_ACT3_SHELL_HEARD,
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_POOLS_STILLED,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGON_OATH_SPOKEN,
  FLAG_ACT3_OATH_SCROLLS_EXAMINED,
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_MIRA_FORGIVEN,
  FLAG_ACT3_MIRA_REPROACHED,
  FLAG_ACT3_FORTRESS_GATES_EXAMINED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_PHOENIX_STORY_TOLD,
  FLAG_ACT3_INSCRIPTION_MENDED,
  VIRTUE_MERCY,
} from './Act3StoryFlags'
import {
  executeCommands,
  expectMarkupWellFormed,
  expectCharacterInRoom,
  expectCurrentRoom,
  expectItemCountInInventory,
  expectItemInInventory,
  expectItemInRoom,
  expectQuests,
  expectStoryFlag,
  pathIndex,
  playPath,
} from '@/testing/gameHelpers'

const MAIN = 'The Three Virtues'
const ECHOES = 'Echoes of the Hidden Bond'

const PATH = ACT3_GOLDEN_PATH

/**
 * Where each stage of the golden path starts: the index of its first command.
 * A bead that adds a quest adds a marker and a block below; the path itself
 * stays the one place that says how the act is played.
 */
const AT = {
  opening: 0,
  causewayKey: pathIndex(PATH, 'examine mural'),
  shoreline: pathIndex(PATH, 'n', 1),
  outerWards: pathIndex(PATH, 'e', 1),
  collapsedPier: pathIndex(PATH, 'e', 2),
  antechamber: pathIndex(PATH, 'w', 1),
  sanctum: pathIndex(PATH, 'e', 3),
  leaveRuins: pathIndex(PATH, 'w', 2),
  scholar: pathIndex(PATH, 'talk to ash scholar'),
  outcrops: pathIndex(PATH, 'n', 2),
  terraces: pathIndex(PATH, 'e', 7),
  emberGallery: pathIndex(PATH, 's', 2),
  fumarole: pathIndex(PATH, 'n', 3),
  phoenix: pathIndex(PATH, 's', 3),
  cavernMouth: pathIndex(PATH, 'n', 4),
  overseer: pathIndex(PATH, 'talk to mine overseer'),
  toolCache: pathIndex(PATH, 'n', 5),
  galleries: pathIndex(PATH, 'e', 9),
  echoChambers: pathIndex(PATH, 'search', 6),
  vestibule: pathIndex(PATH, 'w', 6),
  dragon: pathIndex(PATH, 'e', 11),
  hut: pathIndex(PATH, 'w', 7),
  fortress: PATH.length - 1,
}

describe('Act 3 integration', () => {
  it('completes only after the fortress gates are examined', () => {
    const act = new Act3()
    const game = new Game([act])

    expect(act.isCompleted(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT3_FORTRESS_GATES_EXAMINED, true)
    expect(act.isCompleted(game.state)).toBe(true)
  })

  it('initializes correctly', () => {
    const act3 = new Act3()
    expect(act3).not.toBeNull()
    expect(typeof act3.rooms, 'rooms is a record').toBe('object')
    expect(Array.isArray(act3.quests), 'quests is a list').toBe(true)
    expect(act3.getActIntro()).not.toBeNull()
  })

  it('opens on the belief Elior voiced in Greendale and on how Mira brought the party home', () => {
    const intro = new Act3().getActIntro()

    expect(intro).toContain('[bold]ACT III: TRIALS AND REVELATIONS[/bold]')
    expect(intro).toContain(
      'He took them. That is why they vanished, and that is why he wants me.',
    )
    expect(intro).toContain(
      'Mira came to Greendale the night of the vision. She had felt the ' +
        'amulet open to the forest, she said, and knew. In the castle ' +
        'courtyard she drew a circle in chalk, and the three of you stepped ' +
        'out of it into her hut in Willowbrook, the herbs still swinging ' +
        'from the beam.',
    )
    expect(intro).not.toContain('THE AWAKENING')
    expect(intro).not.toContain('Obsidian Fortress')
  })

  it('can be loaded into a Game', () => {
    const act3 = new Act3()
    const game = new Game([act3])
    expect(game).not.toBeNull()
    expect(game.acts).toHaveLength(1)
    expect(game.acts[0]).toBe(act3)
  })
})

describe('Act 3 golden path', () => {
  /** Plays the path to `index` on a fresh game; the start of a stage. */
  const gameAt = (index: number): Game => {
    const game = new Game([new Act3()])
    playPath(game, PATH, 0, index)
    return game
  }
  /** Plays the path from `from` up to `to` and returns what the game said. */
  const play = (game: Game, from: number, to: number): string =>
    playPath(game, PATH, from, to).toLowerCase()

  describe('the opening in the hut', () => {
    it('starts the main quest, then the keepsake note starts a side quest', () => {
      const game = new Game([new Act3()])
      const state = game.state
      expectCurrentRoom(state, "Mira's Hut")
      expectCharacterInRoom(state.currentRoom, 'mira', true)

      expect(play(game, AT.opening, AT.opening + 1)).toContain('three relics')
      expectStoryFlag(state, FLAG_ACT3_MAIN_STARTED, true)
      expectQuests(state, [MAIN])

      play(game, AT.opening + 1, AT.opening + 2)
      expectQuests(state, [ECHOES, MAIN])
    })

    it('carries the party to the Tidal Causeway on the second talk', () => {
      const game = gameAt(AT.opening + 2)
      play(game, AT.opening + 2, AT.causewayKey)
      expectCurrentRoom(game.state, 'Tidal Causeway')
      expectCharacterInRoom(game.state.currentRoom, 'mira', true)
      expectCharacterInRoom(game.state.currentRoom, 'sir cedric', true)
    })
  })

  describe('the Tidal Causeway: the mural, the letter and the key', () => {
    it('reads the mural, takes the sea-sealed letter and finds the key by light', () => {
      const game = gameAt(AT.causewayKey)
      const state = game.state
      expectItemInInventory(state, 'Rusted Locker Key', false)

      const mural = play(game, AT.causewayKey, AT.causewayKey + 1)
      expect(
        mural.includes('reliquary') || mural.includes('sea-sealed letter'),
      ).toBe(true)
      play(game, AT.causewayKey + 1, AT.causewayKey + 3)
      expectItemInInventory(state, 'Sea-Sealed Letter', true)

      const light = play(game, AT.causewayKey + 3, AT.causewayKey + 4)
      expect(light).toContain('shadow')
      expect(light).toContain('hollow')
      expect(light).toContain('key')
      expectItemInRoom(state.currentRoom, 'Rusted Locker Key', true)

      play(game, AT.causewayKey + 4, AT.shoreline)
      expectItemInInventory(state, 'Rusted Locker Key', true)
      expectItemInRoom(state.currentRoom, 'Rusted Locker Key', false)
    })
  })

  describe('Shoreline Markers: the moon rune shards', () => {
    it('starts Tideward Sigils and gives the shards once', () => {
      const game = gameAt(AT.shoreline)
      const state = game.state
      play(game, AT.shoreline, AT.shoreline + 1)
      expectCurrentRoom(state, 'Shoreline Markers')
      const reveal = play(game, AT.shoreline + 1, AT.shoreline + 2)
      expect(reveal.includes('moon') || reveal.includes('shard')).toBe(true)
      expectQuests(state, [ECHOES, MAIN, 'Tideward Sigils'])

      const found = play(game, AT.shoreline + 2, AT.outerWards)
      expect(found.includes('moon') || found.includes('shard')).toBe(true)
      expectItemInInventory(state, 'Moon Rune Shards', true)
      expect(executeCommands(game, ['search']).toLowerCase()).toContain(
        'already',
      )
    })
  })

  describe('Outer Wards: Tideward Sigils', () => {
    it('purifies the pillars and sets the sigil', () => {
      const game = gameAt(AT.outerWards)
      const state = game.state
      play(game, AT.outerWards, AT.outerWards + 1)
      expectCurrentRoom(state, 'Outer Wards')

      const purify = play(game, AT.outerWards + 1, AT.outerWards + 2)
      expect(
        ['cleanse', 'rinse', 'cleansed'].some((k) => purify.includes(k)),
      ).toBe(true)
      expect(play(game, AT.outerWards + 2, AT.collapsedPier)).toContain('sigil')
      expectStoryFlag(state, FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
      expectQuests(state, [ECHOES, MAIN])
    })
  })

  describe('Collapsed Pier: the locker and the prism lanterns', () => {
    it('jams the old key, opens the locker by spell and gives three lanterns', () => {
      const game = gameAt(AT.collapsedPier)
      const state = game.state
      play(game, AT.collapsedPier, AT.collapsedPier + 1)
      expectCurrentRoom(state, 'Collapsed Pier')

      const exam = executeCommands(game, ['examine locker']).toLowerCase()
      expect(exam.includes('fused') || exam.includes('lock')).toBe(true)
      const jammed = play(game, AT.collapsedPier + 1, AT.collapsedPier + 2)
      expect(
        jammed.includes('too corroded') ||
          jammed.includes('jams in the mechanism'),
      ).toBe(true)

      const unlocked = play(game, AT.collapsedPier + 2, AT.collapsedPier + 3)
      expect(unlocked).toContain('locker')
      expect(unlocked.includes('click') || unlocked.includes('release')).toBe(
        true,
      )
      expect(play(game, AT.collapsedPier + 3, AT.collapsedPier + 4)).toContain(
        'prism lantern',
      )
      play(game, AT.collapsedPier + 4, AT.antechamber)
      expectItemCountInInventory(state, 'Prism Lantern', 3)
    })
  })

  describe('Submerged Antechamber: the lanterns and the light', () => {
    it('mounts three lanterns and lights the path west', () => {
      const game = gameAt(AT.antechamber)
      const state = game.state
      expectItemCountInInventory(state, 'Prism Lantern', 3)

      play(game, AT.antechamber, AT.antechamber + 2)
      expectCurrentRoom(state, 'Submerged Antechamber')
      expect(play(game, AT.antechamber + 2, AT.antechamber + 3)).toContain(
        'bracket',
      )
      play(game, AT.antechamber + 3, AT.antechamber + 6)
      expectItemCountInInventory(state, 'Prism Lantern', 0)
      const light = play(game, AT.antechamber + 6, AT.sanctum)
      expect(light.includes('path') || light.includes('lanterns')).toBe(true)
    })
  })

  describe('Sanctum of the Tide: the vow and the crystal', () => {
    it('parts the water on the last step and asks what was not abandoned', () => {
      const game = gameAt(AT.sanctum)
      const parted = play(game, AT.sanctum, AT.sanctum + 4)
      expectCurrentRoom(game.state, 'Sanctum of the Tide')
      expect(parted).toContain('what did you not abandon?')

      const midWalk = new Game([new Act3()])
      midWalk.loadSaveData(game.toSaveData())
      expect(midWalk.state.currentRoom.descriptionFor(midWalk.state)).toContain(
        'The water stands parted',
      )
    })

    it('lets the crystal be taken once the vow is spoken', () => {
      const game = gameAt(AT.sanctum + 4)
      const vow = play(game, AT.sanctum + 4, AT.sanctum + 5)
      expect(vow).toContain('sits loose in its basin')
      play(game, AT.sanctum + 5, AT.sanctum + 6)
      expectItemInInventory(game.state, 'crystal of light', true)
    })
  })

  describe('leaving the ruins for Mount Ember', () => {
    it('talks Mira into carrying the party to the Lower Switchbacks', () => {
      const game = gameAt(AT.leaveRuins)
      play(game, AT.leaveRuins, AT.scholar)
      expectCurrentRoom(game.state, 'Lower Switchbacks')
    })
  })

  describe('Lower Switchbacks: the scholar and the canteen', () => {
    it('gives the first brass mirror segment and a second from the canteen', () => {
      const game = gameAt(AT.scholar)
      const state = game.state
      const talk = play(game, AT.scholar, AT.scholar + 1)
      expect(talk.includes('scholar') || talk.includes('brass')).toBe(true)
      expectItemCountInInventory(state, 'Brass Mirror Segment', 1)

      const canteen = play(game, AT.scholar + 1, AT.scholar + 2)
      expect(
        ['expedition', 'brass', 'canteen'].some((k) => canteen.includes(k)),
      ).toBe(true)
      play(game, AT.scholar + 2, AT.outcrops)
      expectItemCountInInventory(state, 'Brass Mirror Segment', 2)
    })
  })

  describe('Obsidian Outcrops: more segments and binding resin', () => {
    it('shows brass and resin on a search and lets both be taken', () => {
      const game = gameAt(AT.outcrops)
      const state = game.state
      play(game, AT.outcrops, AT.outcrops + 1)
      expectCurrentRoom(state, 'Obsidian Outcrops')
      const search = play(game, AT.outcrops + 1, AT.outcrops + 2)
      expect(search.includes('brass') || search.includes('resin')).toBe(true)
      play(game, AT.outcrops + 2, AT.terraces)
      expectItemCountInInventory(state, 'Brass Mirror Segment', 3)
      expectItemInInventory(state, 'Binding Resin')
    })
  })

  describe('Mirror Terraces: mirrors of Ember Light', () => {
    it('installs the segments, mends the mount and waits for the noon beam', () => {
      const game = gameAt(AT.terraces)
      const state = game.state
      play(game, AT.terraces, AT.terraces + 4)
      expectCurrentRoom(state, 'Mirror Terraces')
      expectItemCountInInventory(state, 'Brass Mirror Segment', 4)
      play(game, AT.terraces + 4, AT.terraces + 6)
      expectStoryFlag(state, FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, false)

      play(game, AT.terraces + 6, AT.terraces + 7)
      expectStoryFlag(state, FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, false)
      expect(state.currentRoom.getExits(state).east).toBeUndefined()

      const reloaded = new Game([new Act3()])
      reloaded.loadSaveData(game.toSaveData())
      executeCommands(reloaded, ['rest'])
      expectStoryFlag(
        reloaded.state,
        FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
        true,
      )

      play(game, AT.terraces + 7, AT.emberGallery)
      expectStoryFlag(state, FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, true)
    })
  })

  describe('Ember Gallery: the heat-ward mix', () => {
    it('finds ash-fern and cooled slag and combines them', () => {
      const game = gameAt(AT.emberGallery)
      const state = game.state
      play(game, AT.emberGallery, AT.emberGallery + 1)
      expectCurrentRoom(state, 'Ember Gallery')
      const search = play(game, AT.emberGallery + 1, AT.emberGallery + 2)
      expect(
        search.includes('ash-fern') || search.includes('cooled slag'),
      ).toBe(true)
      play(game, AT.emberGallery + 2, AT.emberGallery + 4)
      expectItemInInventory(state, 'ash-fern', true)
      expectItemInInventory(state, 'cooled slag', true)
      const craft = play(game, AT.emberGallery + 4, AT.fumarole)
      expect(craft.includes('heat') || craft.includes('ward')).toBe(true)
      expectItemInInventory(state, 'heat-ward mix', true)
    })
  })

  describe('Fumarole Passages: Breath of the Mountain', () => {
    it('refuses the ward until the third vent stone, then seals the vents', () => {
      const game = gameAt(AT.fumarole)
      const state = game.state
      play(game, AT.fumarole, AT.fumarole + 2)
      expectCurrentRoom(state, 'Fumarole Passages')
      executeCommands(game, ['south'])
      expectCurrentRoom(state, 'Fumarole Passages')

      // Off the path: the stones can be picked up, and there are three.
      executeCommands(game, ['take vent stone', 'take vent stone'])
      executeCommands(game, ['take vent stone'])
      expectItemCountInInventory(state, 'Vent Stone', 3)
      play(game, AT.fumarole + 2, AT.fumarole + 4)
      const early = executeCommands(game, ['use heat-ward mix']).toLowerCase()
      expect(
        early.includes('not yet synchronized') || early.includes('unstable'),
      ).toBe(true)

      play(game, AT.fumarole + 4, AT.fumarole + 5)
      const applied = play(game, AT.fumarole + 5, AT.fumarole + 6)
      expect(applied.includes('ward') || applied.includes('seals')).toBe(true)
      expectStoryFlag(state, FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, false)
    })

    it('keeps the in-breath across a save and crosses on it', () => {
      const game = gameAt(AT.fumarole + 6)
      const state = game.state
      executeCommands(game, ['south'])
      expectCurrentRoom(state, 'Fumarole Passages')
      executeCommands(game, ['rest'])
      const midBreath = new Game([new Act3()])
      midBreath.loadSaveData(game.toSaveData())
      executeCommands(midBreath, ['south'])
      expectCurrentRoom(midBreath.state, 'Phoenix Crater')

      executeCommands(game, ['south'])
      expectCurrentRoom(state, 'Phoenix Crater')
      expectStoryFlag(state, FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, true)
    })

    it('crosses on the path as it is played', () => {
      const game = gameAt(AT.phoenix + 1)
      expectCurrentRoom(game.state, 'Phoenix Crater')
      expectStoryFlag(
        game.state,
        FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
        true,
      )
    })
  })

  describe('Phoenix Crater: the relic trial', () => {
    it('shows the phoenix, asks its riddle and gives the feather for patience', () => {
      const game = gameAt(AT.phoenix + 1)
      const state = game.state
      play(game, AT.phoenix + 1, AT.phoenix + 2)
      expectCharacterInRoom(state.currentRoom, 'phoenix', true)
      const riddle = play(game, AT.phoenix + 2, AT.phoenix + 3)
      expect(riddle).toContain('wisdom')
      expect(riddle).toContain('time is short')
      play(game, AT.phoenix + 3, AT.cavernMouth)
      expectItemInInventory(state, 'phoenix feather', true)
    })
  })

  describe('Cavern Mouth: the Mine Overseer', () => {
    it('carries the party under the mountain and gives the miner’s key', () => {
      const game = gameAt(AT.cavernMouth)
      const state = game.state
      play(game, AT.cavernMouth, AT.overseer)
      expectCurrentRoom(state, 'Cavern Mouth')
      expectCharacterInRoom(state.currentRoom, 'mine overseer', true)

      const talk = play(game, AT.overseer, AT.overseer + 1)
      expect(talk).toContain('tool cache')
      expect(talk).toContain('key')
      expectItemInInventory(state, "Miner's Key", true)
    })
  })

  describe("Tool Cache: the supply crate (Miners' Rescue)", () => {
    it('hides the crate until a search, then yields the three supplies', () => {
      const game = gameAt(AT.toolCache)
      const state = game.state
      play(game, AT.toolCache, AT.toolCache + 1)
      expectCurrentRoom(state, 'Tool Cache')
      expectItemInRoom(state.currentRoom, 'supply crate', false)

      const search = play(game, AT.toolCache + 1, AT.toolCache + 2)
      expect(search).toContain('discover a heavy supply crate')
      expect(search).toContain('hidden behind stacked timbers')
      expect(search).toContain('rescue supplies')
      expectItemInRoom(state.currentRoom, 'supply crate', true)
      expect(executeCommands(game, ['search']).toLowerCase()).toContain(
        'already found',
      )

      const unlock = play(game, AT.toolCache + 2, AT.toolCache + 3)
      expect(unlock.includes('unlock') || unlock.includes('padlock')).toBe(true)
      expect(play(game, AT.toolCache + 3, AT.toolCache + 4)).toContain('braces')
      play(game, AT.toolCache + 4, AT.galleries)
      expectItemInInventory(state, 'Reinforced Braces', true)
      expectItemInInventory(state, 'Support Straps', true)
      expectItemInInventory(state, 'Wedge Blocks', true)
    })
  })

  describe('Collapsed Galleries: freeing the miners', () => {
    it('keeps the east blocked until the rock is braced, strapped and wedged', () => {
      const game = gameAt(AT.galleries)
      const state = game.state
      play(game, AT.galleries, AT.galleries + 2)
      expectCurrentRoom(state, 'Collapsed Galleries')
      expectCharacterInRoom(state.currentRoom, 'miners', false)
      expectItemInRoom(state.currentRoom, 'fallen rock', true)
      executeCommands(game, ['east'])
      expectCurrentRoom(state, 'Collapsed Galleries')

      expect(play(game, AT.galleries + 2, AT.galleries + 3)).toContain(
        'steady the collapse',
      )
      expect(play(game, AT.galleries + 3, AT.galleries + 4)).toContain(
        'bind the reinforced braces securely',
      )
      const freed = play(game, AT.galleries + 4, AT.galleries + 5)
      expect(freed).toContain('the pile gives way')
      expect(freed).toContain('the miners come out one at a time')
      expectCharacterInRoom(state.currentRoom, 'miners', true)
      expectItemInRoom(state.currentRoom, 'fallen rock', false)
    })

    it('completes the rescue when the miners are spoken to', () => {
      const game = gameAt(AT.galleries + 5)
      const rescue = play(game, AT.galleries + 5, AT.galleries + 6)
      expect(rescue).toContain('miner steps forward')
      expect(rescue).toContain('thank the gods')
      expectStoryFlag(game.state, FLAG_ACT3_MINERS_RESCUE_COMPLETED, true)
      play(game, AT.galleries + 6, AT.echoChambers)
      expectCurrentRoom(game.state, 'Echo Chambers')
    })
  })

  describe('Echo Chambers: the Resonant Chant', () => {
    it('shows the oath scrolls and the rubbings from the runic walls', () => {
      const game = gameAt(AT.echoChambers)
      const state = game.state
      expectItemInRoom(state.currentRoom, 'runic walls', true)

      const search = executeCommands(game, [PATH[AT.echoChambers]])
      expect(search).toContain('ancient scrolls')
      expect(search).toContain('stone niche')

      const scrolls = executeCommands(game, [PATH[AT.echoChambers + 1]])
      expect(scrolls).toContain('I take what is given, and I return ___.')
      expect(scrolls.toLowerCase()).not.toContain('disintegrate')
      expectStoryFlag(state, FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)
      expectItemInRoom(state.currentRoom, 'Old Oath Scrolls', true)

      const walls = executeCommands(game, [PATH[AT.echoChambers + 2]])
      expect(walls).toContain('Let stillness echo, let silence bind')
      expect(walls.toLowerCase()).toContain('chant to quiet the phantoms')
      expectItemInRoom(state.currentRoom, 'Resonant Chant Rubbings', true)

      expectItemInInventory(state, 'Resonant Chant Rubbings', false)
      expect(executeCommands(game, [PATH[AT.echoChambers + 3]])).toBe(
        'This might come in handy, so you decide to pick it up.',
      )
      expectItemInInventory(state, 'Resonant Chant Rubbings', true)
    })
  })

  describe('Stillness Vestibule: the Oath of Stillness', () => {
    it('blesses the stones, stills the pools and performs the oath', () => {
      const game = gameAt(AT.vestibule)
      const state = game.state
      play(game, AT.vestibule, AT.vestibule + 2)
      expectCurrentRoom(state, 'Stillness Vestibule')
      expectItemInRoom(state.currentRoom, 'echo stones', true)
      expectCharacterInRoom(state.currentRoom, 'silence keeper', true)

      const bless = play(game, AT.vestibule + 2, AT.vestibule + 3)
      expect(bless).toContain('steady glow')
      expect(bless).toContain('ancient chant')

      play(game, AT.vestibule + 3, AT.vestibule + 4)
      const still = play(game, AT.vestibule + 4, AT.vestibule + 5)
      expect(still).toContain('the pools are mirror-still')
      expectItemInInventory(state, 'stillwater phial', true)

      const oath = play(game, AT.vestibule + 5, AT.dragon)
      expect(oath).toContain('you recite the resonant chant')
      expect(oath).toContain('harmonious silence')
      expect(oath).toContain("dragon's hall now lies open")
      expectStoryFlag(state, FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)
      expectItemInInventory(state, 'Resonant Chant Rubbings', false)
    })
  })

  describe("Dragon's Hall: the memory, the oath and the scale", () => {
    it('shares its memory on the first talk', () => {
      const game = gameAt(AT.dragon + 1)
      const state = game.state
      expectCharacterInRoom(state.currentRoom, 'ancient dragon', true)
      expectItemInRoom(state.currentRoom, "dragon's scale", false)

      const memory = play(game, AT.dragon + 1, AT.dragon + 2)
      expect(memory).toContain('aren and lysa')
      expect(memory).toContain('warded away, not dead')
      expect(memory).toContain('anchored in the amulet')
      expectStoryFlag(state, FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    })

    it('gives its scale to the finished oath', () => {
      const game = gameAt(AT.dragon + 2)
      const state = game.state
      const oath = executeCommands(game, [PATH[AT.dragon + 2]])
      expect(oath).toContain('Your words ring true, young one.')
      expect(oath.toLowerCase()).toContain('scale')
      expectStoryFlag(state, FLAG_ACT3_DRAGON_OATH_SPOKEN, true)
      expectItemInRoom(state.currentRoom, "dragon's scale", true)

      play(game, AT.dragon + 3, AT.hut)
      expectItemInInventory(state, "dragon's scale", true)
      expectItemInRoom(state.currentRoom, "dragon's scale", false)
    })
  })

  describe("Mira's Hut: the confession, the rite and the elixir", () => {
    it('brings the party home with the three relics', () => {
      const game = gameAt(AT.hut)
      const talk = play(game, AT.hut, AT.hut + 3)
      expect(talk).toContain('that is all three')
      expect(talk).toContain('to my hut')
      expectCurrentRoom(game.state, "Mira's Hut")
    })

    it('holds the rite back until the confession is heard and answered', () => {
      const game = gameAt(AT.hut + 3)
      const state = game.state
      expectCurrentRoom(state, "Mira's Hut")
      expect(executeCommands(game, ['say parents to mira'])).toContain(
        'Later, Elior. Not here.',
      )
      const confession = executeCommands(game, [PATH[AT.hut + 3]])
      expect(confession.toLowerCase()).toContain('i was their pupil')
      expect(confession).toContain('say parents, say malakar')
      expect(executeCommands(game, ['say mother to mira'])).toContain(
        'They became the ward',
      )
      expectStoryFlag(state, FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, false)

      expect(executeCommands(game, ['say i forgive you to mira'])).toContain(
        'Thank you. I did not dare ask for that.',
      )
      expectStoryFlag(state, FLAG_ACT3_MIRA_FORGIVEN, true)

      const beforeRite = new Game([new Act3()])
      expect(beforeRite.loadSaveData(game.toSaveData())).toContain('loaded')
      expectItemInRoom(beforeRite.state.currentRoom, 'healing herbs', true)
      expect(executeCommands(beforeRite, ['say amulet to mira'])).toContain(
        'anchor of their ward',
      )
      expectStoryFlag(beforeRite.state, FLAG_ACT3_MIRA_FORGIVEN, true)
      executeCommands(beforeRite, ['talk to mira'])
      expectItemInRoom(beforeRite.state.currentRoom, 'healing herbs', false)
    })

    it('performs the Warding Rite and gives the lifelight elixir', () => {
      const game = gameAt(AT.hut + 4)
      const state = game.state
      const rite = play(game, AT.hut + 4, AT.hut + 5)
      expect(rite).toContain('three relics resonate')
      expect(rite).toContain('lifelight elixir')
      expect(rite).toContain('they were made together, and they know it.')
      expectStoryFlag(state, FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, true)

      expect(
        executeCommands(game, ['say you should have told me to mira']),
      ).toContain('shakes her head.')
      expectStoryFlag(state, FLAG_ACT3_MIRA_REPROACHED, false)

      expectItemInRoom(state.currentRoom, 'healing herbs', false)
      expectItemInInventory(state, 'healing herbs', false)
      expect(executeCommands(game, ['take herbs'])).toContain(
        "There is no 'herbs' here to take.",
      )

      expectItemInRoom(state.currentRoom, 'lifelight elixir', true)
      play(game, AT.hut + 5, AT.hut + 6)
      expectItemInInventory(state, 'lifelight elixir', true)
      expectItemInRoom(state.currentRoom, 'lifelight elixir', false)
    })
  })

  describe("Entrance to Malakar's Fortress: the gates", () => {
    it('carries the party to the fortress, where Mira refuses to stay behind', () => {
      // Mira's forgiveness is the player's choice, off the path.
      const game = gameAt(AT.hut + 3)
      executeCommands(game, [PATH[AT.hut + 3], 'say i forgive you to mira'])
      play(game, AT.hut + 4, AT.fortress)
      const fortress = play(game, AT.fortress, PATH.length)
      expect(fortress).toContain('final journey')
      expect(fortress).toContain('fortress')
      expectCurrentRoom(game.state, "Entrance to Malakar's Fortress")

      const gateTalk = executeCommands(game, ['talk to mira'])
      expect(gateTalk).toContain('I am coming with you.')
      expect(gateTalk).toContain('You forgave me in the hut')
      expect(executeCommands(game, ['talk to mira'])).toContain(
        'I am right behind you, Elior.',
      )
    })

    it('completes the act on the gates, with the hook as the closing page', () => {
      const game = gameAt(PATH.length)
      const state = game.state
      const examine = executeCommands(game, ACT3_COMPLETING_COMMANDS)
      expect(examine.toLowerCase()).toContain(
        'the gates are taller than a house',
      )
      expect(examine.toLowerCase()).toContain('act iii is complete')
      expectStoryFlag(state, FLAG_ACT3_FORTRESS_GATES_EXAMINED, true)
      expect(examine).toContain(
        'The Dragon said they were warded away, not dead. You do not yet know what that means.',
      )
      expect(examine).toContain('In your pack, the lifelight elixir is warm.')

      for (let turn = 0; turn < 3; turn++) game.newTurn()
      const hook =
        "Your parents were Malakar's closest friends. The Dragon says they are warded away, not dead."
      expect(game.getActCompleteText()).toMatch(
        new RegExp(`^${hook}\\n\\nCongratulations — you have completed`),
      )
      const fresh = new Game([new Act3()])
      expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
      for (let turn = 0; turn < 3; turn++) fresh.newTurn()
      expect(fresh.getActCompleteText()).toBe(game.getActCompleteText())
      expectItemInRoom(fresh.state.allRooms.MirasHut, 'healing herbs', false)
      expect(executeCommands(game, ['look at mira'])).toContain(
        "the Wardens' pupil",
      )
      expectStoryFlag(state, FLAG_ACT3_MAIN_COMPLETED, true)
      expect(state.isQuestCompleted(MAIN)).toBe(true)
      expect(new Act3().isCompleted(state)).toBe(true)
    })
  })

  it('survives a save and load round-trip at the end', () => {
    const game = new Game([new Act3()])
    expectMarkupWellFormed(game.commandParser.parse('cheat act 3'))
    const data = game.toSaveData()
    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(data)).toContain('loaded')
    expect(fresh.state.currentRoom.name).toBe(game.state.currentRoom.name)
    expect(fresh.state.inventory.map((i) => i.name)).toEqual(
      game.state.inventory.map((i) => i.name),
    )
    expect(fresh.state.storyFlags).toEqual(game.state.storyFlags)
  })
})

describe('Act 3 Mount Ember notebook save and load', () => {
  it('keeps the scholar gift and the Phoenix told-once state across a save', () => {
    const game = new Game([new Act3()])
    const room = game.state.getRoom('Lower Switchbacks')
    if (!room) throw new Error('Lower Switchbacks missing')
    game.state.currentRoom = room
    game.commandParser.parse('talk to ash scholar')
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_STORY_TOLD, true)

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(fresh.state.hasItem('Charred Notebook')).toBe(true)
    expect(fresh.state.getStoryFlag(FLAG_ACT3_PHOENIX_STORY_TOLD)).toBe(true)
    const again = fresh.commandParser.parse('talk to ash scholar')
    expect(again).toContain('Seek the outcrops for what the mountain has shed.')
    expect(fresh.state.getItemCount('Charred Notebook')).toBe(1)
  })
})

describe('Act 3 optional mercy: mending the inscription', () => {
  it('records one mercy, skips nothing on the golden path and survives a save', () => {
    const game = new Game([new Act3()])
    const upToInscription = ACT3_GOLDEN_PATH.slice(
      0,
      ACT3_GOLDEN_PATH.indexOf('examine inscription') + 1,
    )
    executeCommands(game, upToInscription)

    const mended = executeCommands(game, ['cast mend on inscription'])
    expect(mended).toContain('The deeper cut fills.')
    expect(mended).toContain('this will be remembered')
    expect(game.state.virtueCount(VIRTUE_MERCY)).toBe(1)

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(fresh.state.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)).toBe(true)
    expect(fresh.state.virtueCount(VIRTUE_MERCY)).toBe(1)
    const again = executeCommands(fresh, ['cast mend on inscription'])
    expect(again).toContain('There is nothing left to mend.')
    expect(again).not.toContain('remembered')
    expect(fresh.state.virtueCount(VIRTUE_MERCY)).toBe(1)

    executeCommands(fresh, ACT3_GOLDEN_PATH.slice(upToInscription.length))
    executeCommands(fresh, ACT3_COMPLETING_COMMANDS)
    expect(new Act3().isCompleted(fresh.state)).toBe(true)
  })
})

describe('Act 3 golden path as declared by the act', () => {
  it('does not replay a glow after a save and load mid-act', () => {
    const game = new Game([new Act3()])
    executeCommands(game, ACT3_GOLDEN_PATH.slice(0, 8))
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const again = executeCommands(fresh, ['examine letter', 'examine amulet'])

    expect(again).not.toContain('grows warm')
    expect(again).toContain('two faces linger')
  })

  it('answers the dragon after a reload with the scrolls read but not in hand', () => {
    const game = new Game([new Act3()])
    const toDragon = ACT3_GOLDEN_PATH.indexOf(
      'say everything to ancient dragon',
    )
    executeCommands(game, ACT3_GOLDEN_PATH.slice(0, toDragon))
    game.state.removeItemFromInventory('Old Oath Scrolls')
    const chambers = game.state.getRoom('Echo Chambers')?.items ?? []
    chambers.splice(
      0,
      chambers.length,
      ...chambers.filter((i) => i.name !== 'Old Oath Scrolls'),
    )
    expect(chambers.some((i) => i.name === 'Old Oath Scrolls')).toBe(false)
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const talk = executeCommands(fresh, ['talk to ancient dragon'])
    expect(talk).toContain('what will you give back, for what you take?')

    const early = executeCommands(fresh, ['say it to ancient dragon'])
    expect(early).toContain('Your words ring true, young one.')
    expectStoryFlag(fresh.state, FLAG_ACT3_DRAGON_OATH_SPOKEN, true)

    const again = new Game([new Act3()])
    again.loadSaveData(fresh.toSaveData())
    expectStoryFlag(again.state, FLAG_ACT3_DRAGON_OATH_SPOKEN, true)
  })

  it('hears the dream voice once and does not replay it after a reload', () => {
    const game = new Game([new Act3()])
    const first = executeCommands(
      game,
      ACT3_GOLDEN_PATH.slice(
        0,
        ACT3_GOLDEN_PATH.indexOf('talk to ancient dragon') + 1,
      ),
    )
    expect(first).toContain('The friend who stayed behind.')
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const again = executeCommands(fresh, ['talk to ancient dragon'])

    expect(again).not.toContain('stayed behind')
    expect(again).toContain('what will you give back, for what you take?')
  })

  it("plays each of Mira's slips once on the golden path, before the confession", () => {
    const game = new Game([new Act3()])
    const out = executeCommands(game, ACT3_GOLDEN_PATH)
    const count = (needle: string): number => out.split(needle).length - 1
    expect(count('She always crossed her sevens.')).toBe(1)
    expect(count('looks at the feather a long time.')).toBe(1)
    expect(count('Tell her she has grown old.')).toBe(1)
    expect(count('does not answer.')).toBe(1)
    expect(count('You noticed. I saw you notice.')).toBe(1)
    expect(out.indexOf('crossed her sevens')).toBeLessThan(
      out.indexOf('a long time'),
    )
    expect(out.indexOf('grown old')).toBeLessThan(
      out.indexOf('I saw you notice'),
    )
  })

  it("still relays the dragon's message after a save and load", () => {
    const game = new Game([new Act3()])
    executeCommands(
      game,
      ACT3_GOLDEN_PATH.slice(
        0,
        ACT3_GOLDEN_PATH.indexOf('talk to ancient dragon') + 1,
      ),
    )
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const relay = executeCommands(fresh, ['w', 'w', 'talk to mira'])

    expect(relay).toContain(
      "[effect]You give her the dragon's words.[/effect] [character_name]Mira[/character_name] does not answer.",
    )
  })

  it('ends with the amulet showing both parents, after three glows', () => {
    const game = new Game([new Act3()])
    const out = executeCommands(game, ACT3_GOLDEN_PATH)
    expect(
      out.match(
        /ancient amulet\[\/item_name\] (grows warm|glows again|blazes)/g,
      ),
    ).toHaveLength(3)
    expect(executeCommands(game, ['examine amulet'])).toContain(
      'Aren and Lysa stand hand in hand',
    )
  })

  it('completes every non-main quest before completing the main quest', () => {
    const game = new Game([new Act3()])
    executeCommands(game, ACT3_GOLDEN_PATH)
    expect(game.state.completedQuests.map((q) => q.name).sort()).toEqual([
      'Breath of the Mountain',
      'Echoes of the Hidden Bond',
      'Lanterns of the Deeps',
      "Miners' Rescue",
      'Mirrors of Emberlight',
      'Oath of Stillness',
      'The Three Virtues',
      'Tideward Sigils',
    ])
  })

  it('is what cheat act 3 plays', () => {
    const viaPath = new Game([new Act3()])
    executeCommands(viaPath, ACT3_GOLDEN_PATH)
    const viaCheat = new Game([new Act3()])
    executeCommands(viaCheat, ['cheat act 3'])
    expect(viaCheat.state.storyFlags).toEqual(viaPath.state.storyFlags)
    expect(viaCheat.state.currentRoom.name).toBe(viaPath.state.currentRoom.name)
  })
})

describe('debug act3', () => {
  it('plays the golden path without a failure, leaving the finale to the player', async () => {
    const game = new Game([new Act3()])
    const shown: string[] = []
    await playDebugScript('act3', {
      play: (command) => executeCommands(game, [command]),
      running: () => true,
      show: (text) => shown.push(text),
      goldenPath: (n) => game.goldenPath(n),
    })
    expect(shown.join('\n')).not.toContain('[failure]')
    expectStoryFlag(game.state, FLAG_ACT3_FORTRESS_GATES_EXAMINED, false)

    executeCommands(game, ACT3_COMPLETING_COMMANDS)
    expectStoryFlag(game.state, FLAG_ACT3_FORTRESS_GATES_EXAMINED, true)
  })
})

describe('Tobin and the saves', () => {
  const galleries = (game: Game): string[] =>
    game.state.allRooms.CollapsedGalleries.characters.map((c) => c.name)

  it('keeps Tobin and how often he was talked to through a save', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.CollapsedGalleries
    game.state.currentRoom.addCharacter(new Miners())
    executeCommands(game, ['talk to miners', 'talk to boy', 'talk to tobin'])

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(galleries(fresh)).toContain('Tobin')
    expect(executeCommands(fresh, ['talk to young miner'])).toContain(
      '[character_name]Tobin[/character_name] does not look up.',
    )
  })

  it('gives Tobin to a save already past the rescue, once', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED, true)
    expect(galleries(game)).not.toContain('Tobin')

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    new Act3().afterLoad(fresh.state)

    expect(galleries(fresh).filter((n) => n === 'Tobin')).toHaveLength(1)
  })

  it('leaves Tobin out of a save from before the rescue', () => {
    const game = new Game([new Act3()])
    new Act3().afterLoad(game.state)
    expect(galleries(game)).not.toContain('Tobin')
  })
})

describe('Giving the quiet charm to Tobin', () => {
  const rescued = (): Game => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.CollapsedGalleries
    game.state.currentRoom.addCharacter(new Miners())
    executeCommands(game, ['talk to miners'])
    game.state.addItemToInventory(new QuietCharm())
    return game
  }

  it('plays through the commands, records one selfless moment and cannot be repeated', () => {
    const game = rescued()
    const gift = executeCommands(game, ['give quiet charm to young miner'])
    expect(gift).toContain("It's quiet.")
    expect(gift).toContain('✦ Selflessness — this will be remembered')
    expect(game.state.virtueCount('selfless')).toBe(1)
    expect(game.state.hasItem('quiet charm')).toBe(false)
    expect(executeCommands(game, ['give charm to boy'])).toContain(
      "You don't have a 'charm' to give.",
    )
    expect(game.state.virtueCount('selfless')).toBe(1)
  })

  it('keeps the gift, the selfless moment and the unseen thanks through a save', () => {
    const game = rescued()
    executeCommands(game, ['give charm to tobin'])

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(fresh.state.virtueCount('selfless')).toBe(1)
    expect(executeCommands(fresh, ['examine boy'])).toContain(
      'The pale charm hangs at his throat',
    )
    expect(executeCommands(fresh, ['talk to tobin'])).toContain('Still quiet.')
    expect(executeCommands(fresh, ['talk to miners'])).toContain(
      'Thank you, Elior.',
    )
    expect(executeCommands(fresh, ['talk to miners'])).not.toContain(
      'Thank you, Elior.',
    )
  })
})

describe('Act 3 saves from before the stillwater phial stilled the pools', () => {
  it('gives the old phial its reflection, adds the pool and counts a finished oath as stilled', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.StillnessVestibule
    const vestibule = game.state.allRooms.StillnessVestibule
    vestibule.items = vestibule.items.filter(
      (item) => !(item instanceof DarkPool),
    )
    const phial = vestibule.items.find((i) => i instanceof StillwaterPhial)
    if (!phial) throw new Error('no phial')
    phial.description = 'An old phial text.'
    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)

    new Act3().afterLoad(game.state)

    expect(phial.description).toContain('a young woman at a long table')
    expect(vestibule.items.some((i) => i instanceof DarkPool)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_ACT3_POOLS_STILLED)).toBe(true)
    expect(executeCommands(game, ['examine pool'])).toContain(
      'Not a tremor crosses it.',
    )
  })
})

describe('Act 3 lullaby', () => {
  it('keeps what Elior has heard across a save and load', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom.addItem(new PolishedShell())
    game.listen('shell')
    new WanderingPhantoms().talkTo(game.state)

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    expectStoryFlag(fresh.state, FLAG_ACT3_SHELL_HEARD, true)
    expectStoryFlag(fresh.state, FLAG_ACT3_PHANTOMS_HEARD, true)
    expect(fresh.listen('shell')).toContain('still humming')
  })
})

describe('Act 3 saves from before the fortress threshold was reworded', () => {
  it('gives the entrance, the gates and the elixir their new descriptions', () => {
    const game = new Game([new Act3()])
    const entrance = game.state.allRooms.FortressEntrance
    const gates = entrance.items.find((i) => i instanceof FortressGates)
    if (!gates) throw new Error('no gates')
    const elixir = new LifelightElixir()
    game.state.addItemToInventory(elixir)
    entrance.description = 'Old room text.'
    gates.description = 'Old gates text.'
    elixir.description = 'Old elixir text.'

    new Act3().afterLoad(game.state)

    expect(entrance.description).toBe(new FortressEntrance().description)
    expect(gates.description).toBe(new FortressGates().description)
    expect(elixir.description).toBe(new LifelightElixir().description)
  })
})
