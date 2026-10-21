import {
  Character,
  type GameState,
  type Item,
  characterName,
  event,
  remembered,
  speech,
} from '@/engine'
import { FLAG_ACT3_TOBIN_GIVEN_CHARM, VIRTUE_SELFLESS } from '../Act3StoryFlags'
import { QuietCharm } from '../items/QuietCharm'

/** Names the player may use for Tobin. */
const TOBIN_NAMES: readonly string[] = ['tobin', 'young miner', 'boy']

/**
 * The young miner who shouted for help until his voice went and has not
 * spoken since. He answers with narrated silence until the player gives him
 * the Quiet Charm, which quiets the shouting he keeps hearing and gives him
 * back a few words.
 */
export class Tobin extends Character {
  /** How many times the player has talked to him. */
  talks = 0

  constructor() {
    super({
      name: 'Tobin',
      description:
        'A boy of perhaps fifteen sits apart from the others on an upturned ' +
        'bucket, knees drawn up, a cracked lamp in his lap. His throat is ' +
        'wrapped in a strip of torn shirt. He watches the ceiling, not you.',
    })
  }

  /** He answers to "tobin", "young miner" and "boy", however cased. */
  override answersTo(name: string): boolean {
    return TOBIN_NAMES.includes(name.trim().toLowerCase())
  }

  /**
   * Accept the Quiet Charm, once: it leaves the pack, he speaks, his
   * description shows the charm and one selfless moment is recorded. Anything
   * else is declined as usual.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (!(item instanceof QuietCharm)) return super.giveItem(gameState, item)
    gameState.removeItemFromInventory(item.name)
    gameState.setStoryFlag(FLAG_ACT3_TOBIN_GIVEN_CHARM, true)
    gameState.addVirtue(VIRTUE_SELFLESS)
    this.description =
      'A boy of perhaps fifteen sits on an upturned bucket, a cracked lamp in ' +
      'his lap. The pale charm hangs at his throat on a bootlace, over the ' +
      'strip of torn shirt. He watches you now, not the ceiling.'
    return (
      event(
        `You give the [item_name]${item.name}[/item_name] to ${characterName(this.name)}.`,
      ) +
      '\n' +
      `Tobin turns the pale stone over in his fingers. As his hand ` +
      'closes around it, the endless dripping of the gallery seems to step ' +
      'back a pace, and his shoulders come down for the first time since ' +
      'you met him.' +
      '\n' +
      `${characterName(this.name)}: ` +
      speech("'It's quiet.'") +
      ' His voice is a cracked whisper. ' +
      speech(
        "'I could still hear it. Me, shouting. All this time, I could still " +
          "hear it.'",
      ) +
      '\n' +
      'Across the gallery, the lead miner sets down his pick and does not ' +
      'pick it up again.' +
      '\n' +
      remembered('Selflessness')
    )
  }

  /** Narrate his silence: one line each for the first and second talk, a third forever after. */
  override talkTo(gameState: GameState): string {
    this.talks += 1
    if (gameState.getStoryFlag(FLAG_ACT3_TOBIN_GIVEN_CHARM)) {
      return (
        `${characterName(this.name)} touches the charm at his throat: ` +
        speech(
          "'Still quiet. I'll keep it, if that's all right. Just till we're " +
            "up top.'",
        )
      )
    }
    if (this.talks === 1) {
      return event(
        `${characterName(this.name)} looks at you for a long moment. His lips part, then close ` +
          'again. He turns the cracked lamp over in his hands and goes back ' +
          'to watching the ceiling.',
      )
    }
    if (this.talks === 2) {
      return event(
        `${characterName(this.name)} swallows, and you see what it costs him. No sound comes. ` +
          'He shakes his head, once.',
      )
    }
    return event(
      `${characterName(this.name)} does not look up. His thumb traces the crack in the lamp's ` +
        'glass, back and forth.',
    )
  }
}
