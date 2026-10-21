import { Item, event, type GameState } from '@/engine'
import { SeaSealedLetter } from './SeaSealedLetter'

/** A weathered mural along a half-drowned arch showing two figures shielding a child. */
export class Mural extends Item {
  private letterFound = false

  constructor() {
    super({
      name: 'mural',
      shortName: 'mural',
      description:
        'A faded mural shows two figures shielding a small child from a ' +
        'storm of sigils, while a third reaches toward them. Salt has ' +
        'softened the colours; you cannot tell whether the third hand ' +
        'means to help or to take.',
      canBeCarried: false,
    })
  }

  /** Examine the mural to reveal hidden secrets or the letter. */
  override examine(gameState: GameState): string {
    if (this.letterFound) {
      return event(
        'The two figures still shield the child, and the third still ' +
          'reaches toward them. Where a small box was sealed into the ' +
          'paint, empty stone now shows its place.',
      )
    }
    // Mark the letter as found the first time it is revealed
    this.letterFound = true
    gameState.currentRoom.addItem(new SeaSealedLetter())
    return event(
      "Fine salt lines run along the mural's base. Pressing the stone, " +
        'your hand finds a hollow and a dry scrap falls into your palm. A ' +
        '[item_name]Sea-Sealed Letter[/item_name] peels free, its ink half-hidden ' +
        'by varnish made of salt and tide.',
    )
  }
}
