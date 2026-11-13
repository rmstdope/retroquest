import { describe, expect, it } from 'vitest'
import { Game, type Item } from '@/engine'
import { Act1 } from '../Act1'
import { Apple } from './Apple'
import { Armor } from './Armor'
import { Bread } from './Bread'
import { BrokenShovel } from './BrokenShovel'
import { Bucket } from './Bucket'
import { Coin } from './Coin'
import { DullKnife } from './DullKnife'
import { Egg } from './Egg'
import { FadedPhotograph } from './FadedPhotograph'
import { Feather } from './Feather'
import { Fish } from './Fish'
import { FishingRod } from './FishingRod'
import { FreshBread } from './FreshBread'
import { GameMap } from './GameMap'
import { Horseshoe } from './Horseshoe'
import { Key } from './Key'
import { Magnet } from './Magnet'
import { Matches } from './Matches'
import { MillstoneFragment } from './MillstoneFragment'
import { MothersLetter } from './MothersLetter'
import { RareFlower } from './RareFlower'
import { Rope } from './Rope'
import { RuneToken } from './RuneToken'
import { RustyHoe } from './RustyHoe'
import { RustySaw } from './RustySaw'
import { SharpKnife } from './SharpKnife'
import { ShinyPebble } from './ShinyPebble'
import { ShinyRing } from './ShinyRing'
import { Stick } from './Stick'
import { Sword } from './Sword'
import { TravelCloak } from './TravelCloak'
import { WanderingBoots } from './WanderingBoots'
import { WildBerries } from './WildBerries'
import { Lantern } from './Lantern'
import { Locket } from './Locket'
import { WitheredCarrot } from './WitheredCarrot'
import { BlessSpell } from '../spells/BlessSpell'

/** The line the story used to tell for every item (rq-3uug). */
const SHARED_LINE = 'This might come in handy, so you decide to pick it up.'

/** Every plain item of Act I that Elior can carry. */
const ITEMS: (new () => Item)[] = [
  RareFlower,
  MothersLetter,
  MillstoneFragment,
  FadedPhotograph,
  ShinyRing,
  RuneToken,
  Key,
  GameMap,
  ShinyPebble,
  Bucket,
  BrokenShovel,
  FishingRod,
  Magnet,
  RustyHoe,
  RustySaw,
  DullKnife,
  SharpKnife,
  Stick,
  Horseshoe,
  Rope,
  Matches,
  Sword,
  Armor,
  Bread,
  FreshBread,
  Apple,
  Egg,
  Fish,
  WildBerries,
  TravelCloak,
  WanderingBoots,
  Coin,
  Feather,
]

/** A fresh Act I game standing in the cottage. */
function newGame(): Game {
  const act = new Act1()
  act.musicFile = ''
  return new Game([act])
}

describe('Act I pickup lines (rq-3uug)', () => {
  it('gives every carried item a line of its own, never the shared one', () => {
    const wrong: string[] = []
    const owner: Record<string, string> = {}
    for (const make of ITEMS) {
      const game = newGame()
      const item = new make()
      item.canBeCarried = true
      game.state.currentRoom.items.push(item)
      const line = game.take(item.name)
      if (line in owner)
        wrong.push(`${item.name} repeats the line of ${owner[line]}`)
      owner[line] = item.name
      if (line === '' || line === SHARED_LINE)
        wrong.push(`${item.name}: ${line}`)
    }
    expect(wrong).toEqual([])
  })

  it('tells the lantern line only once it is lit', () => {
    const game = newGame()
    const lantern = new Lantern()
    game.state.currentRoom.items.push(lantern)
    const unlit = game.take('lantern')
    expect(unlit).toContain('before you carry it')
    lantern.use(game.state)
    const lit = game.take('lantern')
    expect(lit).toContain('lit your way home')
    expect(lit).not.toBe(unlit)
  })

  it('tells the withered and the fresh carrot different lines', () => {
    const game = newGame()
    game.state.currentRoom.items.push(new WitheredCarrot())
    const withered = game.take('carrot')
    const fresh = new WitheredCarrot()
    fresh.revive()
    game.state.currentRoom.items.push(fresh)
    const revived = game.take('carrot')
    expect(withered).toContain('still a carrot')
    expect(revived).toContain('cool and firm')
  })

  it('keeps the priest scene on the first locket take and tells the line after', () => {
    const game = newGame()
    game.state.currentRoom.items.push(new Locket())
    expect(game.take('locket')).toContain('You have learned')
    expect(game.state.hasSpell(new BlessSpell().id)).toBe(true)
    game.state.currentRoom.items.push(new Locket())
    const again = game.take('locket')
    expect(again).not.toContain('You have learned')
    expect(again).not.toBe(SHARED_LINE)
    expect(again).not.toBe('')
  })

  it('says the line once when different items share a name', () => {
    const game = newGame()
    game.state.currentRoom.items.push(new Coin(), new Coin())
    const line = game.take('coin')
    expect(line).not.toBe('')
    expect(line.split(line.slice(0, 20)).length).toBe(2)
  })
})
