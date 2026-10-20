import { Character, type GameState } from '@/engine'
import { ProtectiveCharm } from '../items/ProtectiveCharm'
import { FLAG_HERMITS_WARNING_ACCEPTED } from '../Act2StoryFlags'

/**
 * Wilderness mentor who grants a protective charm and warns of deeper trials.
 *
 * The first interaction grants a ProtectiveCharm and sets the acceptance flag;
 * later talks only reinforce the guidance.
 */
export class ForestHermit extends Character {
  hasWarned = false
  charmGiven = false

  constructor() {
    super({
      name: 'forest hermit',
      description:
        'A mysterious figure wrapped in forest-green robes, with skin weathered ' +
        'by years in the wilderness. Their eyes hold the wisdom of the forest, ' +
        'and they carry protective charms and talismans from the deep woods.',
    })
  }

  /** Warn the player and give the charm once, then repeat the guidance. */
  override talkTo(gameState: GameState): string {
    const name = this.name
    const eventMsg =
      '[event]You approach the [character_name]' +
      name +
      '[/character_name].[/event]'

    if (!this.hasWarned) {
      this.hasWarned = true
      this.charmGiven = true

      // Give protective charm and complete "The Hermit's Warning" quest
      const protectiveCharm = new ProtectiveCharm()
      gameState.addItemToInventory(protectiveCharm)
      // Quest will be activated by the Forest Transition room when appropriate
      // Set quest completion flag
      gameState.setStoryFlag(FLAG_HERMITS_WARNING_ACCEPTED, true)
      return (
        eventMsg +
        '\n' +
        (`The [character_name]${this.name}[/character_name] ` +
          "studies you with ancient eyes. [dialogue]'I have been waiting for you, ") +
        ('young one. The forest spirits whispered of your coming. You ' +
          'seek to enter the Enchanted Forest, but few mortals who ' +
          "venture unprepared ever return.'[/dialogue]\n\n") +
        ("[dialogue]'The forest is alive with magic both beautiful and " +
          'terrible. Ancient guardians protect its secrets, and the very ' +
          'trees themselves judge the worth of those who walk among them. ' +
          'Dark spirits prey upon the unwary, and the paths shift like ' +
          "shadows at twilight.'[/dialogue]\n\n") +
        ("[dialogue]'But you... you have the light of destiny about you. " +
          "Take this charm—it will protect you from the forest's darker " +
          'influences and mark you as one under my protection. Remember: ' +
          'show respect to all forest beings, never take more than you give, ' +
          "and listen to the wind's warnings.'[/dialogue]\n\n") +
        '[event]You receive a [item_name]protective charm[/item_name]![/event]'
      )
    } else {
      return (
        eventMsg +
        '\n' +
        (`The [character_name]${this.name}[/character_name] ` +
          "nods knowingly. [dialogue]'The forest awaits, but remember my warnings. ") +
        ("Trust in nature's wisdom, and the ancient ways will guide your " +
          "steps. May the spirits of leaf and stone watch over you.'[/dialogue]")
      )
    }
  }
}
