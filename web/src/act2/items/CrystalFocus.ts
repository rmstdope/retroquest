import { Item, type GameState } from '@/engine'

/** The item's description; `Act2.afterLoad` restores it in older saves. */
export const CRYSTAL_FOCUS_DESCRIPTION =
  'A clear crystal the length of your finger, cut with many faces. Hold ' +
  'it to the light and the light comes out the other side narrower and ' +
  'brighter.'

/** A faceted crystal that narrows and brightens the light through it. */
export class CrystalFocus extends Item {
  constructor() {
    super({
      name: 'Crystal Focus',
      shortName: 'crystal',
      description: CRYSTAL_FOCUS_DESCRIPTION,
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
}
