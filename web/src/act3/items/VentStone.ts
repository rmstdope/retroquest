import { Item, type GameState } from '@/engine'

/** A carved stone used to tune the timing of the fumarole vents. */
export class VentStone extends Item {
  constructor() {
    super({
      name: 'vent stone',
      description:
        'A smooth, heat-tempered stone carved with grooves that fit into ' +
        'the fumarole fittings. Several are needed to calibrate the vents.',
      shortName: 'vent stone',
      canBeCarried: true,
    })
  }

  /** Use the vent stone to attempt a calibration when in the passages. */
  override use(gameState: GameState): string {
    // Find current room name and act accordingly
    const room = gameState.currentRoom
    const hook = (
      room as {
        calibrateWithStone?: (gs: GameState, stone: VentStone) => string
      }
    ).calibrateWithStone
    if (room.name !== 'Fumarole Passages' || typeof hook !== 'function') {
      return (
        `[failure]You can't use the [item_name]${this.name}[/item_name] ` +
        'usefully here.[/failure]'
      )
    }
    // Delegate to room helper
    return hook.call(room, gameState, this)
  }
}
