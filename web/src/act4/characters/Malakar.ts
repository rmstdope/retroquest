import { Character, type GameState, dialogue, event } from '@/engine'
import {
  FLAG_ACT4_ELIXIR_ON_KING,
  FLAG_ACT4_ELIXIR_ON_MALAKAR,
  FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED,
  FLAG_ACT4_THRONE_AMULET_OPENED,
  FLAG_ACT4_THRONE_OFFER_HEARD,
  FLAG_ACT4_THRONE_REFRAIN_SAID,
} from '../Act4StoryFlags'
import { AncientAmulet } from '../items/AncientAmulet'
import { LifelightElixir } from '../items/LifelightElixir'
import {
  THRONE_CHAMBER_AMULET,
  THRONE_CHAMBER_HEALED,
} from '../rooms/throneDescriptions'

/** The speaker label of the dream voice, as in the Memory Vault. */
const SHADOW_LABEL = 'Shadow of the Past'

/** The words that are the refrain, when said in full. */
const REFRAIN_LINE = 'power follows purpose; purpose follows truth'

/**
 * Malakar in the Throne Chamber: tired and pleading, a grieving friend. He
 * plays the climax scene in three strictly ordered steps (his offer, the
 * refrain, the open amulet) and then takes the Lifelight Elixir if Elior
 * offers it. His state is all story flags, so saves return it exactly.
 */
export class Malakar extends Character {
  constructor() {
    super({
      name: 'Malakar',
      description:
        "A tall man in a grey robe that was once a Warden's blue. His hair " +
        'is white, though he cannot be much older than your father would ' +
        'have been. He leans on the throne as if it is the only thing ' +
        'holding him up.',
    })
  }

  /** His look. */
  override examine(_gameState: GameState): string {
    return event(this.description)
  }

  /** What he says follows the refrain, the amulet and the elixir. */
  override talkTo(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR)) {
      return dialogue(
        this.name,
        'It does not hurt. For the first time in years, it does not hurt.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)) {
      return dialogue(
        this.name,
        'You chose the king. Of course you did. So would they.',
      )
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return '[dim]Malakar does not answer. He is staring at the open amulet.[/dim]'
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return dialogue(this.name, 'Then show me what they left you.')
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD)) {
      return dialogue(
        this.name,
        'Please, Elior. The amulet, and they come home.',
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD, true)
    return dialogue(
      this.name,
      "Aren's son. You have their eyes, both of them. You have seen the " +
        'vault, so you know I loved them. Then help me, Elior. Give me the ' +
        'amulet and I will bring them back, and I will tell you everything: ' +
        'what they were like, what they sang over your cradle. Stand with ' +
        'me. Please.',
    )
  }

  /** The refrain is the refusal; any other word only gets a dim answer. */
  override sayTo(gameState: GameState, words: string): string {
    const word = words
      .trim()
      .replace(/^['"“]|['"”.!]+$/g, '')
      .toLowerCase()
    if (word !== 'refrain' && word !== REFRAIN_LINE) {
      return this.otherWords(gameState)
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return '[dim]You have said it. Malakar heard.[/dim]'
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_OFFER_HEARD, true)
    gameState.setStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID, true)
    return [
      event(
        '“Power follows purpose; purpose follows truth,” you say. The ' +
          "words from the stone in Willowbrook, from Nyx, from the Dragon's " +
          'hall. They are yours now.',
      ),
      dialogue(
        this.name,
        'We carved those words together, your father and I. I had ' +
          'forgotten them.',
      ),
    ].join('\n')
  }

  /** What he answers to words that are not the refrain. */
  private otherWords(gameState: GameState): string {
    if (this.choiceMade(gameState)) {
      return '[dim]Malakar listens, but words are not what he needs now.[/dim]'
    }
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return '[dim]Malakar does not answer. He is staring at the open amulet.[/dim]'
    }
    return '[dim]Malakar only waits for your answer.[/dim]'
  }

  /** Whether the elixir has been used, on anyone. */
  private choiceMade(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR) ||
      gameState.getStoryFlag(FLAG_ACT4_ELIXIR_ON_KING)
    )
  }

  /** The Lifelight Elixir offered to him by hand: the same as using it on him. */
  override giveItem(
    gameState: GameState,
    item: Parameters<Character['giveItem']>[1],
  ): string {
    if (item instanceof LifelightElixir) return this.receiveElixir(gameState)
    if (item instanceof AncientAmulet) return this.otherWords(gameState)
    return super.giveItem(gameState, item)
  }

  /**
   * The Ancient Amulet used here: the third step of the scene. Fails before
   * the refrain, and afterwards only a dim line.
   */
  openAmulet(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) {
      return '[dim]The amulet is already open, its light filling the chamber.[/dim]'
    }
    if (!gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return (
        '[failure]The amulet is cold. Malakar is still waiting for your ' +
        'answer.[/failure]'
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED, true)
    gameState.currentRoom.description = THRONE_CHAMBER_AMULET
    return [
      event(
        'You raise the amulet. It opens in your hand like a flower, and ' +
          'the light of the ward pours out over the chamber. Malakar ' +
          'staggers. When he speaks again, it is not his voice.',
      ),
      dialogue(
        SHADOW_LABEL,
        'Elior. I tore the world to keep them, and I lost them anyway. ' +
          'Finish what I could not.',
      ),
      event(
        'The Lifelight Elixir is warm in your hand. It can be used only ' +
          'once. It could break the crystal and free the king, or it could ' +
          'be offered to Malakar, to heal the wound that is killing him.',
      ),
    ].join('\n')
  }

  /**
   * Why the elixir cannot be used yet, or null once the amulet is open (the
   * choice is then open, and only its targets are accepted).
   */
  elixirRefusal(gameState: GameState): string | null {
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_AMULET_OPENED)) return null
    if (gameState.getStoryFlag(FLAG_ACT4_THRONE_REFRAIN_SAID)) {
      return '[failure]Not yet. The amulet at your chest is stirring.[/failure]'
    }
    return '[failure]Not yet. Malakar is still waiting for your answer.[/failure]'
  }

  /** Malakar drinks the elixir: the grey leaves him and the wound waits. */
  receiveElixir(gameState: GameState): string {
    const refusal = this.elixirRefusal(gameState)
    if (refusal) return refusal
    gameState.setStoryFlag(FLAG_ACT4_ELIXIR_ON_MALAKAR, true)
    gameState.setStoryFlag(FLAG_ACT4_LIFELIGHT_ELIXIR_CONSUMED, true)
    gameState.removeItemFromInventoryOrRoom('Lifelight Elixir', 1)
    gameState.currentRoom.description = THRONE_CHAMBER_HEALED
    return [
      event(
        "You kneel and hold the elixir to Malakar's lips. He drinks. The " +
          'grey goes out of his face, and for a moment he is the young man ' +
          'at the workbench again. The wound flickers, and waits.',
      ),
      event('The Lifelight Elixir is gone.'),
    ].join('\n')
  }
}
