import type { Item } from './Item'
import { isNamed } from './itemNames'
import type { Quest } from './Quest'
import type { Room } from './Room'
import type { Spell } from './Spell'

/** The quests that changed while settling, grouped by kind of change. */
export interface QuestChanges {
  /** Quests that were activated, in the order they started. */
  activated: Quest[]
  /** Active quests whose log changed. */
  updated: Quest[]
  /** Quests that were completed, in the order they finished. */
  completed: Quest[]
}

/** A sound trigger the game fired: the key of the room it was fired in and its name. */
export interface SoundFiring {
  roomKey: string
  trigger: string
}

/**
 * The mutable state of the act being played: where the player is, what they
 * carry and know, which rooms they have seen, story flags and quest progress.
 */
export class GameState {
  currentRoom: Room
  allRooms: Record<string, Room>
  /** One entry per carried item; several equal items are shown as a count. */
  inventory: Item[] = []
  /** Display names of the rooms the player has been in, in order. */
  visitedRooms: string[]
  knownSpells: Spell[] = []
  storyFlags: Record<string, boolean> = {}
  nonActivatedQuests: Quest[]
  activatedQuests: Quest[] = []
  completedQuests: Quest[] = []
  /**
   * The virtue moments the player has chosen so far. Unlike the rest of the
   * state it is carried into the next act's state; acts name their virtues
   * with constants.
   */
  virtues: string[] = []
  /**
   * The sound triggers fired since the UI last took them. Declared without a
   * value so that saves made before it existed still load; `fireSound` makes it.
   */
  firedSounds?: SoundFiring[]

  constructor(
    startingRoom: Room,
    allRooms: Record<string, Room>,
    allQuests: Quest[],
  ) {
    this.currentRoom = startingRoom
    this.allRooms = allRooms
    this.visitedRooms = [startingRoom.name]
    this.nonActivatedQuests = [...allQuests]
  }

  /**
   * Fires the sound trigger `trigger` in the room the player is in, for the
   * scene's effects that the mix binds to it. A name the room does not declare
   * (`Room.soundTriggers`) is ignored.
   */
  fireSound(trigger: string): void {
    const room = this.currentRoom
    if (!room.soundTriggers().includes(trigger)) return
    const here = Object.entries(this.allRooms).find(([, r]) => r === room)
    if (!here) return
    this.firedSounds = [
      ...(this.firedSounds ?? []),
      { roomKey: here[0], trigger },
    ]
  }

  /** The sound triggers fired since the last call, oldest first; the queue is emptied. */
  takeFiredSounds(): SoundFiring[] {
    const fired = this.firedSounds ?? []
    this.firedSounds = undefined
    return fired
  }

  markVisited(room: Room): void {
    if (!this.visitedRooms.includes(room.name))
      this.visitedRooms.push(room.name)
  }

  setStoryFlag(flagName: string, value: boolean): void {
    this.storyFlags[flagName] = value
  }

  /**
   * Records one virtue moment. Every call counts, so each moment must be
   * recorded once by its own guard (a flag or a state change).
   */
  addVirtue(virtue: string): void {
    this.virtues.push(virtue)
  }

  /** How many moments of the virtue have been recorded, in this or an earlier act. */
  virtueCount(virtue: string): number {
    return this.virtues.filter((v) => v === virtue).length
  }

  /** True when the virtue has been recorded in this or an earlier act. */
  hasVirtue(virtue: string): boolean {
    return this.virtues.includes(virtue)
  }

  /** The flag's value; false when it was never set. */
  getStoryFlag(flagName: string): boolean {
    return this.storyFlags[flagName] ?? false
  }

  /** Item name → how many are carried. */
  getInventorySummary(): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const item of this.inventory)
      counts[item.name] = (counts[item.name] ?? 0) + 1
    return counts
  }

  getItemCount(itemName: string): number {
    return this.inventory.filter((item) => isNamed(item, itemName)).length
  }

  hasItem(itemName: string): boolean {
    return this.inventory.some((item) => isNamed(item, itemName))
  }

  /**
   * Every item the story name refers to, in the one lookup order: the
   * inventory first, then the current room, and an item that gives way on
   * the word after those that do not. Matching is `isNamed`; each match
   * answers through its `partNamed` for the word.
   */
  findItems(itemName: string, { inventory = true, room = true } = {}): Item[] {
    const named = [
      ...(inventory ? this.inventory : []),
      ...(room ? this.currentRoom.items : []),
    ].filter((item) => isNamed(item, itemName))
    return [
      ...named.filter((item) => !item.givesWayOn(itemName)),
      ...named.filter((item) => item.givesWayOn(itemName)),
    ].map((item) => item.partNamed(itemName))
  }

  /** The first item `findItems` returns for the name, or null. */
  findItem(
    itemName: string,
    options: { inventory?: boolean; room?: boolean } = {},
  ): Item | null {
    return this.findItems(itemName, options)[0] ?? null
  }

  /** Remove up to `count` carried items named by full or short name; returns how many went. */
  removeItemFromInventory(itemName: string, count = 1): number {
    return this.removeFrom(
      this.inventory,
      (item) => isNamed(item, itemName),
      count,
    )
  }

  /** Remove every carried item named by full or short name; returns how many went. */
  removeAllItemsFromInventory(itemName: string): number {
    return this.removeFrom(
      this.inventory,
      (item) => isNamed(item, itemName),
      Number.POSITIVE_INFINITY,
    )
  }

  /**
   * Remove up to `count` items named by full or short name, from the inventory
   * first and then from the current room; returns how many went.
   */
  removeItemFromInventoryOrRoom(itemName: string, count = 1): number {
    const matches = (item: Item) => isNamed(item, itemName)
    let removed = this.removeFrom(this.inventory, matches, count)
    if (removed < count) {
      removed += this.removeFrom(
        this.currentRoom.items,
        matches,
        count - removed,
      )
    }
    return removed
  }

  addItemToInventory(item: Item, count = 1): void {
    for (let i = 0; i < count; i++) this.inventory.push(item)
  }

  learnSpell(spell: Spell): void {
    if (!this.hasSpell(spell.id)) this.knownSpells.push(spell)
  }

  /** Whether a spell with this identifier (any case) is known. */
  hasSpell(spellId: string): boolean {
    const wanted = spellId.toLowerCase()
    return this.knownSpells.some((spell) => spell.id.toLowerCase() === wanted)
  }

  /** A summary of the state as markup. */
  stats(): string {
    const lines = [
      `[bold]Current Room:[/bold] [room_name]${this.currentRoom.name}[/room_name]`,
      '',
      '[bold]Inventory:[/bold]',
    ]
    const counts = Object.entries(this.getInventorySummary())
    if (counts.length > 0) {
      for (const [name, count] of counts) {
        lines.push(
          count === 1
            ? `- [item_name]${name}[/item_name]`
            : `- [item_name]${count} ${name}[/item_name]`,
        )
      }
    } else {
      lines.push('(empty)')
    }
    lines.push('', '[bold]Known Spells:[/bold]')
    lines.push(
      ...this.listOrNone(
        this.knownSpells.map((s) => `- [spell_name]${s.name}[/spell_name]`),
      ),
    )
    lines.push('', '[bold]Visited Rooms:[/bold]')
    lines.push(
      ...this.listOrNone(
        this.visitedRooms.map((r) => `- [room_name]${r}[/room_name]`),
      ),
    )
    lines.push('', '[bold]Activated Quests:[/bold]')
    lines.push(
      ...this.listOrNone(
        this.activatedQuests.map(
          (q) =>
            `- [quest_name]${q.name} (${questType(q)})[/quest_name]: ${q.description}`,
        ),
      ),
    )
    lines.push('', '[bold]Completed Quests:[/bold]')
    lines.push(
      ...this.listOrNone(
        this.completedQuests.map(
          (q) =>
            `- [quest_name]${q.name} (${questType(q)})[/quest_name]: ${q.completion}`,
        ),
      ),
    )
    return lines.join('\n')
  }

  /**
   * Settle every pending quest event: activate each quest whose trigger is
   * met, or that was completed before it was offered, collect each log
   * change, then complete each quest whose completion is met. A quest
   * completed before it was offered is reported only as completed: its
   * opening log would tell of a task already done. Callers use this instead
   * of looping over the next* methods. Each quest's `checkUpdate` must report
   * a log change only once, or this never returns.
   */
  settleQuests(): QuestChanges {
    const changes: QuestChanges = { activated: [], updated: [], completed: [] }
    const unoffered = this.nonActivatedQuests.filter((quest) => quest.completed)
    const reported = (quest: Quest): boolean => !unoffered.includes(quest)
    for (let q: Quest | null; (q = this.nextActivatedQuest()); )
      if (reported(q)) changes.activated.push(q)
    for (let q: Quest | null; (q = this.nextUpdatedQuest()); )
      if (reported(q)) changes.updated.push(q)
    for (let q: Quest | null; (q = this.nextCompletedQuest()); )
      changes.completed.push(q)
    return changes
  }

  /**
   * Activate the first quest whose trigger is met, or that was completed
   * before it was ever offered (its offer skipped), and return it, or null.
   * A completed quest then settles as completed in the same pass.
   */
  nextActivatedQuest(): Quest | null {
    const index = this.nonActivatedQuests.findIndex(
      (quest) => quest.completed || quest.checkTrigger(this),
    )
    if (index < 0) return null
    const [quest] = this.nonActivatedQuests.splice(index, 1)
    this.activatedQuests.push(quest)
    return quest
  }

  /** The first active quest whose log changed, or null. */
  nextUpdatedQuest(): Quest | null {
    return this.activatedQuests.find((quest) => quest.checkUpdate(this)) ?? null
  }

  /**
   * Ask every saved room, the items and characters in it, every carried item,
   * every known spell and every quest to give its saved static text the
   * current wording. Run on every load, after the act's `afterLoad`.
   */
  refreshSavedText(): void {
    for (const room of Object.values(this.allRooms)) {
      room.refreshSavedText(this)
      for (const item of room.items) item.refreshSavedText(this)
      for (const character of room.characters) character.refreshSavedText(this)
    }
    for (const item of this.inventory) item.refreshSavedText(this)
    for (const spell of this.knownSpells) spell.refreshSavedText(this)
    for (const quest of [
      ...this.nonActivatedQuests,
      ...this.activatedQuests,
      ...this.completedQuests,
    ])
      quest.refreshSavedText(this)
  }

  /**
   * Rebuild the log of every active quest from the story flags, without
   * reporting anything as news. A save made before quests kept their log as
   * data lacks it; this brings a loaded game level with a played one.
   */
  refreshQuestLogs(): void {
    for (const quest of this.activatedQuests) quest.checkUpdate(this)
  }

  /**
   * Move every quest already completed but still waiting to be offered or
   * active to the completed quests, reporting nothing. A save made while a
   * quest finished before its offer stayed there is brought level on load.
   */
  settleFinishedQuests(): void {
    const finished = [
      ...this.nonActivatedQuests,
      ...this.activatedQuests,
    ].filter((quest) => quest.completed)
    if (!finished.length) return
    this.nonActivatedQuests = this.nonActivatedQuests.filter(
      (quest) => !quest.completed,
    )
    this.activatedQuests = this.activatedQuests.filter(
      (quest) => !quest.completed,
    )
    this.completedQuests.push(...finished)
  }

  /**
   * Complete the first active quest whose completion is met and return it, or
   * null. Completing raises the quest's completed flag.
   */
  nextCompletedQuest(): Quest | null {
    const index = this.activatedQuests.findIndex((quest) =>
      quest.checkCompletion(this),
    )
    if (index < 0) return null
    const [quest] = this.activatedQuests.splice(index, 1)
    quest.complete(this)
    this.completedQuests.push(quest)
    return quest
  }

  /** The room with the display name (case-insensitive), or null. */
  getRoom(roomName: string): Room | null {
    const wanted = roomName.toLowerCase()
    return (
      Object.values(this.allRooms).find(
        (r) => r.name.toLowerCase() === wanted,
      ) ?? null
    )
  }

  /** The item named by full or short name: carried first, then in any room. */
  getItem(itemName: string): Item | null {
    const carried = this.inventory.find((item) => isNamed(item, itemName))
    if (carried) return carried
    for (const room of Object.values(this.allRooms)) {
      const found = room.items.find((item) => isNamed(item, itemName))
      if (found) return found
    }
    return null
  }

  /** The quest with the name (case-insensitive) in any list, or null. */
  getQuest(questName: string): Quest | null {
    const wanted = questName.toLowerCase()
    const all = [
      ...this.nonActivatedQuests,
      ...this.activatedQuests,
      ...this.completedQuests,
    ]
    return all.find((quest) => quest.name.toLowerCase() === wanted) ?? null
  }

  isQuestActivated(questName: string): boolean {
    return this.activatedQuests.some((quest) => quest.name === questName)
  }

  isQuestCompleted(questName: string): boolean {
    return this.completedQuests.some((quest) => quest.name === questName)
  }

  private removeFrom(
    items: Item[],
    matches: (item: Item) => boolean,
    count: number,
  ): number {
    let removed = 0
    for (let i = 0; i < items.length && removed < count; ) {
      if (matches(items[i])) {
        items.splice(i, 1)
        removed++
      } else {
        i++
      }
    }
    return removed
  }

  private listOrNone(lines: string[]): string[] {
    return lines.length > 0 ? lines : ['(none)']
  }
}

function questType(quest: Quest): 'main' | 'side' {
  return quest.isMain() ? 'main' : 'side'
}
