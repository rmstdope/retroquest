import {
  Character,
  type GameState,
  type Item,
  characterName,
  clue,
  remembered,
  speech,
  dialogue,
  type NameOptions,
} from '@/engine'
import {
  FLAG_HELPED_ELDERLY_RESIDENTS,
  FLAG_WREN_FLOWER_GIVEN,
  VIRTUE_SELFLESS,
} from '../Act2StoryFlags'
import { WalkingStick } from '../items/WalkingStick'
import { MountainFlower } from '../items/MountainFlower'
import { HealingHerbs } from '../items/HealingHerbs'

/**
 * Collective NPC representing local families; grants rewards for civic help.
 *
 * Friendly dialogue requires FLAG_HELPED_ELDERLY_RESIDENTS (earned by giving a
 * WalkingStick). The first friendly conversation grants HealingHerbs once.
 * Every friendly talk then mentions the grey garden plots (the blight), and ends
 * with the line about little Wren until she has a MountainFlower: giving it is
 * the optional selfless moment, recorded once.
 */
export class Families extends Character {
  healingHerbsGiven = false

  /** Named by what they are, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  /** Several of them, so the default replies take plural verbs. */
  override isPlural(): boolean {
    return true
  }

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
      return clue(
        'The ' +
          characterName(this.name) +
          ' seem busy with their own affairs and no one seems to want to ' +
          'talk to you. They give you polite but distant nods, clearly not ' +
          'interested in conversation with a stranger.',
      )
    }

    let response = dialogue(
      this.name,
      "Welcome to our neighborhood! It's lovely to meet someone who " +
        'takes time to help others. Greendale has a rich history - our ' +
        'families have been here for generations. The city has always been ' +
        'a place where those with good hearts and magical talents find a ' +
        "home. We're grateful for folks like you who lend a hand to those " +
        'in need.',
    )

    // Give healing herbs on first conversation after helping elderly residents
    if (!this.healingHerbsGiven) {
      this.healingHerbsGiven = true
      const herbs = new HealingHerbs()
      gameState.addItemToInventory(herbs)
      response +=
        '\n\n' +
        'An elderly woman from one of the ' +
        characterName(this.name) +
        ' approaches you with a warm smile. ' +
        speech('Here, dear,') +
        ' she says, pressing a bundle into your hands. ' +
        speech(
          'These are rare healing herbs that have been in our family for ' +
            'generations. Someone who helps others as you do should have them.',
        ) +
        ` You receive [item_name]${herbs.name}[/item_name]!` +
        '\n\n' +
        dialogue(
          this.name,
          'Master Lyria up the lane has been asking all week for herbs like ' +
            "these. If you've no use for them yourself, she would.",
        )
    }

    response +=
      '\n\n' +
      dialogue(
        this.name,
        'Our garden plots have gone grey this year. Beans, cabbages, the lot: ' +
          'they come up green and then simply give up. Old Hettie says it is ' +
          'the soil, but none of us has ever seen soil do that.',
      )

    if (!gameState.getStoryFlag(FLAG_WREN_FLOWER_GIVEN)) {
      response +=
        '\n\n' +
        dialogue(
          this.name,
          'Little Wren at the end house has been abed with fever all week. ' +
            'She keeps asking for the purple flowers that grow up on the ' +
            'mountain path. None of us can manage that climb any more.',
        )
    }

    return response
  }

  /**
   * Handle giving items to the Families: the walking stick helps the elders,
   * the mountain flower goes to Wren (selfless, recorded once), anything else
   * gets the default reply. Of the flower, strangers get only a polite nod.
   */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof MountainFlower) {
      return this.giveFlower(gameState, item)
    }
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

  /** The flower for Wren: reaction, thanks and the remembered line. */
  private giveFlower(gameState: GameState, flower: Item): string {
    if (!gameState.getStoryFlag(FLAG_HELPED_ELDERLY_RESIDENTS)) {
      return (
        `The ${characterName(this.name)} give you polite but distant nods. ` +
        'Nobody seems to know what a stranger wants with them, or with a ' +
        'flower.'
      )
    }
    if (gameState.getStoryFlag(FLAG_WREN_FLOWER_GIVEN)) {
      return super.giveItem(gameState, flower)
    }
    gameState.removeItemFromInventory(flower.name)
    gameState.setStoryFlag(FLAG_WREN_FLOWER_GIVEN, true)
    gameState.addVirtue(VIRTUE_SELFLESS)
    return (
      'A mother carries the flower down the lane to the end house. A little ' +
      'later a thin face appears at the window, holding it up to the light.' +
      '\n' +
      dialogue(
        this.name,
        "She's smiling. First time in a week. It's only a flower, and she " +
          'knows it, but it came from the mountain and someone thought of ' +
          'her. Thank you, truly.',
      ) +
      '\n' +
      remembered('Selflessness')
    )
  }
}
