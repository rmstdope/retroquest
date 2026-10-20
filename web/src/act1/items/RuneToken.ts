import { Item } from '@/engine'

/**
 * A black-iron token scored with a twisted rune, drawn up from the purified
 * well together with the shiny ring. Mira names it a fouling sigil: proof
 * that someone poisoned the well on purpose.
 */
export class RuneToken extends Item {
  constructor() {
    super({
      name: 'rune token',
      shortName: 'token',
      description:
        'A small disc of black iron, cold to the touch however long you hold it. ' +
        'A twisted rune, like a root strangling itself, is scored deep into its face. ' +
        'Nothing about it was lost by accident; someone made it, and made it to last.',
      canBeCarried: true,
    })
  }
}
