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

/** Every plain item of Act I with the line Elior's hand tells when taking it. */
const LINES: [new () => Item, string][] = [
  [
    RareFlower,
    'The petals stay open in your hand. You hold it carefully, the way you would hold something that trusted you.',
  ],
  [
    MothersLetter,
    'You fold it along its old creases and put it inside your shirt, where it will stay dry. Your hands are not quite steady.',
  ],
  [
    MillstoneFragment,
    'It is rough and heavy, and the edge where it broke is still pale. Whoever built that mill meant it to last.',
  ],
  [
    FadedPhotograph,
    'You hold it by the edges so as not to smudge the faces. The child in it is you, though you do not remember the day.',
  ],
  [
    ShinyRing,
    'It is small and cold, and it fits in the hollow of your palm. You close your hand around it before you think to.',
  ],
  [
    RuneToken,
    'It is cold, and it stays cold. You put it away, and you do not like having it.',
  ],
  [
    Key,
    'It is small and rusty, and the teeth are worn. Someone used it often, once.',
  ],
  [
    GameMap,
    'You fold it so the village is on top. Some of the paths on it you have never walked.',
  ],
  [
    ShinyPebble,
    'It is warm, warmer than the sun could make it. You keep it anyway.',
  ],
  [
    Bucket,
    'The handle creaks, but it holds. Most things in Willowbrook are like that.',
  ],
  [
    BrokenShovel,
    'The handle shifts where it is cracked. It will dig, if you are gentle with it.',
  ],
  [FishingRod, 'It bends more than a rod should. It will have to do.'],
  [
    Magnet,
    'It snaps to the nearest bit of iron and has to be pulled free. Small as it is, it does not let go easily.',
  ],
  [
    RustyHoe,
    'Rust comes off on your palm. Someone worked a field with it for years.',
  ],
  [
    RustySaw,
    'The teeth are dull and orange with rust. It will cut something soft, once or twice.',
  ],
  [DullKnife, 'You test the edge with your thumb. It would not cut bread.'],
  [
    SharpKnife,
    'The new edge catches the light. You hold it by the handle, and carefully.',
  ],
  [
    Stick,
    'It is straight and sound, and about the right length. A good stick is worth keeping.',
  ],
  [
    Horseshoe,
    'It is heavy, and bent at one heel. Iron like this does not go to waste.',
  ],
  [
    Rope,
    'You loop it over your shoulder. It is good rope, and it was not cheap.',
  ],
  [
    Matches,
    'The box rattles, nearly full. You keep it away from anything damp.',
  ],
  [
    Sword,
    'It sits well in your hand, better than you expected. You hope you will not need it.',
  ],
  [
    Armor,
    'It is stiff, and it smells of new leather. It will soften with wearing.',
  ],
  [Bread, 'The crust gives under your thumb. It smells like morning.'],
  [
    FreshBread,
    'It is warm through the cloth. It smells of home, and of her kitchen.',
  ],
  [Apple, 'It is crisp and cold, and nearly too red. You save it for later.'],
  [
    Egg,
    'It is still warm, and you hold it carefully. One wrong step and it is gone.',
  ],
  [Fish, 'It is slippery and cold. It will not keep for long.'],
  [
    WildBerries,
    'They stain your fingers dark. You do not know yet if they are safe.',
  ],
  [
    TravelCloak,
    'It is heavy, and it smells of cedar. She must have kept it a long time.',
  ],
  [
    WanderingBoots,
    "The leather is soft from other people's roads. They feel ready to go, even if you are not.",
  ],
  [Coin, 'It is small, and the stamp is worn. Not much, but it is something.'],
  [
    Feather,
    'It weighs nothing at all. You tuck it away before the wind can take it.',
  ],
]

/** A fresh Act I game standing in the cottage. */
function newGame(): Game {
  const act = new Act1()
  act.musicFile = ''
  return new Game([act])
}

describe('Act I pickup lines (rq-3uug)', () => {
  it.each(LINES)(
    '%o tells its own line, again after a drop elsewhere',
    (make, line) => {
      const game = newGame()
      const item = new make()
      item.canBeCarried = true
      game.state.currentRoom.items.push(item)
      expect(game.take(item.name)).toBe(line)
      game.state.currentRoom = game.state.allRooms['VillageSquare']
      expect(game.drop(item.name)).toContain('You drop')
      expect(game.take(item.name)).toBe(line)
    },
  )

  it('tells the lantern line only once it is lit', () => {
    const game = newGame()
    const lantern = new Lantern()
    game.state.currentRoom.items.push(lantern)
    expect(game.take('lantern')).toContain('before you carry it')
    lantern.use(game.state)
    expect(game.take('lantern')).toBe(
      'The brass is worn smooth where hands have held it. ' +
        'It has lit your way home for as long as you can remember.',
    )
  })

  it('tells the withered and the fresh carrot their own lines', () => {
    const game = newGame()
    const carrot = new WitheredCarrot()
    game.state.currentRoom.items.push(carrot)
    expect(game.take('carrot')).toBe(
      'It bends in your fingers, soft and nearly gone. ' +
        'It is still a carrot, just.',
    )
    game.drop('carrot')
    carrot.revive()
    expect(game.take('carrot')).toBe(
      'It is cool and firm, with soil still on it. ' +
        'Not long ago it was barely alive.',
    )
  })

  it('keeps the priest scene on the first locket take and tells the line after', () => {
    const game = newGame()
    game.state.currentRoom.items.push(new Locket())
    expect(game.take('locket')).toContain('You have learned')
    game.drop('locket')
    expect(game.state.hasSpell(new BlessSpell().id)).toBe(true)
    expect(game.take('locket')).toBe(
      'The silver is cool against your palm. You keep it where you can feel it.',
    )
  })

  it('says each line once when different items share a name', () => {
    const game = newGame()
    game.state.currentRoom.items.push(new Coin(), new Coin())
    expect(game.take('coin')).toBe(
      'It is small, and the stamp is worn. Not much, but it is something.',
    )
  })

  it('never tells the shared line for any item Act I lets Elior carry', () => {
    for (const [make] of LINES) {
      const game = newGame()
      const item = new make()
      item.canBeCarried = true
      game.state.currentRoom.items.push(item)
      expect(game.take(item.name)).not.toBe(SHARED_LINE)
    }
  })
})
