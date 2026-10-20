import {
  Character,
  type GameState,
  type Item,
  event,
  characterName,
  speech,
} from '@/engine'
import {
  FLAG_BLACKSMITH_MET,
  FLAG_DEER_CAN_BE_OBSERVED,
} from '../Act1StoryFlags'
import { Coin } from '../items/Coin'
import { DullKnife } from '../items/DullKnife'
import { SharpKnife } from '../items/SharpKnife'
import { MillstoneFragment } from '../items/MillstoneFragment'

/** Blacksmith NPC who forges tools, sharpens blades, and shares village lore. */
export class Blacksmith extends Character {
  constructor() {
    super({
      name: 'blacksmith',
      description:
        'A burly, skilled craftsman who forges tools and weapons for the ' +
        'village. He is always ready to offer advice or sharpen a blade.',
    })
  }

  /** Dialogue when the player talks to the blacksmith; varies by story flags. */
  override talkTo(gameState: GameState): string {
    const eventMsg = event(`You speak with the ${characterName(this.name)}.`)

    if (gameState.getStoryFlag(FLAG_BLACKSMITH_MET)) {
      return (
        eventMsg +
        '\n' +
        speech(
          `'Welcome back, young ${characterName('Elior')}. ` +
            "Need something else?'",
        )
      )
    }

    gameState.setStoryFlag(FLAG_BLACKSMITH_MET, true)
    return (
      eventMsg +
      '\n' +
      speech(
        "'Well met, young one. I am Borin, the village " +
          `${characterName(this.name)}. If you need tools ` +
          "made or mended, I'm your man. A sharp blade can be a good friend.'",
      )
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

        const givenMsg = event(
          `You give the [item_name]${item.name}[/item_name] ` +
            `and [item_name]${dullKnifeInstance.name}[/item_name] to the ` +
            `${characterName(this.name)}.`,
        )

        return (
          givenMsg +
          '\n' +
          `The ${characterName(this.name)} takes your ` +
          `[item_name]${item.name}[/item_name] and your ` +
          `[item_name]${dullKnifeInstance.name}[/item_name]. He ` +
          'expertly sharpens it on his whetstone and hands you back a ' +
          'gleaming [item_name]sharp knife[/item_name]!'
        )
      }
      const offerMsg = event(
        `You offer the [item_name]${item.name}[/item_name] to ` +
          `the ${characterName(this.name)}.`,
      )
      return (
        offerMsg +
        '\n' +
        `The ${characterName(this.name)} eyes the ` +
        `[item_name]${item.name}[/item_name]. ` +
        speech(
          "'Thanks for the offer, but I can only sharpen a " +
            "[item_name]dull knife[/item_name] for ye if you have one—and you'll " +
            "need to pay me a coin for the service.'",
        )
      )
    } else if (item instanceof MillstoneFragment) {
      gameState.removeItemFromInventory(item.name)
      // Optionally, set a story flag if needed
      gameState.setStoryFlag(FLAG_DEER_CAN_BE_OBSERVED, true)

      const eventMsg = event(
        `You give the [item_name]${item.name}[/item_name] to ` +
          `the ${characterName(this.name)}.`,
      )

      return (
        eventMsg +
        '\n' +
        `The ${characterName(this.name)} takes the ` +
        `[item_name]${item.name}[/item_name], turning it over in ` +
        'his calloused hands. ' +
        speech(
          "'Aye, this is from the old mill, alright. Sturdy stone. " +
            'You know, old tales say the mill was built on a place of ancient ' +
            'power. Some say a magical deer sometimes appears in the Hidden ' +
            'Glade, but only when all is calm and rest-ful—no voices, no ' +
            'footsteps, just the hush of the wind and the song of the stream. ' +
            'If you seek the deer, remember: it will not show itself to those ' +
            "who rush or bring trouble.'",
        )
      )
    }
    const eventMsg = event(
      `You offer the [item_name]${item.name}[/item_name] to ` +
        `the ${characterName(this.name)}.`,
    )

    return (
      eventMsg +
      '\n' +
      `The ${characterName(this.name)} looks at the ` +
      `[item_name]${item.name}[/item_name]. ` +
      speech("'I don't have a use for this, lad.'")
    )
  }
}
