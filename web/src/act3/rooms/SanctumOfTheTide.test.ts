import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { CrystalOfLight } from '../items/CrystalOfLight'
import {
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_VOW_OF_COURAGE_MADE,
} from '../Act3StoryFlags'
import {
  executeCommands,
  expectStoryFlag,
  expectItemInInventory,
} from '@/testing/gameHelpers'

/**
 * Tests for guardian interaction, vow acceptance gating and crystal
 * acquisition: once accepted the vow sets the VOW flag and the Crystal of
 * Light can be picked up.
 */
describe('Sanctum of the Tide', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.SanctumOfTheTide
  })

  it('accepts the vow and lets the crystal be taken when prerequisites are met', () => {
    // Set prerequisites
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)

    const vow = executeCommands(game, [
      'east',
      'east',
      'east',
      'say myself to tide-born guardian',
    ])
    expect(
      vow.toLowerCase().includes('you may now take') ||
        vow.toLowerCase().includes('waters draw back'),
    ).toBe(true)
    expectStoryFlag(game.state, FLAG_ACT3_VOW_OF_COURAGE_MADE, true)

    executeCommands(game, ['take crystal of light'])
    expectItemInInventory(game.state, 'crystal of light', true)
  })
})

/** What the room card shows for the room Elior stands in. */
function describeRoom(game: Game): string {
  return game.state.currentRoom.describe(game.state)
}

/** The trial of courage: walking into the dark water, step by step. */
describe('Sanctum of the Tide trial', () => {
  let game: Game

  /** Enter the Sanctum from the Antechamber as a player would. */
  function enter(): string {
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    game.state.currentRoom = game.state.allRooms.SubmergedAntechamber
    return executeCommands(game, ['east'])
  }

  beforeEach(() => {
    game = new Game([new Act3()])
  })

  it('puts the lights out on arrival and shows both exits', () => {
    const out = enter()
    expect(out).toContain('every light goes out at once')
    expect(out).toContain('Walk.')
    const look = describeRoom(game)
    expect(look).toContain('You stand at the edge of the black water')
    expect(look).toContain('east')
    expect(look).toContain('west')
    expect(look).not.toContain('Crystal of Light')
    expect(look).not.toContain('sigils that breathe')
  })

  it('walks three steps east and reveals the crystal on the third', () => {
    enter()
    expect(executeCommands(game, ['east'])).toContain('cold to the knees')
    expect(executeCommands(game, ['east'])).toContain('Turn back, Elior')
    expect(describeRoom(game)).not.toContain('Crystal of Light')
    const third = executeCommands(game, ['east'])
    expect(third).toContain('What did you not abandon?')
    expect(game.state.currentRoom.name).toBe('Sanctum of the Tide')
    expect(describeRoom(game)).toContain('Crystal of Light')
  })

  it('turns back from a step without penalty, then west leaves', () => {
    enter()
    executeCommands(game, ['east', 'east'])
    expect(executeCommands(game, ['west'])).toContain('You wade back')
    expect(game.state.currentRoom.name).toBe('Sanctum of the Tide')
    expect(describeRoom(game)).toContain('edge of the black water')
    executeCommands(game, ['west'])
    expect(game.state.currentRoom.name).toBe('Submerged Antechamber')
  })

  it('refuses light, early words and the crystal in the dark', () => {
    enter()
    expect(executeCommands(game, ['cast light'])).toContain(
      'Here you go without it.',
    )
    expect(
      executeCommands(game, ['say myself to tide-born guardian']),
    ).toContain('Walk first.')
    expectStoryFlag(game.state, FLAG_ACT3_VOW_OF_COURAGE_MADE, false)
    executeCommands(game, ['east', 'east', 'east', 'take crystal of light'])
    expectItemInInventory(game.state, 'crystal of light', false)
  })

  it('puts him back at the edge with the return line after leaving', () => {
    enter()
    executeCommands(game, ['east', 'east', 'west', 'west'])
    const again = executeCommands(game, ['east'])
    expect(again).toContain('The lights go out again')
    expect(describeRoom(game)).toContain('edge of the black water')
  })

  it('lights the Sanctum for good after the vow', () => {
    enter()
    executeCommands(game, ['east', 'east', 'east'])
    const vow = executeCommands(game, ['say myself to tide-born guardian'])
    expect(vow).toContain('Most name a person')
    expect(vow).toContain('chamber is lit as you first saw it')
    executeCommands(game, ['take crystal of light'])
    expectItemInInventory(game.state, 'crystal of light', true)
    const look = describeRoom(game)
    expect(look).toContain('sigils that breathe')
    expect(look).not.toContain('east')
    executeCommands(game, ['east'])
    expect(game.state.currentRoom.name).toBe('Sanctum of the Tide')
    executeCommands(game, ['west', 'east'])
    expect(describeRoom(game)).not.toContain('black water')
    expect(executeCommands(game, ['cast light'])).not.toContain('go without it')
  })

  it('keeps the step through a save made mid-walk', () => {
    enter()
    executeCommands(game, ['east', 'east'])
    const reloaded = new Game([new Act3()])
    reloaded.loadSaveData(game.toSaveData())
    expect(reloaded.state.currentRoom.name).toBe('Sanctum of the Tide')
    expect(describeRoom(reloaded)).toContain('Black water to your waist')
  })

  it('takes the crystal away again when Elior turns back or leaves', () => {
    enter()
    executeCommands(game, ['east', 'east', 'east', 'say gold to guardian'])
    executeCommands(game, ['west'])
    expect(describeRoom(game)).not.toContain('Crystal of Light')
    executeCommands(game, ['east', 'east', 'east', 'west', 'west', 'east'])
    expect(describeRoom(game)).not.toContain('Crystal of Light')
    executeCommands(game, ['east', 'east', 'east'])
    expect(describeRoom(game)).toContain('Crystal of Light')
  })

  it('hides a crystal left in the room by an older save until step 3', () => {
    enter()
    game.state.currentRoom.addItem(new CrystalOfLight())
    expect(describeRoom(game)).not.toContain('Crystal of Light')
  })
})
