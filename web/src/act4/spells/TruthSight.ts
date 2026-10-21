import {
  Spell,
  event,
  type Character,
  type GameState,
  type Item,
} from '@/engine'
import {
  FLAG_ACT4_BANNERS_SEEN,
  FLAG_ACT4_ECHO_STONE_HEARD,
  FLAG_ACT4_MEMORY_ORBS_MENDED,
} from '../Act4StoryFlags'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { Malakar } from '../characters/Malakar'
import { endingPlayed } from '../endings'
import { Banners } from '../items/Banners'
import { EchoStone } from '../items/EchoStone'
import { MemoryOrbs } from '../items/MemoryOrbs'

/** What the spell shows where nothing is hidden. */
const NOTHING_HIDDEN =
  '[dim]Your sight sharpens, but there is no illusion here to see through.[/dim]'

/** What the banners show, once. */
const BANNERS_SEEN =
  'Your sight sharpens, and the grime slides from the banners. Beneath it is ' +
  "a sigil you have seen on the captain's tabard: the gate company of King " +
  "Alden's guard. The knight served the king before he ever served Malakar."

/** What the Echo Stone reveals, once. */
const STONE_HEARD =
  "Your sight sharpens, and the stone's murmur parts. Under the hall's " +
  'voices one is already there, very quiet: a man weeping, saying one word ' +
  'over and over as if he knows no other. "Sorry." It is the knight\'s voice.'

/** What the clouded orbs show before they are mended. */
const ORBS_SEEN =
  'Your sight sharpens. In the clouded orb the cradle by the fire comes ' +
  "clear: the hearth is a Willowbrook cottage's, and through the window " +
  'beyond it stands the village well.'

/** What Malakar shows for a breath. */
const MALAKAR_SEEN =
  'For a breath the sorcerer is gone, and a young man sits at a workbench, ' +
  'ink on his fingers, mending a toy for a child who is not there. Then the ' +
  'shadows close again.'

/**
 * Learned in the Mirror Labyrinth: sees through illusion to what is really
 * there. In the Hall of Echoes the knight, the banners and the Echo Stone each
 * show a part of his story (all three are needed before he can be redeemed);
 * the Memory Orbs (until mended) and Malakar show a glimpse of their own.
 */
export class TruthSight extends Spell {
  constructor() {
    super({
      id: 'truth_sight',
      name: 'Truth Sight',
      description: 'See through illusion to what is really there.',
    })
  }

  /** Nothing is hidden anywhere in this piece of the act. */
  override castSpell(_gameState: GameState): string {
    return NOTHING_HIDDEN
  }

  /** The banners, the Echo Stone and the unmended orbs hide something. */
  override castOnItem(gameState: GameState, target: Item): string {
    if (target instanceof Banners) {
      return this.seeOnce(
        gameState,
        FLAG_ACT4_BANNERS_SEEN,
        BANNERS_SEEN,
        'You have already seen the banners as they truly are.',
      )
    }
    if (target instanceof EchoStone) {
      return this.seeOnce(
        gameState,
        FLAG_ACT4_ECHO_STONE_HEARD,
        STONE_HEARD,
        "You have already heard the knight's voice in the stone.",
      )
    }
    if (
      target instanceof MemoryOrbs &&
      !gameState.getStoryFlag(FLAG_ACT4_MEMORY_ORBS_MENDED)
    ) {
      return event(ORBS_SEEN)
    }
    return NOTHING_HIDDEN
  }

  /** The knight is shown as he is, Malakar for a breath; nothing is hidden in anyone else. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof KnightOfDespair) return target.seeThrough(gameState)
    if (target instanceof Malakar && !endingPlayed(gameState)) {
      return event(MALAKAR_SEEN)
    }
    return NOTHING_HIDDEN
  }

  /** One of the hall's three sights: the line the first time, the dim line after. */
  private seeOnce(
    gameState: GameState,
    flag: string,
    line: string,
    already: string,
  ): string {
    if (gameState.getStoryFlag(flag)) return `[dim]${already}[/dim]`
    gameState.setStoryFlag(flag, true)
    return event(line)
  }
}
