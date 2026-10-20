import { Character, type GameState, type Item } from '@/engine'
import { ReviveSpell } from '../spells/ReviveSpell'
import { TravelCloak } from '../items/TravelCloak'
import { WildBerries } from '../items/WildBerries'
import { Locket } from '../items/Locket'
import { FadedPhotograph } from '../items/FadedPhotograph'
import {
  FLAG_READ_PHOTO_MESSAGE,
  FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO,
} from '../Act1StoryFlags'

/** Elior's grandmother: wise elder who guides the player and grants items. */
export class Grandmother extends Character {
  dialogueState: Record<string, boolean> = {
    initial_talk: true,
    given_locket: false,
    given_berries: false,
  }

  constructor() {
    super({
      name: 'grandmother',
      description:
        "Elior's wise and loving grandmother, always ready with advice and a " +
        'gentle smile. She has raised Elior since his parents vanished.',
    })
  }

  /** Dialogue varying by story flags; grants the Revive spell when appropriate. */
  override talkTo(gameState: GameState): string {
    let dialogue = ''
    if (this.dialogueState.initial_talk) {
      dialogue =
        '[dialogue]Oh, [character_name]Elior[/character_name], my dear. The village... ' +
        "it feels a bit on edge lately, doesn't it? \n" +
        'Willowbrook has always been a peaceful place. The [room_name]Village ' +
        'Square[/room_name] is usually bustling, though folks seem more hushed ' +
        'these days. \n' +
        "If you're needing anything, the [room_name]General Store[/room_name] " +
        'usually has a bit of everything. Old Man Hemlock, the ' +
        '[character_name]shopkeeper[/character_name], sees and hears a lot, too.\n' +
        "And if it's wisdom or a remedy you seek, [character_name]Mira[/character_name] " +
        'in her hut to the north of the square is the one to talk to. She has a ' +
        'way with herbs and... other things.\n' +
        'The [character_name]Blacksmith[/character_name] down by the south end, ' +
        "he's a sturdy fellow, always hammering away. Keeps the tools sharp, " +
        'and his spirits, mostly.\n' +
        "Just... be observant, child. There's more to this world than meets the " +
        'eye. And you, [character_name]Elior[/character_name], you have a good heart. ' +
        'Remember that.[/dialogue]'
      this.dialogueState.initial_talk = false // Change state after initial talk
    }

    if (gameState.getStoryFlag('journal_read_prologue_entry')) {
      const addedDialogue =
        '\n[dialogue]That [item_name]journal[/item_name] of yours... your father was ' +
        'a great writer, you know. He wrote of many things, some of which I am ' +
        'only now beginning to understand.\n' +
        'He sensed a darkness, a shadow stretching over Eldoria, long before ' +
        'others did. He believed it was tied to the old tales, to the whispers of ' +
        'forgotten magic.\n' +
        'He even researched a peculiar enchantment, one that could supposedly ' +
        'breathe life back into things on the very brink... a ' +
        "'[spell_name]revive[/spell_name]' " +
        'spell, he called it.\n' +
        'He thought it might be a key, a way to mend what the encroaching ' +
        'darkness sought to break. Keep your eyes open, ' +
        "[character_name]Elior[/character_name]. What you've read might be more than " +
        'just stories.[/dialogue]'
      dialogue += addedDialogue

      // Check if player already knows Revive spell by its name
      if (!gameState.hasSpell('revive')) {
        gameState.knownSpells.push(new ReviveSpell())
        dialogue +=
          '\n\n[event]As she speak of it, the words your father wrote seem to ' +
          'settle in your mind. \nYou feel a new understanding... You have '
        dialogue += 'learned the [spell_name]Revive[/spell_name] spell![/event]'
      } else {
        dialogue +=
          "\n\n[event]You recall your father's writings on the " +
          '[spell_name]Revive[/spell_name] spell. The knowledge feels familiar.[/event]'
      }
    }

    if (!dialogue) {
      // If no other dialogue was triggered
      dialogue =
        "[dialogue]It's good to see you, [character_name]Elior[/character_name]. " +
        'Is there something you need?[/dialogue]'
    }

    const eventMsg =
      '[event]You speak with [character_name]' +
      this.name +
      '[/character_name].[/event]'
    return eventMsg + '\n' + dialogue
  }

  /** Handle items given to the grandmother and produce appropriate events. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof Locket) {
      gameState.removeItemFromInventory(item.name)
      const travelCloak = new TravelCloak()
      gameState.addItemToInventory(travelCloak)
      const eventMsg =
        '[event]You give the [item_name]' +
        item.name +
        '[/item_name] to the [character_name]' +
        this.name +
        '[/character_name].[/event]'
      return (
        eventMsg +
        '\n' +
        ('[character_name]' +
          this.name +
          "[/character_name]'s eyes widen as " +
          'she sees the [item_name]' +
          item.name +
          '[/item_name]. ' +
          "[dialogue]'This... this was your mother's. She said it would keep " +
          'you safe. And this... she wanted you to have this when you were ' +
          "old enough to understand its importance.'[/dialogue]\n") +
        ('[character_name]' +
          this.name +
          '[/character_name] hands you a finely made [item_name]' +
          travelCloak.name +
          '[/item_name].\n' +
          "[dialogue]'May it protect you on your journeys, " +
          "[character_name]Elior[/character_name].'[/dialogue]") +
        '\n[event]You received a [item_name]' +
        travelCloak.name +
        '[/item_name]![/event]'
      )
    } else if (
      item instanceof WildBerries &&
      !this.dialogueState.given_berries
    ) {
      this.dialogueState.given_berries = true
      // Remove WildBerries from inventory
      gameState.removeItemFromInventory(item.name)
      const eventMsg =
        '[event]You give the [item_name]' +
        item.name +
        '[/item_name] to the [character_name]' +
        this.name +
        '[/character_name].[/event]'
      return (
        eventMsg +
        '\n' +
        ("[dialogue]'Oh, [item_name]" +
          item.name +
          '[/item_name]! ' +
          "Thank you, dear. These look lovely. I'll make a pie later.' ") +
        (' [character_name]' +
          this.name +
          '[/character_name] smiles warmly. ' +
          "'It's the little things that brighten the day, isn't it?'[/dialogue]")
      )
    } else if (
      item instanceof WildBerries &&
      this.dialogueState.given_berries
    ) {
      // Remove WildBerries from inventory
      gameState.removeItemFromInventory(item.name)
      const eventMsg =
        '[event]You give the [item_name]' +
        item.name +
        '[/item_name] to the [character_name]' +
        this.name +
        '[/character_name].[/event]'
      return (
        eventMsg +
        '\n' +
        ("[dialogue]'More [item_name]" +
          item.name +
          '[/item_name]? ' +
          'You are too ' +
          "kind, [character_name]Elior[/character_name]. Thank you.'[/dialogue]")
      )
    } else if (item instanceof FadedPhotograph) {
      const eventMsg =
        '[event]You show the [item_name]' +
        item.name +
        '[/item_name] to ' +
        'the [character_name]' +
        this.name +
        '[/character_name].[/event]'
      if (!gameState.getStoryFlag(FLAG_READ_PHOTO_MESSAGE)) {
        return (
          eventMsg +
          '\n' +
          "She takes the photograph, her eyes misty with memory. [dialogue]'This " +
          'was taken long ago, before the troubles began. Your parents were so ' +
          "full of hope... They loved you dearly, Elior. I miss them every day.' " +
          'She gently returns the photo to you, lost in thought.[/dialogue]'
        )
      }
      gameState.setStoryFlag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO, true)
      return (
        eventMsg +
        '\n' +
        'She studies the back of the photograph, her expression growing ' +
        "serious. [dialogue]'You found the message, then? Your parents... " +
        'they were involved in something much bigger than any of us realized. ' +
        'There is a darkness in Eldoria, and your family is tied to it. There ' +
        "is a secret, Elior — a truth you must uncover. Promise me you'll be " +
        "careful.'[/dialogue]"
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
      '[dialogue][character_name]' +
      this.name +
      '[/character_name] looks at the [item_name]' +
      item.name +
      "[/item_name]. 'I'm not sure what to do with this, dear.'[/dialogue]"
    )
  }
}
