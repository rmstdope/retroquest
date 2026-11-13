import type { Character } from './Character'
import type { GameState } from './GameState'
import { nameInSentence, type NameOptions } from './names'

export interface ItemOptions {
  name: string
  description: string
  /** The name the story uses for the item; defaults to the full name. */
  shortName?: string
  canBeCarried?: boolean
}

/**
 * Base class for all items. Subclasses override the actions they answer to;
 * every action fails politely by default.
 */
export class Item {
  name: string
  description: string
  shortName: string
  canBeCarried: boolean

  constructor({ name, description, shortName, canBeCarried }: ItemOptions) {
    this.name = name
    this.description = description
    this.shortName = shortName ?? name
    this.canBeCarried = canBeCarried ?? false
  }

  /**
   * Give the static text a save keeps (a description, a name) the current
   * wording after a load. The engine calls it on every saved room, room item,
   * room character, carried item, known spell and quest, after the act's
   * `afterLoad`; it must be idempotent. Does nothing by default.
   */
  refreshSavedText(_gameState: GameState): void {}

  /**
   * Whether the player's word for an item names this one: its full name or
   * short name, compared case-insensitively. Override to accept more names.
   */
  answersTo(name: string): boolean {
    const wanted = name.toLowerCase()
    return (
      this.name.toLowerCase() === wanted ||
      this.shortName.toLowerCase() === wanted
    )
  }

  /**
   * Whether another item answering to `name` (a word `answersTo` accepted)
   * goes first, wherever the two lie: for a plain noun this item only borrows
   * from what describes it, while the other is called that outright. False by
   * default, so the lookup order alone decides.
   */
  givesWayOn(_name: string): boolean {
    return false
  }

  /**
   * The item that answers when the player names this one by `name` (a word
   * `answersTo` accepted): this item itself by default. Override for an item
   * that answers to a part of itself, so every verb tried on the part is
   * answered by the part (the note in Act I's opened box). A part lies in no
   * room or bag of its own, so it must refuse pickup in `preventPickup`.
   */
  partNamed(_name: string): Item {
    return this
  }

  /**
   * The item's name as it reads inside a sentence, article included (see
   * `nameInSentence` in `names.ts`): "the [item]". Override and pass
   * `bare: true` for an item named after a person ("Elior's Journal").
   */
  nameInSentence(options?: NameOptions): string {
    return nameInSentence('item', this.name, options)
  }

  /**
   * Why the item cannot be taken, or '' when it can. The game state lets an
   * item's refusal follow the story; most items ignore it.
   */
  preventPickup(_gameState: GameState): string {
    return this.canBeCarried
      ? ''
      : `[failure]You can't take ${this.nameInSentence()}.[/failure]`
  }

  use(_gameState: GameState): string {
    return (
      `[failure]You can't use ${this.nameInSentence()} in any ` +
      'special way.[/failure]'
    )
  }

  /**
   * Use this item with `other`. By default `other` gets to answer through
   * `answerUseFrom` (an altar that takes offerings, say), and only when it
   * has nothing to say does the use fail.
   */
  useWith(gameState: GameState, other: Item): string {
    const answer = other.answerUseFrom(gameState, this)
    if (answer) return answer
    return (
      `[failure]You can't use ${this.nameInSentence()} with ` +
      `${other.nameInSentence()}.[/failure]`
    )
  }

  /**
   * What this item says when `item` is used with it and `item` has no use of
   * its own for it; '' (the default) leaves the generic refusal.
   */
  answerUseFrom(_gameState: GameState, _item: Item): string {
    return ''
  }

  useOnCharacter(_gameState: GameState, target: Character): string {
    return (
      `[failure]You can't use ${this.nameInSentence()} on ` +
      `${target.nameInSentence()}.[/failure]`
    )
  }

  /**
   * What the item looks like right now, computed from the game's state. The
   * Bag, `look` and `examine` all read it, so a change to how the item looks
   * after a story event is made here once. The saved `description` is only
   * the text it was built with and is never reassigned; override this for
   * an item whose look follows the story.
   */
  descriptionFor(_gameState: GameState): string {
    return this.description
  }

  /** The item's look: what `descriptionFor` says. Override only to say more. */
  examine(gameState: GameState): string {
    return this.descriptionFor(gameState)
  }

  /** Called after the player takes the item; the text is shown after the pickup. */
  pickedUp(_gameState: GameState): string {
    return ''
  }

  open(_gameState: GameState): string {
    return `[failure]You can't open ${this.nameInSentence()}.[/failure]`
  }

  close(_gameState: GameState): string {
    return `[failure]You can't close ${this.nameInSentence()}.[/failure]`
  }

  /** Called by the grow spell. */
  grow(_gameState: GameState): string {
    return (
      '[failure]The [spell_name]grow[/spell_name] spell finds nothing to ' +
      `wake in ${this.nameInSentence()}.[/failure]`
    )
  }

  eat(_gameState: GameState): string {
    return `[failure]You can't eat ${this.nameInSentence()}.[/failure]`
  }

  drink(_gameState: GameState): string {
    return `[failure]You can't drink ${this.nameInSentence()}.[/failure]`
  }

  equip(_gameState: GameState): string {
    return `[failure]You can't equip ${this.nameInSentence()}.[/failure]`
  }

  unequip(_gameState: GameState): string {
    return `[failure]You can't unequip ${this.nameInSentence()}.[/failure]`
  }
}
