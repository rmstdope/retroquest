import { Room, type Exits, type GameState, event } from '@/engine'
import { CaptainOfTheGuard } from '../characters/CaptainOfTheGuard'
import { TrappedServants } from '../characters/TrappedServants'
import { LoyaltyToken } from '../items/LoyaltyToken'
import { ServantsPendant } from '../items/ServantsPendant'
import {
  FLAG_ACT4_SERVANTS_TRUST_EARNED,
  FLAG_ACT4_SERVANTS_FREED,
  FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED,
  FLAG_ACT4_TRAPPED_SERVANTS_STARTED,
} from '../Act4StoryFlags'

/** The courtyard once the servants are free and the captain has woken. */
const COURTYARD_AFTER_DESCRIPTION =
  'The black tears in the fountains have dried, and the storm overhead has ' +
  'thinned to grey. The Freed Servants rest by the fountains, their chains ' +
  'gone, and the captain of the guard sits among them with his head in his hands.'

/**
 * A once-beautiful courtyard now tainted by shadow magic and trapped souls.
 *
 * Introduces themes of compassion through freeing enslaved servants: the
 * Guardian's essence and blessing magic are required to break their chains.
 */
export class OuterCourtyard extends Room {
  constructor() {
    super({
      name: 'Outer Courtyard',
      description:
        'What was once a magnificent courtyard now writhes under a shroud of despair. ' +
        'Withered fountains weep black tears, and twisted statues reach toward a sky ' +
        'that seems perpetually stormy. Ethereal figures wander in endless circles, ' +
        'their faces etched with torment as dark chains bind their spirits to this ' +
        'cursed ground. ' +
        'By the dry fountain a soldier in a soot-black royal tabard stands ' +
        'rigid, staring at nothing. ' +
        'The very stones beneath your feet pulse with anguish, and ' +
        'the air tastes of lost hope and forgotten dreams.',
      items: [],
      characters: [new TrappedServants(), new CaptainOfTheGuard()],
      exits: { west: 'FortressGates', north: 'MirrorLabyrinth' },
    })
  }

  /** Starting to explore the courtyard starts the servants quest. */
  override onEnter(gameState: GameState): void {
    gameState.setStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_STARTED, true)
  }

  /** The way west is always open; north opens once the servants are free. */
  override getExits(gameState: GameState): Exits {
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return { west: this.exits.west }
    }
    return { west: this.exits.west, north: this.exits.north }
  }

  /** The bound servants drift across the archway north. */
  override blockedExit(
    _gameState: GameState,
    direction: string,
  ): string | null {
    if (direction !== 'north') return null
    return (
      '[failure]The trapped servants drift across the archway, their chains ' +
      'of shadow trailing behind them. You cannot pass while they are ' +
      'bound.[/failure]'
    )
  }

  /** Handle casting bless spell on servants. */
  castBless(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_TRUST_EARNED)) {
      return (
        '[failure]The servants do not trust you enough to accept your blessing. ' +
        'You must prove your worthiness first.[/failure]'
      )
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      gameState.setStoryFlag(FLAG_ACT4_SERVANTS_FREED, true)
      gameState.setStoryFlag(FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, true)
      // Add the loyalty token and pendant to the room
      this.addItem(new LoyaltyToken())
      this.addItem(new ServantsPendant())
      // The servants stay, now called the Freed Servants
      const servants = this.getCharacterByName('servants')
      if (servants instanceof TrappedServants) servants.free()
      this.description = COURTYARD_AFTER_DESCRIPTION
      return event(
        'Your blessing magic flows out like golden light, shattering ' +
          'the dark chains that bind the servants. They cry out in joy as their ' +
          "spirits are freed from Malakar's curse. " +
          'By the fountain, the captain blinks, as if waking from a long sleep. ' +
          'In gratitude, they offer you ' +
          'a loyalty token and a pendant that will help guide you through the ' +
          'trials ahead.',
      )
    }
    return '[dim]The servants have already been freed from their cursed bonds.[/dim]'
  }
}
