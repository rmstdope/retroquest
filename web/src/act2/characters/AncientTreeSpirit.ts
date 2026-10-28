import {
  Character,
  type GameState,
  type Item,
  characterName,
  dialogue,
  speech,
  type NameOptions,
} from '@/engine'
import { EnchantedAcorn } from '../items/EnchantedAcorn'
import { CrystalClearWater } from '../items/CrystalClearWater'
import { Moonflowers } from '../items/Moonflowers'
import { SilverLeaves } from '../items/SilverLeaves'
import { ForestSpeechSpell } from '../spells/ForestSpeechSpell'
import {
  FLAG_WHISPERS_IN_WIND_COMPLETED,
  FLAG_WHISPERS_IN_WIND_OFFERED,
  QUEST_WHISPERS_IN_THE_WIND,
} from '../Act2StoryFlags'

/** Where the nymphs are, said after the acorn without naming what to bring. */
const NYMPHS_POINTER_TEXT =
  'The nymphs in the glade east of the entrance have something for these ' +
  'roots. Answer them, and bring back what they give you.'
/** The pointer as spoken straight after the spell is learned. */
const NYMPHS_POINTER_AFTER_SPELL =
  'You can hear them now. The grove is uneasy. ' + NYMPHS_POINTER_TEXT

/** Ancient Tree Spirit NPC for quest progression and spell teaching. */
export class AncientTreeSpirit extends Character {
  acornReceived = false
  whispersQuestCompleted = false

  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'ancient tree spirit',
      description:
        'The spirit lives in the silver-barked tree. Its face is only there ' +
        'when you stop looking for it: two knots for eyes, a split in the ' +
        'bark for a mouth. Moss grows on it in rings, one for every winter.',
    })
  }

  /** Handle dialogue when talking to the Ancient Tree Spirit. */
  override talkTo(gameState: GameState): string {
    if (!this.acornReceived) {
      // Player hasn't brought the acorn yet
      return (
        'A face gathers in the knots of the silver bark and turns toward ' +
        'you.\n' +
        dialogue(
          this.name,
          'You walk like spring. Everything new, nothing kept.',
        ) +
        '\n\n' +
        speech(
          "I don't teach for nothing. Bring me something that hasn't " +
            'grown yet.',
        )
      )
    }

    if (!gameState.getStoryFlag(FLAG_WHISPERS_IN_WIND_COMPLETED)) {
      // Player has given the acorn but hasn't completed the quest yet
      return (
        dialogue(this.name, 'Still summer for you, then — all errands.') +
        '\n\n' +
        speech(NYMPHS_POINTER_TEXT)
      )
    }

    // General conversation after the quest is complete
    return dialogue(
      this.name,
      'Autumn, for you. You came with nothing and you leave carrying ' +
        'things. The way south is yours.',
    )
  }

  /** Handle giving items to the Ancient Tree Spirit. */
  override giveItem(gameState: GameState, item: Item): string {
    // Handle the enchanted acorn
    if (item instanceof EnchantedAcorn) {
      if (this.acornReceived) {
        return this.refuseRepeatGift()
      }

      // Receive the acorn, teach the spell, and offer the quest
      this.acornReceived = true
      gameState.removeItemFromInventory('enchanted acorn')
      gameState.learnSpell(new ForestSpeechSpell())
      gameState.setStoryFlag(FLAG_WHISPERS_IN_WIND_OFFERED, true)
      gameState.currentRoom.items.push(new SilverLeaves())

      return (
        'The bark around the knots softens.\n' +
        dialogue(
          this.name,
          "Next spring's tree, and you carried it here instead of planting " +
            'it. Good. Listen, then.',
        ) +
        '\n\n[success]The voices of the grove settle into you: the creak of ' +
        'branches, the talk of roots, the small sounds in the undergrowth. ' +
        'You can understand them now.\n\nYou have learned ' +
        '[spell_name]Forest Speech[/spell_name].[/success]\n\n' +
        dialogue(this.name, NYMPHS_POINTER_AFTER_SPELL)
      )
    }

    // Items from Whispering Glade: water or moonflowers
    const name = item.name.toLowerCase()
    if (name === 'crystal-clear water' || name === 'moonflowers') {
      if (!(item instanceof CrystalClearWater || item instanceof Moonflowers)) {
        return super.giveItem(gameState, item)
      }

      if (gameState.getStoryFlag(FLAG_WHISPERS_IN_WIND_COMPLETED)) {
        return this.refuseRepeatGift()
      }

      const hasWater = gameState.hasItem('crystal-clear water')
      const hasMoonflowers = gameState.hasItem('moonflowers')

      if (hasWater && hasMoonflowers) {
        gameState.getQuest(QUEST_WHISPERS_IN_THE_WIND)?.complete(gameState)
        this.whispersQuestCompleted = true
        gameState.removeItemFromInventory('moonflowers')

        return (
          'You pour some of the crystal-clear water at the foot of the ' +
          'silver tree and set the moonflowers in the wet soil. They take ' +
          'root at once and begin to glow.\n\n' +
          dialogue(
            this.name,
            "Rain and a night's flowers. That will see the roots through " +
              'winter.',
          ) +
          '\n\nSouth of the grove, branches pull apart with a long creak.\n\n' +
          dialogue(
            this.name,
            "Nyx lives at the end of that path. She doesn't come for " +
              'asking — read her altar before you call her.',
          )
        )
      }

      // Player only has one of the two gifts
      return dialogue(
        this.name,
        'Half a harvest. The nymphs gave you two things — go back for the ' +
          'other.',
      )
    }

    // Default response for other items
    return (
      'The ' +
      characterName(this.name) +
      ' does not stir. ' +
      speech('Wrong season for that.')
    )
  }

  /** Turn down a gift the spirit has already received. */
  private refuseRepeatGift(): string {
    return (
      'The ' +
      characterName(this.name) +
      ' does not take it. ' +
      speech('Keep it. The roots have what they need.')
    )
  }

  /** Examine the Ancient Tree Spirit and read its description. */
  override examine(_gameState: GameState): string {
    return (
      `${this.description} The bark is warm under your hand, and below ` +
      'your feet the roots shift slowly, like someone turning over in ' +
      'their sleep.'
    )
  }
}
