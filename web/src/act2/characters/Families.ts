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
        "Neighbours on their doorsteps, shelling beans and minding each other's " +
        'children. Most of them were born on this lane, and so were their ' +
        'grandparents.',
    })
  }

  /** Ignore strangers; welcome helpers and hand over herbs on the first visit. */
  override talkTo(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_HELPED_ELDERLY_RESIDENTS)) {
      return clue(
        'The ' +
          characterName(this.name) +
          ' give you polite but distant nods and go on with their work. ' +
          'Behind them an old man inches along the cobbles, one hand flat ' +
          'against the wall.',
      )
    }

    let response = dialogue(
      this.name,
      "You're the one who helped the old folk over the cobbles. Sit a " +
        'moment, if you like. Nobody on this lane forgets a kindness.',
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
        ' comes over, wiping her hands. ' +
        speech('Here, dear,') +
        ' she says, pressing a bundle into your hands. ' +
        speech(
          "From my mother's garden, and hers before that. The grey hasn't " +
            'reached that bed yet.',
        ) +
        ` You receive [item_name]${herbs.name}[/item_name].` +
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
        '[success]An old man takes the stick, tries it on the cobbles, and ' +
        'walks the length of the lane without touching the wall. By the time ' +
        'he is back, half the doors on the street are open.[/success]'
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
