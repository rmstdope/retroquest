import { describe, it, expect } from 'vitest'
import { Game, type GameState, type Item } from '@/engine'
import { Act3 } from '../Act3'
import { FLAG_ACT3_MINERS_RESCUE_STARTED } from '../Act3StoryFlags'
import { AshFern } from './AshFern'
import { CharredNotebook } from './CharredNotebook'
import { CooledSlag } from './CooledSlag'
import { CrystalOfLight } from './CrystalOfLight'
import { FallenRock } from './FallenRock'
import { FortressGates } from './FortressGates'
import { Locker } from './Locker'
import { MinersKey } from './MinersKey'
import { MirrorMount } from './MirrorMount'
import { ReinforcedBraces } from './ReinforcedBraces'
import { ResonantChantRubbings } from './ResonantChantRubbings'
import { SeaSealedLetter } from './SeaSealedLetter'
import { Sigils } from './Sigils'
import { Steles } from './Steles'
import { SupplyCrate } from './SupplyCrate'
import { SupportStraps } from './SupportStraps'
import { TeleportationFocus } from './TeleportationFocus'
import { WardingPillars } from './WardingPillars'
import { WedgeBlocks } from './WedgeBlocks'
import { EchoStones } from './EchoStones'
import { BindingResin } from './BindingResin'

/** A fresh Act III game. */
function newGame(): Game {
  return new Game([new Act3()])
}

/** The text of every `[event]` line in an answer. */
function eventLines(answer: string): string[] {
  return [...answer.matchAll(/\[event\](.*?)\[\/event\]/gs)].map((m) => m[1])
}

/** Whether the answer is a red box that the narration reads. */
function isClue(answer: string): boolean {
  return answer.includes('[failure][clue]')
}

/** Whether the answer is a red box the narration skips. */
function isSilentFailure(answer: string): boolean {
  return answer.includes('[failure]') && !answer.includes('[clue]')
}

/** Put `items` in the room, so tests can use them. */
function place(state: GameState, ...items: Item[]): void {
  for (const item of items) state.currentRoom.addItem(item)
}

describe('Act III items narrate effects and keep no echo of the command', () => {
  it('bracing, strapping and wedging the fallen rock read as effects', () => {
    const game = newGame()
    const rock = new FallenRock()
    place(game.state, rock)
    game.state.setStoryFlag(FLAG_ACT3_MINERS_RESCUE_STARTED, true)

    const braces = rock.useWith(game.state, new ReinforcedBraces())
    const straps = rock.useWith(game.state, new SupportStraps())
    const wedges = rock.useWith(game.state, new WedgeBlocks())

    expect(braces).toContain(
      'The reinforced braces wedge under the sagging ceiling and steady ' +
        'the collapse. The immediate danger',
    )
    expect(straps).toContain(
      'The support straps bind the reinforced braces securely, so they ' +
        'can withstand the pressure when the debris is cleared.',
    )
    expect(wedges).toContain(
      'The wedge blocks bite into the cracks and free the blocked ' +
        'passage. The fallen rock crumbles away',
    )
    for (const answer of [braces, straps, wedges]) {
      expect(eventLines(answer)).toEqual([])
    }
  })

  it('examining the fallen rock drops the echo; the three tool refusals are read', () => {
    const game = newGame()
    const rock = new FallenRock()
    place(game.state, rock)

    const early = rock.useWith(game.state, new ReinforcedBraces())
    const examined = rock.examine(game.state)
    const strapsEarly = rock.useWith(game.state, new SupportStraps())
    const wedgesEarly = rock.useWith(game.state, new WedgeBlocks())
    const unhelpful = rock.useWith(game.state, new CooledSlag())

    expect(examined).not.toContain('You examine')
    expect(examined.startsWith('The collapse appears unstable')).toBe(true)
    expect(isClue(early)).toBe(true)
    expect(isClue(strapsEarly)).toBe(true)
    expect(isClue(wedgesEarly)).toBe(true)
    expect(isSilentFailure(unhelpful)).toBe(true)
  })

  it('the supply crate drops its echoes and splits read from silent boxes', () => {
    const game = newGame()
    const crate = new SupplyCrate()
    place(game.state, crate)

    const examined = crate.examine(game.state)
    const lockedOpen = crate.open(game.state)
    const key = crate.useWith(game.state, new MinersKey())
    const opened = crate.open(game.state)
    const openAgain = crate.open(game.state)

    expect(examined).toBe(
      'The padlock is sturdy and rusted, but the keyhole looks intact. ' +
        'The crate is labeled for rescue supplies.',
    )
    expect(isClue(lockedOpen)).toBe(true)
    expect(key).toBe(
      'With a click, the padlock opens. The crate is now unlocked. The ' +
        "miner's key is left twisted and useless, and you discard it.",
    )
    expect(opened.startsWith('Inside the crate are heavy iron braces')).toBe(
      true,
    )
    expect(isSilentFailure(openAgain)).toBe(true)
    expect(openAgain).toContain('The crate is already open.')
  })

  it('the crate spell unlock is read the first time and a silent box the second', () => {
    const crate = new SupplyCrate()
    const game = newGame()

    const first = crate.unlockWithSpell(game.state)
    const second = crate.unlockWithSpell(game.state)

    expect(eventLines(first)).toEqual([])
    expect(isSilentFailure(second)).toBe(true)
    expect(second).toContain('The padlock already hangs open.')
  })

  it('crafting the heat-ward mix is one read sentence', () => {
    const game = newGame()
    const fern = new AshFern()
    const slag = new CooledSlag()
    game.state.inventory.push(fern, slag)

    const answer = fern.useWith(game.state, slag)

    expect(answer).toBe(
      'The ash-fern and cooled slag grind down into a coarse paste: a ' +
        'heat-ward mix.',
    )
  })

  it('the mirror mount reads its clue boxes and keeps "already" silent', () => {
    const game = newGame()
    const mount = new MirrorMount()

    const bindEarly = mount.useWith(game.state, new BindingResin())
    const mendEarly = mount.mend(game.state)

    expect(isClue(bindEarly)).toBe(true)
    expect(isClue(mendEarly)).toBe(true)
    expect(eventLines(mount.examine(game.state))).toEqual([])
  })

  it('the warding pillars and steles read their refusals and answers', () => {
    const game = newGame()
    const pillars = new WardingPillars()
    const steles = new Steles()

    expect(isClue(pillars.preventPickup())).toBe(true)
    expect(isClue(steles.preventPickup())).toBe(true)
    expect(eventLines(pillars.examine(game.state))).toEqual([])
    expect(eventLines(pillars.purify(game.state))).toEqual([])
    expect(eventLines(steles.examine(game.state))).toEqual([])
  })

  it('the locker reads its two refusals', () => {
    const game = newGame()
    const locker = new Locker()

    expect(isClue(locker.open(game.state))).toBe(true)
    expect(isClue(locker.unlock(game.state))).toBe(true)
  })

  it('the crystal of light reads its ward refusal', () => {
    const game = newGame()
    const crystal = new CrystalOfLight()
    game.state.inventory.push(crystal)

    expect(isClue(crystal.pickedUp(game.state))).toBe(true)
  })

  it('the rubbings read both chant refusals, the chant recited over the water', () => {
    const game = newGame()
    const rubbings = new ResonantChantRubbings()
    const stones = new EchoStones()

    const cold = rubbings.useWith(game.state, stones)
    stones.receiveSpell(game.state, 'bless', 'bless')
    const overWater = rubbings.useWith(game.state, stones)

    expect(isClue(cold)).toBe(true)
    expect(isClue(overWater)).toBe(true)
    expect(
      overWater.startsWith('You recite the resonant chant at each stone.\n'),
    ).toBe(true)
  })

  it('reading and examining the story items drops the echo', () => {
    const game = newGame()
    const letter = new SeaSealedLetter()
    const notebook = new CharredNotebook()
    const focus = new TeleportationFocus()
    const gates = new FortressGates()

    const letterText = letter.examine(game.state)
    const notebookText = notebook.examine(game.state)
    const focusText = focus.examine(game.state)
    const gatesText = gates.examine(game.state)

    expect(letterText).toContain(
      "The letter's ink, protected by crystalline varnish, is still clear:",
    )
    expect(letterText).not.toContain('You examine')
    expect(notebookText).toContain(
      "Most of the notebook's pages have crumbled to flakes; two survive, " +
        'in a neat and patient hand.',
    )
    expect(focusText).toBe(
      'Reflections in the prism hover a breath out of sync—each a doorway ' +
        "waiting for Mira's word.",
    )
    expect(
      gatesText.startsWith(
        'The fortress gates tower above you. Their blackened iron is carved ' +
          'with sigils',
      ),
    ).toBe(true)
    for (const text of [letterText, notebookText, focusText, gatesText]) {
      expect(eventLines(text)).toEqual([])
    }
  })

  it('the sigils drop the cast echo', () => {
    const game = newGame()
    const answer = new Sigils().receiveSpell(game.state, 'bless', 'bless')

    expect(answer).not.toContain('You cast')
    expect(eventLines(answer)).toEqual([])
  })
})
