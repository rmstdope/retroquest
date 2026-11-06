import { describe, it, expect, vi } from 'vitest'
import { Game, GameController, type GameState } from '@/engine'
import { Act1 } from '../Act1'
import { RareFlower } from '../items/RareFlower'
import { RuneToken } from '../items/RuneToken'
import { Mechanism } from '../items/Mechanism'
import { Rope } from '../items/Rope'
import { AncientAmulet } from '../items/AncientAmulet'
import {
  FLAG_CONNECT_WITH_NATURE,
  FLAG_FOUND_RUNE_TOKEN,
  FLAG_FOX_KIT_FREED,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_MIRA_NAMED_FOULING_SIGIL,
  FLAG_VILLAGER_TALKED_TO,
  FLAG_WELL_EXAMINED,
  FLAG_WOKE_FROM_DREAM,
} from '../Act1StoryFlags'
import {
  executeCommands,
  expectDialogueSpeaker,
  expectItemInInventory,
  expectSpellKnown,
} from '@/testing/gameHelpers'

/** A game standing in Mira's hut. */
function gameInMirasHut(): Game {
  const game = new Game([new Act1()])
  game.state.currentRoom = game.state.allRooms.MirasHut
  return game
}

/** Lets the Preparing for the Road quest report itself complete. */
function completeJourneyPreparations(state: GameState): void {
  const quest = state.getQuest('Preparing for the Road')
  expect(quest).not.toBeNull()
  vi.spyOn(quest!, 'checkCompletion').mockReturnValue(true)
}

describe('Mira’s early guidance', () => {
  it('points Elior toward the rare flower, the well and the Hidden Glade', () => {
    const game = gameInMirasHut()
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)

    const response = game.commandParser.parse('talk to mira')

    expect(response).toContain('rare flower')
    expect(response).toContain('Hidden Glade')
    expect(response).toContain('well')
    expect(game.state.getStoryFlag(FLAG_CONNECT_WITH_NATURE)).toBe(true)
  })
})

describe('Mira accepting the rare flower', () => {
  it('teaches the spells in short beats and names the preparations in one line', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())

    const response = executeCommands(game, ['give rare flower to mira'])

    for (const spell of ['heal', 'unlock', 'light'])
      expectSpellKnown(game.state, spell)
    expect(game.state.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)).toBe(true)
    expect(response).toContain(
      "You'll need warmth, protection, food, boots and a [item_name]map[/item_name].",
    )
    expect(response).not.toContain('\n- ')
    const beats = response.split('\n').filter((beat) => beat.trim() !== '')
    expect(beats.length).toBeGreaterThanOrEqual(3)
    for (const beat of beats) expect(beat.length).toBeLessThan(400)
    expectDialogueSpeaker(response, 'Mira')
  })

  it('keeps Greendale for the day she hands over the amulet', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())

    const response = executeCommands(game, ['give rare flower to mira'])

    expect(response).not.toContain('Greendale')
    expect(response).not.toContain('druid')
  })
})

describe('Mira handing over the ancient amulet', () => {
  it('sends Elior toward Greendale and warns him to guard the amulet', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)

    const response = executeCommands(game, ['talk to mira'])

    expectItemInInventory(game.state, 'Ancient Amulet')
    expect(response).toContain('Greendale')
    expect(response).toContain('show the amulet to no one lightly')
    expect(response).toContain('Those who know what it is will find you.')
    expect(response).not.toContain('druid')
    expectDialogueSpeaker(response, 'Mira')
  })

  it('takes the amulet off its stand, so there is one amulet in the world', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)

    executeCommands(game, ['talk to mira'])

    expect(game.state.currentRoom.getItemByName('amulet')).toBeNull()
    expect(
      game.state.inventory.filter((item) => item.name === 'ancient amulet'),
    ).toHaveLength(1)
    expect(new GameController(game).getRoomDescription()).toContain(
      'The stand where the amulet rested stands empty.',
    )
  })

  it('hints once, between the gift and the warning, that she knew his parents', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)

    const response = executeCommands(game, ['talk to mira'])
    const hint =
      'I knew your parents better than I have said. ' +
      'Once you are truly ready, I will tell you.'

    expect(response).toContain('She lowers her voice.')
    expect(response).toContain(hint)
    const gift = response.indexOf('You now carry the')
    expect(gift).toBeGreaterThan(-1)
    expect(response.indexOf('She lowers her voice.')).toBeLessThan(
      response.indexOf(hint),
    )
    expect(response.indexOf('She lowers her voice.')).toBeGreaterThan(gift)
    expect(response.indexOf(hint)).toBeLessThan(
      response.indexOf('She holds your hand a moment longer'),
    )

    const later = executeCommands(game, ['talk to mira'])
    expect(later).not.toContain('truly ready')
    expect(later).not.toContain('your parents')
  })

  it('does not hint before the hand-over', () => {
    const game = gameInMirasHut()
    const response = executeCommands(game, ['talk to mira'])
    expect(response).not.toContain('your parents')

    const flower = new RareFlower()
    game.state.addItemToInventory(flower)
    const given = executeCommands(game, ['give rare flower to mira'])
    expect(given).not.toContain('your parents')
    const notReady = executeCommands(game, ['talk to mira'])
    expect(notReady).not.toContain('your parents')
  })

  it('does not repeat the parting words once the amulet is his', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)
    executeCommands(game, ['talk to mira'])

    const response = executeCommands(game, ['talk to mira'])

    expect(response).not.toContain('show the amulet to no one lightly')
  })
})

describe('Mira and the rune token from the well', () => {
  it('names it a fouling sigil, set in the well on purpose, and hands it back', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RuneToken())

    const response = executeCommands(game, ['give rune token to mira'])

    expect(response).toContain('fouling sigil')
    expect(response).toContain(
      'She stops, as if she has said more than she meant to.',
    )
    expect(response).not.toContain('whisper about, perhaps')
    expect(response).toContain('on purpose')
    expect(response).toContain('searching')
    expect(response).not.toContain('Malakar')
    expectItemInInventory(game.state, 'rune token')
    expect(game.state.getStoryFlag(FLAG_MIRA_NAMED_FOULING_SIGIL)).toBe(true)
    expectDialogueSpeaker(response, 'Mira')
    const beats = response.split('\n').filter((beat) => beat.trim() !== '')
    for (const beat of beats) expect(beat.length).toBeLessThan(400)
  })

  it('ties it to the mill once Elior has jammed the mechanism there', () => {
    const game = gameInMirasHut()
    const mechanism = game.state.allRooms.OldMill.items.find(
      (item) => item instanceof Mechanism,
    )
    if (!(mechanism instanceof Mechanism)) throw new Error('no mechanism')
    const rope = new Rope()
    game.state.addItemToInventory(rope)
    mechanism.useWith(game.state, rope)
    game.state.addItemToInventory(new RuneToken())

    const response = executeCommands(game, ['give rune token to mira'])

    expect(response).toContain('mill')
    expectDialogueSpeaker(response, 'Mira')
  })

  it('does not tell the whole tale twice', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RuneToken())
    executeCommands(game, ['give rune token to mira'])

    const response = executeCommands(game, ['give rune token to mira'])

    expect(response).not.toContain('on purpose')
    expectItemInInventory(game.state, 'rune token')
    expectDialogueSpeaker(response, 'Mira')
  })
})

describe('Mira while the rune token is still unread', () => {
  /** A game where Elior carries the amulet and the token Mira has not seen. */
  function amuletAndUnreadToken(): Game {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new AncientAmulet())
    game.state.addItemToInventory(new RuneToken())
    game.state.setStoryFlag(FLAG_FOUND_RUNE_TOKEN, true)
    return game
  }

  it('points at the token rather than sending Elior away', () => {
    const game = amuletAndUnreadToken()

    const answer = executeCommands(game, ['talk to mira'])

    expect(answer).not.toContain('Still here?')
    expect(answer).not.toContain('Then go.')
    expect(answer).toContain('that well')
    expect(answer).toContain('Show me.')
    expectDialogueSpeaker(answer, 'Mira')
  })

  it('follows on from her forest remark without looking up a second time', () => {
    const game = amuletAndUnreadToken()
    game.state.setStoryFlag(FLAG_FOX_KIT_FREED, true)

    const answer = executeCommands(game, ['talk to mira'])

    expect(answer).toContain('She glances at you.')
    expect(answer).not.toContain('looks up from her herbs')
    expect(answer).toContain('Show me.')
    expect(answer).not.toContain('Still here?')
  })

  it('says goodbye again once she has read the token', () => {
    const game = amuletAndUnreadToken()
    executeCommands(game, ['give rune token to mira'])

    const answer = executeCommands(game, ['talk to mira'])

    expect(answer).toContain('Still here?')
    expect(answer).not.toContain('Show me.')
  })
})

describe('Mira and the fox kit', () => {
  const REMARK =
    "It didn't get out of that snare on its own. That was kindly done, " +
    '[character_name]Elior[/character_name].'

  it('says nothing about the forest until the kit has been freed', () => {
    const game = gameInMirasHut()

    expect(executeCommands(game, ['talk to mira'])).not.toContain('whispering')
  })

  it('opens the next talk with her forest remark, then her usual line, once', () => {
    const game = gameInMirasHut()
    game.state.setStoryFlag(FLAG_FOX_KIT_FREED, true)

    const first = executeCommands(game, ['talk to mira'])
    const second = executeCommands(game, ['talk to mira'])

    expect(first).toContain(REMARK)
    expect(first.indexOf('You speak with')).toBeLessThan(first.indexOf(REMARK))
    expect(first).not.toContain('tilts her head')
    expect(first.indexOf(REMARK)).toBeLessThan(
      first.indexOf('Come in, mind the sage.'),
    )
    expectDialogueSpeaker(first, 'Mira')
    expect(second).not.toContain('snare')
    expect(second).toContain('Back already')
  })

  it('also precedes the post-amulet line, whenever in the act the kit was freed', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new AncientAmulet())
    game.state.setStoryFlag(FLAG_FOX_KIT_FREED, true)

    const answer = executeCommands(game, ['talk to mira'])

    expect(answer).toContain(REMARK)
    expect(answer).toContain('Still here?')
  })

  it('does not glance at Elior and then not look up, in the same post-amulet answer', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new AncientAmulet())
    game.state.setStoryFlag(FLAG_FOX_KIT_FREED, true)

    const first = executeCommands(game, ['talk to mira'])
    const second = executeCommands(game, ['talk to mira'])

    expect(first).toContain('She glances at you.')
    expect(first).not.toContain("doesn't look up")
    expect(first).toContain('She turns back to her herbs.')
    expect(second).toContain("doesn't look up from her herbs.")
  })
})

describe('Mira on the land and the king', () => {
  it('calls the sick fields and the sick king one wound when Elior brings the three signs', () => {
    const game = gameInMirasHut()
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)

    const response = executeCommands(game, ['talk to mira'])

    expect(response).toContain('They say the king is ill')
    expect(response).toContain("I think it's one wound")
    expectDialogueSpeaker(response, 'Mira')
  })
})

describe('Mira when the flower comes before the three signs', () => {
  /** A game in which the flower was given before Elior saw the square or the well. */
  function flowerFirst(): Game {
    const game = gameInMirasHut()
    game.state.setStoryFlag(FLAG_WOKE_FROM_DREAM, true)
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['look', 'give rare flower to mira'])
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)
    executeCommands(game, ['look'])
    return game
  }

  it('still calls the land and the king one wound, without asking for the flower again', () => {
    const game = flowerFirst()

    const response = executeCommands(game, ['talk to mira'])

    expect(response).toContain('They say the king is ill')
    expect(response).toContain("I think it's one wound")
    expect(response).not.toContain('Bring me one')
    expect(response).not.toContain('half-dressed')
    expect(game.state.getStoryFlag(FLAG_CONNECT_WITH_NATURE)).toBe(true)
    expectDialogueSpeaker(response, 'Mira')
  })

  it('goes back to the road once she has said it', () => {
    const game = flowerFirst()
    executeCommands(game, ['talk to mira'])

    const again = executeCommands(game, ['talk to mira'])

    expect(again).toContain('half-dressed')
    expect(again).not.toContain('one wound')
  })

  it('says it before she hands over the amulet', () => {
    const game = flowerFirst()
    completeJourneyPreparations(game.state)

    const beat = executeCommands(game, ['talk to mira'])
    const amulet = executeCommands(game, ['talk to mira'])

    expect(beat).toContain("I think it's one wound")
    expect(beat).not.toContain('ancient amulet[/item_name] from its')
    expect(amulet).toContain('A man came to my door')
  })

  it('says it even when the amulet is already Elior’s, then says goodbye', () => {
    const game = flowerFirst()
    game.state.addItemToInventory(new AncientAmulet())

    const beat = executeCommands(game, ['talk to mira'])
    const goodbye = executeCommands(game, ['talk to mira'])

    expect(beat).toContain("I think it's one wound")
    expect(goodbye).toContain('say a proper goodbye to your grandmother')
  })

  it('keeps the journal moving forward: the signs and her words come before the flower', () => {
    const game = flowerFirst()
    executeCommands(game, ['talk to mira'])

    const quest = game.state.getQuest('Shadows over Willowbrook')
    expect(quest).not.toBeNull()
    expect(quest!.latestStage).toContain('The flower opened for you.')
    const earlier = (quest!.earlierStages ?? []).join('')
    expect(earlier.indexOf('smells sour')).toBeLessThan(
      earlier.indexOf('one wound'),
    )
  })
})

describe('Mira and the cloaked stranger', () => {
  it('says, as she hands over the amulet, that a man in a grey cloak came asking after it', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)

    const response = executeCommands(game, ['talk to mira'])

    expect(response).toContain('A man came to my door')
    expect(response).toContain('in a grey cloak, asking after this')
  })

  it('names the man at her door, without catching herself, when the token comes after the amulet', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)
    executeCommands(game, ['talk to mira'])
    game.state.addItemToInventory(new RuneToken())

    const response = executeCommands(game, ['give rune token to mira'])

    expect(response).toContain('fouling sigil')
    expect(response).toContain(
      'The man in the grey cloak, who came to my door.',
    )
    expect(response).not.toContain('said more than she meant to')
    expect(response).not.toContain('whisper about')
    expectDialogueSpeaker(response, 'Mira')
  })

  it('catches herself on the token first, then tells him of the man at the hand-over', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RuneToken())
    const token = executeCommands(game, ['give rune token to mira'])
    game.state.addItemToInventory(new RareFlower())
    executeCommands(game, ['give rare flower to mira'])
    completeJourneyPreparations(game.state)

    const handOver = executeCommands(game, ['talk to mira'])

    expect(token).toContain('said more than she meant to')
    expect(token).not.toContain('grey cloak')
    expect(handOver).toContain('A man came to my door')
  })
})

describe('Mira and the blessing for the road', () => {
  it('asks for a blessing on Elior without sending him to the priest for it', () => {
    const game = gameInMirasHut()
    game.state.addItemToInventory(new RareFlower())

    const taught = executeCommands(game, ['give rare flower to mira'])
    const notYet = executeCommands(game, ['talk to mira'])

    for (const answer of [taught, notYet]) {
      expect(answer).toContain('a blessing on you')
      expect(answer).not.toContain('[character_name]priest[/character_name]')
    }
  })
})

describe('Mira spoken to again before the flower', () => {
  const FIRST_MEETING = 'Come in, mind the sage.'

  /** Elior has seen the crops, the square and the well. */
  function setThreeSigns(game: Game): void {
    game.state.setStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS, true)
    game.state.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    game.state.setStoryFlag(FLAG_WELL_EXAMINED, true)
  }

  it('greets a first visit with the first meeting, a second one with a short reminder', () => {
    const game = gameInMirasHut()
    const first = executeCommands(game, ['talk to mira'])
    const second = executeCommands(game, ['talk to mira'])
    expect(first).toContain(FIRST_MEETING)
    expect(second).not.toContain(FIRST_MEETING)
    expect(second).toContain('Back already')
    expect(second.length).toBeLessThan(first.length)
  })

  it('reminds him of the flower, not the whole request, once she has asked for it', () => {
    const game = gameInMirasHut()
    setThreeSigns(game)
    const first = executeCommands(game, ['talk to mira'])
    const second = executeCommands(game, ['talk to mira'])
    expect(first).toContain('None of that is weather.')
    expect(second).not.toContain(FIRST_MEETING)
    expect(second).not.toContain('None of that is weather.')
    expect(second).toContain('The flower, ')
  })

  it('still makes the request when the signs are gathered after a bare first meeting', () => {
    const game = gameInMirasHut()
    executeCommands(game, ['talk to mira'])
    setThreeSigns(game)
    const response = executeCommands(game, ['talk to mira'])
    expect(response).not.toContain(FIRST_MEETING)
    expect(response).toContain('None of that is weather.')
    expect(game.state.getStoryFlag(FLAG_CONNECT_WITH_NATURE)).toBe(true)
  })

  it('reminds a save that heard the request before the flag existed, not the first meeting', () => {
    const game = gameInMirasHut()
    game.state.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
    const response = executeCommands(game, ['talk to mira'])
    expect(response).not.toContain(FIRST_MEETING)
    expect(response).toContain('The flower, ')
  })
})
