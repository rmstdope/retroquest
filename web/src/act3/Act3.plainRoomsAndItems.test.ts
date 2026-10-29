import { describe, it, expect } from 'vitest'
import { Game, GameState, Room } from '@/engine'
import { Act3 } from './Act3'
import { CavernMouth } from './rooms/CavernMouth'
import { CollapsedGalleries } from './rooms/CollapsedGalleries'
import { ToolCache } from './rooms/ToolCache'
import { EchoChambers } from './rooms/EchoChambers'
import { OuterWards } from './rooms/OuterWards'
import { SubmergedAntechamber } from './rooms/SubmergedAntechamber'
import { SanctumOfTheTide } from './rooms/SanctumOfTheTide'
import { ShorelineMarkers } from './rooms/ShorelineMarkers'
import { FumarolePassages } from './rooms/FumarolePassages'
import { LanternBracket } from './items/LanternBracket'
import { MirrorMount } from './items/MirrorMount'
import { BrassMirrorSegment } from './items/BrassMirrorSegment'
import { HeatWardMix } from './items/HeatWardMix'
import { SupplyCrate } from './items/SupplyCrate'
import { CrystalOfLight } from './items/CrystalOfLight'
import { FLAG_ACT3_VOW_OF_COURAGE_MADE } from './Act3StoryFlags'

/** A bare game state. */
function dummyState(): GameState {
  return new GameState(new Room({ name: 'Nowhere', description: '' }), {}, [])
}

describe('Act III cavern rooms say one true thing', () => {
  it('describes the cavern mouth, the galleries and the tool cache plainly', () => {
    expect(new CavernMouth().description).toBe(
      'A broad arch opens into the hill, hung with cold mist. ' +
        'Lantern light dims a step inside it. ' +
        'Old signs are cut into the arch stone, worn too smooth to read.',
    )
    expect(new CollapsedGalleries().description).toBe(
      'A gallery choked with fallen stone, floor to roof. ' +
        'The timbers that held it lie snapped under the pile, ' +
        'and dust hangs in the still air.',
    )
    expect(new ToolCache().description).toBe(
      'A side chamber shored with old timbers and stacked with crates of ' +
        'braces, iron fittings and coils of hemp rope. ' +
        'The walls are scored with tool marks, ' +
        'and the air smells of iron and wet earth.',
    )
  })

  it('describes the echo chambers and their scrolls by what they do', () => {
    const room = new EchoChambers()
    expect(room.description).toBe(
      'Smooth caverns of bare stone. ' +
        'Every step comes back to you from the alcoves, ' +
        'and so does every word, a breath late, as if someone were copying you. ' +
        'Runes cover the walls, cut by three hands, the same words over and over.',
    )
    expect(room.search(dummyState())).toBe(
      'In a stone niche at the back of an alcove lies a bundle of old scrolls, ' +
        'tied with faded golden thread.',
    )
  })
})

describe('Act III coast rooms taste of vows only in the sanctum', () => {
  it('cuts the tasting line from the outer wards and the antechamber', () => {
    expect(new OuterWards().description).toBe(
      'The courtyard lies half-swallowed by the sea. ' +
        'Three ancient pillars rise from the black water, ' +
        'their faces scored with shallow marks. ' +
        'Brine beads along the carved lines and they catch the moon in small ' +
        'rings of light.',
    )
    expect(new SubmergedAntechamber().description).toBe(
      'The hall lies half-swallowed by tide and time. ' +
        'Salt-smoothed stone arches bear weathered carvings that pulse with a ' +
        'cold, inner glow. ' +
        'A hush hangs in the air as if the sea itself listens; ' +
        'faint, distant echoes suggest something patient and watchful beyond ' +
        'the veil of gloom. ' +
        'Somewhere further in, water drips, slow and patient.',
    )
    expect(new SanctumOfTheTide().description).toContain(
      'the air tastes of brine and vows left unsaid.',
    )
  })
})

describe('Act III lines no longer instruct in the game voice', () => {
  it('reads the mirror mount without naming the next step', () => {
    const state = dummyState()
    state.currentRoom = new Room({ name: 'Terrace', description: '' })
    const mount = new MirrorMount()
    expect(mount.examine(state)).toBe(
      'You sift the ash and grit beneath the mount and find a ' +
        '[item_name]brass mirror segment[/item_name], half-buried in the sand.',
    )
    expect(mount.useWith(state, new BrassMirrorSegment())).toContain(
      'The mount has four sockets, and you have not enough segments to fill them.',
    )
  })

  it('reads the empty bracket without naming the lantern', () => {
    const room = new SubmergedAntechamber()
    room.items.push(new LanternBracket())
    expect(room.mountLantern(dummyState())).toContain(
      'The bracket is empty, and you have nothing to set in it.',
    )
  })

  it('leaves the instructions out of the heat-ward mix, vents and crate', () => {
    expect(new HeatWardMix().description).toBe(
      'A coarse paste of ash-fern and cooled slag prepared to seal and ' +
        "stabilize vent stones against the mountain's heat.",
    )
    expect(
      new FumarolePassages().applyHeatWard(dummyState(), new HeatWardMix()),
    ).toContain(
      'The vents still gust out of time with each other. ' +
        'A ward laid on them now would crack at the first wrong breath.',
    )
    const state = dummyState()
    state.currentRoom = new Room({ name: 'Cache', description: '' })
    const crate = new SupplyCrate()
    crate.locked = false
    expect(crate.open(state)).toContain(
      'Inside the crate are heavy iron braces, strong hemp straps and ' +
        'tapered wooden wedge blocks.',
    )
  })
})

describe('The crystal of light is cold and clear', () => {
  it('describes, examines and picks up plainly', () => {
    const crystal = new CrystalOfLight()
    const game = new Game([new Act3()])
    const text =
      'A prism the size of your palm, cold and clear. ' +
      'Light moves in it like water under a moon.'
    expect(crystal.description).toBe(text)
    expect(crystal.examine(game.state)).toBe(text)
    game.state.setStoryFlag(FLAG_ACT3_VOW_OF_COURAGE_MADE, true)
    expect(crystal.pickedUp(game.state)).toBe(
      'The crystal is cold, and steady in your hand.',
    )
  })
})

describe('Act III small slips', () => {
  it('starts the repeat search sentence in capitals and counts what is left', () => {
    const room = new ShorelineMarkers()
    const state = dummyState()
    room.search(state)
    expect(room.search(state)).toBe(
      '[failure]You comb the surf-slick stones again. ' +
        'Pale shards gleam in the cracks, ' +
        'but you have gathered all you can use.[/failure]',
    )
  })
})

describe('Act III saves from before the plain rooms and items', () => {
  it('give old descriptions their new wording on load', () => {
    const game = new Game([new Act3()])
    const rooms = game.state.allRooms
    const names = [
      'CavernMouth',
      'CollapsedGalleries',
      'ToolCache',
      'EchoChambers',
      'OuterWards',
      'SubmergedAntechamber',
    ]
    for (const name of names) rooms[name].description = 'Old text.'
    const crystal = new CrystalOfLight()
    const mix = new HeatWardMix()
    crystal.description = 'Old crystal.'
    mix.description = 'Old mix.'
    rooms.SanctumOfTheTide.items.push(crystal)
    game.state.inventory.push(mix)

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    const rooms2 = fresh.state.allRooms
    const crystal2 = rooms2.SanctumOfTheTide.items.find(
      (i) => i instanceof CrystalOfLight,
    )
    const mix2 = fresh.state.inventory.find((i) => i instanceof HeatWardMix)

    expect(rooms2.CavernMouth.description).toBe(new CavernMouth().description)
    expect(rooms2.CollapsedGalleries.description).toBe(
      new CollapsedGalleries().description,
    )
    expect(rooms2.ToolCache.description).toBe(new ToolCache().description)
    expect(rooms2.EchoChambers.description).toBe(new EchoChambers().description)
    expect(rooms2.OuterWards.description).toBe(new OuterWards().description)
    expect(rooms2.SubmergedAntechamber.description).toBe(
      new SubmergedAntechamber().description,
    )
    expect(crystal2?.description).toBe(new CrystalOfLight().description)
    expect(mix2?.description).toBe(new HeatWardMix().description)
  })
})
