import { type NameOptions, Item } from '@/engine'

/** Token of favor awarded by Nyx after ritual or trial completion. */
export class NyxToken extends Item {
  constructor() {
    super({
      name: "nyx's token",
      description:
        'A small, crystalline pendant that shifts through all the colors of nature — ' +
        'from the deep green of summer leaves to the golden brown of autumn, the ' +
        'pure white of winter snow, and the vibrant colors of spring flowers. It ' +
        "pulses with gentle magic and seems to contain a fragment of the forest's " +
        'eternal essence.',
    })
  }

  /** Named after a person, so it takes no "the" and keeps its capitals. */
  override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, bare: true })
  }
}
