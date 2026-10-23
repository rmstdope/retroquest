import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act1 } from '../Act1'
import { executeCommands, expectDialogueSpeaker } from '@/testing/gameHelpers'
import {
  FLAG_KEPT_MOTHERS_RING,
  FLAG_MERCHANT_NEWS_HEARD,
  VIRTUE_SELFLESS,
} from '../Act1StoryFlags'
import { Horseshoe } from '../items/Horseshoe'
import { ShinyRing } from '../items/ShinyRing'
import { FreshBread } from '../items/FreshBread'
import { Apple } from '../items/Apple'
import { Egg } from '../items/Egg'
import { Fish } from '../items/Fish'
import { WildBerries } from '../items/WildBerries'
import { WitheredCarrot } from '../items/WitheredCarrot'
import { Merchant } from './Merchant'
import { FLAG_WOKE_FROM_DREAM } from '../Act1StoryFlags'
import { Bread } from '../items/Bread'

/** An Act I game on the Road to Greendale with the ring and the horseshoe, woken from the dream as every player is by then. */
function gameAtMerchant(): Game {
  const game = new Game([new Act1()])
  game.state.setStoryFlag(FLAG_WOKE_FROM_DREAM, true)
  game.state.currentRoom = game.state.allRooms.RoadToGreendale
  game.state.addItemToInventory(new ShinyRing())
  game.state.addItemToInventory(new Horseshoe())
  return game
}

describe('Merchant', () => {
  it('asks for the ring, or failing that a horseshoe', () => {
    const answer = executeCommands(gameAtMerchant(), ['talk to merchant'])

    expect(answer).toContain('[item_name]shiny ring[/item_name]')
    expect(answer).toContain('[item_name]horseshoe[/item_name]')
    expectDialogueSpeaker(answer, 'merchant')
  })

  it('trades the boots for the ring, the golden path', () => {
    const game = gameAtMerchant()

    executeCommands(game, ['give shiny ring to merchant'])

    expect(game.state.hasItem('wandering boots')).toBe(true)
    expect(game.state.hasItem('shiny ring')).toBe(false)
    expect(game.state.getStoryFlag(FLAG_KEPT_MOTHERS_RING)).toBe(false)
  })

  it('takes the horseshoe instead, so Elior keeps the ring', () => {
    const game = gameAtMerchant()

    const answer = executeCommands(game, ['give horseshoe to merchant'])

    expectDialogueSpeaker(answer, 'merchant')
    expect(game.state.hasItem('wandering boots')).toBe(true)
    expect(game.state.hasItem('horseshoe')).toBe(false)
    expect(game.state.hasItem('shiny ring')).toBe(true)
    expect(game.state.getStoryFlag(FLAG_KEPT_MOTHERS_RING)).toBe(true)
  })

  it('trades only one pair of boots', () => {
    const game = gameAtMerchant()
    executeCommands(game, ['give horseshoe to merchant'])

    executeCommands(game, ['give shiny ring to merchant'])

    expect(game.state.hasItem('shiny ring')).toBe(true)
    expect(
      game.state.inventory.filter((i) => i.name === 'wandering boots'),
    ).toHaveLength(1)
    expect(game.state.getStoryFlag(FLAG_KEPT_MOTHERS_RING)).toBe(true)
  })

  it('tells the news of the ill king once, before his usual offer', () => {
    const game = gameAtMerchant()

    const first = executeCommands(game, ['talk to merchant'])
    const second = executeCommands(game, ['talk to merchant'])

    expect(first).toContain(
      "You'll want news, if you're bound for Greendale. It's a sombre city " +
        'this season: they say King Alden has fallen ill, and no physician ' +
        'can name the sickness. And the roads have gone bad besides. I passed ' +
        'a cart on its side by the hill road, and nobody with it. And ' +
        "it's not only your fields that are failing. I've seen crops gone " +
        'grey in every valley from here to the capital, ever since the king ' +
        'took to his bed. Keep to the daylight, friend.',
    )
    expect(first.indexOf('Keep to the daylight, friend.')).toBeLessThan(
      first.indexOf('[item_name]shiny ring[/item_name]'),
    )
    expectDialogueSpeaker(first, 'merchant')
    expect(first.match(/\[dialogue\]/g)).toHaveLength(1)
    expect(game.state.getStoryFlag(FLAG_MERCHANT_NEWS_HEARD)).toBe(true)
    expect(second).not.toContain('King Alden')
    expect(second).toContain('[item_name]shiny ring[/item_name]')
  })

  it('tells the news before the boots line when the boots were traded first', () => {
    const game = gameAtMerchant()
    executeCommands(game, ['give shiny ring to merchant'])

    const first = executeCommands(game, ['talk to merchant'])

    expect(first).toContain('King Alden has fallen ill')
    expect(first.indexOf('Keep to the daylight, friend.')).toBeLessThan(
      first.indexOf('should serve you well'),
    )
    expectDialogueSpeaker(first, 'merchant')
    expect(first.match(/\[dialogue\]/g)).toHaveLength(1)
    expect(executeCommands(game, ['talk to merchant'])).not.toContain('Alden')
  })

  it('adds the news to Shadows Over Willowbrook and keeps it through a save', () => {
    const game = gameAtMerchant()
    game.state.settleQuests()
    game.commandParser.parse('talk to merchant')
    const changes = game.state.settleQuests()
    expect(changes.updated.map((q) => q.name)).toEqual([
      'Shadows Over Willowbrook',
    ])

    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())
    const quest = fresh.state.activatedQuests.find(
      (q) => q.name === 'Shadows Over Willowbrook',
    )

    expect(quest?.description).toContain('King Alden lies ill')
    expect(executeCommands(fresh, ['talk to merchant'])).not.toContain('Alden')
  })

  it('tells the news once to a save made before the news existed', () => {
    const game = gameAtMerchant()
    executeCommands(game, ['give shiny ring to merchant'])
    const fresh = new Game([new Act1()])
    fresh.loadSaveData(game.toSaveData())
    expect(fresh.state.getStoryFlag(FLAG_MERCHANT_NEWS_HEARD)).toBe(false)

    const first = executeCommands(fresh, ['talk to merchant'])
    const second = executeCommands(fresh, ['talk to merchant'])

    expect(first).toContain('King Alden has fallen ill')
    expect(second).not.toContain('King Alden')
  })
})

const HUNGER =
  "Forgive me if I'm short, friend. I've not eaten since the hill road, " +
  "and there's no inn this side of Greendale."
const REMEMBERED_SELFLESS =
  '[event]✦ Selflessness — this will be remembered[/event]'

describe('Merchant and the fresh bread', () => {
  it('ends every talk with his hunger line, in the same speech, until he is fed', () => {
    const game = gameAtMerchant()

    const first = executeCommands(game, ['talk to merchant'])
    const second = executeCommands(game, ['talk to merchant'])

    for (const answer of [first, second]) {
      expect(answer).toContain(HUNGER)
      expect(answer.match(/\[dialogue\]/g)).toHaveLength(1)
      expect(answer.indexOf(HUNGER)).toBeGreaterThan(
        answer.indexOf('[item_name]horseshoe[/item_name]'),
      )
    }
  })

  it('is hungry whether or not the boots were traded, and with or without the bread in the pack', () => {
    const game = gameAtMerchant()
    executeCommands(game, ['give shiny ring to merchant'])
    expect(game.state.hasItem('fresh bread')).toBe(false)

    const answer = executeCommands(game, ['talk to merchant'])

    expect(answer).toContain('should serve you well')
    expect(answer.indexOf(HUNGER)).toBeGreaterThan(
      answer.indexOf('should serve you well'),
    )
  })

  it('takes the fresh bread: reaction, then the remembered line, recorded once', () => {
    const game = gameAtMerchant()
    game.state.addItemToInventory(new FreshBread())

    const answer = executeCommands(game, ['give fresh bread to merchant'])

    expect(game.state.hasItem('fresh bread')).toBe(false)
    expect(answer).toContain(
      'You give the [item_name]fresh bread[/item_name] to the ' +
        '[character_name]merchant[/character_name].',
    )
    expect(answer).toContain(
      'The [character_name]merchant[/character_name] unwraps the cloth and ' +
        'simply holds the loaf for a moment.',
    )
    expect(answer).toContain(
      "Still warm. ... What do I owe you? No? Nothing at all? Then you've a " +
        "better heart than most I meet on this road, friend. I'll not forget it.",
    )
    expect(answer.indexOf(REMEMBERED_SELFLESS)).toBeGreaterThan(
      answer.indexOf("I'll not forget it"),
    )
    expectDialogueSpeaker(answer, 'merchant')
    expect(game.state.hasVirtue(VIRTUE_SELFLESS)).toBe(true)
  })

  it('drops the hunger line once he is fed, and adds nothing', () => {
    const game = gameAtMerchant()
    game.state.addItemToInventory(new FreshBread())
    executeCommands(game, ['give fresh bread to merchant'])

    const answer = executeCommands(game, ['talk to merchant'])

    expect(answer).not.toContain('Forgive me')
    expect(answer).not.toContain('remembered')
    expect(answer).toContain('[item_name]shiny ring[/item_name]')
  })

  it.each([
    ['apple', () => new Apple()],
    ['egg', () => new Egg()],
    ['fish', () => new Fish()],
    ['wild berries', () => new WildBerries()],
    ['withered carrot', () => new WitheredCarrot()],
    ['bread', () => new Bread()],
  ])('kindly refuses the %s and Elior keeps it', (name, make) => {
    const game = gameAtMerchant()
    game.state.addItemToInventory(make())

    const answer = executeCommands(game, [`give ${name} to merchant`])

    expect(answer).toContain(
      `You offer the [item_name]${name}[/item_name] to the ` +
        '[character_name]merchant[/character_name].',
    )
    expect(answer).toContain(
      "That's kind, friend, but you'll want every bite of that where " +
        "you're going. Keep it.",
    )
    expect(game.state.hasItem(name)).toBe(true)
    expect(game.state.hasVirtue(VIRTUE_SELFLESS)).toBe(false)
    expect(executeCommands(game, ['talk to merchant'])).toContain(HUNGER)
  })

  it('shows the refusal as the event line and his speech, with no narration between', () => {
    const game = gameAtMerchant()
    game.state.addItemToInventory(new Apple())

    const answer = executeCommands(game, ['give apple to merchant'])

    expect(answer).toBe(
      '[event]You offer the [item_name]apple[/item_name] to the ' +
        '[character_name]merchant[/character_name].[/event]\n' +
        "[dialogue]That's kind, friend, but you'll want every bite of that " +
        "where you're going. Keep it.[/dialogue]",
    )
  })

  it('counts a merchant from a save made before he could be fed as hungry', () => {
    const game = gameAtMerchant()
    const merchant = game.state.currentRoom.characters.find(
      (c) => c instanceof Merchant,
    ) as Merchant
    Reflect.deleteProperty(merchant, 'fed')

    expect(executeCommands(game, ['talk to merchant'])).toContain(HUNGER)
  })
})
