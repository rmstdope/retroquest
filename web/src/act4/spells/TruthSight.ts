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
  FLAG_ACT4_TOWER_STAIR_OPEN,
} from '../Act4StoryFlags'
import { KnightOfDespair } from '../characters/KnightOfDespair'
import { Malakar } from '../characters/Malakar'
import { SorceressOfLies } from '../characters/SorceressOfLies'
import { Whispers } from '../characters/Whispers'
import { endingPlayed } from '../endings'
import { Banners } from '../items/Banners'
import { CrystalWhispers } from '../items/CrystalWhispers'
import { EchoStone } from '../items/EchoStone'
import { MemoryOrbs } from '../items/MemoryOrbs'
import { SorceressStaff } from '../items/SorceressStaff'
import { ChamberOfWhispers } from '../rooms/ChamberOfWhispers'
import { TowerOfShadows } from '../rooms/TowerOfShadows'

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
  'a tired woman, and nothing more to see. The lies were never in her ' +
  'face. They are in what she says.'

/** What the staff and its mask show, before she is redeemed. */
const STAFF_SEEN =
  'Your sight sharpens. The staff and its mask are just as they look. ' +
  'Whatever the mask hides, the eye will not find it.'

/** What the crystals show, before she is redeemed. */
const WHISPERS_SEEN =
  'Your sight sharpens, and there is nothing in the crystals to see. The ' +
  'lie is in what they hum, and it goes on, as sweet as before.'

/** What the stair shows while the whispers hold it. */
const STAIR_SEEN =
  'Your sight sharpens. The stair is as it looks, and the shadows are only ' +
  'shadows, a moment late. The whispers go on.'

/** What the Tower's shadows show while the whispers hold the stair. */
const SHADOWS_SEEN =
  'Your sight sharpens. They are only shadows, a moment late. Nothing is ' +
  'standing in them.'

/** What the whispers on the stair show. */
const STAIR_WHISPERS_SEEN =
  'Your sight sharpens, and still there is no one on the stair. The voices ' +
  'have no mouths to find. What they say, the eye cannot answer.'

/**
 * Learned in the Mirror Labyrinth: sees through illusion to what is really
 * there. In the Hall of Echoes the knight, the banners and the Echo Stone each
 * show a part of his story (all three are needed before he can be redeemed);
 * the Memory Orbs (until mended) and Malakar show a glimpse of their own. In
 * the Chamber of Whispers, until the Sorceress is redeemed, the sight strips
 * the room's shine and finds that the lie is in what is said, not in what is
 * seen. On the Tower's stair, while the whispers hold it, the sight finds no
 * one there: the shadows are only shadows, and what the whispers say is not
 * for the eye to answer.
 */
export class TruthSight extends Spell {
  constructor() {
    super({
      id: 'truth_sight',
      name: 'Truth Sight',
      description: 'See through illusion to what is really there.',
    })
  }

  /** The Chamber of Whispers, until she is redeemed, and the whispered stair have something to see. */
  override castSpell(gameState: GameState): string {
    if (
      gameState.currentRoom instanceof ChamberOfWhispers &&
      this.chamberHolds(gameState)
    ) {
      return CHAMBER_SEEN
    }
    if (this.stairHeld(gameState)) return STAIR_SEEN
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

  /** In the Tower the stair and its shadows answer, though they are no items; elsewhere nothing does. */
  override castOnName(gameState: GameState, target: string): string | null {
    const room = gameState.currentRoom
    if (!(room instanceof TowerOfShadows)) return null
    if (room.namesStair(target)) return this.castSpell(gameState)
    if (!room.namesShadows(target)) return null
    return this.stairHeld(gameState) ? SHADOWS_SEEN : NOTHING_HIDDEN
  }

  /** The knight is shown as he is, Malakar for a breath, the unredeemed Sorceress as she looks, the whispers as no one at all; nothing is hidden in anyone else. */
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
    if (target instanceof Whispers) return STAIR_WHISPERS_SEEN
    return NOTHING_HIDDEN
  }

  /** Whether the Sorceress still holds the chamber, and its glamour with it. */
  private chamberHolds(gameState: GameState): boolean {
    return !gameState.getStoryFlag(FLAG_ACT4_SORCERESS_OF_LIES_COMPLETED)
  }

  /** Whether Elior stands on the Tower's stair while the whispers still hold it. */
  private stairHeld(gameState: GameState): boolean {
    return (
      gameState.currentRoom instanceof TowerOfShadows &&
      !gameState.getStoryFlag(FLAG_ACT4_TOWER_STAIR_OPEN)
    )
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
