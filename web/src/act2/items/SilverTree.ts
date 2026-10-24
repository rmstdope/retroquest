import { Item, type GameState } from '@/engine'
import { AncientTreeSpirit } from '../characters/AncientTreeSpirit'
import { AncientGrove } from '../rooms/AncientGrove'

/** Ancient silver-barked tree that anchors the Ancient Grove and related encounters. */
export class SilverTree extends Item {
  examined = false

  constructor() {
    super({
      name: 'silver-barked tree',
      shortName: 'tree',
      description:
        'A magnificent ancient tree that towers above all others, its silver bark ' +
        'shimmering with an inner light that seems to pulse in rhythm with your ' +
        'heartbeat. The bark is smooth as polished metal yet warm to the touch, ' +
        'and intricate spiraling patterns flow across its surface like living ' +
        'veins of starlight. This is the dwelling place of the Ancient Tree Spirit.',
      canBeCarried: false,
    })
  }

  /** Examine the magnificent silver-barked tree. */
  override examine(gameState: GameState): string {
    if (!this.examined) {
      this.examined = true
      // Add the Ancient Tree Spirit to the room only if we're in the Ancient Grove
      if (gameState.currentRoom instanceof AncientGrove) {
        const ancientSpirit = new AncientTreeSpirit()
        gameState.currentRoom.characters.push(ancientSpirit)
        return (
          'The ancient tree towers above you, its silver bark shimmering ' +
          'with an inner light that seems to pulse in rhythm with your ' +
          'heartbeat. The bark is smooth as polished metal yet warm to the ' +
          'touch, and intricate spiraling patterns flow across its surface ' +
          'like living veins of starlight. Its massive canopy spreads wide, ' +
          'with leaves that catch and reflect light in impossible ways. You ' +
          'sense an ancient presence within - older than memory, wise beyond ' +
          'measure, and deeply connected to the very essence of the forest. ' +
          'As you study the tree more closely, the silver bark begins to ' +
          'glow more brightly, and suddenly you feel a powerful presence ' +
          'emerge from within. The Ancient Tree Spirit has awakened to your ' +
          'reverent attention.'
        )
      }
      return (
        'The ancient tree towers above you, its silver bark shimmering ' +
        'with an inner light that seems to pulse in rhythm with your ' +
        'heartbeat. The bark is smooth as polished metal yet warm to the ' +
        'touch, and intricate spiraling patterns flow across its surface ' +
        'like living veins of starlight. Its massive canopy spreads wide, ' +
        'with leaves that catch and reflect light in impossible ways. You ' +
        'sense an ancient presence within - older than memory, wise beyond ' +
        'measure, and deeply connected to the very essence of the forest. ' +
        'This is no mere tree, but the dwelling place of the Ancient Tree ' +
        'Spirit.'
      )
    }
    return (
      'The magnificent silver-barked tree continues to radiate ancient ' +
      'power and wisdom. Its presence fills you with a sense of ' +
      'reverence and connection to the natural world.'
    )
  }
}
