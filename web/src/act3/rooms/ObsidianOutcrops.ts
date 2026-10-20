import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { BrassMirrorSegment } from '../items/BrassMirrorSegment'
import { BindingResin } from '../items/BindingResin'

/** The Obsidian Outcrops: sharp volcanic glass formations. */
export class ObsidianOutcrops extends Room {
  revealed = false

  constructor() {
    super({
      name: 'Obsidian Outcrops',
      description:
        'Needle-sharp obsidian towers rise like black teeth from the ash, ' +
        'their surfaces catching and fracturing the light into jagged, ' +
        'glassy facets. Between the towers, thin seams and crevices hide ' +
        'weathered mirror fragments and the faint scars of old mounts—' +
        'brass filings, dull polish, and tiny holes that speak of a long-' +
        'vanished craft. A dry, metallic tang rides the hot wind, and ' +
        'every step sets off a tiny cascade of glass flakes into echoing ' +
        'gullies below.',
      items: [],
      characters: [],
      exits: { south: 'LowerSwitchbacks', east: 'MirrorTerraces' },
    })
  }

  /** Search the outcrops; reveal mirror segments and resin once. */
  override search(_gameState: GameState): string {
    if (this.revealed) {
      return (
        '[event]You pick through the crevices again; the scattered fragments are ' +
        'the same as before—nothing new comes loose.[/event]'
      )
    }
    this.items.push(new BrassMirrorSegment())
    this.items.push(new BindingResin())
    this.revealed = true
    return (
      '[event]You pry at a narrow seam and a brass segment flakes free, along with ' +
      'a hardened pot of binding resin—useful for securing the mirror mounts.[/event]'
    )
  }
}
