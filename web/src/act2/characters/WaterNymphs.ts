import {
  Character,
  type GameState,
  characterName,
  event,
  speech,
} from '@/engine'
import { CrystalClearWater } from '../items/CrystalClearWater'
import { Moonflowers } from '../items/Moonflowers'
import { FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED } from '../Act2StoryFlags'

/** The grey help line shown under every riddle. */
const RIDDLE_HELP =
  '[dim]Think carefully and speak your answer when you believe you know ' +
  "it. Use the command 'say <your_answer> to water nymphs' to give your " +
  'solution.[/dim]'

/** One of the nymphs' riddles: the question, accepted answers, explanation and hint. */
interface Riddle {
  question: string
  answers: string[]
  explanation: string
  hint: string
}

/**
 * The nymphs' three riddles in the order they are asked: water, mask, truth.
 * The mask seeds the silver mark on Elena's wrist; the truth echoes the
 * refrain on the moss-covered stone. Kept out of the save so that saves
 * always meet the current riddles.
 */
export const RIDDLES: Riddle[] = [
  {
    question:
      "I am the forest's blood that flows without wound, the sky's gift " +
      'that falls without being thrown. I give life yet can take it, ' +
      'am soft yet can carve stone. What am I?',
    answers: ['water', 'the water', 'rain', 'stream', 'river'],
    explanation:
      'Water is the lifeblood of the forest, falls as rain, nurtures life ' +
      'but can flood, and over time carves through stone.',
    hint:
      "What runs through us while we sit here? Haven't your boots been " +
      'wet since you came in?',
  },
  {
    question:
      'I smile, yet I have no eyes. I have a face, yet it is not my own. ' +
      'Put me on and I hide you; leave me behind and I tell whose work it ' +
      'was. What am I?',
    answers: ['mask', 'masks', 'a mask', 'the mask', 'false face', 'disguise'],
    explanation:
      'A mask smiles without eyes and wears a face that is not its own. ' +
      'It hides whoever wears it, and whoever leaves one behind has signed ' +
      'their work.',
    hint:
      'What do the players at a fair hold up to their faces? Who smiles on ' +
      'the outside and weeps behind it?',
  },
  {
    question:
      'Purpose follows me, and power follows purpose. A lie may wear my ' +
      'coat, but it cannot keep it on. I am hard to say and harder to ' +
      'hear, and I grow no lighter for being hidden. What am I?',
    answers: ['truth', 'the truth', 'a truth', 'honesty', 'true'],
    explanation:
      'Purpose follows truth, and power follows purpose. A lie can pass ' +
      'for the truth only for a while, and a hidden truth only grows ' +
      'heavier.',
    hint:
      'What did the old stone in your own woods say comes first, before ' +
      'purpose and before power?',
  },
]

/** Guardians of the Whispering Glade who test visitors with riddles, and who answer only with questions. */
export class WaterNymphs extends Character {
  riddlesCompleted = false
  currentRiddle = 0
  /** Wrong answers given to the current riddle; the hint shows from the second. */
  missCount = 0

  constructor() {
    super({
      name: 'water nymphs',
      description:
        'Three of them, or four; it is hard to count water. They sit ' +
        'waist-deep in the stream, and the stream runs through them.',
    })
  }

  /** Convert a number to its ordinal word representation. */
  private getOrdinalWord(number: number): string {
    const ordinals = ['first', 'second', 'third', 'fourth', 'fifth']
    if (number >= 1 && number <= ordinals.length) {
      return ordinals[number - 1]
    }
    return String(number) // fallback for numbers beyond our list
  }

  /**
   * Present the current riddle, or ask what more they could want once all are
   * solved and add the nymphs' remark about the thinning streams (the blight).
   */
  override talkTo(_gameState: GameState): string {
    const eventMsg = event(
      'You approach the ' + characterName(this.name) + ' by the stream.',
    )
    if (this.riddlesCompleted) {
      // After completing all riddles
      return (
        eventMsg +
        '\n' +
        speech("Back again? Wasn't three enough? What more could we ask you?") +
        '\n\n' +
        characterName(this.name) +
        ': ' +
        speech(
          'Yet the streams come down thinner from the hills this season, ' +
            'seeker. Something up there drinks before we do, and the fields ' +
            'below the city taste it first.',
        )
      )
    } else if (this.currentRiddle < RIDDLES.length) {
      // Present the current riddle
      const riddle = RIDDLES[this.currentRiddle]
      const greeting =
        this.currentRiddle === 0
          ? 'The stream rises into shapes. ' +
            speech(
              'Came all this way to stand in our water? Will you answer ' +
                'three questions, then? Here is the first.',
            )
          : speech(
              'Back so soon? Do you remember where we were? The ' +
                `${this.getOrdinalWord(this.currentRiddle + 1)} one, wasn't it?`,
            )
      return (
        eventMsg +
        '\n' +
        greeting +
        '\n\n' +
        speech(`${riddle.question}`) +
        '\n\n' +
        RIDDLE_HELP
      )
    }
    // This shouldn't happen, but just in case
    return (
      eventMsg +
      '\n' +
      speech("Back again? Wasn't three enough? What more could we ask you?")
    )
  }

  /** Process player speech for riddle answering (overrides base). */
  override sayTo(gameState: GameState, words: string): string {
    if (this.riddlesCompleted) {
      return (
        '[dim]The ' +
        characterName(this.name) +
        ` listen to '${words}' and only smile. They have no more riddles ` +
        'for you.[/dim]'
      )
    }

    if (this.currentRiddle >= RIDDLES.length) {
      return '[failure]There are no more riddles to answer.[/failure]'
    }

    const riddle = RIDDLES[this.currentRiddle]
    const wordLower = words.toLowerCase().trim()

    if (riddle.answers.includes(wordLower)) {
      // Correct answer
      this.missCount = 0
      this.currentRiddle += 1
      gameState.setStoryFlag(
        `water_nymph_riddle_${this.currentRiddle}_completed`,
        true,
      )

      if (this.currentRiddle >= RIDDLES.length) {
        this.riddlesCompleted = true
        gameState.setStoryFlag(FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED, true)

        gameState.currentRoom.items.push(new CrystalClearWater())
        gameState.currentRoom.items.push(new Moonflowers())

        return (
          `[success]Correct! '${words}' is indeed the answer. ${riddle.explanation}` +
          '[/success]\n\nThe ' +
          characterName(this.name) +
          ' laugh, a sound like water over a weir. ' +
          speech(
            'Three for three — who taught you to listen like that? Will you ' +
              'take what grows here? Who else would we give it to?',
          ) +
          '\n\n' +
          event(
            'The water nymphs draw back from the bank. The clear pool and ' +
              'the pale flowers at its edge are there for the taking.',
          )
        )
      }
      const nextRiddle = RIDDLES[this.currentRiddle]
      return (
        `[success]Correct! '${words}' is the right answer. ${riddle.explanation}` +
        '[/success]\n\nThe ' +
        characterName(this.name) +
        ' nod. ' +
        speech(
          'Did you know it, or guess it? Does it matter? What about this ' +
            'one?',
        ) +
        '\n\n' +
        speech(`${nextRiddle.question}`)
      )
    }
    this.missCount = (this.missCount || 0) + 1
    const hint = this.missCount >= 2 ? '\n\n' + speech(`${riddle.hint}`) : ''
    return (
      '[failure]The ' +
      characterName(this.name) +
      ` shake their heads gently as you say '${words}'.[/failure] ` +
      speech('Is that really what you think? Will you hear it again?') +
      '\n\n' +
      speech(`${riddle.question}`) +
      hint
    )
  }

  /** Describe the nymphs and what they do when you lean closer. */
  override examine(_gameState: GameState): string {
    return event(
      'You study the ' +
        characterName(this.name) +
        `. ${this.description} When you lean closer, every one of them ` +
        'leans closer too.',
    )
  }
}
