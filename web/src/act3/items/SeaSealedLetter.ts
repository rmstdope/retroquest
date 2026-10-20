import { Item, type GameState } from '@/engine'
import { FLAG_ACT3_SEA_SEALED_LETTER_READ } from '../Act3StoryFlags'

/** A scrap of vellum preserved by salt-crystal varnish. */
export class SeaSealedLetter extends Item {
  constructor() {
    super({
      name: 'Sea-Sealed Letter',
      shortName: 'letter',
      description:
        '[event]You unfold the salt-preserved vellum carefully. The ancient ' +
        'ink, protected by crystalline varnish, reveals words in a familiar ' +
        'hand:[/event]\n\n' +
        '[character_name]Theron[/character_name]\n' +
        "[dialogue]'My beloved Mira, if you read this, then our fears have come " +
        'to pass and Malakar has discovered our betrayal. We were his ' +
        'apprentices once—Lyra and I both served in his shadow, learning ' +
        'his dark arts. But when we saw what he planned for our unborn child, ' +
        "we could no longer remain silent.'[/dialogue]\n\n" +
        "[dialogue]'The three relics hold the key to a ward that can hide our " +
        'son from his sight. We will forge this protection with our lives if ' +
        'we must. Tell Elior, when he is ready, that his parents chose love ' +
        'over loyalty to darkness. The ward will hold until he is strong ' +
        "enough to face what we could not.'[/dialogue]\n\n" +
        '[event]The letter is signed with two names: Lyra and Theron—your ' +
        'parents. Your hands tremble as you realize this testament of their ' +
        'defiance has waited in the depths all these years.[/event]',
      canBeCarried: true,
    })
  }

  /** Examine the letter and set the read flag. */
  override examine(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ, true)
    return (
      `[event]You examine the [item_name]${this.name}[/item_name].[/event]\n` +
      `${this.description}`
    )
  }

  /** Handle letter pickup flavor text. */
  override pickedUp(_gameState: GameState): string {
    return (
      '[event]You carefully fold the preserved fragment — a testament ' +
      'kept by the sea.[/event]'
    )
  }
}
