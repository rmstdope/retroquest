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
        spellMsg =
          '\n\n[success]As you trace the druidic runes with your finger, ' +
          'ancient knowledge flows into your mind. The symbols begin to make ' +
          "sense—they're not just markers, but a teaching tool! You feel a " +
          'connection forming with the natural world around you, and ' +
          'suddenly you understand how to cast the ' +
          '[spell_name]nature sense[/spell_name] spell![/success]\n\n' +
          'You have learned the spell: [spell_name]nature sense[/spell_name]!'
      }
      return (
        'You approach the ancient standing stones and run your hands over ' +
        'their weathered surfaces. The runes carved into the stone are ' +
        'clearly druidic—symbols representing protection, passage, and the ' +
        'balance between civilization and wilderness. These stones have ' +
        'stood here for centuries, marking the boundary between worlds. ' +
        'You can feel the old magic thrumming within them, a gentle but ' +
        'powerful force that has protected travelers for generations.' +
        spellMsg
      )
    }
    return (
      'The standing stones continue to pulse with ancient magic, their druidic runes a ' +
      'testament to the old ways.'
    )
  }
}
