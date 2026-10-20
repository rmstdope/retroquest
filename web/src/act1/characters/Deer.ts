import { Character, characterName } from '@/engine'

/** Deer NPC representing a graceful creature of the Hidden Glade. */
export class Deer extends Character {
  constructor() {
    super({
      name: 'deer',
      description:
        `A graceful ${characterName('deer')} with wise, gentle eyes. ` +
        'It seems to sense the ' +
        'magic of the glade and watches you with curiosity.',
    })
  }
}
