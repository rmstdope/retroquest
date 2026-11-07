import {
  Character,
  type GameState,
  characterName,
  speech,
  type NameOptions,
} from '@/engine'
import {
  FLAG_ACT3_MIRRORS_MENDED,
  FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
} from '../Act3StoryFlags'
import { BrassMirrorSegment } from '../items/BrassMirrorSegment'
import { CharredNotebook } from '../items/CharredNotebook'

/** A scholar who studies mirrorcraft and offers a mirror segment and a charred notebook. */
export class AshScholar extends Character {
  /** Tracks whether this scholar has already given their mirror segment and notebook. */
  private gaveSegment = false

  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'Ash Scholar',
      description:
        'A scholar in soot-streaked robes, with a sheaf of notes on mirror ' +
        'angles tied to one wrist so the wind cannot take it.',
    })
  }

  /** Whether the scholar has already given his segment and notebook. */
  get hasGivenGifts(): boolean {
    return this.gaveSegment
  }

  /**
   * Speak to the scholar; the first talk gives the segment and the notebook.
   * After that he counts the segments the mount takes until the mirrors are
   * mended, then speaks of the lit mirror, and of the feather once it is won.
   */
  override talkTo(gameState: GameState): string {
    // If the scholar hasn't yet given his gifts, give the segment and the notebook now.
    // Do NOT check the player's inventory; the scholar's gift is tracked
    // locally so the player may receive duplicates from other sources.
    if (!this.gaveSegment) {
      const segment = new BrassMirrorSegment()
      gameState.addItemToInventory(segment)
      this.gaveSegment = true
      const notebook = new CharredNotebook()
      gameState.addItemToInventory(notebook)
      return (
        'The ' +
        characterName(this.name) +
        ' looks up from a tray of brass fittings and wipes the soot from ' +
        'both hands before speaking.\n' +
        speech(
          'We are on an expedition: a small band of scholars and tinkerers, ' +
            'tracing the terraces and cataloguing anything that glints.',
        ) +
        '\n' +
        speech(
          'I found this brass mirror segment while prying at a collapsed ' +
            'ledge. It is small, but it will mend a mount. There will be more ' +
            'among the outcrops, if you search carefully.',
        ) +
        '\n' +
        `You receive a [item_name]${segment.name.toLowerCase()}[/item_name].` +
        '\n' +
        speech(
          'This was in the same ledge. A notebook, burned nearly through. ' +
            'Whoever wrote in it knew these mirrors better than any of us, ' +
            'and I cannot make out who that was. Perhaps you can.',
        ) +
        '\n' +
        `You receive a [item_name]${notebook.name.toLowerCase()}[/item_name].`
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)) {
      return (
        'The ' +
        characterName(this.name) +
        ' stares at the feather in your hand. ' +
        speech(
          'We have catalogued everything on this mountain that glints, and ' +
            'never that. Keep it close. It is not for my notes.',
        )
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT3_MIRRORS_MENDED)) {
      return (
        'The ' +
        characterName(this.name) +
        ' looks up toward the terraces. ' +
        speech(
          'The mirror on the terraces is burning again; I saw it catch from ' +
            'here. Four segments, as my notes said.',
        )
      )
    }
    return (
      'The ' +
      characterName(this.name) +
      ' taps a page of notes. ' +
      speech(
        'The mount on the terraces takes four segments, by my notes. Seek ' +
          'the outcrops for what the mountain has shed.',
      )
    )
  }
}
