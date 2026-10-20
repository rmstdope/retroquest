import { Item } from '@/engine'

/**
 * The broad stone bedded at the water's edge of the river bend. It stays where
 * it is; Elior's mother hid a tin in the mud beneath it (see Riverbank.search).
 */
export class SmoothStone extends Item {
  constructor() {
    super({
      name: 'smooth stone',
      description:
        "A broad, flat stone at the water's edge, polished smooth by the river's " +
        'current. It sits snugly in the mud, as if it has always been there.',
      shortName: 'stone',
    })
  }

  /** The stone belongs to the bend; it refuses to be carried off, even in older saves. */
  override preventPickup(): string {
    return (
      '[failure]You lift the [item_name]smooth stone[/item_name] a little, ' +
      'then set it back. It belongs here, at the bend of the river.[/failure]'
    )
  }
}
