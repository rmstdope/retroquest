import { describe, it, expect } from 'vitest'
import { Game, GameState, Room } from '@/engine'
import { Act3 } from '../Act3'
import { executeCommands } from '@/testing/gameHelpers'
import { FumarolePassages } from './FumarolePassages'
import { VentStone } from '../items/VentStone'
import { HeatWardMix } from '../items/HeatWardMix'
import { PhoenixGuardian } from '../characters/PhoenixGuardian'
import {
  FLAG_ACT3_FUMAROLE_WARD_APPLIED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
} from '../Act3StoryFlags'

/** A bare game state (the Python DummyGameState). */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

describe('Fumarole Passages', () => {
  it('initializes with vent stones, the guardian and exits', () => {
    const room = new FumarolePassages()
    expect(room.name).toBe('Fumarole Passages')
    expect(
      room.description.includes('tunnels') || room.description.includes('vent'),
    ).toBe(true)
    expect(room.items.some((i) => i instanceof VentStone)).toBe(true)
    expect(room.characters.some((c) => c instanceof PhoenixGuardian)).toBe(true)
    expect(room.exits).toHaveProperty('south')
    expect(room.exits).toHaveProperty('west')
  })

  it('progresses the calibration with each vent stone', () => {
    const room = new FumarolePassages()
    const gs = dummyState()
    const [stone1, stone2, stone3] = room.items.slice(0, 3) as VentStone[]
    gs.inventory = [stone1, stone2, stone3]
    // First calibration
    const out1 = room.calibrateWithStone(gs, stone1)
    expect(gs.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED)).toBe(true)
    expect(
      out1.includes('timing seems closer') || out1.includes('steadier'),
    ).toBe(true)
    // Second calibration
    const out2 = room.calibrateWithStone(gs, stone2)
    expect(
      out2.includes('timing seems closer') || out2.includes('steadier'),
    ).toBe(true)
    // Third calibration
    const out3 = room.calibrateWithStone(gs, stone3)
    expect(
      out3.includes("vents' rhythms align") ||
        out3.includes('now accept a heat ward'),
    ).toBe(true)
    // No more stones in inventory
    expect(gs.inventory).not.toContain(stone1)
    expect(gs.inventory).not.toContain(stone2)
    expect(gs.inventory).not.toContain(stone3)
  })

  it('requires calibration before the heat ward can be applied', () => {
    const room = new FumarolePassages()
    const gs = dummyState()
    const mix = new HeatWardMix()
    gs.inventory = [mix]
    // Not calibrated yet
    const result = room.applyHeatWard(gs, mix)
    expect(
      result.includes('not yet synchronized') ||
        result.includes('calibrate more'),
    ).toBe(true)
    // Calibrate three times
    for (const stone of room.items.slice(0, 3) as VentStone[]) {
      gs.inventory.push(stone)
      room.calibrateWithStone(gs, stone)
    }
    // Now apply heat ward
    const result2 = room.applyHeatWard(gs, mix)
    expect(gs.getStoryFlag(FLAG_ACT3_FUMAROLE_WARD_APPLIED)).toBe(true)
    expect(gs.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED)).toBe(
      false,
    )
    expect(
      result2.includes('ward seals into place') ||
        result2.includes('passage through the fumaroles is now safe'),
    ).toBe(true)
    expect(gs.inventory).not.toContain(mix)
  })

  it('lists the south exit only once the ward is applied', () => {
    const room = new FumarolePassages()
    const gs = dummyState()
    // By default, south is hidden
    const exits = room.getExits(gs)
    expect(exits).not.toHaveProperty('south')
    // The ward opens it
    gs.setStoryFlag(FLAG_ACT3_FUMAROLE_WARD_APPLIED, true)
    const exits2 = room.getExits(gs)
    expect(exits2).toHaveProperty('south')
  })

  it('sets the started flag on enter', () => {
    const room = new FumarolePassages()
    const gs = dummyState()
    room.onEnter(gs)
    expect(gs.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_STARTED)).toBe(true)
  })

  it('still lists south for a save whose quest was completed under the old rules', () => {
    const gs = dummyState()
    gs.setStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, true)
    expect(new FumarolePassages().getExits(gs)).toHaveProperty('south')
  })
})

const WILD =
  'The vents gust and sputter without rhythm; there is no telling when they will breathe next.'
const OUT =
  'The vents exhale. A scalding gust roars up out of the southern tunnel.'
const PAUSE =
  'The vents fall still, holding their breath. The heat hangs heavy and unmoving.'
const IN = 'The vents draw in. A cool draught tugs past you toward the south.'
/** What a look shows: the room as the player sees it (the story view re-describes the room on look). */
function seen(game: Game): string {
  executeCommands(game, ['look'])
  return game.state.currentRoom.describe(game.state)
}

const breathLine = (text: string): string => `[breath]${text}[/breath]`

/** A game standing in the passages with three stones and the ward mix in hand, ward not yet applied. */
function gameInPassages(): Game {
  const game = new Game([new Act3()])
  game.state.currentRoom = game.state.allRooms.FumarolePassages
  const room = game.state.currentRoom as FumarolePassages
  game.state.inventory.push(...room.items.splice(0, 3), new HeatWardMix())
  room.onEnter(game.state)
  return game
}

/** The same game with the vents calibrated and the ward applied. */
function wardedGame(): Game {
  const game = gameInPassages()
  executeCommands(game, [
    'use vent stone',
    'use vent stone',
    'use vent stone',
    'use heat-ward mix',
  ])
  return game
}

describe('Fumarole Passages — the breath of the mountain', () => {
  it('shows the wild gusting under the description before the ward, with no way south', () => {
    const game = gameInPassages()
    const look = seen(game)
    expect(look).toContain(breathLine(WILD))
    expect(look).not.toContain('south')
    expect(game.state.currentRoom.descriptionFor(game.state)).toContain(
      breathLine(WILD),
    )
  })

  it('does not move the breath before the ward when resting', () => {
    const game = gameInPassages()
    expect(executeCommands(game, ['rest'])).toBe(
      'You rest for a moment, gathering your strength.',
    )
    expect(seen(game)).toContain(breathLine(WILD))
  })

  it('adds the breath to the ward text and lists south, starting on the out-breath', () => {
    const game = gameInPassages()
    const applied = executeCommands(game, [
      'use vent stone',
      'use vent stone',
      'use vent stone',
      'use heat-ward mix',
    ])
    expect(applied).toContain('passage through the fumaroles is now safe')
    expect(applied).toContain(
      'The wild gusting settles into a slow, even breath: out, a held pause, ' +
        'and in. Each time it draws in, a cool draught runs south.',
    )
    const look = seen(game)
    expect(look).toContain(breathLine(OUT))
    expect(look).toMatch(/\[exits\]south\[\/exits\]/)
  })

  it('moves the breath on only with rest and wait: out, pause, in, out', () => {
    const game = wardedGame()
    const rest = (command: string): string => executeCommands(game, [command])
    expect(rest('rest')).toBe(
      `You stand still and count.\n${breathLine(PAUSE)}`,
    )
    expect(rest('wait')).toBe(`You stand still and count.\n${breathLine(IN)}`)
    expect(rest('rest')).toBe(`You stand still and count.\n${breathLine(OUT)}`)
  })

  it('leaves the breath alone for look, talk, examine and search', () => {
    const game = wardedGame()
    executeCommands(game, ['rest'])
    executeCommands(game, [
      'look',
      'talk to phoenix guardian',
      'examine phoenix guardian',
      'search',
      'take heat-ward mix',
      'use heat-ward mix',
    ])
    expect(seen(game)).toContain(breathLine(PAUSE))
  })

  it('drives the player back going south on the out-breath and moves on to the pause', () => {
    const game = wardedGame()
    const answer = executeCommands(game, ['south'])
    expect(answer).toContain(
      'You step into the southern tunnel just as the mountain breathes out. ' +
        'The heat drives you back to the mouth of the passage.',
    )
    expect(game.state.currentRoom.name).toBe('Fumarole Passages')
    expect(seen(game)).toContain(breathLine(PAUSE))
  })

  it('retreats going south on the pause and moves on to the in-breath', () => {
    const game = wardedGame()
    executeCommands(game, ['rest'])
    const answer = executeCommands(game, ['south'])
    expect(answer).toContain(
      'You edge forward into air that is still and searing, and retreat to ' +
        'the mouth of the passage before the next breath can catch you.',
    )
    expect(game.state.currentRoom.name).toBe('Fumarole Passages')
    expect(seen(game)).toContain(breathLine(IN))
  })

  it('crosses on the in-breath and completes Breath of the Mountain the first time', () => {
    const game = wardedGame()
    executeCommands(game, ['rest', 'rest'])
    expect(
      game.state.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED),
    ).toBe(false)
    const answer = executeCommands(game, ['south'])
    expect(answer).toContain(
      'You walk with the draught at your back, down through the cooling ' +
        'tunnel, and out beneath the open sky of the crater.',
    )
    expect(answer).not.toContain('You move south')
    expect(game.state.currentRoom.name).toBe('Phoenix Crater')
    expect(
      game.state.getStoryFlag(FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED),
    ).toBe(true)
  })

  it('starts on the out-breath on every entry, so every crossing needs the timing', () => {
    const game = wardedGame()
    executeCommands(game, ['rest', 'rest', 'south', 'north'])
    expect(game.state.currentRoom.name).toBe('Fumarole Passages')
    expect(seen(game)).toContain(breathLine(OUT))
    executeCommands(game, ['rest'])
    ;(game.state.currentRoom as FumarolePassages).onEnter(game.state)
    expect(seen(game)).toContain(breathLine(OUT))
  })

  it('keeps the breath through a save and load', () => {
    const game = wardedGame()
    executeCommands(game, ['rest'])
    const loaded = new Game([new Act3()])
    loaded.loadSaveData(game.toSaveData())
    expect(seen(loaded)).toContain(breathLine(PAUSE))
    expect(executeCommands(loaded, ['rest'])).toContain(breathLine(IN))
  })

  it('keeps the out-breath through a save and load', () => {
    const game = wardedGame()
    const loaded = new Game([new Act3()])
    loaded.loadSaveData(game.toSaveData())
    expect(seen(loaded)).toContain(breathLine(OUT))
  })

  it('reads a save made before the breath existed as the out-breath', () => {
    const game = wardedGame()
    const room = game.state.currentRoom as FumarolePassages
    Reflect.deleteProperty(room, 'breath')
    expect(seen(game)).toContain(breathLine(OUT))
    expect(executeCommands(game, ['south'])).toContain(
      'just as the mountain breathes out',
    )
    expect(seen(game)).toContain(breathLine(PAUSE))
  })
})
