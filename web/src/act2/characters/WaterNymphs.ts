import { Character, type GameState } from '@/engine'
import { CrystalClearWater } from '../items/CrystalClearWater'
import { Moonflowers } from '../items/Moonflowers'
import { FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED } from '../Act2StoryFlags'

/** One of the nymphs' riddles: the question, accepted answers and the explanation. */
interface Riddle {
  question: string
  answers: string[]
  explanation: string
}

/** Ethereal guardians of the Whispering Glade who test visitors with riddles. */
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
        'Graceful ethereal beings who dwell in the sacred waters of the ' +
        'Whispering Glade. Their forms seem to be made of living water and ' +
        'moonlight, constantly shifting between transparency and solidity. ' +
        'Their voices sound like the gentle babbling of streams mixed with ' +
        'wind chimes, and their eyes hold the wisdom of countless seasons. ' +
        'These ancient guardians are known to test visitors with riddles ' +
        "that reveal the true depth of one's connection to the natural world.",
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

  /** Present the current riddle, or praise the player once all are solved. */
  override talkTo(_gameState: GameState): string {
    const eventMsg =
      `[event]You approach the [character_name]${this.name}[/character_name] ` +
      'by the sacred stream.[/event]'
    if (this.riddlesCompleted) {
      // After completing all riddles
      return (
        eventMsg +
        '\n' +
        (`The [character_name]${this.name}[/character_name] ` +
          "shimmer with approval. [dialogue]'You have proven your wisdom and " +
          "understanding of the forest's ways, young seeker. The sacred " +
          'gifts are yours to take - the crystal-clear water and moonflowers ' +
          'that grow here. Use them wisely in your quest to protect the ' +
          "natural world.'[/dialogue]")
      )
    } else if (this.currentRiddle < this.riddles.length) {
      // Present the current riddle
      const riddle = this.riddles[this.currentRiddle]
      return (
        eventMsg +
        '\n' +
        (`The [character_name]${this.name}[/character_name] ` +
          'speak in harmonious, flowing voices like water over stones. ' +
          "[dialogue]'Welcome, forest walker, to our sacred glade. To prove your " +
          'wisdom and earn our trust, you must answer our riddles three. ' +
          'Listen carefully to the ' +
          `${this.getOrdinalWord(this.currentRiddle + 1)} riddle:'[/dialogue]`) +
        '\n\n' +
        `[dialogue]'${riddle.question}'[/dialogue]\n\n` +
        ('[dim]Think carefully and speak your answer when you believe you ' +
          "know it. Use the command 'say <your_answer> to water nymphs' to " +
          'give your solution.[/dim]')
      )
    }
    // This shouldn't happen, but just in case
    return (
      eventMsg +
      '\n' +
      (`The [character_name]${this.name}[/character_name] ` +
        "smile mysteriously. [dialogue]'The riddles have been answered, young " +
        "one.'[/dialogue]")
    )
  }

  /** Process player speech for riddle answering (overrides base). */
  override sayTo(gameState: GameState, words: string): string {
    if (this.riddlesCompleted) {
      return (
        `[dim]The [character_name]${this.name}[/character_name] have ` +
        'already accepted your wisdom. ' +
        `They listen to your words '${words}' with gentle understanding ` +
        'but have no more riddles for you.[/dim]'
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
          `[success]Correct! '${words}' is indeed the answer. ` +
          `${riddle.explanation}[/success]\n\n` +
          (`The [character_name]${this.name}[/character_name] ` +
            "sing in harmonious delight. [dialogue]'Wisely spoken, all three riddles " +
            'answered! You have proven your deep understanding of the ' +
            "forest's mysteries. Accept our gifts - the crystal-clear water " +
            'and moonflowers that grow in this sacred place. May they ' +
            "serve you well in your noble quest.'[/dialogue]") +
          '\n\n' +
          ('[event]The water nymphs gesture toward the stream and flowers, ' +
            'making them accessible for you to take.[/event]')
        )
      }
      const nextRiddle = this.riddles[this.currentRiddle]
      return (
        `[success]Correct! '${words}' is the right answer. ` +
        `${riddle.explanation}[/success]\n\n` +
        (`The [character_name]${this.name}[/character_name] ` +
          "nod approvingly. [dialogue]'Well spoken! Now for the " +
          `${this.getOrdinalWord(this.currentRiddle + 1)} riddle:'` +
          '[/dialogue]') +
        '\n\n' +
        `[dialogue]'${nextRiddle.question}'[/dialogue]`
      )
    }
    return (
      `[failure]The [character_name]${this.name}[/character_name] ` +
      `shake their heads gently as you say '${words}'.[/failure] ` +
      "[dialogue]'Not quite, young seeker. Think more deeply about the forest " +
      'and its ways. The answer lies in understanding the natural ' +
      "world around you.'[/dialogue]\n\n" +
      `[dialogue]'${riddle.question}'[/dialogue]\n\n` +
      ("[dim]Consider what you've learned about the forest during your " +
        'journey.[/dim]')
    )
  }

  /** Describe the nymphs' ethereal appearance. */
  override examine(_gameState: GameState): string {
    return (
      `[event]You study the [character_name]${this.name}[/character_name] ` +
      `in wonder. ${this.description} They move with fluid grace, and you can ` +
      'see the wisdom of ages in their ever-changing features. These are ' +
      "ancient guardians of the forest's deepest secrets.[/event]"
    )
  }
}
