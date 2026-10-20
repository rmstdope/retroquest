import { Quest, type GameState } from '@/engine'
import {
  FLAG_ACT3_ECHOES_QUEST_STARTED,
  FLAG_ACT3_SEA_SEALED_LETTER_READ,
  FLAG_ACT3_CHARRED_INSCRIPTION_READ,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_ECHOES_QUEST_COMPLETED,
} from '../Act3StoryFlags'

/** The lead-in of the clue list. */
const INTRO =
  'Your parents once walked these same paths in their own desperate ' +
  'search for the three relics. As you face the trials they faced, ' +
  'you may discover traces of their passage.'

/** The clues still open, in order: depths, heights, shadows. */
const OPEN_CLUES = [
  'In the depths where courage is tested, echoes of the past linger.',
  'On the heights where wisdom burns, their words may still echo.',
  'In the shadows where sacrifice dwells, ancient memories await.',
]

/** Storytelling quest to discover the truth about Elior's parents and their ward. */
export class EchoesOfTheHiddenBondQuest extends Quest {
  private discoveries: Record<string, boolean> = {}

  constructor() {
    super({
      name: 'Echoes of the Hidden Bond',
      description:
        'Your parents once walked these same paths in their own desperate ' +
        'search for the three relics. As you face the trials they faced, ' +
        'you may discover traces of their passage—fragments of their story ' +
        'left behind in the depths, heights, and shadows where they sought ' +
        'to forge a protection that would outlast their own lives.\n\n' +
        '○ In the depths where courage is tested, echoes of the past linger.\n' +
        '○ On the heights where wisdom burns, their words may still echo.\n' +
        '○ In the shadows where secrets are kept, their choices may still resonate.\n',
      completion:
        "The three testimonies have revealed the truth: Elior's parents, " +
        'once apprentices to Malakar, defied their master to protect their ' +
        'son. Through sacrifice and ancient wards, they hid Elior from ' +
        "Malakar's sight, ensuring he would grow strong enough to face " +
        'the darkness when the time came.',
    })
    this.setChecklist(
      {
        intro: INTRO,
        // Matches the opening description above, whose last clue is worded
        // differently from the one `checkUpdate` shows; the next update poll
        // replaces it.
        items: [
          OPEN_CLUES[0],
          OPEN_CLUES[1],
          'In the shadows where secrets are kept, their choices may still resonate.',
        ].map((text) => ({ done: false, text })),
      },
      this.description,
    )
  }

  /** Return false as this is a storytelling side quest. */
  override isMain(): boolean {
    return false
  }

  /** Check if quest should trigger when Mira gives the keepsake note. */
  override checkTrigger(gameState: GameState): boolean {
    // For now, trigger immediately when Act III main quest starts
    // In a full implementation, this would trigger when Mira gives a keepsake note
    return gameState.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_STARTED)
  }

  /** Check if quest description should update based on discoveries. */
  override checkUpdate(gameState: GameState): boolean {
    let updated = false

    // The prose form of each clue, for readers of the description.
    const baseDesc = `[dim]${INTRO}[/dim]`
    const items: { done: boolean; text: string }[] = []
    const lines: string[] = []

    const found = [
      {
        key: 'sea_letter',
        flag: FLAG_ACT3_SEA_SEALED_LETTER_READ,
        text:
          "Depths of the Sunken Ruins: You found traces of your parents' " +
          "first passage, revealing their past as Malakar's apprentices and " +
          'the moment they chose to defy him.',
      },
      {
        key: 'charred_inscription',
        flag: FLAG_ACT3_CHARRED_INSCRIPTION_READ,
        text:
          "Heights of Mount Ember: You discovered your parents' words " +
          'burned into stone, describing the protective ward they forged ' +
          'through fire and sacrifice.',
      },
      {
        key: 'dragons_memory',
        flag: FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
        text:
          'Shadows of the Caverns: The ancient dragon shared memories ' +
          "of your parents' final act, naming them and the completion of " +
          'their ward.',
      },
    ]
    found.forEach(({ key, flag, text }, index) => {
      const done = gameState.getStoryFlag(flag)
      if (done && !this.discoveries[key]) {
        this.discoveries[key] = true
        updated = true
      }
      const open = OPEN_CLUES[index]
      items.push({ done, text: done ? text : open })
      lines.push(done ? `✓ ${text}` : `[dim]○ ${open}[/dim]`)
    })

    this.setChecklist(
      { intro: INTRO, items },
      baseDesc + '\n\n' + lines.join('\n'),
    )

    return updated
  }

  /** Check if quest is completed when all three testimonies are found. */
  override checkCompletion(gameState: GameState): boolean {
    const allFound =
      gameState.getStoryFlag(FLAG_ACT3_SEA_SEALED_LETTER_READ) &&
      gameState.getStoryFlag(FLAG_ACT3_CHARRED_INSCRIPTION_READ) &&
      gameState.getStoryFlag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED)

    if (allFound && !gameState.getStoryFlag(FLAG_ACT3_ECHOES_QUEST_COMPLETED)) {
      gameState.setStoryFlag(FLAG_ACT3_ECHOES_QUEST_COMPLETED, true)
      return true
    }

    return false
  }
}
