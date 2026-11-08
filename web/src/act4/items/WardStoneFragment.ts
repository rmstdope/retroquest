import { Item, clue, type GameState } from '@/engine'

/** The piece that cracks from the right ward stone when the gates fall. It stays where it lands. */
export class WardStoneFragment extends Item {
  constructor() {
    super({
      name: 'Ward Stone Fragment',
      description:
        'A jagged piece of the right ward stone, carved with half a rune. It ' +
        'is cold, and keeps no time at all.',
      canBeCarried: false,
    })
  }

  /**
   * Refuses in-world, whatever `canBeCarried` says: a save from when the
   * fragment could be taken still holds it as carriable.
   */
  override preventPickup(_gameState: GameState): string {
    return clue(
      'The cold of the fragment bites at your fingers, and you let it lie ' +
        'by the stone.',
    )
  }
}
