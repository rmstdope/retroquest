import { Item, type GameState } from '@/engine'
import { WardingPillars } from './WardingPillars'

/** Etched moon-forged shards used for ward-line restoration. */
export class MoonRuneShards extends Item {
  constructor() {
    super({
      name: 'Moon Rune Shards',
      description:
        'Thin, chalky shards veined with pale luster. Each shard holds a ' +
        'faint lunar marking, as if carved in moonlight and salt.',
      shortName: 'moon rune shards',
      canBeCarried: true,
    })
  }

  /** Override pickup to provide tactile flavor text. */
  override pickedUp(_gameState: GameState): string {
    return (
      '[dim]The shards whisper with tide-salt; they leave a faint dust on' +
      ' your fingers.[/dim]'
    )
  }

  /** Delegate pillar combinations to the pillars when used with them. */
  override useWith(gameState: GameState, other: Item): string {
    if (other instanceof WardingPillars) {
      return other.useWith(gameState, this)
    }
    return super.useWith(gameState, other)
  }
}
