import { Item, event, type GameState } from '@/engine'
import { FLAG_ACT3_POOLS_STILLED } from '../Act3StoryFlags'
import { DarkPool } from './DarkPool'
import { EchoStones } from './EchoStones'

/** A vial of eerily still water from the vestibule pools; it stills them for the chant. */
export class StillwaterPhial extends Item {
  constructor() {
    super({
      name: 'stillwater phial',
      description:
        'A crystal vial containing water so still it seems solid. The ' +
        "liquid captures and holds reflections that shouldn't be there. " +
        'Tilted to the light, it shows not your face but a young woman at a ' +
        'long table, bent over a book, and three teachers about her: one ' +
        'pointing at the page, one laughing, one watching from the shadow ' +
        'by the door.',
      canBeCarried: true,
      shortName: 'phial',
    })
  }

  /** Use the phial with the pool or the echo stones to still the pools; the phial is kept. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof DarkPool || other instanceof EchoStones) {
      if (gameState.getStoryFlag(FLAG_ACT3_POOLS_STILLED)) {
        return '[dim]The pools are already mirror-still.[/dim]'
      }
      gameState.setStoryFlag(FLAG_ACT3_POOLS_STILLED, true)
      return (
        event(
          'You unstopper the phial and let a single drop fall into the ' +
            'nearest pool. The ripple does not spread; it sinks, and the ' +
            'stillness goes down after it until the black water lies flat ' +
            'as glass, holding the stones and the dark above in perfect ' +
            'reflection. ',
        ) +
        '\n' +
        '[success]The pools are mirror-still. Now the chant will carry.[/success]'
      )
    }
    return super.useWith(gameState, other)
  }
}
