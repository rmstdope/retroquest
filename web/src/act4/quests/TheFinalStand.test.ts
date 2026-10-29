import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_MAIN_STARTED,
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
} from '../Act4StoryFlags'
import { TheFinalStand } from './TheFinalStand'

/** A fresh Act IV game, with the quest under test and no flags set. */
function setup(): { game: Game; quest: TheFinalStand } {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.storyFlags = {}
  return { game, quest: new TheFinalStand() }
}

describe('TheFinalStand', () => {
  it('is named The Final Stand and is the main quest', () => {
    const { quest } = setup()
    expect(quest.name).toBe('The Final Stand')
    expect(quest.isMain()).toBe(true)
  })

  it('triggers on its start flag', () => {
    const { game, quest } = setup()
    expect(quest.checkTrigger(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT4_MAIN_STARTED, true)
    expect(quest.checkTrigger(game.state)).toBe(true)
  })

  it('opens on the king held and the vow to make Malakar pay', () => {
    const { quest } = setup()
    expect(quest.description).toBe(
      "Malakar's fortress. Somewhere inside it King Alden is held, and " +
        'Malakar waits for you. You came to free the king, and to make ' +
        'Malakar pay for what he took.',
    )
    expect(quest.description).not.toContain('sorcerer')
  })

  it('adds a beat for each revelation, in story order, and reports each once', () => {
    const { game, quest } = setup()
    expect(quest.checkUpdate(game.state)).toBe(false)

    game.state.setStoryFlag(FLAG_ACT4_PARENTS_LEGACY_COMPLETED, true)
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    expect(quest.checkUpdate(game.state)).toBe(true)
    expect(quest.checkUpdate(game.state)).toBe(false)
    expect(quest.hint(game.state)).toContain('In the vault you saw it all.')
    const kept = quest.details()
    expect(kept.kind === 'journal' && kept.earlier).toHaveLength(2)

    game.state.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED, true)
    expect(quest.checkUpdate(game.state)).toBe(true)
    const details = quest.details()
    if (details.kind !== 'journal') throw new Error('expected a journal')
    expect(details.earlier[1]).toContain(
      'The Knight of Despair was the stranger',
    )
    expect(details.earlier[2]).toContain('The voice from your dreams')
    expect(details.latest).toBe(
      'In the vault you saw it all. Malakar tore at time to save your ' +
        'parents from the Wasting. They poured themselves into the ward that ' +
        'holds his wound shut, and the ward lives in you. Malakar waits past ' +
        'the north door.',
    )
  })

  it('names each revelation as the bead words it', () => {
    const { game, quest } = setup()
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    quest.checkUpdate(game.state)
    expect(quest.hint(game.state)).toBe(
      'The Knight of Despair was the stranger from Willowbrook. He fouled ' +
        'the well, framed Sir Cedric and let the king be taken, and he ' +
        "confessed it to Sir Cedric's face.",
    )
    game.state.setStoryFlag(FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED, true)
    quest.checkUpdate(game.state)
    expect(quest.hint(game.state)).toBe(
      "The voice from your dreams is what is left of Malakar's better self. " +
        'It said its words whole at last: Be patient where I was not. Close ' +
        'what I opened, and let them rest.',
    )
  })

  it('rebuilds the log of a save made with the old one-line wording', () => {
    const { game, quest } = setup()
    quest.description =
      "Malakar's fortress stands before you, and somewhere inside King " +
      'Alden is held captive. Break through its defences and face the sorcerer.'
    game.state.setStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED, true)
    quest.checkUpdate(game.state)
    expect(quest.description).toContain('Malakar waits for you.')
    expect(quest.description).toContain('The Knight of Despair was')
  })

  it('completes with the closing words, even in an older save', () => {
    const { game, quest } = setup()
    quest.completion = "You have completed the quest 'The Final Stand'."
    quest.checkUpdate(game.state)
    expect(quest.complete(game.state)).toBe(
      'The wound is closed and the king is free. Your parents are at rest.',
    )
  })
})
