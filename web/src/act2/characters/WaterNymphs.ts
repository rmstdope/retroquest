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

/** One of the nymphs' riddles: the question, accepted answers and the explanation. */
interface Riddle {
  question: string
  answers: string[]
  explanation: string
}

/** Guardians of the Whispering Glade who test visitors with riddles, and who answer only with questions. */
export class WaterNymphs extends Character {
  riddlesCompleted = false
  currentRiddle = 0
  riddles: Riddle[] = [
    {
      question:
        'I stand tall and proud, my arms reaching skyward, and sing without ' +
        'voice. The older I become, the more rings I show. What am I?',
      answers: ['tree', 'trees', 'forest'],
      explanation:
        'A tree grows from earth but reaches toward sky, sings in the wind, ' +
        'and shows age through rings.',
    },
    {
      question:
        "I am the forest's blood that flows without wound, the sky's gift " +
        'that falls without being thrown. I give life yet can take it, ' +
        'am soft yet can carve stone. What am I?',
      answers: ['water'],
      explanation:
        'Water is the lifeblood of the forest, falls as rain, nurtures life ' +
        'but can flood, and over time carves through stone.',
    },
    {
      question:
        'We are many yet one, small yet mighty, busy yet patient. We ' +
        'build without hands, work without rest, and turn death into life. ' +
        'What are we?',
      answers: [
        'insect',
        'insects',
        'bug',
        'bugs',
        'ant',
        'ants',
        'beetle',
        'beetles',
      ],
      explanation:
        'Insects work as colonies, build complex structures, decompose ' +
        'matter, and are essential to the forest ecosystem.',
    },
  ]

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
        speech(
          "'Back again? Wasn't three enough? What more could we ask you?'",
        ) +
        '\n\n' +
        characterName(this.name) +
        ': ' +
        speech(
          'Yet the streams come down thinner from the hills this season, ' +
            'seeker. Something up there drinks before we do, and the fields ' +
            'below the city taste it first.',
        )
      )
    } else if (this.currentRiddle < this.riddles.length) {
      // Present the current riddle
      const riddle = this.riddles[this.currentRiddle]
      const greeting =
        this.currentRiddle === 0
          ? 'The stream rises into shapes. ' +
            speech(
              "'Came all this way to stand in our water? Will you answer " +
                "three questions, then? Here is the first.'",
            )
          : speech(
              "'Back so soon? Do you remember where we were? The " +
                `${this.getOrdinalWord(this.currentRiddle + 1)} one, wasn't it?'`,
            )
      return (
        eventMsg +
        '\n' +
        greeting +
        '\n\n' +
        speech(`'${riddle.question}'`) +
        '\n\n' +
        RIDDLE_HELP
      )
    }
    // This shouldn't happen, but just in case
    return (
      eventMsg +
      '\n' +
      speech("'Back again? Wasn't three enough? What more could we ask you?'")
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

    if (this.currentRiddle >= this.riddles.length) {
      return '[failure]There are no more riddles to answer.[/failure]'
    }

    const riddle = this.riddles[this.currentRiddle]
    const wordLower = words.toLowerCase().trim()

    if (riddle.answers.includes(wordLower)) {
      // Correct answer
      this.currentRiddle += 1
      gameState.setStoryFlag(
        `water_nymph_riddle_${this.currentRiddle}_completed`,
        true,
      )

      if (this.currentRiddle >= this.riddles.length) {
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
            "'Three for three — who taught you to listen like that? Will you " +
              "take what grows here? Who else would we give it to?'",
          ) +
          '\n\n' +
          event(
            'The water nymphs draw back from the bank. The clear pool and ' +
              'the pale flowers at its edge are there for the taking.',
          )
        )
      }
      const nextRiddle = this.riddles[this.currentRiddle]
      return (
        `[success]Correct! '${words}' is the right answer. ${riddle.explanation}` +
        '[/success]\n\nThe ' +
        characterName(this.name) +
        ' nod. ' +
        speech(
          "'Did you know it, or guess it? Does it matter? What about this " +
            "one?'",
        ) +
        '\n\n' +
        speech(`'${nextRiddle.question}'`)
      )
    }
    return (
      '[failure]The ' +
      characterName(this.name) +
      ` shake their heads gently as you say '${words}'.[/failure] ` +
      speech("'Is that really what you think? Will you hear it again?'") +
      '\n\n' +
      speech(`'${riddle.question}'`) +
      "\n\n[dim]Consider what you've learned about the forest during your " +
      'journey.[/dim]'
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
