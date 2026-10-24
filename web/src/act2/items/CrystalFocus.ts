import { Item, type GameState } from '@/engine'

/** Faceted magical crystal that amplifies spellcasting and arcane study. */
export class CrystalFocus extends Item {
  constructor() {
    super({
      name: 'Crystal Focus',
      shortName: 'crystal',
      description:
        'A perfectly cut crystal that resonates with magical energy, crafted by ancient ' +
        'practitioners to amplify and focus spellcasting abilities. The crystal glows ' +
        'with inner light and feels warm to the touch, enhancing your connection to ' +
        'magical forces. This artifact represents the pinnacle of magical craftsmanship ' +
        'from ages past.',
      canBeCarried: true,
    })
  }

  /** This item enhances magical understanding and comprehension of ancient texts. */
  useItem(_gameState: GameState): string {
    return (
      '[success]The crystal amplifies your magical awareness, allowing you to better ' +
      'understand arcane principles and enhancing your ability to comprehend ' +
      'ancient magical texts. Your connection to magical forces feels stronger ' +
      'and more refined.[/success]'
    )
  }

  /** Describe the masterwork crystal. */
  override examine(_gameState: GameState): string {
    return (
      'The [item_name]Crystal Focus[/item_name] is a masterwork of ancient magical ' +
      'craftsmanship. Its faceted surface catches and amplifies magical energy, and ' +
      'you can feel it resonating with your own magical abilities. This is clearly ' +
      'a tool created by master enchanters to enhance the magical arts.'
    )
  }
}
