import { Item } from '@/engine'

/** The item's description; `Act2.afterLoad` restores it in older saves. */
export const SILVER_LEAVES_DESCRIPTION =
  'Leaves from the silver-barked tree, cool and stiff, with a silver ' +
  'sheen even in shadow. A healer would know what to do with these.'

/**
 * Leaves from the silver-barked tree in the Ancient Grove.
 * Purely descriptive; inherits the base `examine`.
 */
export class SilverLeaves extends Item {
  constructor() {
    super({
      name: 'silver leaves',
      description: SILVER_LEAVES_DESCRIPTION,
      canBeCarried: true,
    })
  }
}
