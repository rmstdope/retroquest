import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
  attributeSpeech,
} from '@/engine'
import {
  FLAG_BLACKSMITH_MET,
  FLAG_BLACKSMITH_SHARPENED_KNIFE,
  FLAG_DEER_CAN_BE_OBSERVED,
  FLAG_MAGIC_FULLY_UNLOCKED,
} from '../Act1StoryFlags'
import { Coin } from '../items/Coin'
import { DullKnife } from '../items/DullKnife'
import { SharpKnife } from '../items/SharpKnife'
import { MillstoneFragment } from '../items/MillstoneFragment'
import { RuneToken } from '../items/RuneToken'
import { Deer } from './Deer'

/** Blacksmith NPC who forges tools, sharpens blades, and shares village lore. */
export class Blacksmith extends Character {
  /**
   * How many times Borin has picked a line from those that fit Elior's
   * journey so far; he rotates through them. Absent in older saves.
   */
  contextLinesSpoken?: number
  /**
   * How many lines fitted when he last picked one; when more fit now, he
   * starts over with the newest. Absent in older saves.
   */
  contextLinesKnown?: number

  constructor() {
    super({
      name: 'blacksmith',
      description:
        'A burly, skilled craftsman who forges tools and weapons for the ' +
        'village. He is always ready to offer advice or sharpen a blade.',
    })
  }

  /** Dialogue when the player talks to the blacksmith; varies by story flags. */
  /** Talks as before, with the speaker labelled now that no command line names them. */
  override talkTo(gameState: GameState): string {
    return attributeSpeech(this.name, this.talkAnswer(gameState))
  }

  /** What the blacksmith answers when spoken to, before the speaker is labelled. */
  private talkAnswer(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_BLACKSMITH_MET)) {
      const lines = this.contextLines(gameState)
      if (lines.length === 0) {
        return speech(
          `Welcome back, young ${characterName('Elior')}. ` +
            'Need something else?',
        )
      }
      const spoken =
        lines.length > (this.contextLinesKnown ?? 0)
          ? 0
          : (this.contextLinesSpoken ?? 0)
      this.contextLinesKnown = lines.length
      this.contextLinesSpoken = spoken + 1
      return speech(lines[spoken % lines.length])
    }

    gameState.setStoryFlag(FLAG_BLACKSMITH_MET, true)
    return speech(
      `Well met, young one. I am ${characterName('Borin')}, the village ` +
        `${characterName(this.name)}. If you need tools ` +
        "made or mended, I'm your man. A sharp blade can be a good friend.",
    )
  }

  /**
   * The lines that fit what Elior has done so far, newest first: after he
   * has learned magic for real, after he has seen the deer, after Borin
   * sharpened his knife.
   */
  private contextLines(gameState: GameState): string[] {
    const lines: string[] = []
    if (gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      lines.push(
        `Magic, eh? Word gets round, young ${characterName('Elior')}. ` +
          "Can't hammer that into shape, but I'd wager it wants the same " +
          'as iron: patience, and a steady hand.',
      )
    }
    const glade = gameState.allRooms.HiddenGlade
    if (glade?.characters.some((character) => character instanceof Deer)) {
      lines.push(
        `Saw it, did you? The ${characterName('deer')}? ` +
          `My grandfather swore by that ${characterName('deer')}. ` +
          'Said it only shows itself to ' +
          'them as the land has need of.',
      )
    }
    if (
      gameState.getStoryFlag(FLAG_BLACKSMITH_SHARPENED_KNIFE) ||
      gameState.inventory.some((item) => item instanceof SharpKnife)
    ) {
      lines.push(
        'How is that blade holding up? Keep that edge oiled, mind, ' +
          'or the damp will have it dull again before you know it.',
      )
    }
    return lines
  }

  /** What Borin makes of the black-iron rune token; he hands it back. */
  private readRuneToken(): string {
    return (
      `The ${characterName(this.name)} weighs the token in his palm, then ` +
      'frowns and rubs his thumb over the rune. ' +
      speech(
        "Cold iron. Stays cold, too, however long you hold it. That's no " +
          'village work. This was not forged by any honest smith, lad; ' +
          "somebody beat a curse into it. I'd not keep it near my heart.",
      ) +
      '\nHe hands it back to you, and wipes his hand on his apron.'
    )
  }

  /** Handle items offered to the blacksmith and perform exchanges. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof Coin || item instanceof DullKnife) {
      // Check for "knife (dull)" in inventory
      const dullKnifeInstance = gameState.getItem('dull knife')
      const coinInstance = gameState.getItem('coin')
      if (dullKnifeInstance && coinInstance) {
        // Remove coin from inventory
        gameState.removeItemFromInventory(item.name)
        // Remove the dull knife from inventory
        gameState.removeItemFromInventory(dullKnifeInstance.name)
        // Add a new sharp knife to inventory
        gameState.addItemToInventory(new SharpKnife())
        gameState.setStoryFlag(FLAG_BLACKSMITH_SHARPENED_KNIFE, true)

        return (
          `The ${characterName(this.name)} takes your ` +
          `[item_name]${item.name}[/item_name] and your ` +
          `[item_name]${dullKnifeInstance.name}[/item_name]. He ` +
          'expertly sharpens it on his whetstone and hands you back a ' +
          'gleaming [item_name]sharp knife[/item_name]!'
        )
      }
      return (
        `The ${characterName(this.name)} eyes the ` +
        `[item_name]${item.name}[/item_name]. ` +
        speech(
          'Thanks for the offer, but I can only sharpen a ' +
            "[item_name]dull knife[/item_name] for ye if you have one—and you'll " +
            'need to pay me a coin for the service.',
        )
      )
    } else if (item instanceof RuneToken) {
      return this.readRuneToken()
    } else if (item instanceof MillstoneFragment) {
      gameState.removeItemFromInventory(item.name)
      // Optionally, set a story flag if needed
      gameState.setStoryFlag(FLAG_DEER_CAN_BE_OBSERVED, true)

      return (
        `The ${characterName(this.name)} takes the ` +
        `[item_name]${item.name}[/item_name], turning it over in ` +
        'his calloused hands. ' +
        speech(
          'Aye, this is from the old mill, alright. Sturdy stone. ' +
            'You know, old tales say the mill was built on a place of ancient ' +
            `power. Some say a magical ${characterName('deer')} sometimes ` +
            'appears in the Hidden ' +
            'Glade, but only when all is calm and restful—no voices, no ' +
            'footsteps, just the hush of the wind and the song of the stream. ' +
            `If you seek the ${characterName('deer')}, go there and sit ` +
            'quiet a while; have a rest, and let it come to you. It will not ' +
            'show itself to those who rush or bring trouble.',
        )
      )
    }

    return (
      `The ${characterName(this.name)} looks at the ` +
      `[item_name]${item.name}[/item_name]. ` +
      speech("I don't have a use for this, lad.")
    )
  }
}
