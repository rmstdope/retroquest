import { Character, type GameState, type Item } from '@/engine'
import { ShinyRing } from '../items/ShinyRing'
import { WanderingBoots } from '../items/WanderingBoots'

/** Traveling merchant NPC who trades valuables for useful gear. */
export class Merchant extends Character {
  /** Track if boots have been given. */
  bootsGiven = false

  constructor() {
    super({
      name: 'merchant',
      description:
        'A traveling merchant with a cart full of wares and stories from ' +
        'distant lands. Always ready to trade or offer travel advice.',
    })
  }

  /** Dialogue when the player speaks to the merchant. */
  override talkTo(_gameState: GameState): string {
    // Use bootsGiven flag instead of checking inventory
    const eventMsg =
      '[event]You speak with the [character_name]' +
      this.name +
      '[/character_name].[/event]'
    if (!this.bootsGiven) {
      return (
        eventMsg +
        '\n' +
        '[dialogue]The [character_name]' +
        this.name +
        "[/character_name] offers a friendly nod. 'Looking for something " +
        'specific, or just browsing? If you have any fine jewelry, especially ' +
        "a [item_name]shiny ring[/item_name], I'm ready to exchange it for a " +
        "pair of sturdy [item_name]wandering boots[/item_name].'[/dialogue]"
      )
    }
    return (
      eventMsg +
      '\n' +
      '[dialogue]The [character_name]' +
      this.name +
      "[/character_name] grins. 'Those [item_name]boots[/item_name] should " +
      'serve you well on the road ahead! Let me know if you find anything ' +
      "else of value.'[/dialogue]"
    )
  }

  /** Handle items offered to the merchant and perform trades or gifts. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof ShinyRing) {
      gameState.removeItemFromInventory(item.name)
      const boots = new WanderingBoots()
      gameState.addItemToInventory(boots)
      this.bootsGiven = true // Set flag when boots are given
      const eventMsg =
        '[event]You give the [item_name]' +
        item.name +
        '[/item_name] to the [character_name]' +
        this.name +
        '[/character_name].[/event]'
      return (
        eventMsg +
        '\n' +
        'The [character_name]' +
        this.name +
        "[/character_name]'s eyes widen as you hand over the [item_name]" +
        item.name +
        "[/item_name]. [dialogue]'A fine piece! As promised, here are the [item_name]" +
        boots.name +
        "[/item_name]. They'll serve you well on the road to Greendale.'[/dialogue]" +
        '\n\n' +
        '[event]You receive a pair of [item_name]' +
        boots.name +
        '[/item_name]![/event]'
      )
    }
    const eventMsg =
      '[event]You offer the [item_name]' +
      item.name +
      '[/item_name] to the [character_name]' +
      this.name +
      '[/character_name].[/event]'
    return (
      eventMsg +
      '\n' +
      '[dialogue]The [character_name]' +
      this.name +
      '[/character_name] examines the [item_name]' +
      item.name +
      "[/item_name] but shakes his head. 'Not interested in that, friend.'[/dialogue]"
    )
  }
}
