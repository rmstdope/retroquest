import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { RunicWalls } from '../items/RunicWalls'
import { OldOathScrolls } from '../items/OldOathScrolls'

/** Echoing caverns with runic walls and chant rubbings. */
export class EchoChambers extends Room {
  scrollsDiscovered = false

  constructor() {
    super({
      name: 'Echo Chambers',
      description:
        'Smooth caverns carved from living stone stretch into shadow, where ' +
        'every footfall reverberates through the darkness like whispered ' +
        'incantations. Faint, otherworldly voices seem to mimic your speech, ' +
        'echoing from unseen alcoves as if ancient spirits dwell within the ' +
        'walls themselves. Mysterious runic walls line the chamber, their ' +
        'symbols glowing with a dim, ethereal light that pulses in rhythm ' +
        'with your heartbeat. The air thrums with an almost palpable energy, ' +
        'and you sense that this place has witnessed rituals of great power.',
      items: [new RunicWalls()],
      exits: { west: 'CollapsedGalleries' },
    })
  }

  /** Search the Echo Chambers to discover hidden Old Oath Scrolls. */
  override search(_gameState: GameState): string {
    if (!this.scrollsDiscovered) {
      this.scrollsDiscovered = true
      this.addItem(new OldOathScrolls())
      return (
        'Your careful search of the shadowed alcoves reveals a bundle of ' +
        'ancient scrolls tucked away in a stone niche, their parchment ' +
        'yellowed with age and covered in faded script. These appear to be ' +
        'old oath scrolls, containing wisdom about sacred promises and ' +
        'the true nature of selfless vows.'
      )
    }
    return (
      'You have already discovered the old oath scrolls hidden in this ' +
      'chamber. The alcoves hold no further secrets.'
    )
  }
}
