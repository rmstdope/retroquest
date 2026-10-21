import { describe, it, expect } from 'vitest'
import { Game, characterName, dialogue } from '@/engine'
import { Act2 } from '../Act2'
import { SirCedric } from '../characters/SirCedric'
import { ForestHeartCrystal } from '../items/ForestHeartCrystal'
import type { GameState } from '@/engine'
import { PropheticVision } from './PropheticVision'
import {
  FLAG_GATHERING_STORM_COMPLETED,
  FLAG_VISION_SHARED,
} from '../Act2StoryFlags'
import { expectMarkupWellFormed } from '@/testing/gameHelpers'

/** An Act II game with Sir Cedric in the current room. */
function createGameWithCedric(): Game {
  const game = new Game([new Act2()])
  game.state.currentRoom.addCharacter(new SirCedric())
  return game
}

/** Mark every Act II side quest complete for finale tests. */
function completeAllSideQuests(gameState: GameState): void {
  const sideQuests = [
    ...gameState.nonActivatedQuests,
    ...gameState.activatedQuests,
    ...gameState.completedQuests,
  ].filter((quest) => !quest.isMain())
  gameState.completedQuests.push(...sideQuests)
}

/**
 * Leave exactly the named side quests incomplete: `started` ones in the
 * journal (in the given order), `unfound` ones not yet activated.
 */
function leaveIncomplete(
  gameState: GameState,
  started: string[],
  unfound: string[],
): void {
  const sideQuests = [
    ...gameState.nonActivatedQuests,
    ...gameState.activatedQuests,
    ...gameState.completedQuests,
  ].filter((quest) => !quest.isMain())
  const named = [...started, ...unfound]
  gameState.nonActivatedQuests = gameState.nonActivatedQuests.filter((quest) =>
    quest.isMain(),
  )
  gameState.activatedQuests = gameState.activatedQuests.filter((quest) =>
    quest.isMain(),
  )
  gameState.completedQuests = sideQuests.filter(
    (quest) => !named.includes(quest.name),
  )
  for (const name of started)
    gameState.activatedQuests.push(sideQuests.find((q) => q.name === name)!)
  for (const name of unfound)
    gameState.nonActivatedQuests.push(sideQuests.find((q) => q.name === name)!)
}

const STAGE =
  `The vision has barely begun to stir when ${characterName('Sir Cedric')} ` +
  'lays a hand on your arm.\n\n'
const OPENER =
  'Not yet. Whatever you have seen, I would hear it with our promises ' +
  'kept, not with work still undone.'
const HINT =
  'And I would wager there is more out there that has not yet found you.'
const HERMIT =
  "The hermit at the forest's edge asked you to make ready, and you have not."
const ELENA = 'Elena at the Silver Stag still carries her curse.'
const THORNE = "Thorne's merchants are still lost somewhere in the forest."

/** The refusal an early cast gives, for the current state of the game. */
function refusal(gameState: GameState): string {
  return new PropheticVision().castSpell(gameState)
}

/** Cedric's whole speech as the engine renders it. */
function speech(words: string): string {
  return STAGE + dialogue('Sir Cedric', words)
}

describe('Sir Cedric turns away an early vision', () => {
  it('names several started errands in journal order (state 1)', () => {
    const game = createGameWithCedric()
    leaveIncomplete(
      game.state,
      [
        "The Innkeeper's Daughter",
        "The Merchant's Lost Caravan",
        "The Hermit's Warning",
      ],
      [],
    )

    expect(refusal(game.state)).toBe(
      speech(
        `${OPENER} ${ELENA} ${THORNE} ${HERMIT} See to them, and then show me.`,
      ),
    )
  })

  it('uses the one-left opener and closer for a single started errand (state 2)', () => {
    const game = createGameWithCedric()
    leaveIncomplete(game.state, ["Cedric's Lost Honor"], [])

    expect(refusal(game.state)).toBe(
      speech(
        'Not yet. One promise is still unkept. My own name is not yet ' +
          'cleared. See to it, and then show me.',
      ),
    )
  })

  it('adds the hint after one started errand when others are unfound (state 3)', () => {
    const game = createGameWithCedric()
    leaveIncomplete(game.state, ["The Knight's Test"], ['Whispers in the Wind'])

    const answer = refusal(game.state)

    expect(answer).toBe(
      speech(
        `${OPENER} You have not yet shown me what you can do in the yard. ` +
          `${HINT} See to it, and then show me.`,
      ),
    )
    expect(answer).not.toContain('spirits')
  })

  it('adds the hint after several started errands when others are unfound (state 4)', () => {
    const game = createGameWithCedric()
    leaveIncomplete(
      game.state,
      ["The Innkeeper's Daughter", "The Hermit's Warning"],
      ['The Ancient Library'],
    )

    expect(refusal(game.state)).toBe(
      speech(
        `${OPENER} ${ELENA} ${HERMIT} ${HINT} See to them, and then show me.`,
      ),
    )
  })

  it('gives the only-unfound speech when nothing started is unfinished (state 5)', () => {
    const game = createGameWithCedric()
    leaveIncomplete(game.state, [], ['The Ancient Library'])

    expect(refusal(game.state)).toBe(
      speech(
        'Not yet. There is more out there that has not yet found you, and I ' +
          'would not have us leave it behind. Find it, and then show me.',
      ),
    )
  })

  it('drops finished errands on a later cast (state 6)', () => {
    const game = createGameWithCedric()
    leaveIncomplete(
      game.state,
      ["The Innkeeper's Daughter", "The Hermit's Warning"],
      [],
    )
    expect(refusal(game.state)).toContain(ELENA)

    leaveIncomplete(game.state, ["The Hermit's Warning"], [])
    const again = refusal(game.state)

    expect(again).not.toContain(ELENA)
    expect(again).toContain('One promise is still unkept.')
  })

  it('never sets the story flag and shows nothing of the vision', () => {
    const game = createGameWithCedric()
    leaveIncomplete(game.state, ["Cedric's Lost Honor"], [])

    const answer = refusal(game.state)

    expect(answer).not.toContain('robed figure')
    expect(game.state.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)).toBe(false)
    expectMarkupWellFormed(answer)
  })

  it('has a sentence for every Act II side quest', () => {
    const names = [...createGameWithCedric().state.nonActivatedQuests]
      .filter((quest) => !quest.isMain())
      .map((quest) => quest.name)
    expect(names.length).toBe(11)
    for (const name of names) {
      const game = createGameWithCedric()
      leaveIncomplete(game.state, [name], [])

      const answer = refusal(game.state)

      expect(answer, name).toContain('One promise is still unkept. ')
      expect(answer, name).not.toContain('more out there')
    }
  })

  it('leaves the dim hint unchanged when Cedric is not in the room', () => {
    const game = new Game([new Act2()])

    const answer = new PropheticVision().castSpell(game.state)

    expect(answer).toContain('most meaningful if shared')
    expect(answer).not.toContain('Not yet.')
  })
})

describe('Prophetic Vision markup', () => {
  it('uses only known tags for the first vision', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)

    const answer = new PropheticVision().castSpell(game.state)

    expect(answer).toContain('a robed figure')
    expectMarkupWellFormed(answer)
  })

  it('uses only known tags for a repeated vision', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)
    const spell = new PropheticVision()
    spell.castSpell(game.state)
    game.state.setStoryFlag(FLAG_GATHERING_STORM_COMPLETED, true)

    const answer = spell.castSpell(game.state)

    expect(answer).toContain('brief glimpses of possible futures')
    expectMarkupWellFormed(answer)
  })
})

describe('Prophetic Vision first cast', () => {
  it('shows the village, the figure and the dream voice once', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)
    const spell = new PropheticVision()

    const first = spell.castSpell(game.state)

    expect(
      first.startsWith(
        '[event]' +
          'You close your eyes and reach out with your newly granted sight ' +
          'beyond sight. With [character_name]Sir Cedric[/character_name] ' +
          'standing beside you, you share the vision as it rises before you:' +
          '\n\n' +
          'A village at dusk, its roofs low and familiar. Beyond it, a field ' +
          'withered to grey stalks, the way yours was the morning all this ' +
          "began. And at the field's edge, a robed figure, its face lost in " +
          'shadow, reaching one hand toward you as if across a great ' +
          'distance.\n\n' +
          'Then the voice from your dream, the one that called your name on ' +
          'the night of the storm: [italic]“Elior… how you have grown. Do ' +
          'not be afraid of me.”[/italic] It is closer than it was. You do ' +
          'not know whose it is, only that you have heard it before, long ' +
          'before the dream.\n\n' +
          "The vision fades. Sir Cedric's expression has grown grave." +
          '[/event]\n\n',
      ),
    ).toBe(true)
    expect(first).not.toContain('shadows gathering')
    const later = spell.castSpell(game.state)
    expect(later).not.toContain('how you have grown')
    expect(later).not.toContain('robed figure')
  })
})

describe('Prophetic Vision casting', () => {
  it('does not complete the Gathering Storm before all side quests are complete', () => {
    const game = createGameWithCedric()
    game.state.knownSpells.push(new PropheticVision())

    const answer = game.cast('prophetic vision')

    expect(answer).toContain('Not yet.')
    expect(answer).not.toContain('[failure]')
    expect(game.state.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)).toBe(false)
  })

  it('is cast by its spaced name and shares the vision without ending the act', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)
    game.state.knownSpells.push(new PropheticVision())

    const answer = game.cast('prophetic vision')

    expect(answer).toContain('a robed figure')
    expect(game.state.getStoryFlag(FLAG_VISION_SHARED)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)).toBe(false)
  })
})

describe('Prophetic Vision ending', () => {
  it('ends the cast on Cedric, the realisation and the hint, holding the closing back', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)

    const answer = new PropheticVision().castSpell(game.state)

    expect(answer).toContain(
      'has grown grave.[/event]\n\n' +
        '[character_name]Sir Cedric[/character_name]\n[dialogue]' +
        'Then Malakar is no tale, and it is you he is hunting.[/dialogue]\n\n',
    )
    expect(answer.endsWith('something to say.')).toBe(true)
    expect(answer).not.toContain('Act II is complete')
    expectMarkupWellFormed(answer)
  })
})

describe('Prophetic Vision and the Forest Heart Crystal', () => {
  const CRYSTAL_OPENING =
    'You take the [item_name]Forest Heart Crystal[/item_name] from your ' +
    'pack and hold it out between you and ' +
    `${characterName('Sir Cedric')}. The tiny lights inside it gather, ` +
    'brighten, and spill outward, and the vision rises out of the crystal ' +
    'for both of you to see:\n\nA village at dusk,'

  it('opens the first shared vision with the crystal, keeping it in the pack', () => {
    const game = createGameWithCedric()
    game.state.addItemToInventory(new ForestHeartCrystal())
    completeAllSideQuests(game.state)

    const first = new PropheticVision().castSpell(game.state)

    expect(first.startsWith('[event]' + CRYSTAL_OPENING)).toBe(true)
    expect(first).not.toContain('newly granted sight')
    expect(first).toContain('something to say.')
    expect(game.state.hasItem('forest heart crystal')).toBe(true)
    expectMarkupWellFormed(first)
  })

  it('falls back to the old opening when the crystal is not carried', () => {
    const game = createGameWithCedric()
    completeAllSideQuests(game.state)

    const first = new PropheticVision().castSpell(game.state)

    expect(first).toContain('newly granted sight')
    expect(first).not.toContain('Forest Heart Crystal')
  })

  it('never mentions the crystal without Cedric, before the quests or later', () => {
    const crystal = new ForestHeartCrystal()
    const alone = new Game([new Act2()])
    alone.state.addItemToInventory(crystal)
    expect(new PropheticVision().castSpell(alone.state)).not.toContain(
      'Forest Heart Crystal',
    )

    const early = createGameWithCedric()
    early.state.addItemToInventory(new ForestHeartCrystal())
    expect(new PropheticVision().castSpell(early.state)).not.toContain(
      'Forest Heart Crystal',
    )

    const later = createGameWithCedric()
    later.state.addItemToInventory(new ForestHeartCrystal())
    completeAllSideQuests(later.state)
    const spell = new PropheticVision()
    spell.castSpell(later.state)
    expect(spell.castSpell(later.state)).not.toContain('Forest Heart Crystal')
  })
})
