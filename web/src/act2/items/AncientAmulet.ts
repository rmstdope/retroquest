import { Item } from '@/engine'

/**
 * The examine line once Sir Cedric has named the sigil; he assigns it to the
 * amulet's description, which the bag panel and the rooms show too.
 */
export const SIGIL_RECOGNISED_DESCRIPTION =
  'A mysterious amulet inscribed with runes. At its centre is the sigil of ' +
  'the Wardens of the Dawn: the sun rising over three linked rings. It is ' +
  'faintly warm in your hand.'

/**
 * Elior's heirloom in Act II: the amulet Mira gave him, carried from the first
 * turn. It is an ordinary item (it can be dropped and taken again) whose
 * examine line, also shown by the bag panel, changes once, when Sir Cedric
 * recognises the sigil (see `SIGIL_RECOGNISED_DESCRIPTION`).
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
