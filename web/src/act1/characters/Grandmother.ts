import {
  Character,
  type GameState,
  type Item,
  event,
  characterName,
  speech,
} from '@/engine'
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
        `${characterName('Elior')}'s wise and loving ` +
        `${characterName('grandmother')}, always ready with advice and a ` +
        `gentle smile. She has raised ${characterName('Elior')} since his ` +
        'parents vanished.',
    })
  }

  /** Dialogue varying by story flags; grants the Revive spell when appropriate. */
  override talkTo(gameState: GameState): string {
    let dialogue = ''
    if (this.dialogueState.initial_talk) {
      dialogue = speech(
        `Oh, ${characterName('Elior')}, my dear. The village... ` +
          "it feels a bit on edge lately, doesn't it? \n" +
          'Willowbrook has always been a peaceful place. The [room_name]Village ' +
          'Square[/room_name] is usually bustling, though folks seem more hushed ' +
          'these days. \n' +
          "If you're needing anything, the [room_name]General Store[/room_name] " +
          `usually has a bit of everything. Old Man ${characterName('Hemlock')}, the ` +
          `${characterName('shopkeeper')}, sees and hears a lot, too.\n` +
          `And if it's wisdom or a remedy you seek, ${characterName('Mira')} ` +
          'in her hut to the north of the square is the one to talk to. She has a ' +
          'way with herbs and... other things.\n' +
          `The ${characterName('Blacksmith')} down by the south end, ` +
          "he's a sturdy fellow, always hammering away. Keeps the tools sharp, " +
          'and his spirits, mostly.\n' +
          "Just... be observant, child. There's more to this world than meets the " +
          `eye. And you, ${characterName('Elior')}, you have a good heart. ` +
          'Remember that.',
      )
      this.dialogueState.initial_talk = false // Change state after initial talk
    }

    if (gameState.getStoryFlag('journal_read_prologue_entry')) {
      const addedDialogue =
        '\n' +
        speech(
          'That [item_name]journal[/item_name] of yours... your father was ' +
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
            `${characterName('Elior')}. What you've read might be more than ` +
            'just stories.',
        )
      dialogue += addedDialogue

      // Check if player already knows Revive spell by its name
      if (!gameState.hasSpell('revive')) {
        gameState.knownSpells.push(new ReviveSpell())
        dialogue +=
          '\n\n' +
          event(
            'As she speaks of it, the words your father wrote seem to ' +
              'settle in your mind. \nYou feel a new understanding... You have ' +
              'learned the [spell_name]Revive[/spell_name] spell!',
          )
      } else {
        dialogue +=
          '\n\n' +
          event(
            "You recall your father's writings on the " +
              '[spell_name]Revive[/spell_name] spell. The knowledge feels familiar.',
          )
      }
    }

    if (!dialogue) {
      // If no other dialogue was triggered
      dialogue = speech(
        `It's good to see you, ${characterName('Elior')}. ` +
          'Is there something you need?',
      )
    }

    const eventMsg = event(`You speak with ${characterName(this.name)}.`)
    return eventMsg + '\n' + dialogue
  }

  /** Handle items given to the grandmother and produce appropriate events. */
  override giveItem(gameState: GameState, item: Item): string {
    if (item instanceof Locket) {
      gameState.removeItemFromInventory(item.name)
      const travelCloak = new TravelCloak()
      gameState.addItemToInventory(travelCloak)
      const eventMsg = event(
        `You give the [item_name]${item.name}[/item_name] to the ` +
          `${characterName(this.name)}.`,
      )
      return (
        eventMsg +
        '\n' +
        (`${characterName(this.name)}'s eyes widen as ` +
          'she sees the [item_name]' +
          item.name +
          '[/item_name]. ' +
          speech(
            "This... this was your mother's. It came to her from me, and to " +
              'me from my mother, all the way back to the founders, so the old ' +
              'ones said. I thought she took it with her when she left.',
          ) +
          '\nShe closes her hand around it for a moment. ' +
          speech(
            'She said it would keep you safe. And this... she wanted you to ' +
              'have this when you were old enough to understand its importance.',
          ) +
          '\n') +
        (`${characterName(this.name)} hands you a finely made [item_name]` +
          travelCloak.name +
          '[/item_name].\n' +
          speech(
            `May it protect you on your journeys, ${characterName('Elior')}.`,
          )) +
        '\n' +
        event(`You received a [item_name]${travelCloak.name}[/item_name]!`)
      )
    } else if (
      item instanceof WildBerries &&
      !this.dialogueState.given_berries
    ) {
      this.dialogueState.given_berries = true
      // Remove WildBerries from inventory
      gameState.removeItemFromInventory(item.name)
      const eventMsg = event(
        `You give the [item_name]${item.name}[/item_name] to the ` +
          `${characterName(this.name)}.`,
      )
      return (
        eventMsg +
        '\n' +
        speech(
          `Oh, [item_name]${item.name}[/item_name]! ` +
            "Thank you, dear. These look lovely. I'll make a pie later.",
        ) +
        ` ${characterName(this.name)} smiles warmly. ` +
        speech("It's the little things that brighten the day, isn't it?")
      )
    } else if (
      item instanceof WildBerries &&
      this.dialogueState.given_berries
    ) {
      // Remove WildBerries from inventory
      gameState.removeItemFromInventory(item.name)
      const eventMsg = event(
        `You give the [item_name]${item.name}[/item_name] to the ` +
          `${characterName(this.name)}.`,
      )
      return (
        eventMsg +
        '\n' +
        speech(
          `More [item_name]${item.name}[/item_name]? ` +
            'You are too ' +
            `kind, ${characterName('Elior')}. Thank you.`,
        )
      )
    } else if (item instanceof FadedPhotograph) {
      const eventMsg = event(
        `You show the [item_name]${item.name}[/item_name] to ` +
          `the ${characterName(this.name)}.`,
      )
      if (!gameState.getStoryFlag(FLAG_READ_PHOTO_MESSAGE)) {
        return (
          eventMsg +
          '\n' +
          'She takes the photograph, her eyes misty with memory. ' +
          speech(
            'This was taken long ago, before the troubles began. Your parents were so ' +
              `full of hope... They loved you dearly, ${characterName('Elior')}. ` +
              'I miss them every day.',
          ) +
          ' She gently returns the photo to you, lost in thought.'
        )
      }
      gameState.setStoryFlag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO, true)
      return (
        eventMsg +
        '\n' +
        'She studies the back of the photograph, her expression growing ' +
        'serious. ' +
        speech(
          'You found the message, then? Your parents... ' +
            'they were involved in something much bigger than any of us realized. ' +
            'There is a darkness in Eldoria, and your family is tied to it. There ' +
            `is a secret, ${characterName('Elior')} — a truth you must uncover. ` +
            "Promise me you'll be careful.",
        )
      )
    }

    const eventMsg = event(
      `You offer the [item_name]${item.name}[/item_name] to the ` +
        `${characterName(this.name)}.`,
    )
    return (
      eventMsg +
      '\n' +
      `${characterName(this.name)} looks at the [item_name]` +
      item.name +
      '[/item_name]. ' +
      speech("I'm not sure what to do with this, dear.")
    )
  }
}
