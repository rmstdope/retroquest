import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { SupplyCrate } from '../items/SupplyCrate'

/** A reinforced alcove with a locked supply crate for the miners' rescue. */
export class ToolCache extends Room {
  crateDiscovered = false

  constructor() {
    super({
      name: 'Tool Cache',
      description:
        'A side chamber shored with old timbers and stacked with crates of ' +
        'braces, iron fittings and coils of hemp rope. ' +
        'The walls are scored with tool marks, ' +
        'and the air smells of iron and wet earth.',
      items: [],
      characters: [],
      exits: { south: 'CavernMouth', east: 'CollapsedGalleries' },
    })
  }

  /** Describe the supply crate and hint at its importance. */
  override search(_gameState: GameState): string {
    if (this.crateDiscovered) {
      return (
        "You've already found the heavy supply crate, locked with its large iron " +
        "padlock. The label still reads: 'Rescue Supplies — For Emergency Use Only.'"
      )
    }
    this.crateDiscovered = true
    this.addItem(new SupplyCrate())
    return (
      'You search deeper into the shadowed alcove and discover a heavy supply crate ' +
      'hidden behind stacked timbers, locked with a large iron padlock that glints ' +
      "with an almost malevolent gleam. The label reads: 'Rescue Supplies — For " +
      "Emergency Use Only.' The padlock is iron, rusted shut, and it has a " +
      'keyhole.'
    )
  }
}
