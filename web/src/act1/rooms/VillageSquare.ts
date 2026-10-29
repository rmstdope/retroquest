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
        'The heart of Willowbrook: cobblestones around an old stone fountain, ' +
        'and a weathered notice board covered in faded announcements. ' +
        'Half the market stalls stand empty. The people at the others keep ' +
        'their voices down, and stop talking when you pass.',
      items: [new Bucket(), new OldNotice()],
      characters: [new Villager()],
      exits: { west: 'EliorsCottage', north: 'MirasHut', east: 'GeneralStore' },
    })
  }
}
