import { describe, it, expect, beforeEach } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from '../Act3'
import { PrismLantern } from '../items/PrismLantern'
import { LanternBracket } from '../items/LanternBracket'
import { SubmergedAntechamber } from './SubmergedAntechamber'
import {
  FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
} from '../Act3StoryFlags'
import {
  executeCommands,
  expectItemCountInInventory,
  expectStoryFlag,
  expectMarkupWellFormed,
} from '@/testing/gameHelpers'

/** An Act III game for markup checks. */
function createMarkupGame(): Game {
  return new Game([new Act3()])
}

/**
 * Tests for mounting prism lanterns, casting light, and exit gating: mounting
 * three Prism Lanterns consumes them, casting light with all brackets set
 * updates the lanterns flag, and the east exit is only visible when both the
 * lanterns and tideward sigils flags are true.
 */
describe('Submerged Antechamber', () => {
  let game: Game

  beforeEach(() => {
    game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.SubmergedAntechamber
  })

  it('sets the lanterns flag after mounting three lanterns and casting light', () => {
    // Ensure three lanterns in inventory by adding them
    const lantern = game.state.getItem('Prism Lantern')
    if (lantern) {
      game.state.addItemToInventory(lantern, 3)
    } else {
      game.state.addItemToInventory(new PrismLantern(), 3)
    }

    expectItemCountInInventory(game.state, 'Prism Lantern', 3)

    // Reveal the lantern brackets before attempting to mount lanterns
    // The antechamber hides its features until the Tideward Sigils are done;
    // set that flag so search can reveal the brackets for the unit test.
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    executeCommands(game, ['search'])

    executeCommands(game, ['use prism lantern with lantern bracket'])
    executeCommands(game, ['use prism lantern with lantern bracket'])
    executeCommands(game, ['use prism lantern with lantern bracket'])

    expectItemCountInInventory(game.state, 'Prism Lantern', 0)

    const light = executeCommands(game, ['cast light'])
    expect(
      light.toLowerCase().includes('path') ||
        light.toLowerCase().includes('lantern'),
    ).toBe(true)
    expectStoryFlag(game.state, FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
  })

  it('gates the east exit on both flags', () => {
    const room = game.state.currentRoom
    const exitsInitial = room.getExits(game.state)
    expect(exitsInitial).not.toHaveProperty('east')

    // Set only lanterns flag -> still should not reveal east
    game.state.setStoryFlag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, true)
    const exitsOne = room.getExits(game.state)
    expect(exitsOne).not.toHaveProperty('east')

    // Now set sigils flag too -> east should appear
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    const exitsBoth = room.getExits(game.state)
    expect(exitsBoth).toHaveProperty('east')
  })

  it('reveals the brackets only when searched after the sigils are complete', () => {
    const room = game.state.currentRoom
    const bracketCount = () =>
      room.items.filter((i) => i instanceof LanternBracket).length
    // Lantern brackets should NOT be present before searching
    expect(bracketCount()).toBe(0)

    // Perform search before sigils are complete: the water should be too deep
    const outBlocked = executeCommands(game, ['search']).toLowerCase()
    expect(
      outBlocked.includes('impossible') ||
        outBlocked.includes('murky') ||
        outBlocked.includes('too deep'),
    ).toBe(true)
    // Still no brackets should be present
    expect(bracketCount()).toBe(0)

    // Now complete the sigils and search again to reveal brackets
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    const out = executeCommands(game, ['search'])
    expect(
      out.toLowerCase().includes('bracket') ||
        out.toLowerCase().includes('brackets'),
    ).toBe(true)
    // After searching with sigils complete, the room should include three brackets
    expect(bracketCount()).toBe(3)
  })
})

describe('Submerged Antechamber markup', () => {
  it('uses known tags in the search, mount and light messages of every state', () => {
    const game = createMarkupGame()
    const room = new SubmergedAntechamber()
    const flooded = room.search(game.state)
    game.state.setStoryFlag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    room.search(game.state)
    const bracketsAgain = room.search(game.state)
    game.state.addItemToInventory(new PrismLantern(), 3)
    for (let i = 0; i < 3; i++) {
      room.mountLantern(game.state)
    }
    const allFilled = room.mountLantern(game.state)
    room.castLightHere(game.state)
    const lightAgain = room.castLightHere(game.state)
    const litSearch = room.search(game.state)

    expect(flooded).toContain('sits high and murky')
    expect(bracketsAgain).toContain('Three empty brackets')
    expect(allFilled).toContain('already filled')
    expect(lightAgain).toContain('already burn')
    expect(litSearch).toContain('still burn')
    for (const answer of [
      flooded,
      bracketsAgain,
      allFilled,
      lightAgain,
      litSearch,
    ]) {
      expectMarkupWellFormed(answer)
    }
  })
})
