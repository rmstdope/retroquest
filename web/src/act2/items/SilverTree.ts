import { Item, characterName, type GameState } from '@/engine'
import { AncientTreeSpirit } from '../characters/AncientTreeSpirit'
import { AncientGrove } from '../rooms/AncientGrove'

/** What a first look at the tree shows, wherever it stands. */
const TREE_FIRST_LOOK =
  'The tree stands taller than anything around it. Its bark is silver, ' +
  'smooth as metal and warm under your hand.'

/** Silver-barked tree that anchors the Ancient Grove and related encounters. */
export class SilverTree extends Item {
  examined = false

  constructor() {
    super({
      name: 'silver-barked tree',
      shortName: 'tree',
      description:
        'A tree taller than any around it, with bark the colour of ' +
        'tarnished silver, warm to the touch. Something lives in it; you ' +
        'can feel it the way you feel someone in a dark room.',
      canBeCarried: false,
    })
  }

  /** Examine the tree: the first look in the grove wakes the spirit. */
  override examine(gameState: GameState): string {
    if (!this.examined) {
      this.examined = true
      // Add the Ancient Tree Spirit to the room only if we're in the Ancient Grove
      if (gameState.currentRoom instanceof AncientGrove) {
        const ancientSpirit = new AncientTreeSpirit()
        gameState.currentRoom.characters.push(ancientSpirit)
        return (
          `${TREE_FIRST_LOOK} You stand there long enough, and something ` +
          'in the wood turns over, like a sleeper waking. The ' +
          `${characterName('ancient tree spirit')} is awake.`
        )
      }
      return (
        `${TREE_FIRST_LOOK} Something lives in it; you can feel it the ` +
        'way you feel someone in a dark room.'
      )
    }
    return (
      'The silver bark is warm under your hand. Somewhere in it, the ' +
      'spirit is listening.'
    )
  }
}
