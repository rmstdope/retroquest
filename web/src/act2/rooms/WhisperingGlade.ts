import { Room } from '@/engine'

/** Whispering Glade room: tranquil forest clearing with latent lore potential (Act II). */
export class WhisperingGlade extends Room {
  constructor() {
    super({
      name: 'Whispering Glade',
      description:
        'A peaceful meadow opens around a small stream that babbles over smooth stones. ' +
        'Wildflowers blanket the ground and butterflies drift through warm sunlight. The ' +
        "water's murmur soothes, yet faint voices ride the breeze — whispers hinting at " +
        'ancient secrets. Near the crystal stream you sense watchful, unseen guardians.',
      items: [],
      characters: [],
      exits: { west: 'ForestEntrance' },
    })
  }
}
