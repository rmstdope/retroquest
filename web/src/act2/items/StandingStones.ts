import { Item, type GameState } from '@/engine'
import { NatureSenseSpell } from '../spells/NatureSenseSpell'

/** Ancient druidic monoliths that convey nature magic and may teach a spell. */
export class StandingStones extends Item {
  examined = false

  constructor() {
    super({
      name: 'standing stones',
      shortName: 'stones',
      description:
        'Ancient stone monoliths covered in moss and carved with protective runes ' +
        'that pulse with faint magic. These druidic markers have stood for ' +
        'centuries, representing protection, passage, and the balance between ' +
        'civilization and wilderness. The old magic within them protects travelers ' +
        'at this threshold.',
      canBeCarried: false,
    })
  }

  /** Examine the standing stones to learn about their magic. */
  override examine(gameState: GameState): string {
    if (!this.examined) {
      this.examined = true
      // Learn nature_sense spell automatically
      let spellMsg = ''
      if (!gameState.hasSpell(new NatureSenseSpell().id)) {
        const natureSense = new NatureSenseSpell()
        gameState.learnSpell(natureSense)
        spellMsg = '\n\nYou have learned [spell_name]nature sense[/spell_name].'
      }
      return (
        'You run your hands over the stones. The runes are worn but deep, ' +
        'cut by people who meant them to last. As you trace them, the ' +
        'shapes start to mean something: not words, but a way of listening ' +
        'to everything that grows.' +
        spellMsg
      )
    }
    return (
      'The standing stones continue to pulse with ancient magic, their druidic runes a ' +
      'testament to the old ways.'
    )
  }
}
