import { Item } from '@/engine'

/**
 * Photic foliage fragment underscoring ancient forest luminosity themes.
 * Purely descriptive; inherits the base `examine`.
 */
export class SilverLeaves extends Item {
  constructor() {
    super({
      name: 'silver leaves',
      description:
        'Delicate leaves that shimmer with a soft argent sheen even in shadow. ' +
        'Their surfaces refract light into faint auroral threads, and a cool, ' +
        'clean scent clings to them. Holding them you sense tranquil, ancient ' +
        'vitality. A healer would know what to do with these.',
      canBeCarried: true,
    })
  }
}
