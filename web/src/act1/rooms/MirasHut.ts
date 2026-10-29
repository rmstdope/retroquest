import { type NameOptions, characterName, Room, type GameState } from '@/engine'
import { HealingHerb } from '../items/HealingHerb'
import { AncientAmulet } from '../items/AncientAmulet'
import { Mira } from '../characters/Mira'

const GLOW =
  ' On its stand, the [item_name]ancient amulet[/item_name] glows brighter as you ' +
  'step in, as if something you carry has woken it.'
const EMPTY_STAND = ' The stand where the amulet rested stands empty.'

/**
 * Mira's Hut room: early healing and mystical mentor resource node. The
 * amulet on its stand glows brighter while Elior carries the locket or his
 * mother's letter; once Mira has handed it over the stand reads as empty.
 */
export class MirasHut extends Room {
  constructor() {
    super({
      name: "Mira's Hut",
      description:
        'A small hut hung with drying herbs: lavender, sage, and roots in ' +
        'bundles from the rafters. Shelves of bottles line the walls, every ' +
        `one labelled. ${characterName('Mira')} moves among them without looking, ` +
        'the way you move through your own kitchen.',
      items: [new HealingHerb(), new AncientAmulet()],
      characters: [new Mira()],
      exits: { south: 'VillageSquare' },
    })
  }

  /**
   * The hut's text with the amulet's glow or the empty stand added. Saves
   * made before this was computed may carry either sentence in the stored
   * description, so both are stripped first.
   */
  override descriptionFor(gameState: GameState): string {
    const base = this.description.replace(GLOW, '').replace(EMPTY_STAND, '')
    const onStand = this.items.some((item) => item instanceof AncientAmulet)
    const keepsake =
      gameState.hasItem('locket') || gameState.hasItem("mother's letter")
    return base + (onStand ? (keepsake ? GLOW : '') : EMPTY_STAND)
  }

  /** Named after a person, so it takes no "the" and keeps its capitals. */
  protected override nameInSentence(options?: NameOptions): string {
    return super.nameInSentence({ ...options, bare: true })
  }
}
