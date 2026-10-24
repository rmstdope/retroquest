import { Item, type GameState } from '@/engine'

/** The piece that cracks from the right ward stone when the gates fall. Nothing needs it. */
export class WardStoneFragment extends Item {
  constructor() {
    super({
      name: 'Ward Stone Fragment',
      description:
        'A jagged piece of the right ward stone, carved with half a rune. It ' +
        'is cold, and keeps no time at all.',
      canBeCarried: true,
    })
  }

  /** The fragment's welcome when it is picked up. */
  override pickedUp(_gameState: GameState): string {
    return 'The fragment is cold, and it no longer keeps any time at all.'
  }
}
