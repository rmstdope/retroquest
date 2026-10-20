import { Room } from '@/engine'
import type { GameState } from '@/engine'
import { RareFlower } from '../items/RareFlower'
import { ShinyPebble } from '../items/ShinyPebble'
import { Deer } from '../characters/Deer'
import { GrowSpell } from '../spells/GrowSpell'

/**
 * Hidden Glade room: enchanted clearing with conditional fauna and spell gain.
 *
 * `rest()` spawns the Deer and RareFlower once the `deer_can_be_observed` flag is
 * set; `light()` teaches the Grow spell and brightens the description.
 */
export class HiddenGlade extends Room {
  lightSpellCast = false

  constructor() {
    super({
      name: 'Hidden Glade',
      description:
        'A peaceful clearing bathed in golden sunlight, hidden deep within the forest. ' +
        'Wildflowers carpet the ground, and a gentle breeze stirs the tall grass. In the ' +
        'center, a mossy stone bears a faint, magical inscription. The glade feels ' +
        'enchanted, a place where the world holds its breath.',
      items: [new ShinyPebble()],
      characters: [],
      exits: { north: 'ForestPath', south: 'VillageChapel' },
    })
  }

  /** Build and return the dynamic base description for the glade. */
  getRoomTextDescription(): string {
    let baseDescription =
      'A peaceful clearing bathed in golden sunlight, hidden deep within the forest. ' +
      'Wildflowers carpet the ground, and a gentle breeze stirs the tall grass. In the ' +
      'center, a mossy stone bears a faint, magical inscription.'
    if (!this.lightSpellCast) {
      baseDescription +=
        ' Yet, an unnatural darkness lingers here, as if the glade itself is waiting ' +
        'to be enlightened.'
    }
    const dynamicParts: string[] = []
    if (this.getCharacterByName('Deer')) {
      dynamicParts.push(
        'A graceful [character_name]Deer[/character_name] grazes quietly, occasionally ' +
          'lifting its head to watch you with wise, gentle eyes.',
      )
      if (this.items.some((item) => item instanceof RareFlower)) {
        dynamicParts.push(
          'A beautiful [item_name]Rare Flower[/item_name] blooms near the mossy stone.',
        )
      } else {
        dynamicParts.push(
          'You recall picking a beautiful [item_name]Rare Flower[/item_name] that once ' +
            'bloomed near the mossy stone.',
        )
      }
    }
    if (dynamicParts.length === 0 && !this.getCharacterByName('Deer')) {
      baseDescription +=
        ' The glade feels quiet and expectant, as if waiting for something.'
    }
    let description = baseDescription
    if (dynamicParts.length > 0) {
      description += ' ' + dynamicParts.join(' ')
    }
    description +=
      ' The glade feels enchanted, a place where the world holds its breath.'
    return description
  }

  /** Resting spawns the Deer and RareFlower once the deer can be observed. */
  override rest(gameState: GameState): string {
    if (gameState.getStoryFlag('deer_can_be_observed')) {
      const messages = ['You take a moment to rest in the tranquil glade.']
      if (!this.getCharacterByName('Deer')) {
        const deer = new Deer()
        this.addCharacter(deer)
        messages.push(
          'As you relax, a graceful [character_name]Deer[/character_name] emerges into ' +
            'the glade. It gazes at you with deep, ancient eyes, and for a moment, ' +
            'you feel a surge of gentle magical energy flow through your body, as if ' +
            'the glade itself is welcoming you.',
        )
        this.addItem(new RareFlower())
        messages.push(
          'You notice a rare, beautiful [item_name]Rare Flower[/item_name] blooming ' +
            'near the mossy stone.',
        )
      } else {
        messages.push(
          'The [character_name]Deer[/character_name] continues to graze ' +
            'peacefully.',
        )
      }
      return messages.join(' ')
    }
    return (
      'You rest for a while, but the glade remains quiet. Perhaps something more needs ' +
      'to happen for its magic to awaken.'
    )
  }

  /** Rebuild the description from its dynamic segments before describing. */
  override describe(gameState: GameState): string {
    this.description = this.getRoomTextDescription()
    return super.describe(gameState)
  }

  /** Called when a light source is used or a light spell is cast in the room. */
  override light(gameState: GameState): string {
    this.lightSpellCast = true
    let message =
      '[event]You cast a [spell_name]light[/spell_name] spell that illuminates the ' +
      'glade.[/event]\n' +
      'The inscription on the mossy stone glows faintly, revealing ancient runes. ' +
      "They speak of a seed, a song, and the sun's embrace to awaken life."
    if (!gameState.hasSpell('Grow')) {
      const growSpell = new GrowSpell()
      gameState.learnSpell(growSpell)
      message +=
        '\nAs you read the runes, you feel a connection to the ancient magic of nature. ' +
        'You have learned the [spell_name]grow[/spell_name] spell!'
    }
    return message
  }
}
