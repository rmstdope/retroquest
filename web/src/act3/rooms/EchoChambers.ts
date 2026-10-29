import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { RunicWalls } from '../items/RunicWalls'
import { OldOathScrolls } from '../items/OldOathScrolls'
import { ECHO_AFTER, echoHeard, playEcho } from '../EchoNight'

/** Echoing caverns with runic walls and chant rubbings. */
export class EchoChambers extends Room {
  scrollsDiscovered = false

  constructor() {
    super({
      name: 'Echo Chambers',
      description:
        'Smooth caverns of bare stone. ' +
        'Every step comes back to you from the alcoves, ' +
        'and so does every word, a breath late, as if someone were copying you. ' +
        'Runes cover the walls, cut by three hands, the same words over and over.',
      items: [new RunicWalls()],
      exits: { west: 'CollapsedGalleries' },
    })
  }

  /**
   * Light cast here finds the writing above reach: a rewarded second use of
   * the spell in the act, nothing gained but the sight.
   */
  castLightHere(_gameState: GameState): string {
    return (
      'Your light runs up the runic walls and finds writing higher than any ' +
      'hand could reach: three hands, the same words cut over and over. ' +
      'The whispers hush for as long as it burns.'
    )
  }

  /** Listening plays the echo of the Wardens parting once, then a short line. */
  override getAmbientSound(gameState: GameState): string {
    return echoHeard(gameState) ? ECHO_AFTER : playEcho(gameState)
  }

  /** Search the Echo Chambers to discover hidden Old Oath Scrolls. */
  override search(_gameState: GameState): string {
    if (!this.scrollsDiscovered) {
      this.scrollsDiscovered = true
      this.addItem(new OldOathScrolls())
      return (
        'In a stone niche at the back of an alcove lies a bundle of old scrolls, ' +
        'tied with faded golden thread.'
      )
    }
    return (
      'You have already discovered the old oath scrolls hidden in this ' +
      'chamber. The alcoves hold no further secrets.'
    )
  }
}
