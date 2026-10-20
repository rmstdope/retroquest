import { Item } from '@/engine'

/** Old, rusty saw with a worn wooden handle, useful for cutting soft materials. */
export class RustySaw extends Item {
  constructor() {
    super({
      name: 'rusty saw',
      description:
        'An old, rusty saw with a worn wooden handle. It looks like it could still cut ' +
        'through something soft, but might break on anything tough.',
      shortName: 'saw',
      canBeCarried: true,
    })
  }
}
