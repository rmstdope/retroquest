import { Item } from '@/engine'

/**
 * Elior's heirloom in Act II: the amulet Mira gave him, carried from the first
 * turn. It is an ordinary item (it can be dropped and taken again) whose
 * examine line, also shown by the bag panel, never changes during the act.
 */
export class AncientAmulet extends Item {
  constructor() {
    super({
      name: 'ancient amulet',
      shortName: 'amulet',
      description:
        'A mysterious amulet inscribed with runes. At its centre is a worn ' +
        'sigil you cannot place. It is faintly warm in your hand.',
      canBeCarried: true,
    })
  }
}
