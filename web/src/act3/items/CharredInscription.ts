import { Item, event, remembered, writing, type GameState } from '@/engine'
import { AncientAmulet } from './AncientAmulet'
import {
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_INSCRIPTION_MENDED,
  VIRTUE_MERCY,
} from '../Act3StoryFlags'

/**
 * A charred inscription etched into cooled lava, part of the Hidden Bond story.
 * Once read, casting mend on it restores Malakar's deeper-struck name, an
 * optional mercy.
 */
export class CharredInscription extends Item {
  constructor() {
    super({
      name: 'Charred Inscription',
      description:
        'Words burned deep into cooled lava, the letters blackened by ' +
        'intense heat. Three hands wrote here, one after another.',
      canBeCarried: false,
      shortName: 'inscription',
    })
  }

  /**
   * Examine the inscription to read its message. The closing narrator line
   * says the last name is burned deeper until it has been mended. The first
   * reading ends with the amulet's second glow.
   */
  override examine(gameState: GameState): string {
    const first = !gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)
    gameState.setStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ, true)

    return (
      event(
        'You trace the charred letters with your finger, feeling the ' +
          'heat that once shaped them. The inscription reads:',
      ) +
      '\n\n' +
      writing('We are three, and we are one promise.') +
      '\n\n' +
      writing('I, Aren, pour courage into the Crystal of Light.') +
      '\n\n' +
      writing("I, Lysa, pour selflessness into the Dragon's Scale.") +
      '\n\n' +
      writing('I, Malakar, pour wisdom into the Phoenix Feather.') +
      '\n\n' +
      writing('What we pour into the ward, the ward will keep.') +
      '\n\n' +
      event(
        gameState.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)
          ? 'The three names sit level in the stone, as they did the day ' +
              'the promise was made. Your parents and Malakar made this ' +
              'promise together, and the wisdom was his.'
          : 'The last name is burned deeper than the others, as if the ' +
              'stone was struck again long after it cooled. Your parents ' +
              'and Malakar made this promise together, and the wisdom was ' +
              'his.',
      ) +
      (first ? AncientAmulet.glowInBag(gameState, 2) : '')
    )
  }

  /**
   * Handle a spell cast on the inscription: only `mend` does anything. After
   * the first reading it restores Malakar's name, recording one mercy; before
   * it, or after the mending, it only gets a reply.
   */
  receiveSpell(
    gameState: GameState,
    spellId: string,
    spellName: string = spellId,
  ): string {
    if (spellId !== 'mend') {
      return `[failure]The ${spellName} spell has no effect on the inscription.[/failure]`
    }
    const cast = event(
      'You cast [spell_name]mend[/spell_name] on the ' +
        '[item_name]Charred Inscription[/item_name].',
    )
    if (!gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ)) {
      return (
        cast +
        '\n' +
        'The magic settles over the blackened letters and waits. You have ' +
        'not read them yet; you do not know what in them is broken.'
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)) {
      return (
        cast +
        '\n' +
        'The three names sit level and whole. There is nothing left to mend.'
      )
    }
    gameState.setStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED, true)
    gameState.addVirtue(VIRTUE_MERCY)
    return (
      cast +
      '\n' +
      "The deeper cut fills. Malakar's name sits level with your parents' " +
      'again, as it was the day they wrote it.\n' +
      remembered('Mercy')
    )
  }
}
