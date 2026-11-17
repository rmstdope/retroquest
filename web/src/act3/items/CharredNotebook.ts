import { Item, writing, type GameState } from '@/engine'

/**
 * A burned notebook of Malakar's, handed over by the Ash Scholar. Optional
 * reading: it opens nothing, gates nothing and reads the same every time.
 */
export class CharredNotebook extends Item {
  constructor() {
    super({
      name: 'Charred Notebook',
      shortName: 'notebook',
      description:
        'A notebook burned nearly through. The cover is gone; the spine ' +
        'still holds.',
      canBeCarried: true,
    })
  }

  /** Read the three surviving entries; the text never changes and no state is set. */
  override examine(_gameState: GameState): string {
    return (
      "Most of the notebook's pages have crumbled to flakes; three survive, " +
      'in a neat and patient hand.' +
      '\n\n' +
      writing(
        'Lysa says I measure the light too carefully. Aren says that is why ' +
          'it never misses. We set the third mirror today, and the whole ' +
          'terrace caught fire with it, the good kind.',
      ) +
      '\n\n' +
      writing(
        'We walked up onto the moor tonight, the four of us, to see the two ' +
          'moons. Mira fell asleep in the heather. Lysa says the founders ' +
          'crossed here. I kept watch till dawn and never once wished the ' +
          'night shorter.',
      ) +
      '\n\n' +
      writing(
        'The Wasting has reached Willowbrook. Lysa coughs at night and ' +
          'pretends she does not. Aren sits up with her and pretends he is ' +
          'not afraid. They tell me to wait. I have waited all my life.',
      ) +
      '\n\n' +
      'The last entry is pressed so hard into the page that the pen has ' +
      "torn it. The names in it are your parents'."
    )
  }
}
