import { Item } from '@/engine'

/** The crystal's description; `Act2.afterLoad` restores it in older saves. */
export const FOREST_HEART_CRYSTAL_DESCRIPTION =
  'A crystal the size of a plum. Inside it, tiny lights drift like ' +
  'fireflies over a forest you could almost walk into. Held close, it ' +
  'sounds like wind in leaves.'

/** A crystal holding the living forest, Nyx's gift for the heart of the forest. */
export class ForestHeartCrystal extends Item {
  constructor() {
    super({
      name: 'forest heart crystal',
      description: FOREST_HEART_CRYSTAL_DESCRIPTION,
    })
  }
}
