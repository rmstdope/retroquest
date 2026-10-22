import { characterName, Room } from '@/engine'
import { Candle } from '../items/Candle'
import { PrayerBook } from '../items/PrayerBook'
import { Priest } from '../characters/Priest'

/** Village Chapel room: reflective spiritual focal point. */
export class VillageChapel extends Room {
  constructor() {
    super({
      name: 'Village Chapel',
      description:
        'A small stone chapel stands in quiet dignity, its stained glass windows ' +
        'casting rainbows across the worn pews. The air is cool and still, filled ' +
        `with the faint scent of candle wax and old parchment. A kindly ${characterName('priest')} tends ` +
        'to the altar, offering blessings and words of comfort. Over the door a ' +
        'shape is cut into the stone, worn almost smooth. A dark corner by ' +
        'the altar swallows the light.',
      items: [new Candle(), new PrayerBook()],
      characters: [new Priest()],
      exits: { north: 'HiddenGlade', east: 'RoadToGreendale' },
    })
  }
}
