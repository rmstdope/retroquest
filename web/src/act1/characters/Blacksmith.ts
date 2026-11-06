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
      name: Blacksmith.NAME,
      description: Blacksmith.DESCRIPTION,
    })
  }

  private static readonly NAME = 'Borin'
  private static readonly DESCRIPTION =
    `${characterName(Blacksmith.NAME)}, the village smith: forearms like fence ` +
    'posts and an old burn on every knuckle. He talks while he works, ' +
    "and he doesn't stop working."

  /**
   * Bring a smith from a save made before he was named up to date: he is
   * Borin now. Safe to run more than once.
   */
  migrateLegacyName(): void {
    this.name = Blacksmith.NAME
    this.description = Blacksmith.DESCRIPTION
  }

  /** He answers to his name, Borin, and still to blacksmith. */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'blacksmith'
  }

  /** Dialogue when the player talks to the blacksmith; varies by story flags. */
  override talkTo(gameState: GameState): string {
    return attributeSpeech(this.name, this.talkAnswer(gameState))
  }

  /** What the blacksmith answers when spoken to, before the speaker is labelled. */
  private talkAnswer(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_BLACKSMITH_MET)) {
      const lines = this.contextLines(gameState)
      if (lines.length === 0) {
        return speech("Back again, lad? Forge is hot. What've you got for me?")
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
    return (
      speech('Mind the sparks, lad.') +
      " He doesn't stop hammering. " +
      speech(
        'Not seen you down here since the harvest. Still the same work: ' +
          "I make what this village breaks, and I mend what it won't throw " +
          'away. Got anything with an edge gone soft? Bring it here.',
      )
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
      `${characterName(this.name)} weighs the token in his palm, then ` +
      'frowns and rubs his thumb over the rune. ' +
      speech(
        "Cold iron. Stays cold, too, however long you hold it. That's no " +
          'village work. This was not forged by any honest smith, lad; ' +
          "somebody beat a curse into it. I'd not keep it near my heart.",
      ) +
      '\nHe hands it back to you, and wipes his hand on his apron.'
    )
  }

  /**
   * Handle items offered to the blacksmith and perform exchanges. The knife
   * trade needs the coin and the dull knife both carried and reads the same
   * whichever one is handed over; a knife without a coin gets its own refusal.
   * Handing him anything counts as meeting him, so a later talk never greets
   * Elior as unseen since the harvest.
   */
  override giveItem(gameState: GameState, item: Item): string {
    gameState.setStoryFlag(FLAG_BLACKSMITH_MET, true)
    if (item instanceof Coin || item instanceof DullKnife) {
      // The trade needs both items in hand, whichever one was offered.
      const coinInstance = gameState.inventory.find(
        (carried) => carried instanceof Coin,
      )
      const dullKnifeInstance = gameState.inventory.find(
        (carried) => carried instanceof DullKnife,
      )
      if (dullKnifeInstance && coinInstance) {
        gameState.removeItemFromInventory(coinInstance.name)
        gameState.removeItemFromInventory(dullKnifeInstance.name)
        gameState.addItemToInventory(new SharpKnife())
        gameState.setStoryFlag(FLAG_BLACKSMITH_SHARPENED_KNIFE, true)

        return (
          `${characterName(this.name)} pockets the ` +
          `[item_name]${coinInstance.name}[/item_name] and puts the ` +
          `[item_name]${dullKnifeInstance.name}[/item_name] to the ` +
          'whetstone. It sings for a minute. He tests the edge on his ' +
          'thumbnail before he hands it back.\n' +
          'You receive a [item_name]sharp knife[/item_name].'
        )
      }
      if (item instanceof DullKnife) {
        return (
          `${characterName(this.name)} eyes the ` +
          `[item_name]${item.name}[/item_name]. ` +
          speech(
            'That edge has seen better days. ' +
              "I'll put it right for you, lad, but it'll cost a " +
              "[item_name]coin[/item_name]. Whetstones don't grow on trees.",
          )
        )
      }
      return (
        `${characterName(this.name)} eyes the ` +
        `[item_name]${item.name}[/item_name]. ` +
        speech(
          "A coin's no use to me without something to put an edge on, " +
            'lad. Bring the [item_name]dull knife[/item_name] as well.',
        )
      )
    } else if (item instanceof RuneToken) {
      return this.readRuneToken()
    } else if (item instanceof MillstoneFragment) {
      gameState.removeItemFromInventory(item.name)
      // Optionally, set a story flag if needed
      gameState.setStoryFlag(FLAG_DEER_CAN_BE_OBSERVED, true)

      return (
        `${characterName(this.name)} takes the ` +
        `[item_name]${item.name}[/item_name] and turns it over in ` +
        'his calloused hands. ' +
        speech(
          'From the old mill, that. Good stone. My grandfather said they ' +
            "built the mill where they did for a reason. The ground there's " +
            'older than the village.',
        ) +
        '\nHe sets it on the bench. ' +
        speech(
          `He told me something else, too. There's a ${characterName('deer')} ` +
            'in the [room_name]Hidden Glade[/room_name] that comes to folk ' +
            'who keep still. Not to hunters. Not to talkers. You go there, ' +
            "sit down, rest a while, and stop looking for it. That's when it " +
            'comes.',
        )
      )
    }

    return (
      `${characterName(this.name)} gives it a glance and hands it back. ` +
      speech("Can't melt it, can't mend it. No use to me, lad.")
    )
  }

  /** The two answers to a word with no particular reply, given in turn. */
  protected override unknownWordAnswers(): readonly string[] {
    return [
      `${this.nameInSentence({ atStart: true })} doesn't stop hammering. ` +
        speech(
          "Can't hear a word over this, lad. If it's got an edge, bring it here.",
        ),
      `${this.nameInSentence({ atStart: true })} lowers the hammer for a moment. ` +
        speech("Words aren't my trade, lad. Iron is."),
    ]
  }
}
