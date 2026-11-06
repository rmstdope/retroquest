import { characterName, clue, Room, type GameState } from '@/engine'
import { Candle } from '../items/Candle'
import { PrayerBook } from '../items/PrayerBook'
import { Priest } from '../characters/Priest'
import { Scenery } from '../items/Scenery'

/** The chapel's description up to its last sentence, which follows the candle. */
const CHAPEL_DESCRIPTION =
  'A small stone chapel. Its stained glass windows cast colours across ' +
  'the worn pews, and the air is cool and smells of candle wax. ' +
  `A kindly ${characterName('priest')} tends the altar. ` +
  'By the door the bell rope hangs straight and still. ' +
  'Over the door a shape is cut into the stone, worn almost smooth. '
/** The last sentence while the candle is cold. */
const DARK_CORNER_SENTENCE = 'A dark corner by the altar swallows the light.'
/** The last sentence once the candle is lit. */
const LIT_CORNER_SENTENCE =
  'The candle burns on the altar, and the corner beside it is dark no longer.'

/**
 * Village Chapel room: reflective spiritual focal point. A dark corner by the
 * altar keeps the light out until the candle is lit; the description and the
 * light spell follow the candle.
 */
export class VillageChapel extends Room {
  constructor() {
    super({
      name: 'Village Chapel',
      description: CHAPEL_DESCRIPTION + DARK_CORNER_SENTENCE,
      items: [
        new Candle(),
        new PrayerBook(),
        ...Scenery.forRoom('VillageChapel'),
      ],
      characters: [new Priest()],
      exits: { north: 'HiddenGlade', east: 'RoadToGreendale' },
    })
  }

  /** Whether the chapel's candle has been lit. */
  private candleLit(): boolean {
    return this.items.some((item) => item instanceof Candle && item.isLit)
  }

  /** The chapel, ending on the dark corner while the candle is cold and on its flame once lit. */
  override descriptionFor(_gameState: GameState): string {
    return (
      CHAPEL_DESCRIPTION +
      (this.candleLit() ? LIT_CORNER_SENTENCE : DARK_CORNER_SENTENCE)
    )
  }

  /** A light spell does not reach into the dark corner; only the candle lights it. */
  override light(_gameState: GameState): string {
    if (this.candleLit()) {
      return '[failure]The candle already lights the corner by the altar.[/failure]'
    }
    return clue(
      'Your light goes into the dark corner by the altar and does not come ' +
        'out again. The corner keeps its dark.',
    )
  }
}
