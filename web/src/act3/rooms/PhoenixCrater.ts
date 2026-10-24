import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { Phoenix } from '../characters/Phoenix'

const BASE_DESCRIPTION =
  'A luminous bowl of vitrified rock where warm drafts swirl and cinders dance in ' +
  'spirals. The air smells of ozone, resin, and warm iron; the whole bowl feels like ' +
  'a giant hearth that remembers how to forge stars.'

const PHOENIX_DESCRIPTION =
  " At the crater's heart an enormous phoenix reclines on a throne of cooled slag and " +
  'ember—its plumage a molten fan of red-gold feathers that shimmer and steam. Each ' +
  'breath it gives sends a shower of glowing ash that drifts like sparks, and its ' +
  'coal-bright eyes watch with a patient, ancient intelligence. Its talons curl around ' +
  'glassed stones, and every movement rings with a metal-on-metal chime, as if the bird ' +
  'were at once creature and relic. Now and then a single feather arcs away in a slow, ' +
  'burning arc, embedding itself in the rim where it cools to a shard that still hums ' +
  'faintly.'

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

  /** Until the Phoenix appears, the description ends with an invitation to rest. */
  override descriptionFor(gameState: GameState): string {
    const base = super.descriptionFor(gameState)
    return this.phoenixPresent() ? base : base + DROWSY_DESCRIPTION
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
        'As your eyes close, the air grows warmer. When you ' +
        'open them, a vast phoenix of living ember stands before you, its gaze meeting ' +
        'yours with ancient, knowing patience.'
      )
    }
    return 'The heat of the crater soaks into you, and the ache goes out of your legs.'
  }
}
