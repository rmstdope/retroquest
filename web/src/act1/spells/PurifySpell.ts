import {
  Spell,
  type Character,
  type GameState,
  type Item,
  event,
  characterName,
} from '@/engine'
import { Well } from '../items/Well'
import { River } from '../items/River'
import { FLAG_MAGIC_FULLY_UNLOCKED } from '../Act1StoryFlags'

/** Cleansing spell that removes impurities from items or environments. */
export class PurifySpell extends Spell {
  constructor() {
    super({
      id: 'purify',
      name: 'purify',
      description:
        'A cleansing spell that removes impurities from water or other ' +
        'substances.',
    })
  }

  private fizzle(): string {
    return (
      event(
        `You attempt to cast [spell_name]${this.name}[/spell_name], ` +
          'but the magic fizzles out, achieving nothing.',
      ) +
      '\n' +
      'It feels like the magic is just out of reach.'
    )
  }

  override castSpell(gameState: GameState): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.fizzle()
    }
    return (
      event(`You cast [spell_name]${this.name}[/spell_name].`) +
      '\n' +
      'A cleansing energy flows from your hands.'
    )
  }

  override castOnItem(gameState: GameState, item: Item): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.fizzle()
    }
    if (item instanceof Well) {
      return item.purify(gameState)
    }
    if (item instanceof River) {
      return (
        event(
          `You cast [spell_name]${this.name}[/spell_name] on the ` +
            '[item_name]river[/item_name].',
        ) +
        '\n' +
        'The light runs out over the water and finds nothing to do. The ' +
        'river was never the trouble. Your mother stood at this bend and ' +
        'taught this spell to the fisherman; the water remembers her better ' +
        'than it needs you.'
      )
    }
    const name = item.name
    return (
      event(
        `You cast [spell_name]${this.name}[/spell_name] on ` +
          `[item_name]${name}[/item_name].`,
      ) +
      '\n' +
      'A cleansing energy flows from your hands, but nothing else ' +
      'seems to happen.'
    )
  }

  override castOnCharacter(gameState: GameState, character: Character): string {
    if (!gameState.getStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED)) {
      return this.fizzle()
    }
    const name = character.name
    return (
      event(
        `You cast [spell_name]${this.name}[/spell_name] on ` +
          `${characterName(name)}.`,
      ) +
      '\n' +
      'A cleansing energy flows around ' +
      `${characterName(name)}, purifying their spirit and lifting any negative influences.`
    )
  }
}
