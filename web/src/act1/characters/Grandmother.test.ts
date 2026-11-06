import { describe, it, expect } from 'vitest'
import { Game, findMarkupProblems } from '@/engine'
import { executeCommands, expectDialogueSpeaker } from '@/testing/gameHelpers'
import {
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_SHOWED_GRANDMOTHER_RING,
} from '../Act1StoryFlags'
import { Patches } from './Patches'
import { AncientAmulet } from '../items/AncientAmulet'
import { FreshBread } from '../items/FreshBread'
import { Act1 } from '../Act1'
import { ShinyRing } from '../items/ShinyRing'
import { Locket } from '../items/Locket'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { Key } from '../items/Key'
import { ReviveSpell } from '../spells/ReviveSpell'
import { WildBerries } from '../items/WildBerries'
import { MothersLetter } from '../items/MothersLetter'
import { FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO } from '../Act1StoryFlags'

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
    expect(response).toContain("I suppose it's now.")
  })
})

describe('Grandmother and other gifts', () => {
  it('remembers him as a boy over the berries and promises a pie', () => {
    const game = cottageGame()
    game.state.addItemToInventory(new WildBerries())

    const response = executeCommands(game, ['give berries to grandmother'])

    expect(response).toContain('same as when you were six')
    expect(response).toContain("I'll make a pie.")
  })

  it('turns over a gift she has no use for, her name capitalised', () => {
    const game = cottageGame()
    game.state.addItemToInventory(new Key())

    const response = executeCommands(game, ['give key to grandmother'])

    expect(response).toContain(
      '[character_name]Grandmother[/character_name] turns it over in her hands and gives it back.',
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
    expect(response).toContain('warm and fed')
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
    expect(response).toContain('She brushes flour from the board')
    expect(response).not.toContain('I knew this day would come')
    expect(response).toContain('Come back to me, child.')
    expect(response).not.toContain('warm and fed')
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
    expect(response).not.toContain('Your father wrote in one like that')
  })
})

describe('Grandmother and the dream', () => {
  const REACTION = 'did it say anything more? Anything but your name?'
  const READ = ['use lantern', 'take lantern', 'use journal']

  it('reacts to the dream after the greeting and before the father’s tale', () => {
    const game = cottageGame()
    executeCommands(game, READ)

    const response = executeCommands(game, ['talk to grandmother'])

    const greeting = response.indexOf('There you are.')
    const reaction = response.indexOf(REACTION)
    const tale = response.indexOf('Your father wrote')
    const lesson = response.indexOf('You have learned')
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
    expect(humming).toBeLessThan(response.indexOf('The village is on edge'))
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
        'quiet. She turns to the hearth, where the next loaf is rising, and ' +
        'does not turn back for a while.',
    )
    expect(response).toContain('Some voices are older than memory.')
    expect(response).not.toContain('No. No, of course not.')
  })

  it('reacts without the greeting when it was already heard', () => {
    const game = cottageGame()
    executeCommands(game, ['talk to grandmother', ...READ])

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).not.toContain('There you are.')
    expect(response.indexOf(REACTION)).toBeLessThan(
      response.indexOf('Your father wrote'),
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
    expect(response).not.toContain('You already have it by heart')
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
    expect(response).toContain("It's very quiet here, with you out all day.")
    expect(response).not.toContain('off on the road')
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

describe('Grandmother speaks of the villagers as old neighbours (rq-m3fy)', () => {
  it('sends Elior to Mira, Hemlock and Borin as errands among people he knows', () => {
    const game = cottageGame()

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('look in on')
    expect(response).toContain('at her hut; she was asking after you.')
    expect(response).toContain('You know she has a way with herbs')
    expect(response).toContain(
      'will have heard whatever there is to hear at the',
    )
    expect(response).toContain('he always does.')
    expect(response).toContain("will think you've forgotten him.")
    expect(response).not.toContain('north of the square')
    expect(response).not.toContain('Old Man')
  })
})

describe('Grandmother repeat talk keeps its wording (rq-m3fy)', () => {
  it("offers bread with 'Back again?' the second time", () => {
    const game = cottageGame()
    executeCommands(game, ['talk to grandmother'])

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('Back again?')
    expect(response).not.toContain('look in on')
  })
})

describe('Grandmother and what lies in the cottage', () => {
  const READ = ['use lantern', 'take lantern', 'use journal']

  it('never sees the journal under Elior’s arm, since it cannot be carried', () => {
    const game = cottageGame()
    executeCommands(game, READ)

    const first = executeCommands(game, ['talk to grandmother'])
    const again = executeCommands(game, ['talk to grandmother'])

    expect(game.state.hasItem("elior's journal")).toBe(false)
    expect(first).toContain('Your father wrote in one like that')
    expect(again).not.toContain('Your father wrote in one like that')
    expect(again).toContain('say that word')
    expect(first).not.toContain('under your arm')
    expect(again).not.toContain('under your arm')
    expect(again).toContain('[item_name]journal[/item_name]')
  })

  it('turns to no loaf on the board over the dream once Elior has taken it', () => {
    const game = cottageGame()
    executeCommands(game, ['take bread', ...READ])

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('let them rest. She goes quiet.')
    expect(response).not.toContain('on the board')
  })

  it('turns no loaf on the board in her farewell once the loaf is gone', () => {
    const game = gameAfterMirasTeaching()
    executeCommands(game, ['take bread', 'talk to grandmother'])
    game.state.addItemToInventory(new AncientAmulet())

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain("So it's true, then.")
    expect(response).not.toContain('on the board')
  })

  it('offers the bread on the board while the loaf still lies there', () => {
    const game = cottageGame()
    executeCommands(game, ['talk to grandmother'])

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain("There's bread on the board")
    expectDialogueSpeaker(response, 'grandmother')
  })

  it('offers no bread on the board once Elior has taken the loaf', () => {
    const game = cottageGame()
    executeCommands(game, ['talk to grandmother', 'take bread'])

    const response = executeCommands(game, ['talk to grandmother'])

    expect(game.state.hasItem('bread')).toBe(true)
    expect(response).toContain('Back again?')
    expect(response).not.toContain('bread on the board')
    expectDialogueSpeaker(response, 'grandmother')
  })
})

describe('Grandmother between the Revive tale and the flower', () => {
  const READ = ['use lantern', 'take lantern', 'use journal']
  const PLAIN = "He'd stand over my herbs and say that word"
  const RIVER = 'Have you been down to the river yet?'
  const PATCHES = "I've not heard him whistle in a year."
  const LETTER = 'Keep that dry.'

  /** A game in the cottage where the Revive tale has been heard. */
  function afterRevive(): Game {
    const game = cottageGame()
    executeCommands(game, [...READ, 'talk to grandmother'])
    return game
  }

  it('gives one short plain line on every later talk, never the tale again', () => {
    const game = afterRevive()

    const first = executeCommands(game, ['talk to grandmother'])
    const second = executeCommands(game, ['talk to grandmother'])

    expect(first).toContain(PLAIN)
    expect(first).toContain('She glances at the [item_name]journal[/item_name]')
    expect(first).not.toContain('Sometimes I think it worked')
    expect(first).not.toContain('by heart')
    expect(second).toBe(first)
    expect(findMarkupProblems(first)).toEqual([])
    expectDialogueSpeaker(first, 'grandmother')
  })

  it('points to the river once she has named it', () => {
    const game = afterRevive()
    game.state.setStoryFlag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO, true)

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain(RIVER)
    expect(response).toContain(
      'She turns the loaf, though it does not need turning.',
    )
    expect(response).not.toContain(PLAIN)
  })

  it('tells of Hemlock once Patches is home with him', () => {
    const game = afterRevive()
    game.state.setStoryFlag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO, true)
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain(PATCHES)
    expect(response).toContain('[character_name]Hemlock[/character_name]')
    expect(response).not.toContain(RIVER)
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('keeps her hearth line, not the Patches line, when Patches stayed', () => {
    const game = afterRevive()
    game.state.setStoryFlag(FLAG_PATCHES_FOUND, true)
    game.state.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('asleep in the warm spot by the hearth')
    expect(response).not.toContain(PATCHES)
  })

  it('knows the letter at his pocket, ahead of every older stage', () => {
    const game = afterRevive()
    game.state.setStoryFlag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO, true)
    game.state.setStoryFlag(FLAG_PATCHES_RETURNED, true)
    game.state.addItemToInventory(new MothersLetter())

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('she knows the hand from across the room.')
    expect(response).toContain(LETTER)
    expect(response).toContain('She does not ask what it says.')
    expect(response).not.toContain(PATCHES)
    expect(findMarkupProblems(response)).toEqual([])
  })

  it('shows no stage line once Mira has taught him', () => {
    const game = afterRevive()
    game.state.addItemToInventory(new MothersLetter())
    game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)

    const response = executeCommands(game, ['talk to grandmother'])

    expect(response).toContain('You have her gift')
    expect(response).not.toContain(LETTER)
    expect(response).not.toContain(PLAIN)
  })

  it('shows the same line after a save and reload', () => {
    const game = afterRevive()
    game.state.setStoryFlag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO, true)
    const loaded = cottageGame()
    loaded.loadSaveData(game.toSaveData())

    expect(executeCommands(loaded, ['talk to grandmother'])).toContain(RIVER)
  })
})

describe('Grandmother and the ring from the well', () => {
  const GIVE = ['give shiny ring to grandmother']
  const WELL_BEAT = 'She never took it off. Not once.'

  it('remarks once on the well the first time she is given the ring', () => {
    const game = cottageGame()
    game.state.addItemToInventory(new ShinyRing())

    const first = executeCommands(game, GIVE)

    expect(first).toContain(
      'You tell her where you found it. She looks up at you, and back at the ring.',
    )
    expect(first).toContain(WELL_BEAT)
    expect(first.indexOf('Your father walked to Greendale')).toBeLessThan(
      first.indexOf(WELL_BEAT),
    )
    expect(first.indexOf(WELL_BEAT)).toBeLessThan(
      first.indexOf("That one doesn't go on a shelf."),
    )
    expect(game.state.getStoryFlag(FLAG_SHOWED_GRANDMOTHER_RING)).toBe(true)
  })

  it('gives today’s answer without the well beat from the second time', () => {
    const game = cottageGame()
    game.state.addItemToInventory(new ShinyRing())
    executeCommands(game, GIVE)

    const second = executeCommands(game, GIVE)

    expect(second).toContain("That one doesn't go on a shelf.")
    expect(second).not.toContain(WELL_BEAT)
  })

  it('does not repeat the well beat after a save and reload', () => {
    const game = cottageGame()
    game.state.addItemToInventory(new ShinyRing())
    executeCommands(game, GIVE)
    const loaded = cottageGame()
    loaded.loadSaveData(game.toSaveData())

    expect(executeCommands(loaded, GIVE)).not.toContain(WELL_BEAT)
  })
})

describe("Grandmother answers Elior's father and his spell by name", () => {
  const STOCK = 'Talk to me while I work, dear.'

  it('speaks of his father at the table', () => {
    const game = cottageGame()

    const answer = executeCommands(game, ['say father to grandmother'])

    expect(answer).not.toContain(STOCK)
    expect(answer).toContain('his way of frowning')
    expectDialogueSpeaker(answer, 'Grandmother')
    expect(findMarkupProblems(answer)).toEqual([])
  })

  it('keeps to the stock line for revive before she has told of it', () => {
    const game = cottageGame()

    const answer = executeCommands(game, ['say revive to grandmother'])

    expect(answer).toContain(STOCK)
    expect(answer).not.toContain("Your father's word")
  })

  it('speaks of revive once she has told of it', () => {
    const game = cottageGame()
    game.state.knownSpells.push(new ReviveSpell())

    const answer = executeCommands(game, ['say revive to grandmother'])

    expect(answer).not.toContain(STOCK)
    expect(answer).toContain("Your father's word")
    expectDialogueSpeaker(answer, 'Grandmother')
    expect(findMarkupProblems(answer)).toEqual([])
  })
})
