import { Item } from '@/engine'

/**
 * The withered field behind Elior's home in Willowbrook Field, the last room
 * of the game. Grow cast on it is the last cast of the story (see `Grow`),
 * which ends the act, so it is only ever seen withered.
 */
export class Field extends Item {
  constructor() {
    super({
      name: 'Field',
      description:
        'Row after row of withered crops, the earth between them cracked ' +
        'and grey. You have worked these rows since you could walk.',
      canBeCarried: false,
    })
  }

  /** The player may also say "crops". */
  override otherNames(): string[] {
    return ['crops']
  }
}
