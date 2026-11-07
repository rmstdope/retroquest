import { Quest, type GameState, type Room } from '@/engine'
import { TheDream } from '../rooms/TheDream'

/** The name of the quest, read by the map to know which task it is. */
export const KNOW_YOUR_VILLAGE = 'Know your village'

const DESCRIPTION =
  'Something pulls at you to walk every lane of Willowbrook, ' +
  'and to look properly at the places you have passed a thousand times.'
const LEAD_IN = 'You have yet to look properly at:'

/**
 * The places of the village in walking order, each with the hint line that
 * names it (in Elior's words, never a command). The order is the checklist's
 * and breaks ties between places equally far away.
 */
const PLACES: [name: string, hint: string][] = [
  [
    "Elior's Cottage",
    'You have hardly looked at your own home, ' +
      "[room_name]Elior's Cottage[/room_name], in days.",
  ],
  [
    'Village Square',
    'You have not stood in the [room_name]Village Square[/room_name] ' +
      'and watched the village go by in a long while.',
  ],
  [
    'Vegetable Field',
    'You have not walked the rows of the ' +
      '[room_name]Vegetable Field[/room_name] in a long while.',
  ],
  [
    'Chicken Coop',
    'You have not looked in on the hens at the ' +
      '[room_name]Chicken Coop[/room_name] in a long while.',
  ],
  [
    "Mira's Hut",
    "You have not gone up to [room_name]Mira's Hut[/room_name], " +
      'north of the square, in a long while.',
  ],
  [
    'General Store',
    'You have not stepped into the [room_name]General Store[/room_name] ' +
      'in a long while.',
  ],
  [
    "Blacksmith's Forge",
    'You have not stood in the heat of the ' +
      "[room_name]Blacksmith's Forge[/room_name] in a long while.",
  ],
  [
    'Village Well',
    'You have not leaned over the [room_name]Village Well[/room_name] ' +
      'in a long while.',
  ],
  [
    'Abandoned Shed',
    'You have not been near the [room_name]Abandoned Shed[/room_name] ' +
      'south of the well in years.',
  ],
  [
    'Old Mill',
    'You have not been down to the [room_name]Old Mill[/room_name] ' +
      'in a long while.',
  ],
  [
    'Riverbank',
    'You have not sat on the [room_name]Riverbank[/room_name] ' +
      'in a long while.',
  ],
  [
    'Forest Path',
    'You have not walked the [room_name]Forest Path[/room_name] ' +
      'past the river in a long while.',
  ],
  [
    'Hidden Glade',
    'South of the [room_name]Forest Path[/room_name] lies the ' +
      '[room_name]Hidden Glade[/room_name], where you have never once stood.',
  ],
  [
    'Village Chapel',
    'You have not sat in the [room_name]Village Chapel[/room_name] ' +
      'in a long while.',
  ],
  [
    'Road to Greendale',
    'You have not walked out to where the ' +
      '[room_name]Road to Greendale[/room_name] leaves the village ' +
      'in a long while.',
  ],
]

/**
 * Side quest: visit every room of Willowbrook. Its log is a checklist of the
 * places, and its hint names the unvisited one nearest to Elior; both are read
 * from `visitedRooms`, so a loaded save shows the same.
 */
export class KnowYourVillageQuest extends Quest {
  constructor() {
    super({
      name: KNOW_YOUR_VILLAGE,
      description: DESCRIPTION,
      completion:
        'You have walked every corner of Willowbrook. ' +
        'The pull has gone quiet, and the village feels like home.',
    })
  }

  /**
   * The village's places Elior has not visited, in walking order. The dream
   * the act opens with is not a corner of Willowbrook and does not count.
   */
  static unvisited(gameState: GameState): Room[] {
    return Object.values(gameState.allRooms)
      .filter(
        (room) =>
          !(room instanceof TheDream) &&
          !gameState.visitedRooms.includes(room.name),
      )
      .sort((a, b) => walkingIndex(a) - walkingIndex(b))
  }

  /**
   * The unvisited place fewest steps from where Elior stands, over the exits
   * open now; a place no open exit reaches ranks last. Ties go to the earlier
   * place in walking order. Null when every place has been visited.
   */
  static nearestUnvisited(gameState: GameState): Room | null {
    const steps = stepsFrom(gameState)
    let nearest: Room | null = null
    for (const room of KnowYourVillageQuest.unvisited(gameState)) {
      if (nearest === null || stepsTo(steps, room) < stepsTo(steps, nearest))
        nearest = room
    }
    return nearest
  }

  /** Triggered when the player leaves Elior's Cottage for the first time. */
  override checkTrigger(gameState: GameState): boolean {
    return gameState.visitedRooms.length > 1
  }

  /** Keep the checklist current; ticks are never news, so always false. */
  override checkUpdate(gameState: GameState): boolean {
    this.refreshChecklist(gameState)
    return false
  }

  /**
   * Completed when every room of the village has been visited; the checklist
   * is brought up to date first so a finished log shows every place ticked.
   */
  override checkCompletion(gameState: GameState): boolean {
    this.refreshChecklist(gameState)
    return KnowYourVillageQuest.unvisited(gameState).length === 0
  }

  /** Names the nearest unvisited place in Elior's words; nothing once all are visited. */
  override hint(gameState: GameState): string | null {
    const nearest = KnowYourVillageQuest.nearestUnvisited(gameState)
    if (nearest === null) return null
    return PLACES.find(([name]) => name === nearest.name)?.[1] ?? null
  }

  /** Set the checklist: every place in walking order, ticked when visited. */
  private refreshChecklist(gameState: GameState): void {
    const items = PLACES.map(([name]) => ({
      done: gameState.visitedRooms.includes(name),
      text: name,
    }))
    const intro = `${DESCRIPTION}\n${LEAD_IN}`
    const lines = items.map(({ done, text }) => {
      const tag = done ? 'success' : 'pending'
      return `[${tag}] * ${text}[/${tag}]`
    })
    this.setChecklist({ intro, items }, `${intro}\n${lines.join('\n')}`)
  }
}

/** The room's place in walking order; unknown rooms sort last. */
function walkingIndex(room: Room): number {
  const index = PLACES.findIndex(([name]) => name === room.name)
  return index < 0 ? PLACES.length : index
}

/** Steps from the current room to each room (by name), over the open exits. */
function stepsFrom(gameState: GameState): Record<string, number> {
  const steps: Record<string, number> = { [gameState.currentRoom.name]: 0 }
  const queue: Room[] = [gameState.currentRoom]
  for (let room = queue.shift(); room; room = queue.shift()) {
    for (const key of Object.values(room.getExits(gameState))) {
      const next = gameState.allRooms[key]
      if (next && steps[next.name] === undefined) {
        steps[next.name] = steps[room.name] + 1
        queue.push(next)
      }
    }
  }
  return steps
}

/** Steps to a room, or infinity when no open exit reaches it. */
function stepsTo(steps: Record<string, number>, room: Room): number {
  return steps[room.name] ?? Infinity
}
