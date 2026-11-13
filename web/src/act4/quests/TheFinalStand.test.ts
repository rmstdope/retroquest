import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act4 } from '../Act4'
import {
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_PARENTS_LEGACY_COMPLETED,
  FLAG_ACT4_SHADOW_OF_THE_PAST_COMPLETED,
} from '../Act4StoryFlags'
import { TheFinalStand } from './TheFinalStand'
import { ACT4_GOLDEN_PATH } from '../Act4GoldenPath'
import { executeCommands } from '@/testing/gameHelpers'

/** The golden path up to the step into the Throne Chamber. */
const INTO_THRONE = ACT4_GOLDEN_PATH.slice(
  0,
  ACT4_GOLDEN_PATH.indexOf('talk to malakar'),
)

/** The Final Stand's line of the `hint` answer. */
function finalStandHint(game: Game): string {
  const line = game
    .hint()
    .split('\n')
    .find((text) => text.startsWith('[bold]The Final Stand:[/bold]'))
  if (!line) throw new Error('expected a Final Stand hint')
  return line.replace('[bold]The Final Stand:[/bold] ', '')
}

/** A fresh Act IV game, with the quest under test and no flags set. */
function setup(): { game: Game; quest: TheFinalStand } {
  const act = new Act4()
  act.musicFile = ''
  const game = new Game([act])
  game.state.storyFlags = {}
  return { game, quest: new TheFinalStand() }
}

describe('TheFinalStand', () => {
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

  describe('in the Throne Chamber', () => {
    /** A game standing in the Throne Chamber, before Malakar has spoken. */
    function inThrone(): Game {
      const game = new Game([new Act4()])
      executeCommands(game, INTO_THRONE)
      expect(game.state.currentRoom.name).toBe('Throne Chamber')
      return game
    }

    it('follows the scene to the Redemption, never past the north door', () => {
      const game = inThrone()
      const hints = [finalStandHint(game)]
      for (const command of [
        'talk to malakar',
        'say refrain to malakar',
        'use ancient amulet',
        'use lifelight elixir on malakar',
        'say forgiveness to malakar',
      ]) {
        executeCommands(game, [command])
        hints.push(finalStandHint(game))
      }
      for (const hint of hints) expect(hint).not.toContain('north door')
      expect(hints).toEqual([
        'Malakar stands by the wound, waiting for you. He has not said ' +
          'his piece yet.',
        'Malakar has made his offer, and he waits for your answer. The ' +
          "stone in Willowbrook, Nyx and the Dragon's hall all gave you " +
          'the same words.',
        'Malakar has turned from the wound to look at you. Your parents ' +
          'left their ward in the [item_name]ancient amulet[/item_name], ' +
          'still shut.',
        'The amulet is open and the ward is unsealed. The ' +
          '[item_name]lifelight elixir[/item_name] can be given once: to ' +
          "heal Malakar's wound, or to break the king's prison.",
        'Malakar is healed, and he looks up at you like a man waiting to ' +
          'be forgiven.',
        'You forgave him, and [spell_name]forgiveness[/spell_name] is yours ' +
          'now. The wound is still open.',
      ])
    })

    it('follows the scene on the roads of Justice and Sacrifice', () => {
      for (const word of ['justice', 'sacrifice']) {
        const game = inThrone()
        executeCommands(game, [
          'talk to malakar',
          'say refrain to malakar',
          'use ancient amulet',
          'use lifelight elixir on prison',
        ])
        expect(finalStandHint(game)).toBe(
          'The king is free, and the wound still stands open beside ' +
            'Malakar. You could name his crimes and seal him away, in ' +
            'justice. Or you could give up your magic to close it, in ' +
            'sacrifice.',
        )
        executeCommands(game, [`say ${word} to malakar`])
        expect(finalStandHint(game)).toBe(
          'You have chosen. The open amulet is ready for the wound.',
        )
      }
    })

    it('still points north from the vault, before the Throne Chamber', () => {
      const game = new Game([new Act4()])
      executeCommands(game, INTO_THRONE.slice(0, -1))
      expect(game.state.currentRoom.name).toBe("Parents' Vault")
      expect(finalStandHint(game)).toContain(
        'Malakar waits past the north door.',
      )
    })
  })
})
