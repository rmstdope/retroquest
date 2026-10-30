import { describe, it, expect, beforeEach } from 'vitest'
import { Game, GameController } from '@/engine'
import { Act3 } from '../Act3'
import { EchoesOfTheHiddenBondQuest } from './EchoesOfTheHiddenBond'
import {
  FLAG_ACT3_ECHOES_QUEST_STARTED,
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_ECHOES_QUEST_COMPLETED,
} from '../Act3StoryFlags'

describe('Echoes of the Hidden Bond quest', () => {
  let game: Game
  let quest: EchoesOfTheHiddenBondQuest

  beforeEach(() => {
    game = new Game([new Act3()])
    quest = new EchoesOfTheHiddenBondQuest()
  })

  it('initializes correctly', () => {
    expect(quest.name).toBe('Echoes of the Hidden Bond')
    expect(quest.isMain()).toBe(false)
    expect(quest.description).toContain('Your parents made the three relics')
  })

  it('triggers when the Act III main quest starts', () => {
    // Initially should not trigger
    expect(quest.checkTrigger(game.state)).toBe(false)

    // After main quest starts, should trigger
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
  })

  it('updates as discoveries are made', () => {
    // Start the quest
    game.state.setStoryFlag(FLAG_ACT3_MAIN_STARTED, true)

    // Find Sea-Sealed Letter
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    let updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    expect(quest.description).toContain('✓ In the Sunken Ruins')
    expect(quest.description).toContain('a letter from Aren and Lysa')
    expect(quest.description).not.toContain('apprentices')

    // Read Charred Inscription
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    expect(quest.description).toContain('✓ On Mount Ember')
    expect(quest.description).toContain('one virtue each')

    // Hear Dragon's Memory
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    updated = quest.checkUpdate(game.state)
    expect(updated).toBe(true)
    expect(quest.description).toContain('✓ In the Caverns of Shadow')
    expect(quest.description).toContain('They are warded away, not dead')
  })

  it('completes when all testimonies are found', () => {
    // Initially should not be complete
    expect(quest.checkCompletion(game.state)).toBe(false)

    // With only some discoveries, should not be complete
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    expect(quest.checkCompletion(game.state)).toBe(false)

    // With all discoveries, should be complete
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    expect(quest.checkCompletion(game.state)).toBe(true)

    // Should set completion flag
    expect(game.state.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_COMPLETED)).toBe(true)

    // Should not complete again
    expect(quest.checkCompletion(game.state)).toBe(false)
  })

  it('has appropriate completion text', () => {
    const completionText = quest.completion
    expect(completionText).toBe(
      "Your parents were not Malakar's victims. They were his closest " +
        'friends, Wardens of the Dawn like him, and when he tore at time ' +
        'they became the ward that hides you. The dragon says they are ' +
        'warded away, not dead.',
    )
  })

  it('reports its clues as checklist data', () => {
    const open = quest.details()
    expect(open.kind).toBe('checklist')
    quest.checkUpdate(game.state)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    quest.checkUpdate(game.state)

    const details = quest.details()
    if (details.kind !== 'checklist') throw new Error('expected a checklist')
    expect(details.items.map((item) => item.done)).toEqual([false, true, false])
    expect(details.items[1].text).toContain('On Mount Ember')
    expect(details.items[0].text).toBe(
      'By the sea: something they left in the Sunken Ruins.',
    )
    expect(details.items[2].text).toBe(
      'Under the hills: something they left in the Caverns of Shadow.',
    )
    expect(details.intro).toMatch(/^Your parents made the three relics/)
  })

  it('words the third open clue the same in the opening log and the checklist', () => {
    const opening = quest.description
    quest.checkUpdate(game.state)
    expect(opening).toContain('○ Under the hills: something they left')
    expect(quest.description).toContain('Under the hills: something they left')
  })

  it('refreshes the completion text of an older save', () => {
    quest.completion = 'once apprentices to Malakar'
    quest.refreshText()
    expect(quest.completion).toBe(new EchoesOfTheHiddenBondQuest().completion)
  })

  it('refreshes the completion text when a save is loaded', () => {
    const saved = game.state.nonActivatedQuests.find(
      (q) => q instanceof EchoesOfTheHiddenBondQuest,
    )
    if (!saved) throw new Error('no Echoes quest')
    saved.completion = 'once apprentices to Malakar'

    new Act3().afterLoad(game.state)

    expect(saved.completion).toBe(new EchoesOfTheHiddenBondQuest().completion)
  })

  it('words the intro and the three found texts exactly', () => {
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    quest.checkUpdate(game.state)
    const details = quest.details()
    if (details.kind !== 'checklist') throw new Error('expected a checklist')
    expect(details.intro).toBe(
      'Your parents made the three relics, long before you were born. Mira ' +
        'says they left words behind them: by the sea, on the mountain and ' +
        'under the hills.',
    )
    expect(details.items.map((item) => item.text)).toEqual([
      'In the Sunken Ruins: a letter from Aren and Lysa to their friend ' +
        'Malakar, begging him not to reach for time. He wrote back: You would ' +
        'have me wait while you die.',
      'On Mount Ember: the promise the three of them burned into stone, one ' +
        "virtue each, and Malakar's name struck deeper than the others.",
      'In the Caverns of Shadow: the dragon remembered them. They poured ' +
        "themselves into a ward that hides you and holds Malakar's wound " +
        'shut. They are warded away, not dead.',
    ])
  })

  it('keeps the Caverns clue readable in the finished quest, through a save', () => {
    game.state.nonActivatedQuests = [quest]
    game.state.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED, true)
    game.state.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    game.state.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)
    game.state.setStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)
    game.state.settleQuests()

    const caverns =
      'In the Caverns of Shadow: the dragon remembered them. They poured ' +
      "themselves into a ward that hides you and holds Malakar's wound " +
      'shut. They are warded away, not dead.'
    const reloaded = new Game([new Act3()])
    reloaded.loadSaveData(game.toSaveData())
    for (const g of [game, reloaded]) {
      const done = new GameController(g)
        .getCompletedQuests()
        .find((q) => q.name === quest.name)
      expect(done?.details).toMatchObject({ kind: 'checklist' })
      const items = done?.details.kind === 'checklist' ? done.details.items : []
      expect(items).toHaveLength(3)
      expect(items.every((item) => item.done)).toBe(true)
      expect(items[2].text).toBe(caverns)
    }
  })
})
