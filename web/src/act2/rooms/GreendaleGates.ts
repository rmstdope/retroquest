import { Room } from '@/engine'
import type { Exits, GameState } from '@/engine'
import { GateCaptain } from '../characters/GateCaptain'
import { CityMap } from '../items/CityMap'

/**
 * Greendale Gates room: formal entry gate with etiquette-based search unlock.
 *
 * `getExits()` withholds `north` until the gate captain grants entry; `search()`
 * is blocked until the captain has accepted the entry pass (he leaves in that
 * same turn; an older save may still have him present) and the first
 * permissive search spawns a CityMap (idempotent via `cityMapFound`).
 */
export class GreendaleGates extends Room {
  gateCaptain: GateCaptain
  cityMapFound = false

  constructor() {
    const gateCaptain = new GateCaptain()
    super({
      name: 'Greendale Gates',
      description:
        'A magnificent stone archway marks the entrance to Greendale, the largest ' +
        'settlement you have encountered. Guards in polished mail stand watch, banners ' +
        'fluttering in the mountain breeze. Beyond, cobblestone streets wind between ' +
        'stone houses and bustling shops. The air carries the sounds of commerce—a ' +
        "stark contrast to Willowbrook's quiet charm.",
      items: [],
      characters: [gateCaptain],
      exits: { south: 'MountainPath', north: 'MainSquare' },
    })
    this.gateCaptain = gateCaptain
  }

  /** Return exits; hide north until entry is granted by the gate captain. */
  override getExits(gameState: GameState): Exits {
    const exits: Exits = { ...super.getExits(gameState) }
    // Remove north exit until the entry pass has been given
    if (!this.gateCaptain.entryPassGiven && 'north' in exits) {
      delete exits.north
    }
    return exits
  }

  /** Search the area; the map appears only after protocol and the first search. */
  override search(_gameState: GameState): string {
    if (!this.gateCaptain.entryPassGiven) {
      return (
        'The Gate Captain stands vigilant, watching all who approach. It would be ' +
        'improper to search while he observes you so closely. Perhaps he would relax if you ' +
        'showed him proper papers.'
      )
    }
    if (this.cityMapFound) {
      return "[failure]You've already searched thoroughly. Nothing more of value stands out here.[/failure]"
    }
    this.cityMapFound = true
    const cityMap = new CityMap()
    this.addItem(cityMap)
    const name = cityMap.name
    return (
      "With the Gate Captain gone, you're free to look around. A small information post " +
      'nearby holds items left by travelers. Among them you discover a detailed ' +
      `[item_name]${name}[/item_name] of Greendale. ` +
      'Someone has drawn on it in grey ink.'
    )
  }
}
