import { Room } from '@/engine'
import { Bucket } from '../items/Bucket'
import { OldNotice } from '../items/OldNotice'
import { Villager } from '../characters/Villager'

/** Village Square room: central social/navigation hub with light utility items. */
export class VillageSquare extends Room {
  constructor() {
    super({
      name: 'Village Square',
      description:
        'The heart of Willowbrook bustles with life. Cobblestone paths radiate from an ' +
        'old stone fountain, and a weathered notice board stands nearby, covered in faded ' +
        'announcements. Children chase each other around market stalls, and the air is ' +
        'filled with laughter, gossip, and the scent of fresh bread. The square is a ' +
        'crossroads for villagers, travelers, and secrets alike.',
      items: [new Bucket(), new OldNotice()],
      characters: [new Villager()],
      exits: { west: 'EliorsCottage', north: 'MirasHut', east: 'GeneralStore' },
    })
  }
}
