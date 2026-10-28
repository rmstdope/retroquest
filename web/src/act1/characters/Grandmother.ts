import {
  Character,
  type GameState,
  type Item,
  characterName,
  speech,
  attributeSpeech,
} from '@/engine'
import { ReviveSpell } from '../spells/ReviveSpell'
import { TravelCloak } from '../items/TravelCloak'
import { WildBerries } from '../items/WildBerries'
import { Locket } from '../items/Locket'
import { FadedPhotograph } from '../items/FadedPhotograph'
import { Key } from '../items/Key'
import { AncientAmulet } from '../items/AncientAmulet'
import { FreshBread } from '../items/FreshBread'
import { Patches } from './Patches'
import {
  FLAG_GRANDMOTHER_BAKED_BREAD,
  FLAG_MAGIC_FULLY_UNLOCKED,
  FLAG_PATCHES_FOUND,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
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
        `Your ${characterName('grandmother')}, flour on her apron and her ` +
        'sleeves pushed up. She has raised you since your parents went ' +
        'away, and she keeps her hands busy when she would rather not ' +
        'answer.',
    })
  }

  /**
   * Dialogue varying by story flags: the greeting, then (once, after the
   * journal is read) her reaction to the dream, then the journal tale
   * (which grants the Revive spell), her lines on Elior's journey, on
   * Patches and the shed hint while he carries its key. The journal tale is told again only
   * when she has nothing newer to say.
   */
  override talkTo(gameState: GameState): string {
    return attributeSpeech(this.name, this.talkAnswer(gameState))
  }

  /** What Grandmother answers when spoken to, before the speaker is labelled. */
  private talkAnswer(gameState: GameState): string {
    let dialogue = ''
    const journalRead = gameState.getStoryFlag('journal_read_prologue_entry')
    const dreamToTell = journalRead && !gameState.hasSpell('revive')
    if (dreamToTell) dialogue = Grandmother.HUMMING_AT_THE_HEARTH
    if (this.dialogueState.initial_talk) {
      dialogue += dialogue ? '\n' : ''
      dialogue +=
        speech("There you are. Sit down a minute, the bread's nearly done.") +
        '\nShe does not sit down herself.\n' +
        speech(
          "The village is on edge, you'll have noticed. Folk keep their " +
            'voices down in the square these days, and nobody will say why.\n' +
            `If you're going out, call on ${characterName('Mira')}, north of ` +
            'the square. She has a way with herbs, and with... other things. ' +
            `Old Man ${characterName('Hemlock')} at the ` +
            '[room_name]General Store[/room_name] hears everything, and ' +
            `${characterName('Borin')} at the forge keeps the tools sharp.\n` +
            `You've a good heart, ${characterName('Elior')}. ` +
            "Don't let anyone talk you out of it.",
        )
      this.dialogueState.initial_talk = false // Change state after initial talk
    }

    if (dreamToTell) {
      dialogue +=
        (dialogue ? '\n' : '') +
        this.dreamReaction() +
        '\n' +
        this.journalTale() +
        '\n\n' +
        this.teachRevive(gameState)
    }

    const journeyLine = this.journeyLine(gameState)
    if (journeyLine) dialogue += (dialogue ? '\n' : '') + journeyLine

    const patchesLine = this.patchesLine(gameState)
    if (patchesLine) dialogue += (dialogue ? '\n' : '') + patchesLine

    if (gameState.inventory.some((item) => item instanceof Key)) {
      dialogue += (dialogue ? '\n' : '') + this.shedKeyHint()
    }

    if (!dialogue && journalRead) {
      // Nothing newer to say: she tells the journal tale again.
      dialogue =
        this.journalTale() +
        '\n\n' +
        'You already have it by heart: his words, and the way she told them.'
    }

    if (!dialogue) {
      // If no other dialogue was triggered
      dialogue = speech(
        "Back again? There's bread on the board, if you're hungry.",
      )
    }

    return dialogue
  }

  /**
   * What she is doing when Elior goes to her with the dream to tell: humming
   * the cradle tune, which she stops. Shown first in that one talk, before
   * any greeting.
   */
  private static readonly HUMMING_AT_THE_HEARTH =
    'When you go to her, she is humming at the hearth: a slow tune that ' +
    'climbs three notes and settles home again. You know it. You have ' +
    'known it all your life, and you could not say from where. She ' +
    'stops when she sees your face.'

  /** Her reaction once Elior has told her of the dream (see `talkTo`). */
  private dreamReaction(): string {
    return (
      'You tell her about the dream: the shadows, the figure, the voice ' +
      'calling your name, and how you were sure you had heard it before. ' +
      'She reaches for your hand and holds it tighter than she means to. ' +
      speech(
        'That voice... did it say anything more? Anything but your name?',
      ) +
      '\nYou tell her the three words you caught at the very end, the ones ' +
      'you wrote down before they could go: let them rest. She goes ' +
      'quiet. She turns to the bread on the board and does not turn back ' +
      'for a while. ' +
      speech('Some voices are older than memory.')
    )
  }

  /** What she tells of Elior's father's journal and the revive spell. */
  private journalTale(): string {
    return (
      'She wipes her hands and looks at the [item_name]journal[/item_name] ' +
      'under your arm. ' +
      speech(
        'Your father wrote in one like that every night, at this table. ' +
          'Half of it I never understood.\n' +
          'He thought the land was getting sick long before anyone else did. ' +
          'And there was one thing he kept coming back to: a way to call a ' +
          "thing back when it's nearly gone. [spell_name]Revive[/spell_name], " +
          "he called it. He'd try it on my herbs when they wilted.",
      ) +
      '\nShe almost smiles. ' +
      speech('Sometimes I think it worked.')
    )
  }

  /** Teach Elior the revive spell his father wrote of. */
  private teachRevive(gameState: GameState): string {
    gameState.knownSpells.push(new ReviveSpell())
    return (
      'As she speaks, the words your father wrote come back to you, and ' +
      'this time they stay.\n' +
      'You have learned [spell_name]revive[/spell_name].'
    )
  }

  /**
   * What she says of Elior's journey, newest first: a farewell once he
   * carries the amulet; after Mira's teaching, her daughter's gift seen in
   * him and a fresh loaf for the road, then only a word on his preparations.
   * Null before Mira has taught him.
   */
  private journeyLine(gameState: GameState): string | null {
    if (gameState.inventory.some((item) => item instanceof AncientAmulet)) {
      return (
        'Her eyes fall on the [item_name]amulet[/item_name] you carry, and ' +
        'she goes very still. ' +
        speech("So it's true, then.") +
        ' She turns the loaf on the board, though it does not need turning. ' +
        speech('Come back to me, child.')
      )
    }
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) return null
    if (gameState.getStoryFlag(FLAG_GRANDMOTHER_BAKED_BREAD)) {
      return speech(
        "Packed yet? Don't tell me you'll manage. You'll manage cold and " +
          'hungry. I want you warm and fed, do you hear?',
      )
    }
    gameState.setStoryFlag(FLAG_GRANDMOTHER_BAKED_BREAD, true)
    const bread = new FreshBread()
    gameState.addItemToInventory(bread)
    return (
      'She looks at you for a long moment, as if seeing someone else ' +
      'standing in your place. ' +
      speech(
        "There's a light about you since you came back from the healer's " +
          "hut. You have her gift... your mother's gift. " +
          'I would know it anywhere.',
      ) +
      '\nShe turns to the hearth before you can ask her what she means. ' +
      speech(
        "So you're to go on the road. Then you'll not go hungry on it. " +
          'I baked this morning; take this for the way.',
      ) +
      '\n' +
      `You receive a [item_name]${bread.name}[/item_name].`
    )
  }

  /** Whether Elior is carrying Patches, found but not yet given a home. */
  private carryingPatches(gameState: GameState): boolean {
    return (
      gameState.getStoryFlag(FLAG_PATCHES_FOUND) &&
      !gameState.getStoryFlag(FLAG_PATCHES_RETURNED) &&
      !gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)
    )
  }

  /**
   * What she says of Patches: while Elior carries her, the offer to keep
   * her; once she has stayed, how she has settled in. Null otherwise.
   */
  private patchesLine(gameState: GameState): string | null {
    if (gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)) {
      return (
        `${characterName('Patches')} is asleep in the warm spot by the hearth. ` +
        `Your ${characterName('grandmother')} follows your gaze and smiles. ` +
        speech(
          'She has the run of the cottage already. ' +
            "I'll not be lonely with that one about.",
        )
      )
    }
    if (!this.carryingPatches(gameState)) return null
    return (
      `${characterName('Patches')} peers out of your arms, and your ` +
      `${characterName('grandmother')} reaches out to scratch her ears. ` +
      speech(
        `${characterName('Hemlock')}'s ${characterName('Patches')}! ` +
          "Poor thing, she's all dust and bones.",
      ) +
      '\nShe keeps scratching a while longer than she needs to.\n' +
      speech(
        "It's very quiet here, with you out all day. " +
          "If you'd have her stay with me, say so, and I'll square it with " +
          `${characterName('Hemlock')} myself. Or carry her home to him. ` +
          "He'll be worried sick.",
      )
    )
  }

  /**
   * Saying "stay" (or "yes" or "keep") while Elior carries Patches lets her
   * stay by the hearth: grandmother sends word to Hemlock, who reopens the
   * store. Other words only get a fond look.
   */
  override sayTo(gameState: GameState, words: string): string {
    const yes = /\b(stay|yes|keep)\b/i.test(words)
    if (yes && this.carryingPatches(gameState)) {
      gameState.setStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER, true)
      gameState.currentRoom.addCharacter(new Patches())
      return (
        `${characterName('Patches')} sniffs the rug, circles twice and curls ` +
        `up at your ${characterName('grandmother')}'s feet. She laughs softly. ` +
        speech(
          "Well, that's settled, then. I'll send word to " +
            `${characterName('Hemlock')} this very afternoon. He's a kind ` +
            "old soul; he'll be glad she's safe, and his store will be open " +
            'again by the time you get there.',
        )
      )
    }
    return (
      `Your ${characterName(this.name)} tilts her head. ` +
      speech(
        "I'm not sure what you mean, dear, but I do like to hear you talk.",
      )
    )
  }

  /** What she says on seeing the shed key she once hid in the chicken coop. */
  private shedKeyHint(): string {
    return speech(
      'So the chickens gave up my little secret. I tucked that key up in the ' +
        'coop rafters years ago. It opens the old shed by the mill.\n' +
        "It was a workshop once... your father's. I never could bring myself " +
        "to go in. It's dark as a cellar in there, dear; take the " +
        '[item_name]lantern[/item_name] with you.',
    )
  }

  /** Handle items given to the grandmother and produce appropriate events. */
  override giveItem(gameState: GameState, item: Item): string {
    return attributeSpeech(this.name, this.giveAnswer(gameState, item))
  }

  /** What Grandmother answers to a gift, before the speaker is labelled. */
  private giveAnswer(gameState: GameState, item: Item): string {
    if (item instanceof Locket) {
      gameState.removeItemFromInventory(item.name)
      const travelCloak = new TravelCloak()
      gameState.addItemToInventory(travelCloak)
      return (
        `${characterName('Grandmother')}'s eyes widen as ` +
        'she sees the [item_name]' +
        item.name +
        '[/item_name]. ' +
        speech(
          "This... this was your mother's. It came to her from me, and to " +
            'me from my mother, all the way back to the founders, so the old ' +
            'ones said. I thought she took it with her when she left.',
        ) +
        '\nShe closes her hand around it for a moment. Then she goes to the ' +
        'chest at the foot of her bed and takes out something folded in ' +
        'paper. ' +
        speech(
          "She left this with me the week before she went. 'When he's " +
            "grown,' she said. I've never known when that was.",
        ) +
        '\nShe looks at you. ' +
        speech("I suppose it's now.") +
        '\n' +
        `You receive a [item_name]${travelCloak.name}[/item_name].`
      )
    } else if (
      item instanceof WildBerries &&
      !this.dialogueState.given_berries
    ) {
      this.dialogueState.given_berries = true
      // Remove WildBerries from inventory
      gameState.removeItemFromInventory(item.name)
      return (
        speech(
          `Look at you: [item_name]${item.name}[/item_name], and your ` +
            'fingers purple to the knuckle, same as when you were six.',
        ) +
        ' She tips them into a bowl. ' +
        speech("I'll make a pie. You'll be here to eat it, I hope.")
      )
    } else if (
      item instanceof WildBerries &&
      this.dialogueState.given_berries
    ) {
      // Remove WildBerries from inventory
      gameState.removeItemFromInventory(item.name)
      return speech("More? That's two pies, then. Or one very large one.")
    } else if (item instanceof FadedPhotograph) {
      if (!gameState.getStoryFlag(FLAG_READ_PHOTO_MESSAGE)) {
        return (
          `Your ${characterName('grandmother')} takes the photograph and ` +
          'holds it close to the window. ' +
          speech(
            "The three of you. You'd not have been two. Your mother wouldn't " +
              "stand still for it; that's why she's half a blur.",
          ) +
          '\nShe hands it back, and turns to the bread.'
        )
      }
      gameState.setStoryFlag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO, true)
      return (
        `Your ${characterName('grandmother')} turns the photograph over, ` +
        'and her thumb rests on the writing. ' +
        speech(
          "That's her hand. She always wrote as if the ink were running out.",
        ) +
        '\nFor a while she says nothing. ' +
        speech(
          `Your parents didn't just leave, ${characterName('Elior')}. ` +
            'They went toward something. I begged them not to.',
        ) +
        '\nShe hands the photograph back. ' +
        speech(
          'Your mother loved the river. If anyone remembers what she did ' +
            `there, it's the old ${characterName('fisherman')} down at the ` +
            "[room_name]Riverbank[/room_name]. Promise me you'll be careful.",
        )
      )
    }

    return (
      `${characterName('Grandmother')} turns it over in her hands and gives ` +
      'it back. ' +
      speech('Keep it, love. My shelves are full enough.')
    )
  }
}
