import { Character, type GameState, type Item } from '@/engine'
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
  dialogueStates: Record<string, string>

  constructor() {
    super({
      name: 'Mira',
      description:
        'The village healer and wise woman, Mira is known for her knowledge ' +
        'of herbs and magic. She guides Elior on his journey.',
    })
    this.dialogueStates = {
      initial:
        `[character_name]${this.name}[/character_name] smiles warmly as ` +
        "you enter her fragrant hut. [dialogue]'Welcome, " +
        '[character_name]Elior[/character_name]. I sense a stirring of the ' +
        "old powers within you. What brings you to my door?'" +
        '[/dialogue]',
      quest_conditions_not_met:
        `[character_name]${this.name}[/character_name] looks at you ` +
        "thoughtfully. [dialogue]'You have made progress, " +
        '[character_name]Elior[/character_name], but you are not yet fully ' +
        'prepared for what lies ahead. Ensure you have all necessary items, ' +
        'learned the essential spells, and received a blessing for your ' +
        "journey.'[/dialogue]",
      quest_complete_amulet_given:
        `[character_name]${this.name}[/character_name] smiles, a deep ` +
        "wisdom in her eyes. [dialogue]'You have done well, " +
        '[character_name]Elior[/character_name]. You have gathered your ' +
        'supplies, honed your magical skills, and prepared your spirit. ' +
        "You are ready.'[/dialogue] She presents you with the " +
        "[item_name]Ancient Amulet[/item_name]. [dialogue]'May this guide and " +
        "protect you.'[/dialogue] [event]([item_name]Ancient Amulet[/item_name] " +
        'added to inventory!)[/event]',
      post_amulet:
        `[character_name]${this.name}[/character_name] looks at you kindly. ` +
        "[dialogue]'The journey of a thousand miles begins with a single step. You " +
        "have taken many already. Go now, and may your path be clear.'[/dialogue]",
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

      // Combined dialogue for receiving flower, teaching spells, and giving quest.
      return (
        '[character_name]Mira[/character_name] smiles, accepting the ' +
        "[item_name]flower[/item_name]. [dialogue]'This bloom,' she says, her " +
        "voice soft, 'is a testament to your growing bond with the living world, " +
        "Elior. It shows you are ready to truly channel the energies around us.'" +
        '[/dialogue] She then guides you through ancient words and gestures, ' +
        'awakening your innate abilities. [event]You feel a new understanding ' +
        'dawn as she imparts the knowledge of [spell_name]heal[/spell_name] to mend, ' +
        '[spell_name]unlock[/spell_name] to reveal, and [spell_name]light[/spell_name] to ' +
        "illuminate the path.[/event] [dialogue]'The spark was always within " +
        "you,'[/dialogue] [character_name]Mira[/character_name] explains, " +
        "[dialogue]'but now, you can truly command these magics.'[/dialogue] With " +
        'your newfound power, she tasks you with preparing for the journey ahead, ' +
        'mentioning that the [item_name]Ancient Amulet[/item_name] will be yours once ' +
        'you are truly ready. She tells you that you will need:\n' +
        '- Warm clothing\n' +
        '- Magical protection\n' +
        '- Food for the road\n' +
        '- Sturdy footwear\n' +
        '- A [item_name]map[/item_name] to find your way\n' +
        '- To have learned all the basic magic the village elders can teach you.\n' +
        "[dialogue]'Your journey will take you to Greendale,' she continues, her " +
        "tone serious. 'There, you must seek out the old druid who dwells at the " +
        "forest's edge. He alone can teach you the deeper mysteries of nature's magic " +
        'and help you understand the darkness threatening Willowbrook. Trust in ' +
        'yourself, Elior, and remember: the fate of our village, or even more, may ' +
        "rest in your hands.'[/dialogue]"
      )
    }
    return (
      '[character_name]Mira[/character_name] looks at the [item_name]' +
      item.name +
      '[/item_name] but shakes her head gently. ' +
      "[dialogue]'I have no need for this, child.'[/dialogue]"
    )
  }

  /** Dialogue depending on quest progress; hands over the amulet when ready. */
  override talkTo(gameState: GameState): string {
    const eventMsg =
      '[event]You speak with [character_name]Mira[/character_name].[/event]'
    // 1. Give the post_amulet message if amulet is in inventory
    if (gameState.hasItem('Ancient Amulet')) {
      return eventMsg + '\n' + this.dialogueStates.post_amulet
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
          "\nYou describe to Mira the withered crops, the villagers' " +
          'fears, and the foul stench from the well. Her expression grows ' +
          'troubled as she listens. ' +
          "[dialogue]'These are signs of a darkness that has long slumbered " +
          "beneath Willowbrook,'[/dialogue] she says sadly. " +
          "[dialogue]'The land is suffering, and so are its people. But there " +
          'is hope, Elior. You must connect with the living world—listen to ' +
          'the wind, the water, the roots beneath your feet. Only by ' +
          'understanding the magic of nature can you hope to confront what ' +
          "is coming.'[/dialogue]" +
          '\n' +
          "[dialogue]'A rare [item_name]Rare Flower[/item_name] grows in the " +
          '[room_name]Hidden Glade[/room_name]. Seek it out, and pay close ' +
          'attention to the well and the glade; they may hold secrets vital to ' +
          "your quest.'[/dialogue]"
        return eventMsg + '\n' + this.dialogueStates.initial + extra
      }
      return eventMsg + '\n' + this.dialogueStates.initial
    }

    // 3. If 'magic_fully_unlocked' is set (flower given) and player doesn't have amulet:
    //    Quest is active or completable.
    // The quest always exists in Act 1; Python would have raised if it were missing.
    const quest = gameState.getQuest('Preparing for the Road')!
    if (quest.checkCompletion(gameState)) {
      // Conditions are fulfilled: give amulet and quest_complete_amulet_given message
      gameState.addItemToInventory(new AncientAmulet())
      this.amuletGiven = true
      return eventMsg + '\n' + this.dialogueStates.quest_complete_amulet_given
    }
    // Conditions not fulfilled: give quest_conditions_not_met message
    return eventMsg + '\n' + this.dialogueStates.quest_conditions_not_met
  }
}
