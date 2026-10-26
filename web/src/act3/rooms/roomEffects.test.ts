import { describe, it, expect } from 'vitest'
import { Game, GameState, Room } from '@/engine'
import { Act3 } from '../Act3'
import { PhoenixCrater } from './PhoenixCrater'
import { OuterWards } from './OuterWards'
import { ObsidianOutcrops } from './ObsidianOutcrops'
import { ShorelineMarkers } from './ShorelineMarkers'
import { TidalCauseway } from './TidalCauseway'
import { SubmergedAntechamber } from './SubmergedAntechamber'
import { FumarolePassages } from './FumarolePassages'
import { EmberGallery } from './EmberGallery'
import { EchoChambers } from './EchoChambers'
import { SanctumOfTheTide } from './SanctumOfTheTide'
import { VentStone } from '../items/VentStone'
import { HeatWardMix } from '../items/HeatWardMix'
import { PrismLantern } from '../items/PrismLantern'
import { FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED } from '../Act3StoryFlags'

/** A bare game state. */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

describe('Act III rooms narrate the effect, never the echo', () => {
  it('reads the crater call, the phoenix arrival and the second rest', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = new PhoenixCrater()

    expect(game.talk('phoenix')).toBe(
      'The crater is silent. Nothing comes to those who call.',
    )
    const first = game.rest()
    expect(first).toMatch(
      /^As your eyes close, the air grows warmer\. When you /,
    )
    expect(first).not.toContain('You rest')
    expect(game.rest()).toBe(
      'The heat of the crater soaks into you, and the ache goes out of your legs.',
    )
  })

  it('searches the drowned courtyard without repeating the search', () => {
    const out = new OuterWards().search(dummyState())

    expect(out).toBe(
      'Apart from the three ancient warding pillars rising from the black ' +
        'water, the drowned courtyard holds little of interest; the pillars ' +
        'alone seem keyed to the moon and tide.',
    )
  })

  it('reads the first search and gives a silent box for the second', () => {
    for (const room of [new ObsidianOutcrops(), new ShorelineMarkers()]) {
      const first = room.search(dummyState())
      const again = room.search(dummyState())

      expect(first).not.toContain('[event]')
      expect(first).not.toContain('[failure]')
      expect(again).toMatch(/^\[failure\](?!\[clue\])/)
    }
  })

  it('gives a silent box when the mural is lit again', () => {
    const room = new TidalCauseway()
    const first = room.castLightHere(dummyState())
    const again = room.castLightHere(dummyState())

    expect(first).not.toContain('[event]')
    expect(again).toMatch(/^\[failure\](?!\[clue\])/)
  })

  it('reads the ember gallery and echo chambers light results', () => {
    expect(new EmberGallery().search(dummyState())).not.toContain('[event]')
    expect(new EchoChambers().castLightHere(dummyState())).not.toContain(
      '[event]',
    )
  })

  it('sets a lantern without repeating the action and reads the clues', () => {
    const state = dummyState()
    const room = new SubmergedAntechamber()
    expect(room.search(state)).not.toContain('[event]')
    state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    room.search(state)
    expect(room.search(state)).not.toContain('[event]')

    expect(room.mountLantern(state)).toBe(
      '[failure][clue]You need a [item_name]prism lantern[/item_name] to ' +
        'mount here.[/clue][/failure]',
    )
    state.inventory.push(
      new PrismLantern(),
      new PrismLantern(),
      new PrismLantern(),
    )
    expect(room.mountLantern(state)).toBe(
      'The prism lantern settles into the bracket; water hums softly as it ' +
        'takes the weight.',
    )
    expect(room.castLightHere(state)).toMatch(
      /^\[failure\]\[clue\]You kindle a spark, but without lanterns mounted/,
    )
    room.mountLantern(state)
    room.mountLantern(state)
    room.castLightHere(state)
    expect(room.castLightHere(state)).toBe(
      '[failure]The prism lanterns already burn with steady, cold flame.[/failure]',
    )
  })

  it('reads a bare light spark where nothing catches', () => {
    expect(new SubmergedAntechamber().castLightHere(dummyState())).toBe(
      'A warm spark flares in your palm and fades—nothing here seems to catch.',
    )
  })

  it('calibrates and wards the vents without repeating the command', () => {
    const room = new FumarolePassages()
    const state = dummyState()
    const stones = room.items.filter(
      (i): i is VentStone => i instanceof VentStone,
    )
    state.inventory = [...stones]

    expect(room.applyHeatWard(state, new HeatWardMix())).toMatch(
      /^\[failure\]\[clue\]The vents are not yet synchronized/,
    )
    const first = room.calibrateWithStone(state, stones[0])
    expect(first).toMatch(/^The vents click and a rhythmic hiss/)
    room.calibrateWithStone(state, stones[1])
    const last = room.calibrateWithStone(state, stones[2])
    expect(last).not.toContain('[event]')

    const mix = new HeatWardMix()
    state.inventory.push(mix)
    const ward = room.applyHeatWard(state, mix)
    expect(ward).toMatch(/^The rock grows a touch cooler around your hands/)
    expect(ward).not.toContain('[event]')
  })

  it('reads the dark sanctum description on the first entrance', () => {
    const game = new Game([new Act3()])
    const room = game.state.allRooms.SanctumOfTheTide
    expect(room).toBeInstanceOf(SanctumOfTheTide)
    const out = room.enterText(game.state)

    expect(out).not.toMatch(/^\[event\]/)
  })
})
