import { Item, type GameState } from '@/engine'

/** Something that can have the heat-ward mix applied to it (an item or the room). */
type HeatWardTarget = {
  applyHeatWard?: (gameState: GameState, mix: HeatWardMix) => string
}

/** A simple mixture used to protect from the intense fumarole heat. */
export class HeatWardMix extends Item {
  constructor() {
    super({
      name: 'heat-ward mix',
      description:
        'A coarse paste of ash-fern and cooled slag prepared to seal and ' +
        "stabilize vent stones against the mountain's heat. Use it at the " +
        'fumaroles after calibration.',
      shortName: 'heat-ward mix',
      canBeCarried: true,
    })
  }

  /**
   * Allow applying the mix directly to a target exposing `applyHeatWard`
   * (the fumarole room helper); otherwise fail.
   */
  override useWith(gameState: GameState, other: Item): string {
    // If used with a room-like object that has applyHeatWard, call it
    const hook = (other as HeatWardTarget).applyHeatWard
    if (typeof hook === 'function') return hook.call(other, gameState, this)

    return (
      `[failure]You can't use the [item_name]${this.name}[/item_name] ` +
      `with the [item_name]${other.name}[/item_name].[/failure]`
    )
  }

  /** Use the mix in the current room if applicable (Fumarole Passages). */
  override use(gameState: GameState): string {
    const room = gameState.currentRoom
    if (room.name !== 'Fumarole Passages') {
      return (
        `[failure]You can't use the [item_name]${this.name}[/item_name] ` +
        'usefully here.[/failure]'
      )
    }

    const hook = (room as HeatWardTarget).applyHeatWard
    if (typeof hook === 'function') return hook.call(room, gameState, this)

    return (
      `[failure]The [item_name]${this.name}[/item_name] has no obvious ` +
      'place to use here.[/failure]'
    )
  }
}
