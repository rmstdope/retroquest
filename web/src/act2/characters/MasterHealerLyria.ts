import {
  Character,
  type GameState,
  type Item,
  characterName,
  dialogue,
  speech,
} from '@/engine'
import { CrystalFocus } from '../items/CrystalFocus'
import { HealingHerbs } from '../items/HealingHerbs'
import { SilverLeaves } from '../items/SilverLeaves'
import { GreaterHealSpell } from '../spells/GreaterHealSpell'
import {
  FLAG_HEALERS_APPRENTICE_ACCEPTED,
  FLAG_HEALERS_APPRENTICE_COMPLETED,
  FLAG_KNOWS_ELENA_CURSE,
  FLAG_ELENA_HEALED,
  FLAG_INNKEEPERS_DAUGHTER_COMPLETED,
  FLAG_LYRIA_DIAGNOSED,
  FLAG_LYRIA_SILVER_LEAVES_GIVEN,
  QUEST_HEALERS_APPRENTICE,
} from '../Act2StoryFlags'

/** NPC mentor who teaches advanced healing and handles the apprenticeship quest. */
export class MasterHealerLyria extends Character {
  constructor() {
    super({
      name: 'Master Healer Lyria',
      description:
        'A wise and nurturing healer with graying hair and gentle eyes that seem to ' +
        'see right through to your magical potential. She wears simple robes adorned ' +
        'with healing herbs, and her hands are steady from years of tending to the ' +
        "sick and wounded. There's an aura of calm competence about her that inspires " +
        'confidence in her abilities.',
    })
  }

  /**
   * Her usual talk, and once the silver leaves have been given, a closing
   * line about the dish of leaves on her windowsill.
   */
  override talkTo(gameState: GameState): string {
    const talk = this.baseTalk(gameState)
    if (!gameState.getStoryFlag(FLAG_LYRIA_SILVER_LEAVES_GIVEN)) {
      return talk
    }
    return (
      talk +
      '\n\n' +
      'The dish of [item_name]silver leaves[/item_name] sits on the ' +
      'windowsill where the light can reach it.'
    )
  }

  /**
   * Lyria is the one who explains how Elena's curse is lifted: the first talk
   * once the curse is known gives the full diagnosis, later talks until Elena
   * is cured give a one-line reminder, each before her usual reply.
   */
  private baseTalk(gameState: GameState): string {
    const usual = this.usualReply(gameState)
    const curseKnown =
      gameState.getStoryFlag(FLAG_KNOWS_ELENA_CURSE) ||
      gameState.getStoryFlag(FLAG_ELENA_HEALED)
    if (
      !curseKnown ||
      gameState.getStoryFlag(FLAG_INNKEEPERS_DAUGHTER_COMPLETED)
    ) {
      return usual
    }
    if (!gameState.getStoryFlag(FLAG_LYRIA_DIAGNOSED)) {
      gameState.setStoryFlag(FLAG_LYRIA_DIAGNOSED, true)
      return (
        characterName('Lyria') +
        ' looks up from her mortar, and something in your face makes her ' +
        'set the pestle down.' +
        '\n\n' +
        dialogue(
          this.name,
          "You've been to the Silver Stag. Marcus's girl, Elena. I have sat " +
            'by her bed myself, and I could do nothing for her. Listen, then, ' +
            'because this is how a curse like hers is lifted, if it can be ' +
            'lifted at all. First she must be made strong, or what comes ' +
            'after will kill her; that wants a deeper healing than I can ' +
            'give alone. Then the mark must be washed in water no shadow has ' +
            'ever touched. You will find none in this city; every well here ' +
            'has seen the dark. And last, the thing must be unbound. Not ' +
            'broken: unbound, with the old kind of unbinding, the kind the ' +
            'scholars wrote down before any of us were born.',
        ) +
        '\n\n' +
        'She picks the pestle up again and sets it down.' +
        '\n\n' +
        dialogue(
          this.name,
          'I wrote to the healer at Willowbrook about that mark, weeks ago. ' +
            'Mira. The best hand with a curse this side of the hills, they ' +
            'say. She never came, and she never answered.',
        ) +
        '\n\n' +
        usual
      )
    }
    return (
      dialogue(
        this.name,
        'Elena still? Strengthen her, wash her in untouched water, then ' +
          'unbind it. In that order, or not at all.',
      ) +
      '\n\n' +
      usual
    )
  }

  /**
   * Lyria's reply for the player's current point in the apprenticeship: the
   * herb ask (or, when the herbs are carried, the invitation to hand them
   * over), the reminder of the focus once the herbs are given, and her line
   * after the apprenticeship.
   */
  private usualReply(gameState: GameState): string {
    if (gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_COMPLETED)) {
      return dialogue(
        this.name,
        'You have the first of it. Mastery is the next twenty years.',
      )
    }
    if (gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)) {
      return dialogue(
        this.name,
        "He's holding on. The herbs bought him days, not weeks. Find me " +
          'that focus.',
      )
    }
    if (gameState.hasItem('healing herbs')) {
      return (
        characterName('Lyria') +
        "'s eyes go straight to the bundle in your hands." +
        '\n\n' +
        dialogue(
          this.name,
          'Are those from the old families? Give them here, if you are ' +
            'willing. I have a bed that cannot wait.',
        )
      )
    }
    return dialogue(
      this.name,
      'Welcome to my house of healing. I can sense magical potential in ' +
        'you, and I could use it, but look at my shelves. Bare. I have ' +
        'patients on the brink of death and nothing left to steep for ' +
        'them. Bring me [item_name]healing herbs[/item_name], good ones, ' +
        'and I will let you watch me work. That is how every healer ' +
        'starts.',
    )
  }

  /**
   * Handle giving items to Master Healer Lyria. The silver leaves go in a dish
   * on her windowsill. The healing herbs start the apprenticeship at the
   * carter's bed; the Crystal Focus is taught over that bed and is handed back
   * when the herbs have not been given yet.
   */
  override giveItem(gameState: GameState, item: Item): string {
    const apprenticed = gameState.getStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED)
    if (item instanceof HealingHerbs && !apprenticed) {
      gameState.removeItemFromInventory(item.name)
      gameState.setStoryFlag(FLAG_HEALERS_APPRENTICE_ACCEPTED, true)
      return (
        characterName('Lyria') +
        ' unties the bundle and breathes it in.' +
        '\n\n' +
        dialogue(
          this.name,
          "Greendale's old families grow these. They don't part with them " +
            'lightly.',
        ) +
        '\n\n' +
        'She leads you through to the back room, where a carter lies grey ' +
        'under a blanket, his chest crushed under his own wagon. You watch ' +
        'her steep the herbs, lay her hands on him and pour her healing in. ' +
        'His breathing eases, but only a little.' +
        '\n\n' +
        dialogue(
          this.name,
          'This is the work. You give what you have, and sometimes it is ' +
            'not enough. He needs more than these hands can give. The old ' +
            'healers gathered their healing into a crystal, a ' +
            '[item_name]Crystal Focus[/item_name], and it came out the ' +
            'other side like sunlight through a glass. If one survives in ' +
            'Greendale, it is wherever the old scholars hid their books.',
        )
      )
    }
    if (item instanceof SilverLeaves) {
      gameState.removeItemFromInventory(item.name)
      gameState.setStoryFlag(FLAG_LYRIA_SILVER_LEAVES_GIVEN, true)
      return (
        characterName('Lyria') +
        ' turns one leaf toward the window, and for a moment she forgets ' +
        'to breathe. ' +
        speech(
          'Silverbark. From the old tree itself, not a cutting. I have ' +
            'only ever read of these.',
        ) +
        ' She lays them in a shallow dish as if they might bruise. ' +
        speech(
          'Steeped, a single leaf breaks a fever in a night. Greendale ' +
            `will have a gentler winter because of you, ${characterName('Elior')}.`,
        )
      )
    }
    if (item instanceof CrystalFocus) {
      if (!apprenticed) {
        return (
          characterName('Lyria') +
          ' turns the crystal over in her hands and gives it back.' +
          '\n\n' +
          dialogue(
            this.name,
            'A focus gathers what you pour into it, and I have nothing ' +
              'left to pour. Bring me [item_name]healing herbs[/item_name] ' +
              "first. Then we'll see what this is for.",
          )
        )
      }
      gameState.removeItemFromInventory('Crystal Focus')
      gameState.getQuest(QUEST_HEALERS_APPRENTICE)?.complete(gameState)
      gameState.learnSpell(new GreaterHealSpell())
      return (
        characterName('Lyria') +
        " takes the [item_name]Crystal Focus[/item_name] to the carter's " +
        'bed and sets it on his chest.' +
        '\n\n' +
        dialogue(this.name, 'Watch my hands, not the light.') +
        '\n\n' +
        'She gathers her healing into the crystal, and it comes out the ' +
        'other side bright and narrow, straight into him. The grey goes out ' +
        'of his face. Then she takes your hands, puts them where hers were, ' +
        'and has you do it again, slower, until you feel the shape of it.' +
        '\n\n' +
        '[success]You learn [spell_name]greater heal[/spell_name].[/success]' +
        '\n\n' +
        dialogue(this.name, "He'll live. And you have the first of it now.") +
        "\n\n[success]Quest Complete: The Healer's Apprentice[/success]"
      )
    }
    // Default response for other items
    const name = characterName(this.name)
    return (
      name +
      ' seems to be too busy to receive any gifts from you at the moment.'
    )
  }
}
