import { Item, type GameState, characterName, speech, clue } from '@/engine'
import {
  FLAG_FOUND_RUNE_TOKEN,
  FLAG_KEPT_MOTHERS_RING,
  FLAG_MIRA_NAMED_FOULING_SIGIL,
  FLAG_PATCHES_RETURNED,
  FLAG_PATCHES_STAYED_WITH_GRANDMOTHER,
  FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED,
} from '../Act1StoryFlags'

/** The name of the quest that is counted apart from the side quests. */
const PREPARATION_QUEST = 'Preparing for the road'

/** What leads Elior to a side quest he never started, in two wordings. */
export interface RoadLead {
  /** The side quest this leads to. */
  quest: string
  /** The words in the map's refusal. */
  map: string
  /** The words in the main quest's hint, ready to follow its frame. */
  hint: string
}

/** One lead per missable side quest, in the order the act meets them. */
const ROAD_LEADS: RoadLead[] = [
  {
    quest: 'Curiosity killed the cat',
    map: `Old Man ${characterName('Hemlock')} is still waiting for his cat`,
    hint: `Old Man ${characterName('Hemlock')} is still waiting for his cat.`,
  },
  {
    quest: 'Fishing expedition',
    map:
      `the ${characterName('fisherman')} at the river bend still sits ` +
      'with an empty line',
    hint:
      `the ${characterName('fisherman')} at the river bend still sits ` +
      'with an empty line.',
  },
  {
    quest: 'Let there be light',
    map: `the ${characterName('priest')} in the chapel has not had his say`,
    hint: `the ${characterName('priest')} in the chapel has not had his say.`,
  },
  {
    quest: 'Magnet fishing expedition',
    map: 'something still glints far down in the village [item_name]well[/item_name]',
    hint: 'far down in the [item_name]well[/item_name], something still glints.',
  },
  {
    quest: 'Oh deer, oh deer',
    map:
      `${characterName('Borin')} at the forge still has a story about the ` +
      '[room_name]Hidden Glade[/room_name] to tell',
    hint:
      `${characterName('Borin')} at the forge still has a story about the ` +
      '[room_name]Hidden Glade[/room_name] to tell.',
  },
  {
    quest: 'The faded photograph',
    map: 'a drawer at home still holds something you have not seen',
    hint: 'a drawer at home still holds something you have not seen.',
  },
]

/**
 * The revelation in the farewell: grandmother names Elior's parents for the
 * first time, says the amulet was theirs and warns that someone is looking for it.
 */
function revelation(): string {
  return (
    'Her hand finds the [item_name]amulet[/item_name] at your chest and ' +
    'closes around it.\n' +
    speech(
      `This was theirs, you know. ${characterName('Aren')} and ` +
        `${characterName('Lysa')}'s.`,
    ) +
    '\nIn all your years, you have never once heard her say their names.\n' +
    speech(
      `They gave it to ${characterName('Mira')} to keep for you, until you ` +
        'were ready. And someone has come to Willowbrook looking for it. ' +
        'Keep it hidden, child.',
    )
  )
}

/**
 * The farewell on the Road to Greendale that ends Act I: grandmother has
 * walked out to see Elior off, with a word on the ring and on Patches that
 * follows his choices; then the chapel bell rings once by itself.
 */
function farewell(gameState: GameState): string {
  const ringLine = gameState.getStoryFlag(FLAG_KEPT_MOTHERS_RING)
    ? speech('And you kept her ring. Good. Let a little of her go with you.')
    : speech(
        `The ${characterName('merchant')} showed me the ring he had of you. ` +
          "It was your mother's wedding ring, child. No, don't fret; " +
          "she'd have given it for your boots in a heartbeat.",
      )
  let patchesLine = ''
  if (gameState.getStoryFlag(FLAG_PATCHES_STAYED_WITH_GRANDMOTHER)) {
    patchesLine = speech(
      `And don't you worry about ${characterName('Patches')}. ` +
        "She's already claimed your pillow.",
    )
  } else if (gameState.getStoryFlag(FLAG_PATCHES_RETURNED)) {
    patchesLine = speech(
      `Old ${characterName('Hemlock')} is telling the whole square ` +
        `how you found his ${characterName('Patches')}.`,
    )
  }
  return (
    'Footsteps hurry along the road behind you.\n' +
    `Your ${characterName('grandmother')} has walked all the way out from ` +
    'the village. She tugs the [item_name]travel cloak[/item_name] straight ' +
    'on your shoulders. ' +
    speech("Wear your mother's cloak. She'd want you warm.") +
    '\n' +
    ringLine +
    (patchesLine ? '\n' + patchesLine : '') +
    '\n' +
    revelation() +
    '\nShe kisses your brow, and turns for home before you can see her cry.\n' +
    'As you look back at Willowbrook, the chapel bell rings once, ' +
    'with no hand on the rope.'
  )
}

/**
 * Player-held world map enabling Act I completion in the correct context.
 * (Python class `Map`; named `GameMap` here so it does not shadow the global `Map`.)
 */
export class GameMap extends Item {
  constructor() {
    super({
      name: 'map',
      description:
        'A detailed map of Willowbrook and the surrounding areas. It shows various ' +
        'landmarks and paths, some of which are not immediately obvious.',
      canBeCarried: true,
    })
  }

  /**
   * What still keeps Elior in Willowbrook, in the words the map's refusal
   * uses; empty when the act may end. The one readiness rule of Act I's end,
   * read by the map and by the main quest's hint. A rune token Mira has not
   * read keeps Elior here, since the act's ending tells what she read in it.
   */
  static unfinishedBeforeTheRoad(gameState: GameState): string[] {
    const missingRequirements: string[] = []
    if (!gameState.hasItem('ancient amulet')) {
      missingRequirements.push('the amulet Mira still keeps for you')
    }
    if (
      gameState.getStoryFlag(FLAG_FOUND_RUNE_TOKEN) &&
      !gameState.getStoryFlag(FLAG_MIRA_NAMED_FOULING_SIGIL)
    ) {
      missingRequirements.push('the rune token Mira has not yet seen')
    }
    if (!gameState.isQuestCompleted(PREPARATION_QUEST)) {
      missingRequirements.push('your preparations for the road')
    }
    if (GameMap.hasBegunOpenTask(gameState)) {
      missingRequirements.push('the tasks you began in the village')
    }
    missingRequirements.push(
      ...GameMap.unstartedLeads(gameState).map((lead) => lead.map),
    )
    return missingRequirements
  }

  /** True while a side quest Elior began is still open. */
  static hasBegunOpenTask(gameState: GameState): boolean {
    return gameState.activatedQuests.some(
      (quest) => !quest.isMain() && quest.name !== PREPARATION_QUEST,
    )
  }

  /**
   * The leads of the side quests Elior never started, in the order the act
   * meets them: each in the words of the map's refusal and of the hint.
   */
  static unstartedLeads(gameState: GameState): RoadLead[] {
    return ROAD_LEADS.filter(({ quest }) =>
      gameState.nonActivatedQuests.some((open) => open.name === quest),
    )
  }

  /**
   * On the Road to Greendale, once Elior is ready, plays the farewell scene
   * and completes the act; elsewhere, or when not ready, only describes the map.
   */
  override use(gameState: GameState): string {
    if (gameState.currentRoom.name.toLowerCase() === 'road to greendale') {
      const missingRequirements = GameMap.unfinishedBeforeTheRoad(gameState)
      if (missingRequirements.length > 0) {
        const last = missingRequirements.pop()
        const unfinished =
          missingRequirements.length > 0
            ? `${missingRequirements.join(', ')} and ${last}`
            : `${last}`
        return clue(
          'The map stays a plain map of Willowbrook. The hidden road ' +
            'will not show itself while something here is unfinished: ' +
            `${unfinished}.`,
        )
      }

      gameState.setStoryFlag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED, true)
      return (
        farewell(gameState) +
        '\n' +
        `The [item_name]${this.name}[/item_name] aligns with the landscape,` +
        ' revealing a ' +
        'hidden path that shortens the journey to Greendale. ' +
        "You tuck your parents' amulet beneath your mother's cloak, and set forth."
      )
    }
    return (
      `The [item_name]${this.name}[/item_name] depicts the local area with ` +
      'surprising detail.'
    )
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'You fold it so the village is on top. ' +
      'Some of the paths on it you have never walked.'
    )
  }
}
