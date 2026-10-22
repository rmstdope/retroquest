import { Item } from '@/engine'

/**
 * The Forest Heart Crystal Nyx gave Elior in Act II, carried through Act IV
 * (made again for this act). It opened the shared vision in Greendale; at
 * the hedge in Willowbrook Field it can be set back where Nyx's light is.
 */
export class ForestHeartCrystal extends Item {
  constructor() {
    super({
      name: 'Forest Heart Crystal',
      description:
        'A crystal with a whole small forest in it. Tiny lights move inside ' +
        'like fireflies, and held close it sounds faintly of wind in leaves.',
      canBeCarried: true,
    })
  }
}
