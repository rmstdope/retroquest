import {
  Character,
  type GameState,
  type Item,
  characterName,
  clue,
  dialogue,
  remembered,
  speech,
  type NameOptions,
} from '@/engine'
import { COURTYARD_CAPTAIN_GONE_DESCRIPTION } from '../rooms/courtyardDescriptions'
import { GuardiansChain } from '../items/GuardiansChain'
import {
  FLAG_ACT4_CAPTAIN_APOLOGY_HEARD,
  FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD,
  FLAG_ACT4_CHAIN_GIVEN,
  FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED,
  FLAG_ACT4_SERVANTS_FREED,
  VIRTUE_SELFLESS,
} from '../Act4StoryFlags'

/**
 * A captain of King Alden's royal guard, enthralled in the Outer Courtyard.
 * Optional lore: the blessing that frees the servants also wakes him, and his
 * line changes from muddled to clear. He gives no item and opens nothing;
 * he asks for nothing, but Elior can give him the Guardian's Chain, which is
 * Act IV's selfless moment, and he then walks home and leaves the courtyard.
 */
export class CaptainOfTheGuard extends Character {
  /** Named by what it is, so it reads "the …" (see `nameInSentence`). */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, common: true })
  }

  constructor() {
    super({
      name: 'Captain of the Guard',
      description:
        'A captain of the royal guard, his tabard black with soot. His eyes are ' +
        'open but see nothing, and his hand rests on a sword he has forgotten ' +
        'how to draw.',
    })
  }

  /** Also answers to "captain". */
  override answersTo(name: string): boolean {
    return super.answersTo(name) || name.toLowerCase() === 'captain'
  }

  /** Blind while enthralled; once freed, awake and restless among the servants. */
  override examine(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return this.description
    }
    return (
      'A captain of the royal guard, his tabard black with soot. He sits ' +
      'among the servants, opening and closing his sword hand as if it ' +
      'belonged to someone else.'
    )
  }

  /** Return the captain's words, muddled while enthralled and clear once freed;
   * the clear talk is his apology for Sir Cedric, recorded as heard, and the
   * first clear talk after the knight's redemption adds the man in grey. */
  override talkTo(gameState: GameState): string {
    const name = characterName(this.name)
    if (!gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)) {
      return (
        `The ${name} stares through you. ` +
        speech(
          "I kept King Alden's gate once. Now I keep it for... I cannot " +
            'remember.',
        )
      )
    }
    gameState.setStoryFlag(FLAG_ACT4_CAPTAIN_APOLOGY_HEARD, true)
    let line =
      'I remember now. King Alden used to walk the walls at night and talk ' +
      'to whoever was on them. That is how they got him. Cedric stood his ' +
      "post. They came in by the king's postern, and it had been left " +
      'unguarded. If you see Sir Cedric again, tell him I am sorry I ever ' +
      'doubted him.'
    if (
      gameState.getStoryFlag(FLAG_ACT4_KNIGHT_OF_DESPAIR_COMPLETED) &&
      !gameState.getStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD)
    ) {
      gameState.setStoryFlag(FLAG_ACT4_CAPTAIN_MAN_IN_GREY_TOLD, true)
      line +=
        ' A man in grey came through here while you were gone. He knelt by ' +
        'me and asked my name. I told him.'
    }
    return (
      `The ${name} lifts his head and meets your eyes. ` +
      speech(line) +
      ' ' +
      speech(
        'They tell me the gates are open. I would walk out of them ' +
          'tonight, if my hand remembered the sword. Every shadow between ' +
          'here and home knows my face.',
      )
    )
  }

  /**
   * Accept only the Guardian's Chain, and only once he is freed: the gift
   * records Selflessness, takes the chain and sends him out through the gates.
   */
  override giveItem(gameState: GameState, item: Item): string {
    const freed = gameState.getStoryFlag(FLAG_ACT4_SERVANTS_FREED)
    const isChain = item instanceof GuardiansChain
    if (!freed) {
      return (
        'The captain stares through you. His hands do not close on it, and ' +
        'you keep it.'
      )
    }
    if (!isChain) {
      return (
        clue(
          `The ${characterName(this.name)} pushes it back into your hands.`,
        ) +
        '\n' +
        dialogue(this.name, 'That will not get me past a shadow.')
      )
    }
    gameState.removeItemFromInventory(item.name)
    gameState.setStoryFlag(FLAG_ACT4_CHAIN_GIVEN, true)
    gameState.addVirtue(VIRTUE_SELFLESS)
    const room = gameState.currentRoom
    room.characters = room.characters.filter((c) => c !== this)
    room.description = COURTYARD_CAPTAIN_GONE_DESCRIPTION
    return [
      "You lift the [item_name]guardian's chain[/item_name] over the " +
        "captain's head. Its crystals flare once and settle against his " +
        'soot-black tabard, and the warmth goes out of your hands.',
      `The ${characterName(this.name)} puts a hand to the chain. ` +
        speech('You will need this more than I will.') +
        ' He tries to give it back, and when you will not take it, he grips ' +
        'your arm. ' +
        speech('Then I will tell them at home what you did here.'),
      remembered('Selflessness'),
      'He turns toward the gates. The shadows draw away from the light at ' +
        'his throat, and at the arch he lifts a hand to you before he goes.',
    ].join('\n')
  }
}
