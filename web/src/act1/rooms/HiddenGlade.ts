import { Room, characterName, writing } from '@/engine'
import type { GameState } from '@/engine'
import { RareFlower } from '../items/RareFlower'
import { ShinyPebble } from '../items/ShinyPebble'
import { Deer } from '../characters/Deer'
import { GrowSpell } from '../spells/GrowSpell'

/**
 * Hidden Glade room: enchanted clearing with conditional fauna and spell gain.
 *
 * `rest()` spawns the Deer and RareFlower once the `deer_can_be_observed` flag is
 * set; `light()` teaches the Grow spell and lifts the unnatural darkness, so
 * the dim, overgrown clearing turns sunlit. Both `light()` and the sunlit
 * description show the refrain carved beneath the runes.
 */
export class HiddenGlade extends Room {
  lightSpellCast = false

  constructor() {
    super({
      name: 'Hidden Glade',
      description: HiddenGlade.DIM_DESCRIPTION,
      items: [new ShinyPebble()],
      characters: [],
      exits: { north: 'ForestPath', south: 'VillageChapel' },
    })
  }

  /** The glade before `light` is cast: dim, overgrown and unreadable. */
  private static readonly DIM_DESCRIPTION =
    'A hushed clearing hidden deep within the forest, dim and overgrown. ' +
    'Brambles crowd its edges, and the tall grass stands grey and still beneath ' +
    'branches that shut out the sun. In the center, a mossy stone bears a faint ' +
    'inscription, too deep in shadow to read. An unnatural darkness lingers here, ' +
    'though the sky above the branches is clear.'

  /** The glade once `light` has lifted the darkness. */
  private static readonly SUNLIT_DESCRIPTION =
    'A peaceful clearing bathed in golden sunlight, hidden deep within the forest. ' +
    'Wildflowers carpet the ground, and a gentle breeze stirs the tall grass. In the ' +
    'center, a mossy stone bears a faint, magical inscription.'

  /** The refrain carved beneath the grow runes, word for word. */
  private static readonly REFRAIN =
    'Power follows purpose; purpose follows truth.'

  /** The sentence in the lit glade that quotes the carved refrain. */
  private static readonly CARVING_SENTENCE =
    ' Beneath it, in a plainer hand, is carved: ' +
    `\u201c${HiddenGlade.REFRAIN}\u201d`

  /**
   * The glade's text, built from its dynamic segments: dim or sunlit, the
   * glowing amulet, and the Deer and Rare Flower once they have appeared.
   * The dim glade ends on its darkness; the sunlit glade ends on the carving
   * (or the amulet's glow), then the Deer and flower once they have appeared.
   */
  override descriptionFor(gameState: GameState): string {
    let baseDescription = this.lightSpellCast
      ? HiddenGlade.SUNLIT_DESCRIPTION + HiddenGlade.CARVING_SENTENCE
      : HiddenGlade.DIM_DESCRIPTION
    if (gameState.hasItem('Ancient Amulet')) {
      baseDescription +=
        ' Beside the mossy stone, the [item_name]ancient amulet[/item_name] in ' +
        'your hand begins to glow.'
    }
    if (!this.lightSpellCast) return baseDescription
    const dynamicParts: string[] = []
    if (this.getCharacterByName('Deer')) {
      dynamicParts.push(
        'A graceful ' +
          characterName('Deer') +
          ' grazes quietly, occasionally ' +
          'lifting its head to watch you with wise, gentle eyes.',
      )
      if (this.items.some((item) => item instanceof RareFlower)) {
        dynamicParts.push(
          'A beautiful [item_name]rare flower[/item_name] blooms near the mossy stone.',
        )
      } else {
        dynamicParts.push(
          'You recall picking a beautiful [item_name]rare flower[/item_name] that once ' +
            'bloomed near the mossy stone.',
        )
      }
    }
    if (dynamicParts.length === 0) return baseDescription
    return baseDescription + ' ' + dynamicParts.join(' ')
  }

  /** Resting spawns the Deer and RareFlower once the deer can be observed. */
  override rest(gameState: GameState): string {
    if (gameState.getStoryFlag('deer_can_be_observed')) {
      const messages = ['You take a moment to rest in the tranquil glade.']
      if (!this.getCharacterByName('Deer')) {
        const deer = new Deer()
        this.addCharacter(deer)
        messages.push(
          'After a while you stop listening for anything, and a ' +
            characterName('Deer') +
            ' steps out of the brambles. It stands and looks at you, quite still.',
        )
        this.addItem(new RareFlower())
        messages.push(
          'Near the mossy stone, where there was only moss, a ' +
            '[item_name]rare flower[/item_name] has opened.',
        )
      } else {
        messages.push(
          'The ' +
            characterName('Deer') +
            ' continues to graze ' +
            'peacefully.',
        )
      }
      return messages.join(' ')
    }
    return (
      'You rest a while. Birds, the grey grass, a stone you cannot read. ' +
      'Nothing comes. You catch yourself watching the brambles for it, ' +
      'whatever it is.'
    )
  }

  /** Called when a light source is used or a light spell is cast in the room. */
  override light(gameState: GameState): string {
    this.lightSpellCast = true
    let message =
      'Light fills the glade.\n' +
      'The darkness lifts, and sunlight comes down through the branches. ' +
      'The runes on the mossy stone stand out clear at last. ' +
      'They speak of a seed, a song, and the sun.'
    if (!gameState.hasSpell('Grow')) {
      const growSpell = new GrowSpell()
      gameState.learnSpell(growSpell)
      message +=
        '\nYou read them slowly, and the spell comes with the reading. ' +
        'It does not wake in you the way the others did; this one you read, ' +
        'word by word, off the stone, and it feels like your own. ' +
        'You have learned the [spell_name]grow[/spell_name] spell!'
    }
    message +=
      '\nCarved beneath the runes, in a plainer hand, are words you can read:' +
      writing(HiddenGlade.REFRAIN) +
      '\nYou read them aloud. They mean nothing to you, and yet they stay with you.'
    return message
  }
}
