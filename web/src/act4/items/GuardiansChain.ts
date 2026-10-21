import { Item, type GameState, event } from '@/engine'
import { FLAG_ACT4_GUARDIANS_CHAIN_RAISED } from '../Act4StoryFlags'
import { HallOfEchoes } from '../rooms/HallOfEchoes'

/** A mystical chain that provides protection against dark magic. */
export class GuardiansChain extends Item {
  constructor() {
    super({
      name: "Guardian's Chain",
      description:
        'A silver chain adorned with small crystal pendants that shimmer with ' +
        'protective light. Each link is inscribed with ancient protective runes ' +
        'that ward against shadow magic. The chain feels warm to the touch and ' +
        'pulses gently with defensive energy.',
      canBeCarried: true,
    })
  }

  /** The chain's welcome when it is picked up. */
  override pickedUp(_gameState: GameState): string {
    return event(
      "As you lift the Guardian's Chain, you feel a surge of protective " +
        "energy coursing through your body. The chain's light grows brighter, " +
        'recognizing you as its new bearer.',
    )
  }

  /** Activate the chain's protective properties. */
  override use(gameState: GameState): string {
    if (gameState.currentRoom instanceof HallOfEchoes) {
      if (!gameState.getStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED)) {
        gameState.setStoryFlag(FLAG_ACT4_GUARDIANS_CHAIN_RAISED, true)
        return event(
          "You hold the Guardian's Chain aloft, and its crystals blaze " +
            'with brilliant light. A protective barrier forms around you, ' +
            'shielding you from the despair that emanates from the corrupted ' +
            'knight.',
        )
      }
      return "[dim]The Guardian's Chain is already providing its protection.[/dim]"
    }
    return event(
      "The Guardian's Chain glows softly, ready to protect you when " +
        'facing shadow magic.',
    )
  }
}
