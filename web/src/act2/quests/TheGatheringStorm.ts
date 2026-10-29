import { Quest, characterName, type GameState } from '@/engine'
import {
  QUEST_GATHERING_STORM,
  FLAG_GATHERING_STORM_COMPLETED,
  FLAG_SPOKEN_TO_SIR_CEDRIC,
  FLAG_CEDRIC_RECOGNISED_SIGIL,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SUPPLIES_QUEST_COMPLETED,
  FLAG_ANCIENT_LIBRARY_COMPLETED,
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_NYX_TRIALS_PASSED,
} from '../Act2StoryFlags'

const SIR_CEDRIC = characterName('Sir Cedric')
const NYX = characterName('Nyx')
const SPECTRAL_LIBRARIAN = characterName('Spectral Librarian')
const PROPHETIC_VISION = '[spell_name]Prophetic Vision[/spell_name]'

/** The flags behind the log's beats, in story order. */
const STORY_ORDER = [
  FLAG_SPOKEN_TO_SIR_CEDRIC,
  FLAG_CEDRIC_RECOGNISED_SIGIL,
  FLAG_DEMONSTRATED_COMBAT_SKILLS,
  FLAG_SUPPLIES_QUEST_COMPLETED,
  FLAG_ANCIENT_LIBRARY_COMPLETED,
  FLAG_RESEARCHED_FAMILY_HERITAGE,
  FLAG_CEDRIKS_HONOR_COMPLETED,
  FLAG_HERMITS_WARNING_COMPLETED,
  FLAG_NYX_TRIALS_PASSED,
]

/** The opening journal entry, which is also the quest description. */
const OPENING_ENTRY =
  'Greendale is bigger than any place you have seen, but the talk in its ' +
  'streets is low and uneasy. People speak of a darkness gathering beyond ' +
  'the walls, and say that if anyone at the castle understands it, it is ' +
  SIR_CEDRIC +
  '.'

/**
 * Act II main quest tracking the narrative arc. `checkUpdate` composes layered
 * narrative segments, dimming earlier stages while appending the newest phase.
 */
export class TheGatheringStormQuest extends Quest {
  private flagState: Record<string, boolean> = {}

  constructor() {
    super({
      name: QUEST_GATHERING_STORM,
      description: OPENING_ENTRY,
    })
  }

  /** This is the main quest for Act II. */
  override isMain(): boolean {
    return true
  }

  override checkTrigger(_gameState: GameState): boolean {
    return true // This quest is always active once Act II begins
  }

  /**
   * Bring an older save's log in order: a flag that is already set but was
   * never noted (a beat added after the save was made) is slotted in at its
   * place in the story, before the first later beat already noted, so the
   * newest beat stays the one the player reached last.
   */
  migrateOlderSave(gameState: GameState): void {
    const noted = Object.keys(this.flagState)
    for (const flag of STORY_ORDER) {
      if (noted.includes(flag) || !gameState.getStoryFlag(flag)) continue
      const later = STORY_ORDER.slice(STORY_ORDER.indexOf(flag) + 1)
      const at = noted.findIndex((n) => later.includes(n))
      noted.splice(at < 0 ? noted.length : at, 0, flag)
    }
    this.flagState = Object.fromEntries(noted.map((f) => [f, true]))
  }

  /** Record a flag the first time it is seen; true when it was new. */
  private noteFlag(flag: string): boolean {
    if (this.flagState[flag]) return false
    this.flagState[flag] = true
    return true
  }

  /**
   * Rebuild the journal: the opening entry first, then every beat whose flag
   * is set, in the order the flags were first noticed (`flagState` keeps its
   * insertion order, in saves too), so the newest beat is always the latest.
   */
  override checkUpdate(gameState: GameState): boolean {
    const beats: [string, string][] = [
      [
        FLAG_SPOKEN_TO_SIR_CEDRIC,
        SIR_CEDRIC +
          ', a knight without his sword, says a storm is gathering over the ' +
          'kingdom and he does not yet know its name. He will not trust you ' +
          'on your word; he wants to see you with a blade.',
      ],
      [
        FLAG_CEDRIC_RECOGNISED_SIGIL,
        SIR_CEDRIC +
          ' knew the sigil on your amulet: the sun rising over three linked ' +
          'rings, the mark of the Wardens of the Dawn. Whoever wore it before ' +
          'you was a Warden, he says, and your family is bound to them.',
      ],
      [
        FLAG_DEMONSTRATED_COMBAT_SKILLS,
        SIR_CEDRIC +
          ' watched you with the training sword and now trusts you. He wants ' +
          'you to find ' +
          NYX +
          ', deep in the Enchanted Forest, because her old wisdom may show ' +
          'what you are truly facing. He gave you a hundred and fifty coins ' +
          'for a survival kit, an enhanced lantern and rope from the Market ' +
          'District.',
      ],
      [
        FLAG_SUPPLIES_QUEST_COMPLETED,
        'The survival kit, the lantern and the rope are packed. The merchants of ' +
          'Greendale have done what they can for you. The rest of the road ' +
          'leads to the edge of the Enchanted Forest.',
      ],
      [
        FLAG_ANCIENT_LIBRARY_COMPLETED,
        'Beneath Greendale, the ' +
          SPECTRAL_LIBRARIAN +
          ' taught you the dispel spell. The chronicle there was written by ' +
          'the Wardens of the Dawn, and their magic was the unbinding kind. ' +
          'Its last page warns that Malakar seeks the blood of Willowbrook.',
      ],
      [
        FLAG_RESEARCHED_FAMILY_HERITAGE,
        "The castle archive's register names a man in a grey cloak who asked " +
          'after the families of Willowbrook, on the business of Malakar. You ' +
          'had always thought Malakar a tale. His last visit was the week ' +
          'King Alden vanished.',
      ],
      [
        FLAG_CEDRIKS_HONOR_COMPLETED,
        "The papers from Thorne's caravan cleared " +
          SIR_CEDRIC +
          "'s name. The watch was paid to let the king be taken, by the will " +
          'of Malakar, and he was carried to the bastion on the shattered ' +
          'ridge.',
      ],
      [
        FLAG_HERMITS_WARNING_COMPLETED,
        "At the standing stones you slept on the forest's doorstep, as the " +
          'hermit asked, and dreamed of a grey field with someone at its far ' +
          'edge. In the morning the hermit said she had let you. Somewhere ' +
          'inside the forest, ' +
          NYX +
          ' is waiting.',
      ],
      [
        FLAG_NYX_TRIALS_PASSED,
        NYX +
          ' judged you worthy and gave you the ' +
          PROPHETIC_VISION +
          ' spell, her token and the forest heart crystal. She left you with ' +
          'the words from the glade stone: power follows purpose; purpose ' +
          'follows truth. When every other task in Greendale is done, cast ' +
          'the vision with ' +
          SIR_CEDRIC +
          ' beside you, so you can both see what is coming.',
      ],
    ]
    let updated = false
    const shown = beats.filter(([flag]) => gameState.getStoryFlag(flag))
    for (const [flag] of shown) if (this.noteFlag(flag)) updated = true
    const noticed = Object.keys(this.flagState)
    shown.sort(([a], [b]) => noticed.indexOf(a) - noticed.indexOf(b))
    const stages = [OPENING_ENTRY, ...shown.map(([, text]) => `\n\n${text}`)]
    this.setJournal(stages.slice(0, -1), stages[stages.length - 1])
    return updated
  }

  /** The story flag completing this quest raises. */
  override completedFlag(): string {
    return FLAG_GATHERING_STORM_COMPLETED
  }
}
