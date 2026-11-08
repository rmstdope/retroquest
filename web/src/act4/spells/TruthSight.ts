import {
  Spell,
  type Character,
  type GameState,
  type Item,
  dialogue,
} from '@/engine'
import {
  FLAG_ACT4_BANNERS_SEEN,
  FLAG_ACT4_ECHO_STONE_HEARD,
  FLAG_ACT4_ELIXIR_ON_MALAKAR,
  FLAG_ACT4_MEMORY_ORBS_MENDED,
  FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED,
} from '../Act4StoryFlags'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { Malakar } from '../characters/Malakar'
import { SorceressOfLies } from '../characters/SorceressOfLies'
import { endingPlayed } from '../endings'
import { Banners } from '../items/Banners'
import { CrystalWhispers } from '../items/CrystalWhispers'
import { EchoStone } from '../items/EchoStone'
import { MemoryOrbs } from '../items/MemoryOrbs'
import { SorceressStaff } from '../items/SorceressStaff'
import { ChamberOfWhispers } from '../rooms/ChamberOfWhispers'

/** What the spell shows where nothing is hidden. */
const NOTHING_HIDDEN =
  '[dim]Your sight sharpens, but there is no illusion here to see through.[/dim]'

/** What the banners show, once. */
const BANNERS_SEEN =
  'Your sight sharpens, and the grime slides from the banners. Beneath it is ' +
  "the sigil of the gate company of King Alden's guard, and the same sigil " +
  "shows through the tarnish on the knight's breastplate. He served the king " +
  'before he ever served Malakar.'

/** What the Echo Stone reveals, once. */
const STONE_HEARD =
  "Your sight sharpens, and the stone's murmur parts. Under the hall's " +
  'voices, the one that keeps saying redemption is weeping, and between the ' +
  'words it says one more, very quietly.\n' +
  dialogue('Knight of Despair', 'Sorry.') +
  "\nIt is the knight's voice."

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

/** What Malakar shows once the elixir has healed him. */
const MALAKAR_HEALED_SEEN =
  'For a breath the sorcerer is gone, and a young man sits at a workbench, ' +
  'ink on his fingers, mending a toy for a child who is not there. This ' +
  'time the shadows do not close.'

/** What the chamber shows, before the Sorceress is redeemed. */
const CHAMBER_SEEN =
  'Your sight sharpens, and the shine goes off the room. The crystals are ' +
  'only crystals, and the floor is only stone. The humming does not stop.'

/** What the Sorceress shows, before she is redeemed. */
const SORCERESS_SEEN =
  "Your sight sharpens, and the chamber's shine slides off her. Under it is " +
  'a tired woman, and nothing more to see. The lies are not in how she ' +
  'looks. They are in what she says, and eyes are no use against that.'

/** What the staff and its mask show, before she is redeemed. */
const STAFF_SEEN =
  'Your sight sharpens. The staff is wood and the mask is silver, both as ' +
  'they look. Whatever the mask hides, it does not hide from the eye.'

/** What the crystals show, before she is redeemed. */
const WHISPERS_SEEN =
  'Your sight sharpens, and there is nothing in the crystals to see. The ' +
  'lie is in what they hum, and it goes on, as sweet as before.'

/**
 * Learned in the Mirror Labyrinth: sees through illusion to what is really
 * there. In the Hall of Echoes the knight, the banners and the Echo Stone each
 * show a part of his story (all three are needed before he can be redeemed);
 * the Memory Orbs (until mended) and Malakar show a glimpse of their own. In
 * the Chamber of Whispers, until the Sorceress is redeemed, the sight strips
 * the room's shine and finds that the lie is in what is said, not in what is
 * seen.
 */
export class TruthSight extends Spell {
  constructor() {
    super({
      id: 'truth_sight',
      name: 'Truth Sight',
      description: 'See through illusion to what is really there.',
    })
  }

  /** Only the Chamber of Whispers, until she is redeemed, has anything to see through. */
  override castSpell(gameState: GameState): string {
    if (
      gameState.currentRoom instanceof ChamberOfWhispers &&
      this.chamberHolds(gameState)
    ) {
      return CHAMBER_SEEN
    }
    return NOTHING_HIDDEN
  }

  /** The banners, the Echo Stone, the unmended orbs and the chamber's staff and crystals answer. */
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
      return ORBS_SEEN
    }
    if (this.chamberHolds(gameState)) {
      if (target instanceof SorceressStaff) return STAFF_SEEN
      if (target instanceof CrystalWhispers) return WHISPERS_SEEN
    }
    return NOTHING_HIDDEN
  }

  /** The knight is shown as he is, Malakar for a breath, the unredeemed Sorceress as she looks; nothing is hidden in anyone else. */
  override castOnCharacter(gameState: GameState, target: Character): string {
    if (target instanceof KnightOfDespair) return target.seeThrough(gameState)
    if (target instanceof Malakar && !endingPlayed(gameState)) {
      return gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)
        ? MALAKAR_HEALED_SEEN
        : MALAKAR_SEEN
    }
    if (target instanceof SorceressOfLies && this.chamberHolds(gameState)) {
      return SORCERESS_SEEN
    }
    return NOTHING_HIDDEN
  }

  /** Whether the Sorceress still holds the chamber, and its glamour with it. */
  private chamberHolds(gameState: GameState): boolean {
    return !gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)
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
    return line
  }
}
