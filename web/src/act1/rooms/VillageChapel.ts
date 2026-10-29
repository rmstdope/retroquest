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
        'A small stone chapel. Its stained glass windows cast colours across ' +
        'the worn pews, and the air is cool and smells of candle wax. ' +
        `A kindly ${characterName('priest')} tends the altar. ` +
        'By the door the bell rope hangs straight and still. ' +
        'Over the door a shape is cut into the stone, worn almost smooth. ' +
        'A dark corner by the altar swallows the light.',
      items: [new Candle(), new PrayerBook()],
      characters: [new Priest()],
      exits: { north: 'HiddenGlade', east: 'RoadToGreendale' },
    })
  }
}
