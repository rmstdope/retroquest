import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { Phoenix } from '../characters/Phoenix'

const BASE_DESCRIPTION =
  'A luminous bowl of vitrified rock where warm drafts swirl and cinders dance in ' +
  'spirals. The air smells of ozone, resin, and warm iron; the whole bowl feels like ' +
  'a giant hearth that remembers how to forge stars.'

const PHOENIX_DESCRIPTION =
  " At the crater's heart the phoenix lies on a bed of cooled slag, its " +
  'feathers red-gold and steaming. Each breath it lets out sends sparks up ' +
  'out of the bowl. Now and then a feather comes loose and cools on the rim ' +
  'to a shard that still hums.'

const DROWSY_DESCRIPTION =
  ' The warmth is drowsy here, as if the bowl would rather you sat and rested a ' +
  'while.'

const SILENT_CRATER = 'The crater is silent. Nothing comes to those who call.'

/** The Phoenix Crater: a luminous bowl of vitrified rock. */
export class PhoenixCrater extends Room {
  constructor() {
    super({
      name: 'Phoenix Crater',
      description: BASE_DESCRIPTION,
      items: [],
      characters: [],
      exits: { north: 'FumarolePassages' },
    })
  }

  /** Whether the Phoenix has appeared. */
  private phoenixPresent(): boolean {
    return this.characters.some((c) => c.name.toLowerCase() === 'phoenix')
  }

  /**
   * Until the Phoenix appears, the description ends with an invitation to
   * rest; afterwards it shows the Phoenix. Built from the constants, so a save
   * made before the text changed shows the current text.
   */
  override descriptionFor(_gameState: GameState): string {
    return (
      BASE_DESCRIPTION +
      (this.phoenixPresent() ? PHOENIX_DESCRIPTION : DROWSY_DESCRIPTION)
    )
  }

  /** Until the Phoenix appears, calling out gets a quiet in-world answer. */
  override talkToNobody(_gameState: GameState, _target: string): string | null {
    return this.phoenixPresent() ? null : SILENT_CRATER
  }

  /** Reveal the Phoenix when the player rests. */
  override rest(_gameState: GameState): string {
    if (!this.phoenixPresent()) {
      this.addCharacter(new Phoenix())
      this.description = BASE_DESCRIPTION + PHOENIX_DESCRIPTION
      return (
        'As your eyes close, the air grows warmer. When you open them, a ' +
        'phoenix is lying in the crater with you, watching you as if it has ' +
        'been there all along.'
      )
    }
    return 'The heat of the crater soaks into you, and the ache goes out of your legs.'
  }
}
