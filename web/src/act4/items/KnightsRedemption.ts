import { Item, type GameState } from '@/engine'
import {
  FLAG_ACT4_BADGE_SHOWN,
  FLAG_ACT4_SORCERESS_OF_LIES_STARTED,
} from '../Act4StoryFlags'
import { ChamberOfWhispers } from '../rooms/ChamberOfWhispers'
import { HeartsTruth } from '../spells/HeartsTruth'

/**
 * The tarnished badge the redeemed knight presses into Elior's hand. Shown to
 * the Sorceress of Lies in the Chamber of Whispers, it teaches Heart's Truth.
 */
export class KnightsRedemption extends Item {
  constructor() {
    super({
      name: "Knight's Redemption",
      description:
        "A tarnished knight's badge, warm to the touch. He pressed it into " +
        "your hand: proof that even one of Malakar's own can turn back.",
      canBeCarried: true,
    })
  }

  /** The badge's look. */
  override examine(_gameState: GameState): string {
    return this.description
  }

  /** In the Chamber of Whispers the badge is shown to the Sorceress (once). */
  override use(gameState: GameState): string {
    if (!(gameState.currentRoom instanceof ChamberOfWhispers)) {
      return super.use(gameState)
    }
    gameState.setStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_STARTED, true)
    if (gameState.getStoryFlag(FLAG_ACT4_BADGE_SHOWN)) {
      return '[dim]She has seen the badge. She cannot stop looking at it.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_BADGE_SHOWN, true)
    const spell = new HeartsTruth()
    gameState.learnSpell(spell)
    return [
      "The Sorceress stares at the knight's badge, and " +
        'for the first time her smile slips. Beneath the whispers you ' +
        'hear something else: a voice, very small, that is not lying.',
      `You have learned the [spell_name]${spell.name}[/spell_name] spell! ` +
        spell.description,
    ].join('\n')
  }
}
