import { Room } from '@/engine'
import { SpectralLibrarian } from '../characters/SpectralLibrarian'
import { AncientChronicle } from '../items/AncientChronicle'
import { ProtectiveEnchantments } from '../items/ProtectiveEnchantments'

/** Hidden Library room: secret archive rewarding residential discovery. */
export class HiddenLibrary extends Room {
  constructor() {
    super({
      name: 'Hidden Library',
      description:
        'Discovered beneath Greendale through a secret passage, this ancient library holds ' +
        'countless volumes of magical lore. Glowing crystals provide soft illumination and ' +
        'the air hums with residual energy. Protective enchantments shimmer around the ' +
        'most valuable texts. Somewhere on these shelves may be an answer about the mark ' +
        'you carry.',
      items: [new AncientChronicle(), new ProtectiveEnchantments()],
      characters: [new SpectralLibrarian()],
      exits: { secret_passage: 'ResidentialQuarter' },
    })
  }
}
