import { Item, type GameState } from '@/engine'

/** Chunk of stone broken from the old mill's grinding wheel. */
export class MillstoneFragment extends Item {
  constructor() {
    super({
      name: 'millstone fragment',
      description:
        "A chunk of stone broken from the old mill's grinding wheel, heavy and " +
        'rough.',
      shortName: 'fragment',
      canBeCarried: true,
    })
  }

  /** The line the story tells when Elior takes it, wherever it is lying. */
  override pickedUp(_gameState: GameState): string {
    return (
      'It is rough and heavy, and the edge where it broke is still pale. ' +
      'Whoever built that mill meant it to last.'
    )
  }
}
