import { Item, type GameState } from '@/engine'
import { MillstoneFragment } from './MillstoneFragment'
import { Rope } from './Rope'

const WORKING_DESCRIPTION =
  'A strange mechanism of black iron, all levers and gears, ' +
  "that doesn't belong to the old mill's design. " +
  'It whirs on its own, and a faint pull tugs at the floorboards around it, ' +
  'as if it were drawing something up from deep beneath the mill. ' +
  'A twisted rune is scored into its housing. ' +
  'Its gears turn freely; something threaded through them might stop them.'

const JAMMED_DESCRIPTION =
  'The [item_name]strange mechanism[/item_name] stands jammed with a [item_name]rope[/item_name], ' +
  'its gears locked and its whirring stilled. ' +
  'The floor no longer hums beneath it. A compartment hangs open.'

/**
 * The cloaked stranger's device in the Old Mill: a black-iron mechanism
 * draining the old power beneath the mill. Jamming its gears with the rope
 * stops it and opens a compartment holding a millstone fragment.
 *
 * `repaired` keeps its old name for save compatibility; it means jammed.
 */
export class Mechanism extends Item {
  repaired = false

  constructor() {
    super({
      name: 'strange mechanism',
      shortName: 'mechanism',
      description: WORKING_DESCRIPTION,
      canBeCarried: false,
    })
  }

  /** Describe the device as working or jammed. */
  override examine(gameState: GameState): string {
    this.description = this.repaired ? JAMMED_DESCRIPTION : WORKING_DESCRIPTION
    return super.examine(gameState)
  }

  /** Point at the gears while it runs; once jammed, there is nothing to do. */
  override use(_gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    if (this.repaired) {
      return '[failure]The ' + nameHtml + ' is jammed fast.[/failure]'
    }
    return (
      'You put a hand to the gears. They turn under it and keep turning; ' +
      'fingers will not stop them.'
    )
  }

  /** Jam the gears with the Rope, which opens the MillstoneFragment's compartment. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof Rope) {
      if (this.repaired) {
        return (
          `[failure]The [item_name]${this.name}[/item_name] is already ` +
          'jammed fast.[/failure]'
        )
      }
      this.repaired = true
      const otherIndex = gameState.inventory.indexOf(other)
      if (otherIndex >= 0) gameState.inventory.splice(otherIndex, 1)
      const millstoneFragment = new MillstoneFragment()
      gameState.currentRoom.addItem(millstoneFragment)
      this.description = JAMMED_DESCRIPTION
      const nameHtml = `[item_name]${this.name}[/item_name]`
      return (
        'You thread the [item_name]rope[/item_name] through the gears of the ' +
        `${nameHtml} and pull it tight. ` +
        'The gears grind, catch, and jam. ' +
        'The whirring dies, and the hum in the floorboards fades away, ' +
        'as whatever it was drawing from beneath the mill is left in peace.\n' +
        'With a clunk, a hidden compartment slides open, ' +
        'revealing a fragment of the old millstone!'
      )
    }
    return super.useWith(gameState, other)
  }

  /** A draining whir while it works; silence once it is jammed. */
  override listen(_gameState: GameState): string {
    const nameHtml = `[item_name]${this.name}[/item_name]`
    if (this.repaired) {
      return 'The ' + nameHtml + ' is silent now, its gears jammed fast.'
    }
    return (
      'You hear a faint whirring and clicking from within the ' +
      nameHtml +
      ', and beneath it a low hum, as if something were being drawn ' +
      'up from far below.'
    )
  }
}
