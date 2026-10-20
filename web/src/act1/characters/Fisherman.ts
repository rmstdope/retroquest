import { Character, type GameState, type Item } from '@/engine'
import { Fish } from '../items/Fish'
import { PurifySpell } from '../spells/PurifySpell'

/** Fisherman NPC who teaches fishing basics and can accept fish. */
export class Fisherman extends Character {
  knowsFishingBasics = false
  receivedFish = false
  dialogueStates: Record<string, string> = {
    initial:
      '[dialogue]The [character_name]fisherman[/character_name] nods at you. ' +
      "'The river's been a bit strange lately. Not many fish biting, and " +
      "my arm... well, it's seen better days. Oh, I wish I could pull up " +
      "a pike or two!'[/dialogue]",
    taught_fishing:
      "[dialogue]The [character_name]fisherman[/character_name] smiles. 'Good " +
      "to see you trying your luck with the rod. Any luck yet?'[/dialogue]",
    received_fish_thanks:
      "The [character_name]fisherman[/character_name]'s eyes light " +
      "up. [dialogue]'Ah, a fine catch! Thank you kindly. It's been a while since " +
      "I've had a fresh river fish.'[/dialogue]",
    taught_spells:
      '[dialogue]The [character_name]fisherman[/character_name] looks out ' +
      "over the water. 'The river has many moods. Treat it with respect, " +
      "and it might share its secrets with you.'[/dialogue]",
  }
  currentDialogueKey = 'initial'

  constructor() {
    super({
      name: 'fisherman',
      description:
        'A weathered old man who spends his days by the riverbank, ' +
        'fishing and humming quiet tunes. He knows much about the river ' +
        'and its secrets.',
    })
  }

  /** Handle talking to the fisherman and teach fishing basics if eligible. */
  override talkTo(gameState: GameState): string {
    // Set the story flag that the player has talked to the fisherman
    gameState.setStoryFlag('talked_to_fisherman', true)
    // Check if player has a fishing rod in the inventory
    const playerHasRod = gameState.hasItem('fishing rod')

    if (this.currentDialogueKey === 'initial') {
      if (playerHasRod && !gameState.getStoryFlag('learned_fishing_basics')) {
        gameState.setStoryFlag('learned_fishing_basics', true)
        this.knowsFishingBasics = true
        this.currentDialogueKey = 'taught_fishing'
        return (
          'The [character_name]fisherman[/character_name] notices ' +
          'your [item_name]fishing rod[/item_name]. ' +
          "[dialogue]'Ah, a fellow angler! " +
          "My arm's busted, can't fish myself. But I can tell you a thing " +
          "or two. Cast your line near the reeds, that's where they like " +
          "to hide. Patience is key, my friend, patience.'[/dialogue]\n" +
          'He teaches you the basics of fishing.'
        )
      } else if (gameState.getStoryFlag('learned_fishing_basics')) {
        // If already taught, but currentDialogueKey is still initial, switch
        // to taught_fishing so the dialogue falls through below.
        this.currentDialogueKey = 'taught_fishing'
      } else {
        return this.dialogueStates.initial
      }
    }

    const eventMsg =
      '[event]You speak with the [character_name]' +
      this.name +
      '[/character_name].[/event]'
    return eventMsg + '\n' + this.dialogueStates[this.currentDialogueKey]
  }

  /** Handle items offered to the fisherman and teach spells if appropriate. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof Fish && !this.receivedFish) {
      this.receivedFish = true
      gameState.removeItemFromInventory(item.name)
      // Teach spell
      gameState.learnSpell(new PurifySpell())
      this.currentDialogueKey = 'taught_spells'
      const eventMsg =
        '[event]You give the [item_name]' +
        item.name +
        '[/item_name] to the [character_name]Fisherman[/character_name].[/event]'
      return (
        eventMsg +
        '\n' +
        this.dialogueStates.received_fish_thanks +
        ' ' +
        "[dialogue]'The river's water... it's not been right. Murky. " +
        'But I sense you have a connection to the old ways. Let me ' +
        'teach you something to help. With this, you can cleanse ' +
        "water,'[/dialogue] " +
        '\n' +
        'You have learned [spell_name]purify[/spell_name]!'
      )
    } else if (item instanceof Fish && this.receivedFish) {
      const eventMsg =
        '[event]You offer the [item_name]' +
        item.name +
        '[/item_name] to the [character_name]Fisherman[/character_name].[/event]'
      return (
        eventMsg +
        '\n' +
        '[dialogue]The [character_name]fisherman[/character_name] smiles. ' +
        "'Thank you, but I've already eaten. Save it for yourself!'" +
        '[/dialogue]'
      )
    }

    const eventMsg =
      '[event]You offer the [item_name]' +
      item.name +
      '[/item_name] to the [character_name]Fisherman[/character_name].[/event]'
    return (
      eventMsg +
      '\n' +
      'The [character_name]fisherman[/character_name] looks at the ' +
      '[item_name]' +
      item.name +
      "[/item_name] curiously but doesn't seem to need it."
    )
  }
}
