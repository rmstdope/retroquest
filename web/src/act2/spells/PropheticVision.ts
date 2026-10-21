import { Spell, type GameState, characterName, dialogue, event } from '@/engine'
import { FLAG_GATHERING_STORM_COMPLETED } from '../Act2StoryFlags'
import { SirCedric } from '../characters/SirCedric'

/** Cedric's sentence for each unfinished side quest he can name, by quest name. */
const ERRAND_SENTENCES: Record<string, string> = {
  "The Knight's Test": 'You have not yet shown me what you can do in the yard.',
  'Supplies for the Journey':
    'You have not yet laid in the supplies for the forest.',
  'Echoes of the Past':
    "The archive in the Great Hall still has your family's story to give up.",
  "The Healer's Apprentice":
    'Master Healer Lyria is still waiting to finish your training.',
  'The Ancient Library':
    'The library beneath Greendale still keeps its secrets from you.',
  "The Innkeeper's Daughter":
    'Elena at the Silver Stag still carries her curse.',
  "Cedric's Lost Honor": 'My own name is not yet cleared.',
  "The Merchant's Lost Caravan":
    "Thorne's merchants are still lost somewhere in the forest.",
  "The Hermit's Warning":
    "The hermit at the forest's edge asked you to make ready, and you have not.",
  'Whispers in the Wind':
    'The spirits of the Whispering Glade have not yet been found.',
  "The Forest Guardian's Riddles":
    "The guardians' riddles are still unanswered.",
}

/**
 * Ultimate divination spell concluding Act II foresight quest progression.
 * The first cast with Sir Cedric present completes the Gathering Storm quest
 * and shows the vision of the village, the robed figure and the dream voice;
 * later casts return a shorter variant.
 */
export class PropheticVision extends Spell {
  constructor() {
    super({
      id: 'prophetic_vision',
      name: 'prophetic vision',
      description:
        'A powerful divination spell that allows the caster to glimpse possible futures ' +
        'and see the threads of fate.',
    })
  }

  /** Cast the prophetic vision; variant depends on Cedric presence and story flags. */
  override castSpell(gameState: GameState): string {
    // Check if Sir Cedric is present in the current room
    const cedricPresent = gameState.currentRoom.characters.some(
      (char) => char instanceof SirCedric,
    )
    if (!cedricPresent) {
      return (
        '[dim]As you begin to cast the prophetic vision spell, you sense that the ' +
        'visions would be most meaningful if shared with someone who can act upon the ' +
        'knowledge. You should use this spell together with Sir Cedric, who has the ' +
        'authority and wisdom to prepare for the threats that the visions reveal.[/dim]'
      )
    }

    if (!gameState.getStoryFlag(FLAG_GATHERING_STORM_COMPLETED)) {
      const sideQuests = [
        ...gameState.nonActivatedQuests,
        ...gameState.activatedQuests,
        ...gameState.completedQuests,
      ].filter((quest) => !quest.isMain())
      if (
        !sideQuests.every((quest) => gameState.isQuestCompleted(quest.name))
      ) {
        return this.cedricRefusal(gameState)
      }

      // First casting - complete The Gathering Storm quest
      gameState.setStoryFlag(FLAG_GATHERING_STORM_COMPLETED, true)
      return (
        event(
          this.visionOpening(gameState) +
            '\n\n' +
            'A village at dusk, its roofs low and familiar. Beyond it, a field ' +
            'withered to grey stalks, the way yours was the morning all this ' +
            "began. And at the field's edge, a robed figure, its face lost in " +
            'shadow, reaching one hand toward you as if across a great ' +
            'distance.\n\n' +
            'Then the voice from your dream, the one that called your name on ' +
            'the night of the storm: [italic]“Elior… how you have grown. Do ' +
            'not be afraid of me.”[/italic] It is closer than it was. You do ' +
            'not know whose it is, only that you have heard it before, long ' +
            'before the dream.\n\n' +
            "The vision fades. Sir Cedric's expression has grown grave.",
        ) +
        '\n\n' +
        dialogue(
          'Sir Cedric',
          'Then Malakar is no tale, and it is you he is hunting.',
        ) +
        '\n\n' +
        'All your life, Malakar has been a name from old books, a story told ' +
        'to frighten children. But the agents asking after the Willowbrook ' +
        'bloodline, the seal on the [item_name]Secret Documents[/item_name], ' +
        'the figure reaching for you in the vision: they all point the same ' +
        'way. Malakar is real, and the bloodline he seeks is yours.\n\n' +
        `${characterName('Sir Cedric')} rests a hand on his sword. ` +
        '"Wherever this road leads, you will not walk it alone." ' +
        '[bold]Act II is complete.[/bold] The storm has a name now.'
      )
    }

    return event(
      'You cast the prophetic vision spell, and brief glimpses of ' +
        'possible futures dance before your eyes. The gift of foresight ' +
        'reminds you that every choice creates ripples through the ' +
        'tapestry of time, and wisdom lies in understanding the ' +
        'consequences of your actions.',
    )
  }

  /**
   * The opening of the first shared vision: Elior holds out the Forest Heart
   * Crystal when he carries it, otherwise the plain casting.
   */
  private visionOpening(gameState: GameState): string {
    if (gameState.hasItem('forest heart crystal')) {
      return (
        'You take the [item_name]Forest Heart Crystal[/item_name] from your ' +
        'pack and hold it out between you and ' +
        characterName('Sir Cedric') +
        '. The tiny lights inside it gather, brighten, and spill outward, ' +
        'and the vision rises out of the crystal for both of you to see:'
      )
    }
    return (
      'You close your eyes and reach out with your newly granted sight ' +
      'beyond sight. With ' +
      characterName('Sir Cedric') +
      ' standing beside you, you share the vision as it rises before you:'
    )
  }

  /**
   * Sir Cedric's in-character refusal to hear the vision while side quests
   * remain: names each started, unfinished errand in journal order, hints at
   * errands not yet found without naming them, and never reveals the vision.
   */
  private cedricRefusal(gameState: GameState): string {
    const started = gameState.activatedQuests
      .filter((quest) => !quest.isMain())
      .map((quest) => ERRAND_SENTENCES[quest.name])
      .filter((sentence): sentence is string => sentence !== undefined)
    const hasUnfound = gameState.nonActivatedQuests.some(
      (quest) => !quest.isMain(),
    )
    const stage =
      'The vision has barely begun to stir when ' +
      `${characterName('Sir Cedric')} lays a hand on your arm.`

    let words: string
    if (started.length === 0) {
      words =
        'Not yet. There is more out there that has not yet found you, and I ' +
        'would not have us leave it behind. Find it, and then show me.'
    } else {
      const single = started.length === 1 && !hasUnfound
      const parts = [
        single
          ? 'Not yet. One promise is still unkept.'
          : 'Not yet. Whatever you have seen, I would hear it with our ' +
            'promises kept, not with work still undone.',
        ...started,
      ]
      if (hasUnfound) {
        parts.push(
          'And I would wager there is more out there that has not yet found you.',
        )
      }
      parts.push(
        started.length === 1
          ? 'See to it, and then show me.'
          : 'See to them, and then show me.',
      )
      words = parts.join(' ')
    }
    return `${stage}\n\n${dialogue('Sir Cedric', `"${words}"`)}`
  }
}
