import { Item } from '@/engine'

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
}
