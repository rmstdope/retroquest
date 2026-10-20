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
        'The pier surrenders to the tide. Warped planks gape and blackened ' +
        'vaults yawn where light forgets to go. Barnacled timbers rise like ' +
        'buried ribs, and the water sings a low, patient counting of losses.',
      items: [new Locker(), new WeatheredCoin()],
      characters: [new PierWarden()],
      exits: { west: 'OuterWards' },
    })
  }
}
