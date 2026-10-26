import { Item, type NameOptions } from '@/engine'

/**
 * Nyx's Token, the crystalline pendant she gave Elior in the Heart of the
 * Forest, carried through Act IV (Act II's token, made again for this act).
 * In the Tower of Shadows it is warm when Nyx's name is said; at the hedge
 * in Willowbrook Field it can be given back to her light.
 */
export class NyxToken extends Item {
  constructor() {
    super({
      name: "Nyx's Token",
      description:
        'A small crystalline pendant that shifts through the colours of the ' +
        'forest as you turn it: leaf green, acorn brown, snow, blossom. It is ' +
        'warm, the way a held hand is warm.',
      canBeCarried: true,
    })
  }

  /** Named after a person, so it takes no "the" and keeps its capitals. */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, bare: true })
  }
}
