import { Item, type GameState } from '@/engine'

/** Attunement implement reinforcing natural magic themes and future ritual gating. */
export class DruidicFocus extends Item {
  constructor() {
    super({
      name: 'druidic focus',
      description:
        'A carefully carved length of living wood wrapped with braided vine and inset ' +
        'with a faintly glowing seed-crystal. The implement hums with quiet natural ' +
        'resonance, inviting disciplined breathing and attunement to subtle tides of ' +
        'primal magic.',
      shortName: 'focus',
      canBeCarried: true,
    })
  }

  /** Return expanded sensory feedback emphasizing latent potential. */
  override examine(_gameState: GameState): string {
    return (
      'The druidic focus feels warm and alive in your hand. Its spiral grain and the ' +
      'embedded seed-crystal seem to sync with your pulse. You sense it could stabilize ' +
      'complex nature rituals or amplify subtle spellwork once such techniques are ' +
      'rediscovered.'
    )
  }
}
