import { type NameOptions, Room, characterName } from '@/engine'
import { Mira } from '../characters/Mira'
import { SirCedric } from '../characters/SirCedric'
import { HealingHerbs } from '../items/HealingHerbs'
import { TeleportationFocus } from '../items/TeleportationFocus'

/** A small hut hung with drying herbs, where Mira works among her bottles. */
export class MirasHut extends Room {
  constructor() {
    super({
      name: "Mira's Hut",
      description:
        'A small hut hung with drying herbs: lavender, sage, and roots in ' +
        'bundles from the rafters. Shelves of bottles line the walls, every ' +
        'one labelled. ' +
        `${characterName('Mira')} moves among them without looking, ` +
        'the way you cross your own kitchen in the dark.',
      items: [new HealingHerbs(), new TeleportationFocus()],
      characters: [new Mira(), new SirCedric()],
      exits: {},
    })
  }

  /** Named after a person, so it takes no "the" and keeps its capitals. */
  protected override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, bare: true })
  }
}
