import { type NameOptions, Item } from '@/engine'

/** The token's description; `Act2.afterLoad` restores it in older saves. */
export const NYX_TOKEN_DESCRIPTION =
  'A small crystal on a cord of plaited grass. Turn it in the light and it ' +
  'is green as summer leaves, then brown as autumn, then white as snow.'

/** Token of favor awarded by Nyx after ritual or trial completion. */
export class NyxToken extends Item {
  constructor() {
    super({
      name: "nyx's token",
      description: NYX_TOKEN_DESCRIPTION,
    })
  }

  /** Named after a person, so it takes no "the" and keeps its capitals. */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, bare: true })
  }
}
