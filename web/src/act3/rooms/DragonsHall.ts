import { Room } from '@/engine'
import { AncientDragon } from '../characters/AncientDragon'

/** A vast chamber lit by slow-breathing embers beneath scaled coils. */
export class DragonsHall extends Room {
  constructor() {
    super({
      name: "Dragon's Hall",
      description:
        'A cathedral of living stone where time itself seems to bow in reverence, ' +
        'this vast chamber stretches beyond mortal comprehension beneath a vaulted ' +
        'ceiling lost in eternal shadow. Primordial embers burn with slow, hypnotic ' +
        'rhythm along the floor, their amber light pulsing like the heartbeat of ' +
        'the earth itself as they illuminate the massive coils of an ancient being. ' +
        'Arcane sigils of forgotten civilizations spiral across obsidian tiles in ' +
        'intricate patterns that seem to shift and breathe when glimpsed from the ' +
        'corner of your eye, each rune thrumming with power that predates human ' +
        'memory. The air itself shimmers with residual magic, thick with the scent ' +
        'of ozone, aged parchment, and something indefinably ancient that speaks ' +
        "to the deepest parts of your soul. At the chamber's sacred heart, the " +
        'Ancient Dragon rests in timeless majesty, its scales gleaming like ' +
        'polished obsidian kissed by starfire, each breath sending ripples of ' +
        'power through the mystical atmosphere that makes your very bones resonate ' +
        'with otherworldly harmonics.',
      characters: [new AncientDragon()],
      exits: { west: 'StillnessVestibule' },
    })
  }
}
