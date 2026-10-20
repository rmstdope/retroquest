import { Room } from '@/engine'

/**
 * An enchanted maze where reality bends and truth becomes elusive.
 *
 * Tests the player's ability to discern truth from deception.
 */
export class MirrorLabyrinth extends Room {
  constructor() {
    super({
      name: 'Mirror Labyrinth',
      description:
        'Endless corridors of gleaming mirrors stretch in impossible directions, ' +
        'each surface reflecting not just your image but fragments of possible ' +
        'futures and buried memories. The reflections move independently, some ' +
        'beckoning you forward while others shake their heads in warning. Crystal ' +
        'facets catch phantom light from unseen sources, creating a kaleidoscope ' +
        'of truth and deception that makes your head spin and your heart race.',
      items: [],
      characters: [],
      exits: { south: 'OuterCourtyard' },
    })
  }
}
