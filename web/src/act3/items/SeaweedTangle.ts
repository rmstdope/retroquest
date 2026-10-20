import { Item } from '@/engine'

/** A mat of salt-wet seaweed that clings to the shoreline; not carriable. */
export class SeaweedTangle extends Item {
  constructor() {
    super({
      name: 'Seaweed Tangle',
      description:
        'A dense mat of seaweed clings to the stones, slick and knotted. ' +
        'It seems rooted to the surf.',
      shortName: 'seaweed',
      canBeCarried: false,
    })
  }

  /** Explain why this cannot be picked up. */
  override preventPickup(): string {
    return (
      '[failure]The seaweed is wedged into crevices and heavy with salt; you ' +
      "can't pull it free.[/failure]"
    )
  }
}
