import { Item, event, type GameState } from '@/engine'

const HEIRLOOM = 'A family heirloom whose runes glint like dew at dawn. '

/** What the amulet shows when examined, by how many clues it has glowed at. */
const PICTURES: string[] = [
  HEIRLOOM + 'It is faintly warm in your hand.',
  HEIRLOOM +
    'In its depths two faces linger: a man and a woman, laughing beside a ' +
    'third figure who has turned away.',
  HEIRLOOM +
    "In its depths the woman's face is clear: Lysa, with Grandmother's " +
    'eyes. The man laughs beside her, and the third figure keeps his back ' +
    'turned.',
  HEIRLOOM +
    'In its depths Aren and Lysa stand hand in hand. The third figure keeps ' +
    'his back turned.',
]

/** The paragraph shown the first time the amulet reaches each stage. */
const GLOWS: string[] = [
  '',
  'At your side, the [item_name]Ancient Amulet[/item_name] grows warm, then ' +
    'glows. In its light you glimpse two faces, a man and a woman, laughing ' +
    'beside a third figure who has turned away. Then the light fades.',
  'The [item_name]Ancient Amulet[/item_name] glows again, brighter than ' +
    "before, and the faces sharpen. The woman has Grandmother's eyes. She " +
    'can only be Lysa, your mother. The third figure still has his back ' +
    'turned.',
  'The [item_name]Ancient Amulet[/item_name] blazes in your hand a third ' +
    'time. Aren stands beside Lysa now, hand in hand. Behind them, the ' +
    'third figure still has his back turned.',
]

/** The paragraph that follows each glow: the curse, worse at every site. */
const CURSES: string[] = [
  '',
  'Out past the arches the tide turns, and the surf that breaks on the ' +
    'causeway runs grey. Dead sea birds lie along the stones, more than you ' +
    'can count, their feathers dull with salt. Whatever is draining the king ' +
    'is draining the sea as well.',
  'Ash begins to fall over the slopes, slow and grey as rain. Down the ' +
    'mountain the braziers gutter one by one and sink to embers. The curse ' +
    'lies heavier here than it did by the sea.',
  'Far off in the mines the ring of picks stops, and does not start again. ' +
    "Then the cavern's old dripping stops too, and the silence is complete. " +
    'The curse has reached even here, beneath the oldest hills.',
]

/** The stage of the amulet's picture after each of the three clues. */
export type AmuletStage = 1 | 2 | 3

/**
 * Elior's heirloom, carried from the first turn of Act III. It glows the
 * first time each Echoes clue is met and shows a little more of his parents'
 * faces; `stage` records how far it has got and `description` (which the
 * bag panel shows) always holds the picture for that stage.
 */
export class AncientAmulet extends Item {
  /** How many clues the amulet has glowed at (0 to 3); saved with the game. */
  stage = 0

  constructor() {
    super({
      name: 'ancient amulet',
      shortName: 'amulet',
      description: PICTURES[0],
      canBeCarried: true,
    })
  }

  /**
   * Glow for the clue of the given stage: the glow paragraph and, straight
   * after it, the curse paragraph for that site, the first time the amulet
   * reaches the stage; or '' when it has already shown that stage or a later
   * one. The examine line moves on to the new picture.
   */
  glow(stage: AmuletStage): string {
    if (this.stage >= stage) return ''
    this.stage = stage
    this.description = PICTURES[stage]
    return event(GLOWS[stage]) + '\n\n' + event(CURSES[stage])
  }

  /**
   * The glow and curse paragraphs (with their leading blank line) for the
   * amulet in the bag, or '' when it has nothing new to show or is not carried.
   */
  static glowInBag(gameState: GameState, stage: AmuletStage): string {
    const amulet = gameState.inventory.find((i) => i instanceof AncientAmulet)
    const paragraph = amulet instanceof AncientAmulet ? amulet.glow(stage) : ''
    return paragraph === '' ? '' : '\n\n' + paragraph
  }
}
