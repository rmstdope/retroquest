import { characterName, Room } from '@/engine'
import { Rope } from '../items/Rope'
import { Apple } from '../items/Apple'
import { Matches } from '../items/Matches'
import { Armor } from '../items/Armor'
import { Sword } from '../items/Sword'
import { Shopkeeper } from '../characters/Shopkeeper'

/** General Store room: static early merchant hub with multi-category items. */
export class GeneralStore extends Room {
  constructor() {
    super({
      name: 'General Store',
      description:
        'A cluttered shop overflowing with goods of every kind. Shelves groan under ' +
        `the weight of rope, apples, matches, and trinkets. The ${characterName('shopkeeper')} bustles ` +
        'about, dusting jars and chatting with customers. The air is thick with the ' +
        'mingled scents of fruit, wax, and old wood. Every corner seems to hold a ' +
        'new surprise, and the promise of a good bargain.',
      items: [new Rope(), new Apple(), new Matches(), new Sword(), new Armor()],
      characters: [new Shopkeeper()],
      exits: { west: 'VillageSquare', south: 'BlacksmithsForge' },
    })
  }
}
