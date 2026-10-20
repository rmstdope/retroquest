import {
  Character,
  type GameState,
  type Item,
  event,
  characterName,
  speech,
} from '@/engine'
import { ShinyRing } from '../items/ShinyRing'
import { WanderingBoots } from '../items/WanderingBoots'
import { Horseshoe } from '../items/Horseshoe'
import {
  FLAG_KEPT_MOTHERS_RING,
  FLAG_MERCHANT_NEWS_HEARD,
} from '../Act1StoryFlags'

/** What the merchant tells, once, before his usual line (the ill king). */
const KING_NEWS =
  "You'll want news, if you're bound for Greendale. " +
  "It's a sombre city this season: they say King Alden has fallen ill, " +
  'and no physician can name the sickness. ' +
  'And the roads have gone bad besides. ' +
  'I passed a cart on its side by the hill road, and nobody with it. ' +
  "And it's not only your fields that are failing. " +
  "I've seen crops gone grey in every valley from here to the capital, " +
  'ever since the king took to his bed. ' +
  'Keep to the daylight, friend.\n'

/**
 * Traveling merchant NPC who trades one pair of wandering boots: for the
 * shiny ring (the golden path) or, so Elior can keep his mother's ring, for
 * the blacksmith's old horseshoe.
 */
export class Merchant extends Character {
  /** Track if boots have been given. */
  bootsGiven = false

  constructor() {
    super({
      name: 'merchant',
      description:
        `A traveling ${characterName('merchant')} with a cart full of wares ` +
        'and stories from ' +
        'distant lands. Always ready to trade or offer travel advice.',
    })
  }

  /**
   * Dialogue when the player speaks to the merchant. The first talk puts the
   * news of the ill king ahead of his usual line, in the same speech.
   */
  override talkTo(gameState: GameState): string {
    let news = ''
    if (!gameState.getStoryFlag(FLAG_MERCHANT_NEWS_HEARD)) {
      news = KING_NEWS
      gameState.setStoryFlag(FLAG_MERCHANT_NEWS_HEARD, true)
    }
    // Use bootsGiven flag instead of checking inventory
    const eventMsg = event(`You speak with the ${characterName(this.name)}.`)
    if (!this.bootsGiven) {
      return (
        eventMsg +
        '\n' +
        `The ${characterName(this.name)} offers a friendly nod. ` +
        speech(
          news +
            'Looking for something ' +
            'specific, or just browsing? If you have any fine jewelry, especially ' +
            "a [item_name]shiny ring[/item_name], I'm ready to exchange it for a " +
            'pair of sturdy [item_name]wandering boots[/item_name].\n' +
            'Failing that, my old mare threw a shoe on the hill road; ' +
            'a good iron [item_name]horseshoe[/item_name] would do me nearly as well.',
        )
      )
    }
    return (
      eventMsg +
      '\n' +
      `The ${characterName(this.name)} grins. ` +
      speech(
        news +
          'Those [item_name]boots[/item_name] should ' +
          'serve you well on the road ahead! Let me know if you find anything ' +
          'else of value.',
      )
    )
  }

  /**
   * Trade the boots for the ring or the horseshoe, once; taking the
   * horseshoe sets FLAG_KEPT_MOTHERS_RING. Anything else is declined.
   */
  override giveItem(gameState: GameState, item: Item): string {
    const tradeGoods = item instanceof ShinyRing || item instanceof Horseshoe
    if (tradeGoods && this.bootsGiven) {
      return (
        event(
          `You offer the [item_name]${item.name}[/item_name] to the ` +
            `${characterName(this.name)}.`,
        ) +
        '\n' +
        `The ${characterName(this.name)} waves it away. ` +
        speech(
          "You've had your boots, friend. Keep that; " +
            'a fair trade is a fair trade.',
        )
      )
    }
    if (item instanceof Horseshoe) return this.tradeHorseshoe(gameState, item)
    if (item instanceof ShinyRing) {
      gameState.removeItemFromInventory(item.name)
      const boots = new WanderingBoots()
      gameState.addItemToInventory(boots)
      this.bootsGiven = true // Set flag when boots are given
      const eventMsg = event(
        'You give the [item_name]' +
          item.name +
          `[/item_name] to the ${characterName(this.name)}.`,
      )
      return (
        eventMsg +
        '\n' +
        `The ${characterName(this.name)}'s eyes widen as you hand over the [item_name]` +
        item.name +
        '[/item_name]. ' +
        speech(
          'A fine piece! As promised, here are the [item_name]' +
            boots.name +
            "[/item_name]. They'll serve you well on the road to Greendale.",
        ) +
        '\n\n' +
        event(`You receive a pair of [item_name]${boots.name}[/item_name]!`)
      )
    }
    const eventMsg = event(
      'You offer the [item_name]' +
        item.name +
        `[/item_name] to the ${characterName(this.name)}.`,
    )
    return (
      eventMsg +
      '\n' +
      `The ${characterName(this.name)} examines the [item_name]` +
      item.name +
      '[/item_name] but shakes his head. ' +
      speech('Not interested in that, friend.')
    )
  }

  /** Boots for the horseshoe: Elior keeps his mother's ring. */
  private tradeHorseshoe(gameState: GameState, item: Item): string {
    gameState.removeItemFromInventory(item.name)
    const boots = new WanderingBoots()
    gameState.addItemToInventory(boots)
    this.bootsGiven = true
    gameState.setStoryFlag(FLAG_KEPT_MOTHERS_RING, true)
    return (
      event(
        `You give the [item_name]${item.name}[/item_name] to the ` +
          `${characterName(this.name)}.`,
      ) +
      '\n' +
      `The ${characterName(this.name)} raps the [item_name]${item.name}[/item_name] ` +
      'with a knuckle and grins. ' +
      speech(
        'Good honest iron! A little bent, but the smith in Greendale will ' +
          'straighten it, and my mare will thank you. ' +
          `Here, the [item_name]${boots.name}[/item_name] are yours.`,
      ) +
      '\n\n' +
      event(`You receive a pair of [item_name]${boots.name}[/item_name]!`)
    )
  }
}
