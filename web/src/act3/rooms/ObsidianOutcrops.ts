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
        'Sharp towers of obsidian stand up out of the ash, ' +
        'their faces split into glassy facets. ' +
        'In the seams between them lie weathered mirror fragments ' +
        'and the marks of old mounts: brass filings and small bolt holes. ' +
        'Glass flakes slide away under every step.',
      items: [],
      characters: [],
      exits: { south: 'LowerSwitchbacks', east: 'MirrorTerraces' },
    })
  }

  /** Give a save made with older wording the current description. */
  override refreshSavedText(): void {
    this.description = new ObsidianOutcrops().description
  }

  /** Search the outcrops; reveal mirror segments and resin once. */
  override search(_gameState: GameState): string {
    if (this.revealed) {
      return (
        '[failure]You pick through the crevices again; the scattered ' +
        'fragments are the same as before—nothing new comes loose.[/failure]'
      )
    }
    this.items.push(new BrassMirrorSegment())
    this.items.push(new BindingResin())
    this.revealed = true
    return (
      'You pry at a narrow seam and a brass segment flakes free, along with ' +
      'a hardened pot of binding resin—useful for securing the mirror mounts.'
    )
  }
}
