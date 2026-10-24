import { Item, type GameState } from '@/engine'

/**
 * What the pass looks like; shown on every `examine`, so older saves read it
 * too. Only `examine` applies it: the stored `description` field of an older
 * save is not rewritten.
 */
const ENTRY_PASS_DESCRIPTION =
  'An official-looking document with the seal of Greendale. The line where ' +
  "the bearer's name should be has been scraped away with a blade, but the " +
  'seal is whole. It appears to grant passage through the city gates to ' +
  'those who present it to the guards.'

/**
 * Credential document that grants passage through Greendale's gates. It was
 * the grey-cloaked stranger's: his name is scraped off, the seal is good.
 */
export class EntryPass extends Item {
  constructor() {
    super({
      name: 'entry pass',
      shortName: 'pass',
      description: ENTRY_PASS_DESCRIPTION,
      canBeCarried: true,
    })
  }

  /** Examine the pass with the current description, whatever an older save stored. */
  override examine(_gameState: GameState): string {
    return ENTRY_PASS_DESCRIPTION
  }

  /** Inspect the seal and the scraped line on the pass. */
  override use(_gameState: GameState): string {
    return (
      'Someone has scraped their name off the entry pass, ' +
      'carefully. The seal looks authentic, and it should allow you passage ' +
      'into Greendale without question.'
    )
  }
}
