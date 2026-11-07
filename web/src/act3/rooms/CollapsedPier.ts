import { Room } from '@/engine'
import { Locker } from '../items/Locker'
import { WeatheredCoin } from '../items/WeatheredCoin'
import { PierWarden } from '../characters/PierWarden'

/** A broken jetty where the sea keeps its older promises in shadow. */
export class CollapsedPier extends Room {
  constructor() {
    super({
      name: 'Collapsed Pier',
      description:
        'The pier has fallen into the tide. ' +
        'Warped planks gape over dark vaults, ' +
        'and barnacled timbers stand up out of the water. ' +
        'The sea knocks against them, slow and steady.',
      items: [new Locker(), new WeatheredCoin()],
      characters: [new PierWarden()],
      exits: { west: 'OuterWards' },
    })
  }

  /** Give a save made with older wording the current description. */
  override refreshSavedText(): void {
    this.description = new CollapsedPier().description
  }
}
