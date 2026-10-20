import { Character, type GameState } from '@/engine'
import { PhoenixFeather } from '../items/PhoenixFeather'
import { FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED } from '../Act3StoryFlags'

/** A majestic, telepathic phoenix who poses a riddle to the worthy. */
export class Phoenix extends Character {
  private riddlePosed = false

  constructor() {
    super({
      name: 'Phoenix',
      description:
        "A vast, ember-wrought phoenix reclines amid the crater's molten glass. Its " +
        'feathers glow with shifting gold and crimson, and its eyes burn with patient, ' +
        'ancient wisdom. It radiates a presence that is both fierce and serene, as if it ' +
        'has seen the rise and fall of ages.',
    })
  }

  /** Telepathic riddle from the Phoenix. */
  override talkTo(_gameState: GameState): string {
    this.riddlePosed = true
    return (
      "The [character_name]phoenix[/character_name]'s voice does not come from its " +
      'beak, but resounds within your mind: ' +
      "[dialogue]'What is wisdom when time is short?'[/dialogue] The question lingers, " +
      'bright and weightless, as if the answer might shape the very air around you.'
    )
  }

  /** Accepts correct answers and gives the Phoenix Feather if appropriate. */
  override sayTo(gameState: GameState, words: string): string {
    // Only accept answer if riddle was posed and feather not yet given
    if (!this.riddlePosed) {
      return super.sayTo(gameState, words)
    }
    if (gameState.getStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED)) {
      return (
        'The [character_name]phoenix[/character_name] inclines its head, a knowing ' +
        'warmth in its eyes. ' +
        "[dialogue]'You already hold what you have earned.'[/dialogue]"
      )
    }
    const answer = words.trim().toLowerCase()
    if (['patience', 'calm', 'ease'].some((key) => answer.includes(key))) {
      gameState.addItemToInventory(new PhoenixFeather())
      gameState.setStoryFlag(FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED, true)
      return (
        "The [character_name]phoenix[/character_name]'s eyes flare with approval. It " +
        "plucks a single glowing feather and offers it to you. [dialogue]'Wisdom is " +
        "patience, even when the world burns. Take this, and remember.'[/dialogue]"
      )
    }
    return (
      'The [character_name]phoenix[/character_name] studies you in silence. ' +
      "[dialogue]'Is that truly wisdom, when time is short?'[/dialogue]"
    )
  }
}
