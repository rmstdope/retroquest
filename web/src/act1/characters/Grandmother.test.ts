import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { executeCommands, expectDialogueSpeaker } from '@/testing/gameHelpers'
import {
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
} from '../Act1StoryFlags'
import { Patches } from './Patches'
import { AncientAmulet } from '../items/AncientAmulet'
import { FreshBread } from '../items/FreshBread'
import { Act1 } from '../Act1'
import { Locket } from '../items/Locket'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { Key } from '../items/Key'

describe('Grandmother and the locket', () => {
  it('recognises the locket as her daughter’s founders’ heirloom', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new Locket())

    const response = executeCommands(game, ['give locket to grandmother'])

    expect(response).toContain("this was your mother's")
    expect(response).toContain('all the way back to the founders')
    expect(game.state.hasItem('travel cloak')).toBe(true)
  })
})

describe('Grandmother and the faded photograph', () => {
  it('points Elior to the fisherman at the Riverbank once the message is read', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new FadedPhotograph())

    executeCommands(game, ['examine faded photograph'])

    const response = executeCommands(game, [
      'give faded photograph to grandmother',
    ])

    expect(response).toContain('Your mother loved the river.')
    expect(response).toContain('[room_name]Riverbank[/room_name]')
    expectDialogueSpeaker(response, 'grandmother')
  })
})

describe('Grandmother and the shed key', () => {
  it('hints that the shed was a workshop, and that it is dark', () => {
    const game = new Game([new Act1()])
    game.state.addItemToInventory(new Key())

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('workshop')
    expect(response).toContain('[item_name]lantern[/item_name]')
    expectDialogueSpeaker(response, 'grandmother')
  })

  it('says nothing of the shed without the key', () => {
    const game = new Game([new Act1()])

    expect(executeCommands(game, ['talk to grandmother'])).not.toContain(
      'workshop',
    )
  })
})

/** An Act I game where Mira has taught Elior and sent him to prepare. */
function gameAfterMirasTeaching(): Game {
  const game = new Game([new Act1()])
  executeCommands(game, ['talk to grandmother'])
  game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
  return game
}

describe('Grandmother and the journey', () => {
  it('says nothing of the gift before Mira has taught Elior', () => {
    const game = new Game([new Act1()])

    const response = executeCommands(game, [
      'talk to grandmother',
      'talk to grandmother',
    ])

    expect(response).not.toContain("your mother's gift")
    expect(game.state.hasItem('fresh bread')).toBe(false)
  })

  it("sees her daughter's gift after Mira's teaching and bakes bread for the road", () => {
    const game = gameAfterMirasTeaching()

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain("your mother's gift")
    expect(response).toContain('[item_name]fresh bread[/item_name]')
    expect(
      game.state.inventory.filter((item) => item instanceof FreshBread),
    ).toHaveLength(1)
    expectDialogueSpeaker(response, 'grandmother')
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('bakes only one loaf, and then just sees Elior off to his preparations', () => {
    const game = gameAfterMirasTeaching()
    executeCommands(game, ['talk to grandmother'])

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).not.toContain("your mother's gift")
    expect(response).toContain('preparations')
    expect(
      game.state.inventory.filter((item) => item instanceof FreshBread),
    ).toHaveLength(1)
    expectDialogueSpeaker(response, 'grandmother')
  })

  it('asks Elior to come back to her once he carries the amulet', () => {
    const game = gameAfterMirasTeaching()
    executeCommands(game, ['talk to grandmother'])
    game.state.addItemToInventory(new AncientAmulet())

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain("So it's true, then.")
    expect(response).toContain('Come back to me, child.')
    expect(response).not.toContain('preparations')
    expectDialogueSpeaker(response, 'grandmother')
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('keeps the long journal tale for the first telling once she has more to say', () => {
    const game = new Game([new Act1()])
    executeCommands(game, [
      'use lantern',
      'take lantern',
      'use journal',
      'talk to grandmother',
    ])
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain("your mother's gift")
    expect(response).not.toContain('your father was a great writer')
  })
})

/** An Act I game in the cottage with Patches, coaxed out of the shed, in Elior's arms. */
function gameCarryingPatches(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.EliorsCottage
  game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
  return game
}

describe('Grandmother and Patches', () => {
  it('offers to keep Patches while Elior carries her', () => {
    const game = gameCarryingPatches()

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('[character_name]Patches[/character_name]')
    expect(response).toContain('say so')
    expectDialogueSpeaker(response, 'grandmother')
  })

  it('keeps Patches by the hearth when Elior says she may stay', () => {
    const game = gameCarryingPatches()

    const response = executeCommands(game, ['say stay to grandmother'])

    expect(findMarkupProblems(response)).toEqual([])
    expectDialogueSpeaker(response, 'grandmother')
    expect(game.state.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)).toBe(
      true,
    )
    expect(game.state.getStoryFlag(FLAG_PATCHES_RETURNED)).toBe(false)
    expect(
      game.state.allRooms.EliorsCottage.characters.some(
        (c) => c instanceof Patches,
      ),
    ).toBe(true)
    expect(executeCommands(game, ['talk to patches'])).toContain('hearth')
  })

  it('mentions Patches in later talk once she has stayed', () => {
    const game = gameCarryingPatches()
    executeCommands(game, ['say stay to grandmother'])

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('[character_name]Patches[/character_name]')
    expect(response).not.toContain('say so')
    expectDialogueSpeaker(response, 'grandmother')
  })

  it('does not take a cat Elior is not carrying', () => {
    const game = new Game([new Act1()])

    executeCommands(game, ['say stay to grandmother'])

    expect(game.state.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)).toBe(
      false,
    )
  })

  it('does not take Patches back from Hemlock once she is home', () => {
    const game = gameCarryingPatches()
    game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)

    const response = executeCommands(game, [
      'talk to grandmother',
      'say stay to grandmother',
    ])

    expect(response).not.toContain('say so')
    expect(game.state.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)).toBe(
      false,
    )
  })
})
