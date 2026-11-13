import { Room } from '@/engine'

/** The room's description; `descriptionFor` returns it in older saves. */
export const WHISPERING_GLADE_DESCRIPTION =
  'A meadow opens round a small stream that runs over smooth stones. ' +
  "Wildflowers grow thick to the water's edge. Under the sound of the " +
  'water there are other sounds, almost voices, and they stop when you ' +
  'listen for them.'

/** Whispering Glade room: meadow by the nymphs' stream (Act II). */
export class WhisperingGlade extends Room {
  constructor() {
    super({
      name: 'Whispering Glade',
      description: WHISPERING_GLADE_DESCRIPTION,
      items: [],
      characters: [],
      exits: { west: 'ForestEntrance' },
    })
  }

  /** The look: the class's own wording, so an older save reads the current text. */
  override descriptionFor(): string {
    return WHISPERING_GLADE_DESCRIPTION
  }
}
