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
  'Your parents made the three relics, long before you were born. Mira ' +
  'says they left words behind them: by the sea, on the mountain and ' +
  'under the hills.'

/** The clues still open, in order: depths, heights, shadows. */
const OPEN_CLUES = [
  'By the sea: something they left in the Sunken Ruins.',
  'On the mountain: something they left on Mount Ember.',
  'Under the hills: something they left in the Caverns of Shadow.',
]

/** What the quest says when all three clues are found. */
const COMPLETION =
  "Your parents were not Malakar's victims. They were his closest " +
  'friends, Wardens of the Dawn like him, and when he tore at time they ' +
  'became the ward that hides you. The dragon says they are warded away, ' +
  'not dead.'

/** The opening log: the lead-in and the three open clues. */
function openingLog(): string {
  return (
    `[dim]${INTRO}[/dim]\n\n` +
    OPEN_CLUES.map((clue) => `[dim]○ ${clue}[/dim]`).join('\n')
  )
}

/** Storytelling quest to discover the truth about Elior's parents and their ward. */
export class EchoesOfTheHiddenBondQuest extends Quest {
  private discoveries: Record<string, boolean> = {}

  constructor() {
    super({
      name: 'Echoes of the Hidden Bond',
      description: openingLog(),
      completion: COMPLETION,
    })
    this.setChecklist(
      {
        intro: INTRO,
        items: OPEN_CLUES.map((text) => ({ done: false, text })),
      },
      this.description,
    )
  }

  /** Re-set the saved completion text, so an older save shows the current wording. */
  refreshText(): void {
    this.completion = COMPLETION
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
          'In the Sunken Ruins: a letter from Aren and Lysa to their friend ' +
          'Malakar, begging him not to reach for time. He wrote back: You ' +
          'would have me wait while you die.',
      },
      {
        key: 'charred_inscription',
        flag: FLAG_ACT3_CHARRED_INSCRIPTION_READ,
        text:
          'On Mount Ember: the promise the three of them burned into stone, ' +
          "one virtue each, and Malakar's name struck deeper than the others.",
      },
      {
        key: 'dragons_memory',
        flag: FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
        text:
          'In the Caverns of Shadow: the dragon remembered them. They ' +
          "poured themselves into a ward that hides you and holds Malakar's " +
          'wound shut. They are warded away, not dead.',
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
