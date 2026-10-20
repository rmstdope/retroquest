import { Item, type GameState } from '@/engine'
import { MillstoneFragment } from './MillstoneFragment'
import { Rope } from './Rope'

/** Central repair puzzle object in the mill context. */
export class Mechanism extends Item {
  repaired = false

  constructor() {
    super({
      name: 'strange mechanism',
      shortName: 'mechanism',
      description:
        "A strange mechanism with levers and gears that doesn't quite seem to " +
        "belong to the old mill's original design. It looks like something could be " +
        'used with it.',
      canBeCarried: false,
    })
  }

  /** Return description based on repaired state. */
  override examine(gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    if (this.repaired) {
      this.description =
        `The ${nameHtml} has been repaired using a ` +
        '[item_name]rope[/item_name]. A compartment is open.'
    } else {
      this.description =
        "A strange mechanism with levers and gears that doesn't quite seem to " +
        "belong to the old mill's original design. It looks like something could be " +
        'used with it.'
    }
    return super.examine(gameState)
  }

  /** Operate the mechanism if repaired, otherwise prompt for repair. */
  override use(_gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    if (this.repaired) {
      return (
        '[failure]The ' + nameHtml + ' has already been operated.[/failure]'
      )
    }
    return (
      '[failure]It looks like you need to use something with the ' +
      nameHtml +
      '[/item_name].[/failure]'
    )
  }

  /** Repair with Rope, spawn MillstoneFragment, or fallback. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Rope) {
      if (this.repaired) {
        return (
          `[failure]The [item_name]${this.name}[/item_name] has already been ` +
          'operated.[/failure]'
        )
      }
      this.repaired = true
      const otherIndex = gameState.inventory.indexOf(other)
      if (otherIndex >= 0) gameState.inventory.splice(otherIndex, 1)
      const millstoneFragment = new MillstoneFragment()
      gameState.currentRoom.addItem(millstoneFragment)
      this.description =
        'The mechanism has been repaired using a rope. A compartment is open.'
      const nameHtml = `[item_name]${this.name}[/item_name]`
      const eventMsg =
        '[event]You try to use the [item_name]rope[/item_name] with the ' +
        nameHtml +
        '[/event]\n'
      const part1 =
        'You manage to thread the [item_name]rope[/item_name] through the ' +
        nameHtml +
        '. '
      const part2 =
        'With a clunk, a hidden compartment slides open, ' +
        'revealing a fragment of the old millstone!'
      return eventMsg + part1 + part2
    }
    return super.useWith(gameState, other)
  }

  /** Return sound feedback based on repaired state. */
  override listen(_gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    const eventMsg = '[event]You listen to the ' + nameHtml + '[/event]\n'
    if (this.repaired) {
      return (
        eventMsg + ('The ' + nameHtml + ' is silent now, its purpose served.')
      )
    }
    return (
      eventMsg +
      ('You hear a faint whirring and clicking from within the ' +
        nameHtml +
        ", as if it's waiting for something.")
    )
  }
}
