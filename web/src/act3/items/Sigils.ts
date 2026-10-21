import { Item, event, speech, characterName, remembered } from '@/engine'
import type { GameState } from '@/engine'
import {
  FLAG_ACT3_DRAGONS_SCALE_ACQUIRED,
  FLAG_ACT3_SIGILS_MENDED,
  VIRTUE_SELFLESS,
} from '../Act3StoryFlags'

/**
 * The sigils that bind the ancient dragon in its hall. Once the scale has
 * been taken they crack; blessing them mends the prison, an optional
 * selfless act that gains the player nothing.
 */
export class Sigils extends Item {
  constructor() {
    super({
      name: 'sigils',
      description:
        'Arcane sigils of forgotten civilizations spiral across the obsidian ' +
        'tiles in rings around the dragon.',
      canBeCarried: false,
    })
  }

  /** Handle a spell cast on the sigils: only `bless` does anything. */
  receiveSpell(
    gameState: GameState,
    spellId: string,
    spellName: string = spellId,
  ): string {
    if (spellId !== 'bless') {
      return `[failure]The ${spellName} spell has no effect on the sigils.[/failure]`
    }
    if (!gameState.getStoryFlag(FLAG_ACT3_DRAGONS_SCALE_ACQUIRED)) {
      return (
        event('You cast [spell_name]bless[/spell_name] on the sigils.') +
        '\n' +
        'The sigils burn steady and whole. They need nothing from you yet.'
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_SIGILS_MENDED)) {
      return (
        event('You cast [spell_name]bless[/spell_name] on the sigils.') +
        '\n' +
        'The sigils already hold. There is nothing left to mend.'
      )
    }
    gameState.setStoryFlag(FLAG_ACT3_SIGILS_MENDED, true)
    gameState.addVirtue(VIRTUE_SELFLESS)
    return (
      event('You cast [spell_name]bless[/spell_name] on the sigils.') +
      '\n' +
      'Light runs along the cracked ring like water finding its course. The ' +
      'sigils brighten, steady, and hold.\n' +
      `The ${characterName('ancient dragon')} lowers its head. ` +
      speech(
        "'You owed me nothing, and gained nothing by it, and you did it " +
          "anyway. Your parents would have done the same.'",
      ) +
      '\n' +
      remembered('Selflessness')
    )
  }
}
