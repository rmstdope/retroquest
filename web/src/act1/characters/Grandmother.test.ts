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
import { WildBerries } from '../items/WildBerries'

/** A new Act I game already woken out of the dream, standing in the cottage. */
function cottageGame(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.EliorsCottage
  return game
}

describe('Grandmother and the locket', () => {
  it('recognises the locket as her daughter’s founders’ heirloom', () => {
    const game = cottageGame()
    game.state.addItemToInventory(new Locket())

    const response = executeCommands(game, ['give locket to grandmother'])

    expect(response).toContain("this was your mother's")
    expect(response).toContain('all the way back to the founders')
    expect(game.state.hasItem('travel cloak')).toBe(true)
  })

  it('starts the sentences of her reaction with a capitalised name', () => {
    const game = cottageGame()
    game.state.addItemToInventory(new Locket())

    const response = executeCommands(game, ['give locket to grandmother'])

    expect(response).toContain(
      "[character_name]Grandmother[/character_name]'s eyes widen",
    )
    expect(response).toContain(
      '[character_name]Grandmother[/character_name] hands you',
    )
  })
})

describe('Grandmother and other gifts', () => {
  it('smiles warmly over the berries, her name capitalised', () => {
    const game = cottageGame()
    game.state.addItemToInventory(new WildBerries())

    const response = executeCommands(game, ['give berries to grandmother'])

    expect(response).toContain(
      '[character_name]Grandmother[/character_name] smiles warmly',
    )
  })

  it('turns over a gift she has no use for, her name capitalised', () => {
    const game = cottageGame()
    game.state.addItemToInventory(new Key())

    const response = executeCommands(game, ['give key to grandmother'])

    expect(response).toContain(
      '[character_name]Grandmother[/character_name] turns it over in her hands.',
    )
  })
})

describe('Grandmother and the faded photograph', () => {
  it('points Elior to the fisherman at the Riverbank once the message is read', () => {
    const game = cottageGame()
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
    const game = cottageGame()
    game.state.addItemToInventory(new Key())

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('workshop')
    expect(response).toContain('[item_name]lantern[/item_name]')
    expectDialogueSpeaker(response, 'grandmother')
  })

  it('says nothing of the shed without the key', () => {
    const game = cottageGame()

    expect(executeCommands(game, ['talk to grandmother'])).not.toContain(
      'workshop',
    )
  })
})

/** An Act I game where Mira has taught Elior and sent him to prepare. */
function gameAfterMirasTeaching(): Game {
  const game = cottageGame()
  executeCommands(game, ['talk to grandmother'])
  game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
  return game
}

describe('Grandmother and the journey', () => {
  it('says nothing of the gift before Mira has taught Elior', () => {
    const game = cottageGame()

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
    const game = cottageGame()
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

describe('Grandmother and the dream', () => {
  const REACTION = 'did it say anything more? Anything but your name?'
  const READ = ['use lantern', 'take lantern', 'use journal']

  it('reacts to the dream after the greeting and before the father’s tale', () => {
    const game = cottageGame()
    executeCommands(game, READ)

    const response = executeCommands(game, ['talk to grandmother'])

    const greeting = response.indexOf('Oh, ')
    const reaction = response.indexOf(REACTION)
    const tale = response.indexOf('your father was')
    const lesson = response.indexOf('learned the')
    expect(greeting).toBeGreaterThan(-1)
    expect(reaction).toBeGreaterThan(greeting)
    expect(tale).toBeGreaterThan(reaction)
    expect(lesson).toBeGreaterThan(tale)
    expect(response).toContain('Some voices are older than memory.')
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('is humming the cradle tune when Elior goes to her with the dream, and stops', () => {
    const game = cottageGame()
    executeCommands(game, READ)

    const response = executeCommands(game, ['talk to grandmother'])

    const humming = response.indexOf(
      'When you go to her, she is humming at the hearth: a slow tune that ' +
        'climbs three notes and settles home again. You know it. You have ' +
        'known it all your life, and you could not say from where. She ' +
        'stops when she sees your face.',
    )
    expect(humming).toBeGreaterThan(-1)
    expect(humming).toBeLessThan(response.indexOf(REACTION))
    expect(humming).toBeLessThan(
      response.indexOf('Willowbrook has always been'),
    )
  })

  it('still hums when Elior has already talked to her and about the photograph', () => {
    const game = cottageGame()
    executeCommands(game, ['talk to grandmother'])
    executeCommands(game, READ)
    game.state.addItemToInventory(new FadedPhotograph())
    const gave = executeCommands(game, [
      'examine faded photograph',
      'give faded photograph to grandmother',
    ])
    expect(gave).toContain('Your mother loved the river.')

    const response = executeCommands(game, ['talk to grandmother'])

    const humming = response.indexOf('When you go to her, she is humming')
    expect(humming).toBeGreaterThan(-1)
    expect(humming).toBeLessThan(response.indexOf(REACTION))
  })

  it('goes quiet over the three words Elior caught from the voice', () => {
    const game = cottageGame()
    executeCommands(game, READ)

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain(
      'You tell her the three words you caught at the very end, the ones ' +
        'you wrote down before they could go: let them rest. She goes ' +
        'quiet. She turns to the bread on the board and does not turn back ' +
        'for a while.',
    )
    expect(response).toContain('Some voices are older than memory.')
    expect(response).not.toContain('No. No, of course not.')
  })

  it('reacts without the greeting when it was already heard', () => {
    const game = cottageGame()
    executeCommands(game, ['talk to grandmother', ...READ])

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).not.toContain('Oh, ')
    expect(response.indexOf(REACTION)).toBeLessThan(
      response.indexOf('your father was'),
    )
  })

  it('does not react before the journal is read', () => {
    const game = cottageGame()

    expect(executeCommands(game, ['talk to grandmother'])).not.toContain(
      REACTION,
    )
  })

  it('never mentions the dream again on later talks', () => {
    const game = cottageGame()
    executeCommands(game, [...READ, 'talk to grandmother'])

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).not.toContain(REACTION)
    expect(response).toContain('You recall your father')
  })

  it('does not react for a player who already learned revive', () => {
    const game = cottageGame()
    executeCommands(game, [...READ, 'talk to grandmother'])
    const fresh = cottageGame()
    fresh.state.setStoryFlag('journal_read_prologue_entry', true)
    fresh.state.knownSpells.push(...game.state.knownSpells)

    expect(executeCommands(fresh, ['talk to grandmother'])).not.toContain(
      REACTION,
    )
  })

  it('still reacts after a save and reload between reading and talking', () => {
    const game = cottageGame()
    executeCommands(game, READ)
    const loaded = cottageGame()
    loaded.loadSaveData(game.toSaveData())

    expect(executeCommands(loaded, ['talk to grandmother'])).toContain(REACTION)
  })
})

/** An Act I game in the cottage with Patches, coaxed out of the shed, in Elior's arms. */
function gameCarryingPatches(): Game {
  const game = cottageGame()
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
    const game = cottageGame()

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
