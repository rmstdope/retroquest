import {
  Character,
  type GameState,
  type Item,
  event,
  characterName,
  speech,
} from '@/engine'
import { RareFlower } from '../items/RareFlower'
import { AncientAmulet } from '../items/AncientAmulet'
import { HealSpell } from '../spells/HealSpell'
import { UnlockSpell } from '../spells/UnlockSpell'
import { LightSpell } from '../spells/LightSpell'
import {
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_INVESTIGATED_WITHERED_CROPS,
  FLAG_VILLAGER_TALKED_TO,
  FLAG_WELL_EXAMINED,
  FLAG_CONNECT_WITH_NATURE,
} from '../Act1StoryFlags'

/** Village healer and wise woman who teaches spells and guides quests. */
export class Mira extends Character {
  /** Flag set when the rare flower is given to Mira. */
  questPrepareForJourneyGiven = false
  amuletGiven = false

  constructor() {
    super({
      name: 'Mira',
      description:
        `The village healer and wise woman, ${characterName('Mira')} is ` +
        'known for her knowledge of herbs and magic. She guides ' +
        `${characterName('Elior')} on his journey.`,
    })
  }

  /**
   * Mira's lines for each stage of the act. Built on demand rather than kept
   * in a field, so a save always shows the current wording.
   */
  private dialogue(
    stage:
      | 'initial'
      | 'quest_conditions_not_met'
      | 'quest_complete_amulet_given'
      | 'post_amulet',
  ): string {
    switch (stage) {
      case 'initial':
        return (
          `${characterName(this.name)} smiles warmly as ` +
          'you enter her fragrant hut. ' +
          speech(
            `Welcome, ${characterName('Elior')}. I sense a stirring of the ` +
              'old powers within you. What brings you to my door?',
          )
        )
      case 'quest_conditions_not_met':
        return (
          `${characterName(this.name)} looks at you thoughtfully. ` +
          speech(
            `You have made progress, ${characterName('Elior')}, but you are not yet fully ` +
              'prepared for what lies ahead. Ensure you have all necessary items, ' +
              'learned the essential spells, and received a blessing for your ' +
              'journey.',
          )
        )
      case 'quest_complete_amulet_given':
        return (
          `${characterName(this.name)} smiles, a deep wisdom in her eyes. ` +
          speech(
            `You have done well, ${characterName('Elior')}. You have gathered your ` +
              'supplies, honed your magical skills, and prepared your spirit. ' +
              'You are ready.',
          ) +
          '\nShe presents you with the [item_name]Ancient Amulet[/item_name]. ' +
          speech('May this guide and protect you.') +
          ' ' +
          event('([item_name]Ancient Amulet[/item_name] added to inventory!)') +
          '\nShe holds your hand a moment longer, her tone serious. ' +
          speech(
            `Your road leads to Greendale, ${characterName('Elior')}. ` +
              'Once there, show the amulet to no one lightly. ' +
              'Those who know what it is will find you.',
          ) +
          '\n' +
          speech(
            'Trust in yourself, and remember: the fate of our village, ' +
              'or even more, may rest in your hands.',
          )
        )
      case 'post_amulet':
        return (
          `${characterName(this.name)} looks at you kindly. ` +
          speech(
            'The journey of a thousand miles begins with a single step. You ' +
              'have taken many already. Go now, and may your path be clear.',
          )
        )
    }
  }

  /** Accept the rare flower, teach the basic spells and give the journey quest. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof RareFlower) {
      gameState.removeItemFromInventory(item.name)

      const spellsToTeach = [
        new HealSpell(),
        new UnlockSpell(),
        new LightSpell(),
      ]
      for (const spellInstance of spellsToTeach) {
        gameState.learnSpell(spellInstance)
      }

      gameState.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)

      // Short beats: the flower, the teaching, then the road ahead.
      return (
        `${characterName('Mira')} smiles, accepting the ` +
        '[item_name]flower[/item_name]. ' +
        speech('This bloom,') +
        ' she says, her voice soft, ' +
        speech(
          'is a testament to your growing bond with the living world, ' +
            `${characterName('Elior')}. It shows you are ready to truly ` +
            'channel the energies around us.',
        ) +
        '\nShe then guides you through ancient words and gestures, ' +
        'awakening your innate abilities. ' +
        event(
          'You feel a new understanding ' +
            'dawn as she imparts the knowledge of [spell_name]heal[/spell_name] to mend, ' +
            '[spell_name]unlock[/spell_name] to reveal, and [spell_name]light[/spell_name] to ' +
            'illuminate the path.',
        ) +
        '\n' +
        speech('The spark was always within you,') +
        ` ${characterName('Mira')} explains, ` +
        speech('but now, you can truly command these magics.') +
        '\nHer tone turns practical. ' +
        speech(
          'Now prepare for the road. ' +
            "You'll need warmth, protection, food, boots and a [item_name]map[/item_name]. " +
            'And learn all the basic magic the village elders can teach you. ' +
            'When you are truly ready, the [item_name]Ancient Amulet[/item_name] ' +
            'will be yours.',
        )
      )
    }
    return (
      `${characterName('Mira')} looks at the [item_name]` +
      item.name +
      '[/item_name] but shakes her head gently. ' +
      speech('I have no need for this, child.')
    )
  }

  /** Dialogue depending on quest progress; hands over the amulet when ready. */
  override talkTo(gameState: GameState): string {
    const eventMsg = event(`You speak with ${characterName('Mira')}.`)
    // 1. Give the post_amulet message if amulet is in inventory
    if (gameState.hasItem('Ancient Amulet')) {
      return eventMsg + '\n' + this.dialogue('post_amulet')
    }

    // 2. Give the initial message if the story flag 'magic_fully_unlocked' is not set
    //    (i.e., flower hasn't been given yet)
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      // Check if all three story flags are set
      if (
        gameState.getStoryFlag(FLAG_INVESTIGATED_WITHERED_CROPS) &&
        gameState.getStoryFlag(FLAG_VILLAGER_TALKED_TO) &&
        gameState.getStoryFlag(FLAG_WELL_EXAMINED)
      ) {
        gameState.setStoryFlag(FLAG_CONNECT_WITH_NATURE, true)
        const extra =
          `\nYou describe to ${characterName('Mira')} the withered crops, ` +
          "the villagers' " +
          'fears, and the foul stench from the well. Her expression grows ' +
          'troubled as she listens. ' +
          speech(
            'These are signs of a darkness that has long slumbered ' +
              'beneath Willowbrook,',
          ) +
          ' she says sadly. ' +
          speech(
            'The land is suffering, and so are its people. But there ' +
              `is hope, ${characterName('Elior')}. You must` +
              ' connect with the living world—listen to ' +
              'the wind, the water, the roots beneath your feet. Only by ' +
              'understanding the magic of nature can you hope to confront what ' +
              'is coming.',
          ) +
          '\n' +
          speech(
            'A [item_name]Rare Flower[/item_name] grows in the ' +
              '[room_name]Hidden Glade[/room_name]. Seek it out, and pay close ' +
              'attention to the well and the glade; they may hold secrets vital to ' +
              'your quest.',
          )
        return eventMsg + '\n' + this.dialogue('initial') + extra
      }
      return eventMsg + '\n' + this.dialogue('initial')
    }

    // 3. If 'magic_fully_unlocked' is set (flower given) and player doesn't have amulet:
    //    Quest is active or completable.
    // The quest always exists in Act 1; Python would have raised if it were missing.
    const quest = gameState.getQuest('Preparing for the Road')!
    if (quest.checkCompletion(gameState)) {
      // Conditions are fulfilled: give amulet and quest_complete_amulet_given message
      gameState.addItemToInventory(new AncientAmulet())
      this.amuletGiven = true
      return eventMsg + '\n' + this.dialogue('quest_complete_amulet_given')
    }
    // Conditions not fulfilled: give quest_conditions_not_met message
    return eventMsg + '\n' + this.dialogue('quest_conditions_not_met')
  }
}
