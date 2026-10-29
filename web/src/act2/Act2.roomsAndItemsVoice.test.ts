import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act2 } from './Act2'
import { CrystalClearWater } from './items/CrystalClearWater'
import { CrystalFocus } from './items/CrystalFocus'
import { EnhancedLantern } from './items/EnhancedLantern'
import { ForestSurvivalKit } from './items/ForestSurvivalKit'
import { Moonflowers } from './items/Moonflowers'
import { SilverLeaves } from './items/SilverLeaves'
import { SquiresDiary } from './items/SquiresDiary'
import { StandingStones } from './items/StandingStones'
import { TrainingSword } from './items/TrainingSword'
import { QualityRope } from './items/QualityRope'
import { Ravine } from './items/Ravine'
import { ProtectiveEnchantments } from './items/ProtectiveEnchantments'
import { MendSpell } from './spells/MendSpell'

const ROOM_TEXT: Record<string, string> = {
  WhisperingGlade:
    'A meadow opens round a small stream that runs over smooth stones. ' +
    "Wildflowers grow thick to the water's edge. Under the sound of the " +
    'water there are other sounds, almost voices, and they stop when you ' +
    'listen for them.',
  HeartOfTheForest:
    'The deepest part of the forest. The light here is green and gold and ' +
    'does not seem to come from the sky. A tree vaster than any other holds ' +
    'up the branches overhead, and before it stands an altar of starstone. ' +
    'The only way out is back north, to the grove.',
  AncientGrove:
    'A ring of trees so old their trunks are wider than a cottage. Signs ' +
    'are carved in their bark, older than any letters you know. In the ' +
    'middle stands one tree taller than the rest, with bark the colour of ' +
    'tarnished silver.',
  MountainPath:
    'A trail climbs through rock and pine between Willowbrook and ' +
    'Greendale. From the overlooks you can see both: Greendale ahead, and ' +
    'Willowbrook small and far behind you. Just off the trail is a camp ' +
    'site where travellers stop for the night.',
}

describe('Act II rooms say one true thing', () => {
  it('describes the forest edge', () => {
    const game = new Game([new Act2()])
    const text = game.state.allRooms.ForestTransition.descriptionFor(game.state)
    expect(text).toContain(
      'The mountain path ends at a ring of standing stones, grey and mossed, ' +
        'with runes cut deep in them. Past the stones the trees begin all at ' +
        'once, close and dark.',
    )
    expect(text).not.toContain('ancient power')
  })

  for (const [id, wording] of Object.entries(ROOM_TEXT)) {
    it(`describes ${id}, and restores it in older saves`, () => {
      const game = new Game([new Act2()])
      const room = game.state.allRooms[id]
      expect(room.description).toBe(wording)
      room.description = 'old wording'
      new Act2().afterLoad(game.state)
      expect(room.description).toBe(wording)
    })
  }
})

describe('Act II items say one true thing', () => {
  it('describes the nymphs gifts and restores them in older saves', () => {
    const game = new Game([new Act2()])
    const water = new CrystalClearWater()
    const flowers = new Moonflowers()
    const leaves = new SilverLeaves()
    expect(water.description).toBe(
      "Water from the nymphs' stream, so clear the flask looks empty until " +
        'you tip it. No bucket has ever gone down that spring.',
    )
    expect(water.examine(game.state)).toBe(water.description)
    expect(flowers.description).toBe(
      'White flowers that open only at night, and these are open still. ' +
        'They smell faintly sweet, and their petals give off a little light ' +
        'of their own.',
    )
    expect(flowers.examine(game.state)).toBe(flowers.description)
    expect(leaves.description).toBe(
      'Leaves from the silver-barked tree, cool and stiff, with a silver ' +
        'sheen even in shadow. A healer would know what to do with these.',
    )
    game.state.currentRoom = game.state.allRooms.WhisperingGlade
    expect(flowers.pickedUp(game.state)).toBe(
      'They come up easily, roots and all, as if they had been waiting to be ' +
        'carried.',
    )

    const focus = new CrystalFocus()
    const kit = new ForestSurvivalKit()
    for (const item of [water, flowers, leaves, focus, kit])
      item.description = 'old'
    game.state.currentRoom.items.push(water, flowers)
    game.state.inventory.push(leaves, focus, kit)
    new Act2().afterLoad(game.state)
    expect(focus.description).toContain('narrower and brighter')
    expect(kit.description).toContain('ring of small warding stones')
    expect(water.description).toContain('nymphs')
    expect(flowers.description).toContain('open only at night')
    expect(leaves.description).toContain('silver-barked')
  })

  it('describes the focus, the lantern and the kit', () => {
    const game = new Game([new Act2()])
    const focus = new CrystalFocus()
    expect(focus.description).toBe(
      'A clear crystal the length of your finger, cut with many faces. Hold ' +
        'it to the light and the light comes out the other side narrower and ' +
        'brighter.',
    )
    expect(focus.examine(game.state)).toBe(focus.description)
    expect(new ForestSurvivalKit().description).toBe(
      'A canvas roll with everything for a night in the open: dried food, ' +
        'flint and steel, a water skin, a blanket, and a ring of small ' +
        'warding stones to set round where you sleep.',
    )
    game.state.currentRoom = game.state.allRooms.ForestEntrance
    expect(new EnhancedLantern().use(game.state)).toContain(
      "The lantern's crystal catches, and its light comes out blue and " +
        'steady. Where it falls on the undergrowth to the east, the tangle ' +
        'thins, and a narrow path shows through it.',
    )
  })

  it('teaches nature sense once, in one announcement', () => {
    const game = new Game([new Act2()])
    const text = new StandingStones().examine(game.state)
    expect(text).toBe(
      'You run your hands over the stones. The runes are worn but deep, cut ' +
        'by people who meant them to last. As you trace them, the shapes ' +
        'start to mean something: not words, but a way of listening to ' +
        'everything that grows.' +
        '\n\n' +
        'You have learned [spell_name]nature sense[/spell_name].',
    )
  })

  it('lets the diary go back under the bench without explaining itself', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.CastleCourtyard
    const text = new SquiresDiary().use(game.state)
    expect(
      text.endsWith(
        '\n\nYou put the diary back under the bench, where the next squire will find it.',
      ),
    ).toBe(true)
    expect(text).not.toContain('Heavensforth by a watchman')
    expect(text).not.toContain('keeps the information safe')
  })

  it('has the sword say what it is when no one is watching', () => {
    const game = new Game([new Act2()])
    expect(new TrainingSword().use(game.state)).toContain(
      'The balance is good. Somebody swung this a great deal, a long time ago.',
    )
  })
})

describe('Act II refusals and results say what happens, not what to do', () => {
  it('lets the ravine refuse without naming rope', () => {
    const game = new Game([new Act2()])
    const text = new Ravine().examine(game.state)
    expect(text).toContain(
      'The walls are sheer and loose; nobody climbs down those by hand.',
    )
    expect(text).not.toContain('rope or other climbing')
  })

  it('opens the inn stairs without naming a command', () => {
    const game = new Game([new Act2()])
    const text = (
      game.state.allRooms.SilverStagInn as unknown as { useKey(): string }
    ).useKey()
    expect(text).toBe(
      '[success]The key turns with a soft click, and the door to the stairs ' +
        'swings open.[/success]',
    )
  })

  it('mends the wards without calling the player worthy', () => {
    const game = new Game([new Act2()])
    const text = new MendSpell().castOnItem(
      game.state,
      new ProtectiveEnchantments(),
    )
    expect(text).toContain('now glow steadily.[/success]')
    expect(text).not.toContain('worthiness')
  })

  it('rescues the caravan by telling what is at the bottom', () => {
    const game = new Game([new Act2()])
    game.state.currentRoom = game.state.allRooms.ForestEntrance
    const text = new QualityRope().useWith(game.state, new Ravine())
    expect(text).toBe(
      '[success]You tie the [item_name]rope[/item_name] to a sturdy tree and ' +
        'climb down into the ravine. The wagon lies on its side at the ' +
        "bottom, and round it are Thorne's people: hurt, hungry, and alive. " +
        'One by one you get them up the rope, and they bring what goods they ' +
        'can carry.[/success]',
    )
  })
})
