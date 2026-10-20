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
        'A reinforced alcove carved from living stone, where shadows pool between ' +
        'weathered crates of timbers, iron braces, and coils of hemp rope. The air ' +
        'tastes of old metal and earth, heavy with the weight of countless mining ' +
        'expeditions. Ancient tool marks score the walls, and you sense the ' +
        'presence of those who labored here in ages past. The flickering torchlight ' +
        'reveals corners shrouded in darkness.',
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
      "Emergency Use Only.' If you had the right key, you could unlock it and retrieve " +
      'the tools needed to help the trapped miners.'
    )
  }
}
