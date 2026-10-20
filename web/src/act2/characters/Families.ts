import { Character, type GameState, type Item } from '@/engine'
import { FLAG_HELPED_ELDERLY_RESIDENTS } from '../Act2StoryFlags'
import { WalkingStick } from '../items/WalkingStick'
import { HealingHerbs } from '../items/HealingHerbs'

/**
 * Collective NPC representing local families; grants rewards for civic help.
 *
 * Friendly dialogue requires FLAG_HELPED_ELDERLY_RESIDENTS (earned by giving a
 * WalkingStick). The first friendly conversation grants HealingHerbs once.
 */
export class Families extends Character {
  healingHerbsGiven = false

  constructor() {
    super({
      name: 'families',
      description:
        'Friendly local families who have lived in Greendale for generations. They know ' +
        "the city's history and are happy to share stories with helpful visitors.",
    })
  }

  /** Ignore strangers; welcome helpers and hand over herbs on the first visit. */
  override talkTo(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_HELPED_ELDERLY_RESIDENTS)) {
      return (
        `[failure]The [character_name]${this.name}[/character_name] seem busy ` +
        'with their own affairs and no one seems to want to talk to you. They give ' +
        'you polite but distant nods, clearly not interested in conversation with a ' +
        'stranger.[/failure]'
      )
    }

    let response =
      `[character_name]${this.name}[/character_name]: ` +
      "[dialogue]Welcome to our neighborhood! It's lovely to meet someone who takes " +
      'time to help others. Greendale has a rich ' +
      'history - our families have been here for generations. The city has always been ' +
      "a place where those with good hearts and magical talents find a home. We're " +
      'grateful for folks like you who lend a hand to those in need.[/dialogue]'

    // Give healing herbs on first conversation after helping elderly residents
    if (!this.healingHerbsGiven) {
      this.healingHerbsGiven = true
      const herbs = new HealingHerbs()
      gameState.addItemToInventory(herbs)
      response +=
        '\n\n[event]An elderly woman from one of the ' +
        `[character_name]${this.name}[/character_name] approaches you with a ` +
        "warm smile. [dialogue]'Here, dear,'[/dialogue] she says, pressing a bundle " +
        "into your hands. [dialogue]'These are rare healing herbs that have been in " +
        'our family for generations. Someone who helps others as you do should have ' +
        "them.'[/dialogue] You receive " +
        `[item_name]${herbs.name}[/item_name]![/event]`
    }

    return response
  }

  /** Handle giving items to the Families. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof WalkingStick) {
      // Remove the walking stick from inventory and help elderly residents
      gameState.removeItemFromInventory(item.name)
      gameState.setStoryFlag(FLAG_HELPED_ELDERLY_RESIDENTS, true)
      return (
        '[success]You use your walking stick to help several elderly residents ' +
        'navigate the uneven cobblestones and carry their heavy loads. Your ' +
        'assistance is greatly appreciated, and the community takes note of your ' +
        'kind and helpful nature. Word spreads that you are someone who cares ' +
        'about others.[/success]'
      )
    } else {
      // For all other items, use the default behavior
      return super.giveItem(gameState, item)
    }
  }
}
