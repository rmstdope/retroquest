import { Item, characterName, speech } from '@/engine'

/**
 * Heirloom catalyst linking three relic threads (Act III). Non-carriable until
 * narrative completion; `preventPickup()` gives flavor feedback through Mira.
 */
export class AncientAmulet extends Item {
  constructor() {
    super({
      name: 'ancient amulet',
      shortName: 'amulet',
      description:
        'A family heirloom whose runes glint like dew at dawn. It seems to ' +
        'resonate faintly in the presence of the other relics, as though ' +
        'completing an unseen circuit.',
      canBeCarried: false,
    })
  }

  /** Block premature pickup, giving narrative feedback through Mira. */
  override preventPickup(): string {
    return (
      characterName('Mira') +
      ' rests a gentle hand on the ' +
      '[item_name]amulet[/item_name]. ' +
      speech(
        "'Not yet. It will choose its bearer when the circle is complete.'",
      )
    )
  }
}
