import { Character, type GameState } from '@/engine'
import { FLAG_VILLAGER_TALKED_TO } from '../Act1StoryFlags'

/** A friendly Willowbrook local who cycles through village rumors. */
export class Villager extends Character {
  dialogueOptions: string[] = [
    'Have you seen the fields lately? The crops are withering overnight, and no one ' +
      "knows why. It's like the land itself is sick...",
    'Last night, someone spotted a cloaked stranger near the old well. Folks say he ' +
      'vanished when the moon went behind the clouds.',
    "The animals are restless. My neighbor's dog howled at nothing for hours, and the " +
      'chickens refuse to leave their coop after dusk.',
    'Strange footprints appeared by the riverbank this morning—too large for any ' +
      'villager, and they led straight into the woods.',
    'Mira says the air feels heavy with magic, and the chapel bell rang by itself at ' +
      "midnight. Something's not right in Willowbrook.",
  ]
  dialogueIndex = 0

  constructor() {
    super({
      name: 'villager',
      description:
        'A friendly Willowbrook local, always eager to share the latest gossip or ' +
        'rumors about the village.',
    })
  }

  /** Share the next rumor and record that a villager has been talked to. */
  override talkTo(gameState: GameState): string {
    gameState.setStoryFlag(FLAG_VILLAGER_TALKED_TO, true)
    const dialogue = this.dialogueOptions[this.dialogueIndex]
    // Cycle through dialogue
    this.dialogueIndex = (this.dialogueIndex + 1) % this.dialogueOptions.length
    const eventMsg = `[event]You speak with the [character_name]${this.name}[/character_name].[/event]`
    return eventMsg + '\n' + `'${dialogue}'`
  }
}
