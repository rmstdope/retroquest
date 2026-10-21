import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { Act3 } from './Act3'
import { DarkPool } from './items/DarkPool'
import { StillwaterPhial } from './items/StillwaterPhial'
import { Miners } from './characters/Miners'
import { QuietCharm } from './items/QuietCharm'
import { ACT3_GOLDEN_PATH } from './Act3GoldenPath'
import { playDebugScript } from '@/utils/debugScript'
import {
  FLAG_ACT3_MAIN_STARTED,
  FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
  FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED,
  FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
  FLAG_ACT3_MINERS_RESCUE_COMPLETED,
  FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED,
  FLAG_ACT3_POOLS_STILLED,
  FLAG_ACT3_DRAGONS_MEMORY_RECEIVED,
  FLAG_ACT3_DRAGON_OATH_SPOKEN,
  FLAG_ACT3_OATH_SCROLLS_EXAMINED,
  FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED,
  FLAG_ACT3_FORTRESS_GATES_EXAMINED,
  FLAG_ACT3_MAIN_COMPLETED,
  FLAG_ACT3_PHOENIX_STORY_TOLD,
  FLAG_ACT3_INSCRIPTION_MENDED,
  VIRTUE_MERCY,
} from './Act3StoryFlags'
import {
  executeCommands,
  expectMarkupWellFormed,
  expectCharacterInRoom,
  expectCurrentRoom,
  expectItemCountInInventory,
  expectItemInInventory,
  expectItemInRoom,
  expectQuests,
  expectStoryFlag,
} from '@/testing/gameHelpers'

const MAIN = 'The Three Virtues'
const ECHOES = 'Echoes of the Hidden Bond'

describe('Act 3 integration', () => {
  it('completes only after the fortress gates are examined', () => {
    const act = new Act3()
    const game = new Game([act])

    expect(act.isCompleted(game.state)).toBe(false)
    game.state.setStoryFlag(FLAG_ACT3_FORTRESS_GATES_EXAMINED, true)
    expect(act.isCompleted(game.state)).toBe(true)
  })

  it('initializes correctly', () => {
    const act3 = new Act3()
    expect(act3).not.toBeNull()
    expect(typeof act3.rooms, 'rooms is a record').toBe('object')
    expect(Array.isArray(act3.quests), 'quests is a list').toBe(true)
    expect(act3.getActIntro()).not.toBeNull()
  })

  it('can be loaded into a Game', () => {
    const act3 = new Act3()
    const game = new Game([act3])
    expect(game).not.toBeNull()
    expect(game.acts).toHaveLength(1)
    expect(game.acts[0]).toBe(act3)
  })
})

describe('Act 3 golden path', () => {
  it('can be completed from start to finish', () => {
    const game = new Game([new Act3()])
    const state = game.state
    const room = () => state.currentRoom

    // Start in Mira's Hut with Mira present
    expectCurrentRoom(state, "Mira's Hut")
    expectCharacterInRoom(room(), 'mira', true)

    // First talk: start main quest (The Three Virtues)
    let result = executeCommands(game, ['talk to mira'])
    expectStoryFlag(state, FLAG_ACT3_MAIN_STARTED, true)
    expect(result.toLowerCase()).toContain('three relics')
    // Ensure quest is activated (helpers auto-flush activations)
    expectQuests(state, [MAIN])

    // Examine note to start another quest
    executeCommands(game, ['examine keepsake note'])
    expectQuests(state, [ECHOES, MAIN])

    // Second talk: teleport to Tidal Causeway (Sunken Ruins entry) with companions
    // Cast light to find key
    executeCommands(game, ['talk to mira'])
    expectCurrentRoom(state, 'Tidal Causeway')
    expectCharacterInRoom(room(), 'mira', true)
    expectCharacterInRoom(room(), 'sir cedric', true)
    expectItemInInventory(state, 'Rusted Locker Key', false)
    result = executeCommands(game, ['cast light'])
    expect(result.toLowerCase()).toContain('shadow')
    expect(result.toLowerCase()).toContain('hollow')
    expect(result.toLowerCase()).toContain('key')
    // Ensure rusted key present
    expectItemInRoom(room(), 'Rusted Locker Key', true)
    executeCommands(game, ['take rusted locker key'])
    expectItemInInventory(state, 'Rusted Locker Key', true)
    expectItemInRoom(room(), 'Rusted Locker Key', false)

    // Step 3: move north to Shoreline Markers => should activate Tideward Sigils
    executeCommands(game, ['north'])
    expectCurrentRoom(state, 'Shoreline Markers')
    // Reveal the runes so the Tideward Sigils started flag is set
    executeCommands(game, ['search'])
    // Newly activated side quest should now be active alongside the main quest
    expectQuests(state, [ECHOES, MAIN, 'Tideward Sigils'])
    // Search/examine/take runes
    const combined = executeCommands(game, [
      'search',
      'examine steles',
      'take moon rune shards',
    ])
    expect(
      combined.toLowerCase().includes('moon') ||
        combined.toLowerCase().includes('shard'),
    ).toBe(true)
    expectItemInInventory(state, 'Moon Rune Shards', true)
    const again = executeCommands(game, ['search'])
    expect(again.toLowerCase()).toContain('already')

    // Step 5: Outer Wards — purify and set sigil; completes Tideward Sigils
    executeCommands(game, ['east'])
    expectCurrentRoom(state, 'Outer Wards')
    const purifyResult = executeCommands(game, ['cast purify on pillars'])
    expect(
      ['cleanse', 'rinse', 'cleansed'].some((k) =>
        purifyResult.toLowerCase().includes(k),
      ),
    ).toBe(true)
    const useResult = executeCommands(game, [
      'use moon rune shards with pillars',
    ])
    expect(useResult.toLowerCase()).toContain('sigil')
    expectStoryFlag(state, FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, true)
    // Quest should be marked completed
    expectQuests(state, [ECHOES, MAIN])

    // Step 6: Removed

    // Step 7: Collapsed Pier (Vault) — key fails, cast unlock, open locker,
    // take three prism lanterns
    // Give the hint by examining the locker
    executeCommands(game, ['east'])
    expectCurrentRoom(state, 'Collapsed Pier')
    const exam = executeCommands(game, ['examine locker'])
    expect(
      exam.toLowerCase().includes('fused') ||
        exam.toLowerCase().includes('lock'),
    ).toBe(true)
    // Jam the key in the lock
    const jammedKey = executeCommands(game, [
      'use rusted locker key with locker',
    ])
    expect(
      jammedKey.toLowerCase().includes('too corroded') ||
        jammedKey.toLowerCase().includes('jams in the mechanism'),
    ).toBe(true)
    // Cast unlock on locker
    const unlocked = executeCommands(game, ['cast unlock on locker'])
    expect(unlocked.toLowerCase()).toContain('locker')
    expect(
      unlocked.toLowerCase().includes('click') ||
        unlocked.toLowerCase().includes('release'),
    ).toBe(true)
    // Open locker and take all lanterns
    const opened = executeCommands(game, ['open locker'])
    expect(opened.toLowerCase()).toContain('prism lantern')
    // Collect three lanterns
    executeCommands(game, [
      'take prism lantern',
      'take prism lantern',
      'take prism lantern',
    ])
    expectItemCountInInventory(state, 'Prism Lantern', 3)

    // Step 8: Submerged Antechamber — navigate, mount lanterns and cast light
    // Move from Collapsed Pier back toward the Outer Wards and the submerged
    // antechamber where lanterns are mounted.
    executeCommands(game, ['west'])
    expectCurrentRoom(state, 'Outer Wards')
    executeCommands(game, ['south'])
    expectCurrentRoom(state, 'Submerged Antechamber')
    // Reveal the lantern brackets in the antechamber, then mount lanterns
    let searchResult = executeCommands(game, ['search'])
    expect(
      searchResult.toLowerCase().includes('bracket') ||
        searchResult.toLowerCase().includes('brackets'),
    ).toBe(true)
    // Mount three lanterns to brackets
    executeCommands(game, ['use prism lantern with lantern bracket'])
    executeCommands(game, ['use prism lantern with lantern bracket'])
    executeCommands(game, ['use prism lantern with lantern bracket'])
    // After mounts, there should be no more prism lanterns in inventory
    expectItemCountInInventory(state, 'Prism Lantern', 0)
    // Cast light to reveal the path
    const lightResult = executeCommands(game, ['cast light'])
    expect(
      lightResult.toLowerCase().includes('path') ||
        lightResult.toLowerCase().includes('lanterns'),
    ).toBe(true)
    // After lighting, head west to the Tidal Causeway
    executeCommands(game, ['west'])
    expectCurrentRoom(state, 'Tidal Causeway')

    // Step 9: Tidal Causeway — examine mural, take Sea-Sealed Letter
    executeCommands(game, ['west'])
    expectCurrentRoom(state, 'Tidal Causeway')
    const muralReveal = executeCommands(game, ['examine mural'])
    expect(
      muralReveal.toLowerCase().includes('reliquary') ||
        muralReveal.toLowerCase().includes('sea-sealed letter'),
    ).toBe(true)
    executeCommands(game, [
      'take sea-sealed letter',
      'examine sea-sealed letter',
    ])
    expectItemInInventory(state, 'Sea-Sealed Letter', true)

    // Step 10: Sanctum — walk three steps into the dark water, speak the
    // vow, then take the crystal
    executeCommands(game, ['east', 'east'])
    expectCurrentRoom(state, 'Sanctum of the Tide')
    executeCommands(game, ['east', 'east'])
    const parted = executeCommands(game, ['east'])
    expect(parted).toContain('What did you not abandon?')
    const midWalk = new Game([new Act3()])
    midWalk.loadSaveData(game.toSaveData())
    expect(midWalk.state.currentRoom.descriptionFor(midWalk.state)).toContain(
      'The water stands parted',
    )
    const vow = executeCommands(game, ['say myself to tide-born guardian'])
    expect(
      vow.toLowerCase().includes('vow') ||
        vow.toLowerCase().includes('waters draw back') ||
        vow.toLowerCase().includes('you may now take'),
    ).toBe(true)
    executeCommands(game, ['take crystal of light'])
    expectItemInInventory(state, 'crystal of light', true)

    // Step 11: Talk to Mira to teleport to Mount Ember
    executeCommands(game, ['w', 'w', 'talk to mira'])
    expectCurrentRoom(state, 'Lower Switchbacks')

    // Step 12: Lower Switchbacks — talk to Ash Scholar to receive a brass mirror
    // Inspect the Emberwater Canteen for lore and a possible mirror hint
    const examineCanteen = executeCommands(game, ['examine emberwater canteen'])
    expect(
      examineCanteen.toLowerCase().includes('expedition') ||
        examineCanteen.toLowerCase().includes('brass') ||
        examineCanteen.toLowerCase().includes('canteen'),
    ).toBe(true)
    executeCommands(game, ['take brass mirror segment'])
    expectItemCountInInventory(state, 'Brass Mirror Segment', 1)

    const talkScholar = executeCommands(game, ['talk to ash scholar'])
    expect(
      talkScholar.toLowerCase().includes('scholar') ||
        talkScholar.toLowerCase().includes('brass'),
    ).toBe(true)
    expectItemCountInInventory(state, 'Brass Mirror Segment', 2)

    // Step 13: Obsidian Outcrops — search to reveal mirror segments and binding resin
    executeCommands(game, ['north'])
    expectCurrentRoom(state, 'Obsidian Outcrops')
    const searchOut = executeCommands(game, ['search'])
    expect(
      searchOut.toLowerCase().includes('brass') ||
        searchOut.toLowerCase().includes('resin'),
    ).toBe(true)
    // Take discovered items
    executeCommands(game, ['take brass mirror segment', 'take binding resin'])
    expectItemCountInInventory(state, 'Brass Mirror Segment', 3)
    expectItemInInventory(state, 'Binding Resin')

    // Step 14: Mirror Terraces — install mirrors to form channel
    executeCommands(game, ['east'])
    expectCurrentRoom(state, 'Mirror Terraces')
    // There should be mounts and at least one brass segment in the room
    // Examine the inscription to update quest log
    executeCommands(game, ['examine inscription'])
    // Take the terrace-provided segment if present
    executeCommands(game, ['examine mirror mount', 'take brass mirror segment'])
    expectItemCountInInventory(state, 'Brass Mirror Segment', 4)
    // Install three segments into mounts (use command format recognized by game)
    executeCommands(game, ['use brass mirror segment with mirror mount'])
    executeCommands(game, ['use binding resin with mirror mount'])
    // Before mending, the mirrors quest should not be completed and the flag not set
    expectStoryFlag(state, FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, false)
    // After installing, cast the mend spell on a mount to finalize repairs
    executeCommands(game, ['cast mend on mirror mount'])
    // The beam waits for the sun: the quest is still open and east is closed
    expectStoryFlag(state, FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, false)
    expect(state.currentRoom.getExits(state).east).toBeUndefined()
    // A save made while waiting loads back still waiting; resting fires the beam
    const reloaded = new Game([new Act3()])
    reloaded.loadSaveData(game.toSaveData())
    executeCommands(reloaded, ['rest'])
    expectStoryFlag(
      reloaded.state,
      FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED,
      true,
    )
    // Resting brings noon; the beam fires and the flag is set
    executeCommands(game, ['rest'])
    expectStoryFlag(state, FLAG_ACT3_MIRRORS_OF_EMBER_LIGHT_COMPLETED, true)

    // --- Step 15: Ember Gallery — find ash-fern and cooled slag, craft heat ward
    // Move back south to the Ember Gallery to gather ward components
    executeCommands(game, ['south'])
    expectCurrentRoom(state, 'Ember Gallery')
    // Search reveals ash-fern and cooled slag
    searchResult = executeCommands(game, ['search'])
    expect(
      searchResult.toLowerCase().includes('ash-fern') ||
        searchResult.toLowerCase().includes('cooled slag'),
    ).toBe(true)
    executeCommands(game, ['take ash-fern', 'take cooled slag'])
    expectItemInInventory(state, 'ash-fern', true)
    expectItemInInventory(state, 'cooled slag', true)
    // Combine to craft the heat-ward mix
    const craftResult = executeCommands(game, ['use ash-fern with cooled slag'])
    expect(
      craftResult.toLowerCase().includes('heat') ||
        craftResult.toLowerCase().includes('ward'),
    ).toBe(true)
    expectItemInInventory(state, 'heat-ward mix', true)

    // --- Step 16: Fumarole Passages — calibrate vents and apply heat ward
    // Move east to the Fumarole Passages (now open because mirrors completed)
    executeCommands(game, ['north', 'east'])
    expectCurrentRoom(state, 'Fumarole Passages')
    // It should not be possible to move south
    executeCommands(game, ['south'])
    expectCurrentRoom(state, 'Fumarole Passages')
    // Take and use three vent stones to calibrate
    executeCommands(game, [
      'take vent stone',
      'take vent stone',
      'take vent stone',
    ])
    expectItemCountInInventory(state, 'Vent Stone', 3)
    // Use each vent stone to calibrate the vents
    executeCommands(game, ['use vent stone', 'use vent stone'])
    // Before the third calibration, applying the ward should fail
    const failApply = executeCommands(game, ['use heat-ward mix'])
    expect(
      failApply.toLowerCase().includes('not yet synchronized') ||
        failApply.toLowerCase().includes('unstable'),
    ).toBe(true)
    // Final calibration
    executeCommands(game, ['use vent stone'])
    // Now apply the heat-ward mix
    const applyResult = executeCommands(game, ['use heat-ward mix'])
    expect(
      applyResult.toLowerCase().includes('ward') ||
        applyResult.toLowerCase().includes('seals'),
    ).toBe(true)
    // The ward does not finish the task: the vents must be crossed in time
    expectStoryFlag(state, FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, false)
    executeCommands(game, ['south'])
    expectCurrentRoom(state, 'Fumarole Passages')
    // The failed try moved the breath to the pause; one rest brings the in-breath
    executeCommands(game, ['rest'])
    // Save mid-breath: the in-breath comes back as it was
    const midBreath = new Game([new Act3()])
    midBreath.loadSaveData(game.toSaveData())
    executeCommands(midBreath, ['south'])
    expectCurrentRoom(midBreath.state, 'Phoenix Crater')

    // --- Step 18: Phoenix Crater (Relic Trial) ---
    // Cross south to Phoenix Crater on the in-breath
    executeCommands(game, ['south'])
    expectCurrentRoom(state, 'Phoenix Crater')
    expectStoryFlag(state, FLAG_ACT3_BREATH_OF_THE_MOUNTAIN_COMPLETED, true)
    // Reveal the phoenix
    executeCommands(game, ['rest'])
    expectCharacterInRoom(room(), 'phoenix', true)
    // Talk to the phoenix to get the riddle
    let talkResult = executeCommands(game, ['talk to phoenix'])
    expect(talkResult.toLowerCase()).toContain('wisdom')
    expect(talkResult.toLowerCase()).toContain('time is short')
    // Say the correct answer
    executeCommands(game, ['say patience to phoenix'])
    // Take the phoenix feather
    expectItemInInventory(state, 'phoenix feather', true)

    // --- Step 19: Talk to Mira to teleport to Cavern Mouth (Caverns of Shadow) ---
    executeCommands(game, ['n', 'w', 'w', 's', 'talk to mira'])
    expectCurrentRoom(state, 'Cavern Mouth')
    expectCharacterInRoom(room(), 'mine overseer', true)

    // --- Step 20: Cavern Mouth: search and talk to Mine Overseer ---
    talkResult = executeCommands(game, ['talk to mine overseer'])
    expect(talkResult.toLowerCase()).toContain('tool cache')
    expect(talkResult.toLowerCase()).toContain('key')
    expectItemInInventory(state, "Miner's Key", true)
    // Should have started Miners' Rescue quest (side quest activation is implicit)
    // (If a helper for quest exists, could check for 'Miners' Rescue' in active quests)

    // --- Step 21: Tool Cache: search to find crate, unlock and open crate, take supplies ---
    executeCommands(game, ['north'])
    expectCurrentRoom(state, 'Tool Cache')

    // Initially, the supply crate should not be visible in the room
    expectItemInRoom(room(), 'supply crate', false)

    // Search the room to discover the hidden supply crate
    searchResult = executeCommands(game, ['search'])
    expect(searchResult.toLowerCase()).toContain(
      'discover a heavy supply crate',
    )
    expect(searchResult.toLowerCase()).toContain(
      'hidden behind stacked timbers',
    )
    expect(searchResult.toLowerCase()).toContain('rescue supplies')

    // After searching, the supply crate should now be visible in the room
    expectItemInRoom(room(), 'supply crate', true)

    // Search again should give a different message indicating it's already found
    const searchAgain = executeCommands(game, ['search'])
    expect(searchAgain.toLowerCase()).toContain('already found')

    // Use key on crate
    const unlockResult = executeCommands(game, [
      "use miner's key with supply crate",
    ])
    expect(
      unlockResult.toLowerCase().includes('unlock') ||
        unlockResult.toLowerCase().includes('padlock'),
    ).toBe(true)

    // Open crate
    const openResult = executeCommands(game, ['open supply crate'])
    expect(openResult.toLowerCase()).toContain('open')
    expect(openResult.toLowerCase()).toContain('braces')
    // Take all three supply items
    executeCommands(game, ['take reinforced braces'])
    executeCommands(game, ['take support straps'])
    executeCommands(game, ['take wedge blocks'])
    expectItemInInventory(state, 'Reinforced Braces', true)
    expectItemInInventory(state, 'Support Straps', true)
    expectItemInInventory(state, 'Wedge Blocks', true)

    // --- Step 22: Collapsed Galleries - Miners' Rescue sequence ---
    executeCommands(game, ['east'])
    expectCurrentRoom(state, 'Collapsed Galleries')
    // Miners should not be present initially - they appear after passage is freed
    expectCharacterInRoom(room(), 'miners', false)
    expectItemInRoom(room(), 'fallen rock', true)

    // Initially, east exit should be blocked
    executeCommands(game, ['east'])
    expectCurrentRoom(state, 'Collapsed Galleries') // Should still be here

    // Use reinforced braces with fallen rock (stabilizes collapse)
    const stabilizeResult = executeCommands(game, [
      'use reinforced braces with fallen rock',
    ])
    expect(stabilizeResult.toLowerCase()).toContain('stabilizing the collapse')

    // Use support straps with fallen rock (secures the braces)
    const secureResult = executeCommands(game, [
      'use support straps with fallen rock',
    ])
    expect(secureResult.toLowerCase()).toContain(
      'bind the reinforced braces securely',
    )

    // Use wedge blocks with fallen rock (frees passage and adds miners to room)
    const freeResult = executeCommands(game, [
      'use wedge blocks with fallen rock',
    ])
    expect(freeResult.toLowerCase()).toContain('freeing the blocked passage')
    expect(freeResult.toLowerCase()).toContain('trapped miners emerging')

    // After freeing passage, miners should now be present and fallen rock should be gone
    expectCharacterInRoom(room(), 'miners', true)
    expectItemInRoom(room(), 'fallen rock', false)

    // Talk to miners (completes rescue and opens east exit)
    const rescueResult = executeCommands(game, ['talk to miners'])
    expect(rescueResult.toLowerCase()).toContain('miner steps forward')
    expect(rescueResult.toLowerCase()).toContain('thank the gods')
    expectStoryFlag(state, FLAG_ACT3_MINERS_RESCUE_COMPLETED, true)

    // Now east exit should be available
    executeCommands(game, ['east'])
    expectCurrentRoom(state, 'Echo Chambers')

    // --- Step 23: Echo Chambers - Resonant Chant sequence ---
    expectItemInRoom(room(), 'runic walls', true)

    // Search to discover the Old Oath Scrolls
    searchResult = executeCommands(game, ['search'])
    expect(searchResult).toContain('ancient scrolls')
    expect(searchResult).toContain('stone niche')

    // First examine the Old Oath Scrolls to understand the oath requirements
    const examineScrolls = executeCommands(game, ['examine old oath scrolls'])
    expect(examineScrolls).toContain('I take what is given, and I return ___.')
    expect(examineScrolls.toLowerCase()).not.toContain('disintegrate')
    expectStoryFlag(state, FLAG_ACT3_OATH_SCROLLS_EXAMINED, true)

    // The scrolls no longer crumble: they stay where they are
    expectItemInRoom(room(), 'Old Oath Scrolls', true)

    // Examine runic walls (reveals chant instructions and adds rubbings to room)
    let examineResult = executeCommands(game, ['examine runic walls'])
    expect(examineResult).toContain('Let stillness echo, let silence bind')
    expect(examineResult.toLowerCase()).toContain('chant to quiet the phantoms')

    // After examining, rubbings should be available in the room
    expectItemInRoom(room(), 'Resonant Chant Rubbings', true)

    // Take resonant chant rubbings (adds to inventory)
    expectItemInInventory(state, 'Resonant Chant Rubbings', false)
    const takeResult = executeCommands(game, ['take resonant chant rubbings'])
    expect(takeResult.toLowerCase()).toContain('resonant chant rubbings')
    expectItemInInventory(state, 'Resonant Chant Rubbings', true)

    // --- Step 24: Stillness Vestibule - Oath of Stillness sequence ---
    executeCommands(game, ['west', 'south'])
    expectCurrentRoom(state, 'Stillness Vestibule')
    expectItemInRoom(room(), 'echo stones', true)
    expectCharacterInRoom(room(), 'silence keeper', true)

    // Cast bless on echo stones (sanctifies them for the rite)
    const blessResult = executeCommands(game, ['cast bless on echo stones'])
    expect(blessResult.toLowerCase()).toContain('sacred luminescence')
    expect(blessResult.toLowerCase()).toContain('ancient chant')

    // Still the pools with the Stillwater Phial (the chant only carries over still water)
    executeCommands(game, ['take phial'])
    const stillResult = executeCommands(game, [
      'use stillwater phial with pool',
    ])
    expect(stillResult.toLowerCase()).toContain('the pools are mirror-still')
    expectItemInInventory(state, 'stillwater phial', true)

    // Use resonant chant rubbings on echo stones (performs the Oath of Stillness)
    let oathResult = executeCommands(game, [
      'use resonant chant rubbings with echo stones',
    ])
    expect(oathResult.toLowerCase()).toContain('recite the resonant chant')
    expect(oathResult.toLowerCase()).toContain('harmonious silence')
    expect(oathResult.toLowerCase()).toContain("dragon's hall now lies open")
    expectStoryFlag(state, FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)

    // Resonant chant rubbings should be consumed and removed from inventory
    expectItemInInventory(state, 'Resonant Chant Rubbings', false)

    // Now east exit to Dragon's Hall should be available
    executeCommands(game, ['east'])
    expectCurrentRoom(state, "Dragon's Hall")

    // --- Step 25: Dragon's Hall - Dragon's Memory (Story Clue) ---
    expectCharacterInRoom(room(), 'ancient dragon', true)
    // Dragon's scale should NOT be present initially (only after oath in step 26)
    expectItemInRoom(room(), "dragon's scale", false)

    // Talk to dragon (grants the Dragon's Memory)
    const memoryResult = executeCommands(game, ['talk to ancient dragon'])
    expect(memoryResult).toContain('Aren and Lysa')
    expect(memoryResult.toLowerCase()).toContain('warded away, not dead')
    expect(memoryResult.toLowerCase()).toContain('anchored in the amulet')
    expectStoryFlag(state, FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, true)

    // --- Step 26: Dragon's Hall - Relic Trial (Oath and Scale) ---
    // Finish the old oath for the dragon (adds dragon's scale to room)
    oathResult = executeCommands(game, ['say everything to ancient dragon'])
    expect(oathResult).toContain(
      'I take what is given, and I return everything.',
    )
    expect(oathResult.toLowerCase()).toContain('scale')
    expectStoryFlag(state, FLAG_ACT3_DRAGON_OATH_SPOKEN, true)

    // Dragon's scale should now be present in the room
    expectItemInRoom(room(), "dragon's scale", true)

    // Take dragon's scale
    executeCommands(game, ["take dragon's scale"])
    expectItemInInventory(state, "dragon's scale", true)
    expectItemInRoom(room(), "dragon's scale", false)

    // --- Step 27: Dragon's Hall - Return to Mira's Hut ---
    // Talk to Mira to teleport back to Mira's Hut
    talkResult = executeCommands(game, ['w', 'w', 'talk to mira'])
    expect(talkResult.toLowerCase()).toContain('three relics are yours')
    expect(talkResult.toLowerCase()).toContain('return to my hut')
    expectCurrentRoom(state, "Mira's Hut")

    // --- Step 28: Mira's Hut - Warding Rite and Lifelight Elixir ---
    // The first talk is Mira's confession; the rite is held back
    const confession = executeCommands(game, ['talk to mira'])
    expect(confession.toLowerCase()).toContain('i was their pupil')
    expectStoryFlag(state, FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, false)

    // A save made before the rite still has the herbs, and the rite takes them
    const beforeRite = new Game([new Act3()])
    expect(beforeRite.loadSaveData(game.toSaveData())).toContain('loaded')
    expectItemInRoom(beforeRite.state.currentRoom, 'healing herbs', true)
    executeCommands(beforeRite, ['talk to mira'])
    expectItemInRoom(beforeRite.state.currentRoom, 'healing herbs', false)

    // The next talk performs the Warding Rite
    const wardingResult = executeCommands(game, ['talk to mira'])
    expect(wardingResult.toLowerCase()).toContain('three relics resonate')
    expect(wardingResult.toLowerCase()).toContain('lifelight elixir')
    expect(wardingResult.toLowerCase()).toContain(
      'courage, wisdom, and selflessness',
    )
    expectStoryFlag(state, FLAG_ACT3_LIFELIGHT_ELIXIR_CREATED, true)

    // The rite used the herbs: gone from the hut, never in the bag.
    expectItemInRoom(room(), 'healing herbs', false)
    expectItemInInventory(state, 'healing herbs', false)
    expect(executeCommands(game, ['take herbs'])).toContain(
      "There is no 'herbs' here to take.",
    )

    // Lifelight Elixir should now be available in the room
    expectItemInRoom(room(), 'lifelight elixir', true)

    // Take Lifelight Elixir
    executeCommands(game, ['take lifelight elixir'])
    expectItemInInventory(state, 'lifelight elixir', true)
    expectItemInRoom(room(), 'lifelight elixir', false)

    // Talk to Mira again to teleport to fortress
    const fortressResult = executeCommands(game, ['talk to mira'])
    expect(fortressResult.toLowerCase()).toContain('final journey')
    expect(fortressResult.toLowerCase()).toContain('fortress')
    expectCurrentRoom(state, "Entrance to Malakar's Fortress")

    // Mira refuses to stay behind; the scene plays once, then a short line.
    const gateTalk = executeCommands(game, ['talk to mira'])
    expect(gateTalk).toContain('I am coming with you.')
    expect(executeCommands(game, ['talk to mira'])).toContain(
      'I am right behind you, Elior.',
    )

    // --- Step 29: Entrance to Malakar's Fortress - Examine Gates ---
    examineResult = executeCommands(game, ['examine gates'])
    expect(examineResult.toLowerCase()).toContain('massive gates')
    expect(examineResult.toLowerCase()).toContain('act iii is complete')
    expectStoryFlag(state, FLAG_ACT3_FORTRESS_GATES_EXAMINED, true)
    expect(examineResult).toContain(
      'The Dragon said they were warded away, not dead. You do not yet know what that means.',
    )
    expect(examineResult).toContain('The Lifelight Elixir pulses')

    // The page opens on the hook, also on a game loaded from a save.
    for (let turn = 0; turn < 3; turn++) game.newTurn()
    const hook =
      "Your parents were Malakar's closest friends. The Dragon says they are warded away, not dead."
    expect(game.getActCompleteText()).toMatch(
      new RegExp(`^${hook}\\n\\nCongratulations — you have completed`),
    )
    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    for (let turn = 0; turn < 3; turn++) fresh.newTurn()
    expect(fresh.getActCompleteText()).toBe(game.getActCompleteText())
    expectItemInRoom(fresh.state.allRooms.MirasHut, 'healing herbs', false)
    expect(executeCommands(game, ['look at mira'])).toContain(
      "the Wardens' pupil",
    )
    expectStoryFlag(state, FLAG_ACT3_MAIN_COMPLETED, true)
    expect(state.isQuestCompleted(MAIN)).toBe(true)
    expect(new Act3().isCompleted(state)).toBe(true)
  })

  it('survives a save and load round-trip at the end', () => {
    const game = new Game([new Act3()])
    expectMarkupWellFormed(game.commandParser.parse('cheat act 3'))
    const data = game.toSaveData()
    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(data)).toContain('loaded')
    expect(fresh.state.currentRoom.name).toBe(game.state.currentRoom.name)
    expect(fresh.state.inventory.map((i) => i.name)).toEqual(
      game.state.inventory.map((i) => i.name),
    )
    expect(fresh.state.storyFlags).toEqual(game.state.storyFlags)
  })
})

describe('Act 3 Mount Ember notebook save and load', () => {
  it('keeps the scholar gift and the Phoenix told-once state across a save', () => {
    const game = new Game([new Act3()])
    const room = game.state.getRoom('Lower Switchbacks')
    if (!room) throw new Error('Lower Switchbacks missing')
    game.state.currentRoom = room
    game.commandParser.parse('talk to ash scholar')
    game.state.setStoryFlag(FLAG_ACT3_PHOENIX_STORY_TOLD, true)

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(fresh.state.hasItem('Charred Notebook')).toBe(true)
    expect(fresh.state.getStoryFlag(FLAG_ACT3_PHOENIX_STORY_TOLD)).toBe(true)
    const again = fresh.commandParser.parse('talk to ash scholar')
    expect(again).toContain('Seek the outcrops for what the mountain has shed.')
    expect(fresh.state.getItemCount('Charred Notebook')).toBe(1)
  })
})

describe('Act 3 optional mercy: mending the inscription', () => {
  it('records one mercy, skips nothing on the golden path and survives a save', () => {
    const game = new Game([new Act3()])
    const upToInscription = ACT3_GOLDEN_PATH.slice(
      0,
      ACT3_GOLDEN_PATH.indexOf('examine inscription') + 1,
    )
    executeCommands(game, upToInscription)

    const mended = executeCommands(game, ['cast mend on inscription'])
    expect(mended).toContain('The deeper cut fills.')
    expect(mended).toContain('this will be remembered')
    expect(game.state.virtueCount(VIRTUE_MERCY)).toBe(1)

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    expect(fresh.state.getStoryFlag(FLAG_ACT3_INSCRIPTION_MENDED)).toBe(true)
    expect(fresh.state.virtueCount(VIRTUE_MERCY)).toBe(1)
    const again = executeCommands(fresh, ['cast mend on inscription'])
    expect(again).toContain('There is nothing left to mend.')
    expect(again).not.toContain('remembered')
    expect(fresh.state.virtueCount(VIRTUE_MERCY)).toBe(1)

    executeCommands(fresh, ACT3_GOLDEN_PATH.slice(upToInscription.length))
    executeCommands(fresh, ['examine fortress gates'])
    expect(new Act3().isCompleted(fresh.state)).toBe(true)
  })
})

describe('Act 3 golden path as declared by the act', () => {
  it('does not replay a glow after a save and load mid-act', () => {
    const game = new Game([new Act3()])
    executeCommands(game, ACT3_GOLDEN_PATH.slice(0, 8))
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const again = executeCommands(fresh, ['examine letter', 'examine amulet'])

    expect(again).not.toContain('grows warm')
    expect(again).toContain('two faces linger')
  })

  it('answers the dragon after a reload with the scrolls read but not in hand', () => {
    const game = new Game([new Act3()])
    const toDragon = ACT3_GOLDEN_PATH.indexOf(
      'say everything to ancient dragon',
    )
    executeCommands(game, ACT3_GOLDEN_PATH.slice(0, toDragon))
    game.state.removeItemFromInventory('Old Oath Scrolls')
    const chambers = game.state.getRoom('Echo Chambers')?.items ?? []
    chambers.splice(
      0,
      chambers.length,
      ...chambers.filter((i) => i.name !== 'Old Oath Scrolls'),
    )
    expect(chambers.some((i) => i.name === 'Old Oath Scrolls')).toBe(false)
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const talk = executeCommands(fresh, ['talk to ancient dragon'])
    expect(talk).toContain('what will you give back, for what you take?')

    const early = executeCommands(fresh, ['say it to ancient dragon'])
    expect(early).toContain('I take what is given, and I return it.')
    expectStoryFlag(fresh.state, FLAG_ACT3_DRAGON_OATH_SPOKEN, true)

    const again = new Game([new Act3()])
    again.loadSaveData(fresh.toSaveData())
    expectStoryFlag(again.state, FLAG_ACT3_DRAGON_OATH_SPOKEN, true)
  })

  it('hears the dream voice once and does not replay it after a reload', () => {
    const game = new Game([new Act3()])
    const first = executeCommands(
      game,
      ACT3_GOLDEN_PATH.slice(
        0,
        ACT3_GOLDEN_PATH.indexOf('talk to ancient dragon') + 1,
      ),
    )
    expect(first).toContain('The friend who stayed behind.')
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const again = executeCommands(fresh, ['talk to ancient dragon'])

    expect(again).not.toContain('stayed behind')
    expect(again).toContain('what will you give back, for what you take?')
  })

  it("plays each of Mira's slips once on the golden path, before the confession", () => {
    const game = new Game([new Act3()])
    const out = executeCommands(game, ACT3_GOLDEN_PATH)
    const count = (needle: string): number => out.split(needle).length - 1
    expect(count('She always crossed her sevens.')).toBe(1)
    expect(count('She looks at the feather a long time.')).toBe(1)
    expect(count('Tell her she has grown old.')).toBe(1)
    expect(count('does not answer.')).toBe(1)
    expect(count('You noticed. I saw you notice.')).toBe(1)
    expect(out.indexOf('crossed her sevens')).toBeLessThan(
      out.indexOf('a long time'),
    )
    expect(out.indexOf('grown old')).toBeLessThan(
      out.indexOf('I saw you notice'),
    )
  })

  it("still relays the dragon's message after a save and load", () => {
    const game = new Game([new Act3()])
    executeCommands(
      game,
      ACT3_GOLDEN_PATH.slice(
        0,
        ACT3_GOLDEN_PATH.indexOf('talk to ancient dragon') + 1,
      ),
    )
    const fresh = new Game([new Act3()])
    fresh.loadSaveData(game.toSaveData())

    const relay = executeCommands(fresh, ['w', 'w', 'talk to mira'])

    expect(relay).toContain('Mira[/character_name] does not answer.')
  })

  it('ends with the amulet showing both parents, after three glows', () => {
    const game = new Game([new Act3()])
    const out = executeCommands(game, ACT3_GOLDEN_PATH)
    expect(
      out.match(
        /Ancient Amulet\[\/item_name\] (grows warm|glows again|blazes)/g,
      ),
    ).toHaveLength(3)
    expect(executeCommands(game, ['examine amulet'])).toContain(
      'Aren and Lysa stand hand in hand',
    )
  })

  it('completes every non-main quest before completing the main quest', () => {
    const game = new Game([new Act3()])
    executeCommands(game, ACT3_GOLDEN_PATH)
    expect(game.state.completedQuests.map((q) => q.name).sort()).toEqual([
      'Breath of the Mountain',
      'Echoes of the Hidden Bond',
      'Lanterns of the Deeps',
      "Miners' Rescue",
      'Mirrors of Emberlight',
      'Oath of Stillness',
      'The Three Virtues',
      'Tideward Sigils',
    ])
  })

  it('is what cheat act 3 plays', () => {
    const viaPath = new Game([new Act3()])
    executeCommands(viaPath, ACT3_GOLDEN_PATH)
    const viaCheat = new Game([new Act3()])
    executeCommands(viaCheat, ['cheat act 3'])
    expect(viaCheat.state.storyFlags).toEqual(viaPath.state.storyFlags)
    expect(viaCheat.state.currentRoom.name).toBe(viaPath.state.currentRoom.name)
  })
})

describe('debug act3', () => {
  it('plays the golden path without a failure, leaving the finale to the player', async () => {
    const game = new Game([new Act3()])
    const shown: string[] = []
    await playDebugScript('act3', {
      play: (command) => executeCommands(game, [command]),
      running: () => true,
      show: (text) => shown.push(text),
      goldenPath: (n) => game.goldenPath(n),
    })
    expect(shown.join('\n')).not.toContain('[failure]')
    expectStoryFlag(game.state, FLAG_ACT3_FORTRESS_GATES_EXAMINED, false)

    executeCommands(game, ['examine gates'])
    expectStoryFlag(game.state, FLAG_ACT3_FORTRESS_GATES_EXAMINED, true)
  })
})

describe('Tobin and the saves', () => {
  const galleries = (game: Game): string[] =>
    game.state.allRooms.CollapsedGalleries.characters.map((c) => c.name)

  it('keeps Tobin and how often he was talked to through a save', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.CollapsedGalleries
    game.state.currentRoom.addCharacter(new Miners())
    executeCommands(game, ['talk to miners', 'talk to boy', 'talk to tobin'])

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(galleries(fresh)).toContain('Tobin')
    expect(executeCommands(fresh, ['talk to young miner'])).toContain(
      '[character_name]Tobin[/character_name] does not look up.',
    )
  })

  it('gives Tobin to a save already past the rescue, once', () => {
    const game = new Game([new Act3()])
    game.state.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_COMPLETED, true)
    expect(galleries(game)).not.toContain('Tobin')

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')
    new Act3().afterLoad(fresh.state)

    expect(galleries(fresh).filter((n) => n === 'Tobin')).toHaveLength(1)
  })

  it('leaves Tobin out of a save from before the rescue', () => {
    const game = new Game([new Act3()])
    new Act3().afterLoad(game.state)
    expect(galleries(game)).not.toContain('Tobin')
  })
})

describe('Giving the Quiet Charm to Tobin', () => {
  const rescued = (): Game => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.CollapsedGalleries
    game.state.currentRoom.addCharacter(new Miners())
    executeCommands(game, ['talk to miners'])
    game.state.addItemToInventory(new QuietCharm())
    return game
  }

  it('plays through the commands, records one selfless moment and cannot be repeated', () => {
    const game = rescued()
    const gift = executeCommands(game, ['give quiet charm to young miner'])
    expect(gift).toContain("'It's quiet.'")
    expect(gift).toContain('✦ Selflessness — this will be remembered')
    expect(game.state.virtueCount('selfless')).toBe(1)
    expect(game.state.hasItem('quiet charm')).toBe(false)
    expect(executeCommands(game, ['give charm to boy'])).toContain(
      "You don't have any 'charm' to give.",
    )
    expect(game.state.virtueCount('selfless')).toBe(1)
  })

  it('keeps the gift, the selfless moment and the unseen thanks through a save', () => {
    const game = rescued()
    executeCommands(game, ['give charm to tobin'])

    const fresh = new Game([new Act3()])
    expect(fresh.loadSaveData(game.toSaveData())).toContain('loaded')

    expect(fresh.state.virtueCount('selfless')).toBe(1)
    expect(executeCommands(fresh, ['examine boy'])).toContain(
      'The pale charm hangs at his throat',
    )
    expect(executeCommands(fresh, ['talk to tobin'])).toContain('Still quiet.')
    expect(executeCommands(fresh, ['talk to miners'])).toContain(
      'Thank you, Elior.',
    )
    expect(executeCommands(fresh, ['talk to miners'])).not.toContain(
      'Thank you, Elior.',
    )
  })
})

describe('Act 3 saves from before the Stillwater Phial stilled the pools', () => {
  it('gives the old phial its reflection, adds the pool and counts a finished oath as stilled', () => {
    const game = new Game([new Act3()])
    game.state.currentRoom = game.state.allRooms.StillnessVestibule
    const vestibule = game.state.allRooms.StillnessVestibule
    vestibule.items = vestibule.items.filter(
      (item) => !(item instanceof DarkPool),
    )
    const phial = vestibule.items.find((i) => i instanceof StillwaterPhial)
    if (!phial) throw new Error('no phial')
    phial.description = 'An old phial text.'
    game.state.setStoryFlag(FLAG_ACT3_OATH_OF_STILLNESS_COMPLETED, true)

    new Act3().afterLoad(game.state)

    expect(phial.description).toContain('a young woman at a long table')
    expect(vestibule.items.some((i) => i instanceof DarkPool)).toBe(true)
    expect(game.state.getStoryFlag(FLAG_ACT3_POOLS_STILLED)).toBe(true)
    expect(executeCommands(game, ['examine pool'])).toContain(
      'Not a tremor crosses it.',
    )
  })
})
