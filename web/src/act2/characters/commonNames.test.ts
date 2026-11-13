import { describe, it, expect } from 'vitest'
import type { Character } from '@/engine'
import { AncientTreeSpirit } from './AncientTreeSpirit'
import { BarmaidElena } from './BarmaidElena'
import { Brenn } from './Brenn'
import { CaravanMasterThorne } from './CaravanMasterThorne'
import { CastleGuardCaptain } from './CastleGuardCaptain'
import { CourtHerald } from './CourtHerald'
import { Families } from './Families'
import { ForestHermit } from './ForestHermit'
import { ForestSprites } from './ForestSprites'
import { GateCaptain } from './GateCaptain'
import { Herald } from './Herald'
import { Historians } from './Historians'
import { InnkeeperMarcus } from './InnkeeperMarcus'
import { LocalCraftsmen } from './LocalCraftsmen'
import { LordCommander } from './LordCommander'
import { MasterHealerLyria } from './MasterHealerLyria'
import { MasterMerchantAldric } from './MasterMerchantAldric'
import { MountainHermit } from './MountainHermit'
import { Nyx } from './Nyx'
import { SirCedric } from './SirCedric'
import { SpectralLibrarian } from './SpectralLibrarian'
import { Squires } from './Squires'
import { TownCrier } from './TownCrier'
import { TrainingMaster } from './TrainingMaster'
import { WaterNymphs } from './WaterNymphs'

/**
 * The Act II characters named by what they are, not who: the engine's own
 * replies call them "the herald" mid-sentence and "The herald" at the start
 * of one, never "Herald" as if it were a proper name, and a group of them
 * takes plural verbs.
 */
const COMMON_NOUNS = [
  ['ancient tree spirit', false, (): Character => new AncientTreeSpirit()],
  ['castle guard captain', false, (): Character => new CastleGuardCaptain()],
  ['court herald', false, (): Character => new CourtHerald()],
  ['families', true, (): Character => new Families()],
  ['forest hermit', false, (): Character => new ForestHermit()],
  ['forest sprites', true, (): Character => new ForestSprites()],
  ['gate captain', false, (): Character => new GateCaptain()],
  ['herald', false, (): Character => new Herald()],
  ['historians', true, (): Character => new Historians()],
  ['local craftsmen', true, (): Character => new LocalCraftsmen()],
  ['lord commander', false, (): Character => new LordCommander()],
  ['mountain hermit', false, (): Character => new MountainHermit()],
  ['Spectral Librarian', false, (): Character => new SpectralLibrarian()],
  ['squires', true, (): Character => new Squires()],
  ['town crier', false, (): Character => new TownCrier()],
  ['training master', false, (): Character => new TrainingMaster()],
  ['water nymphs', true, (): Character => new WaterNymphs()],
] as const

describe('the common-noun characters', () => {
  it('read "the" mid-sentence, "The" at the start, with the right verbs', () => {
    const failures: string[] = []
    for (const [name, plural, make] of COMMON_NOUNS) {
      const marked = `[character_name]${name}[/character_name]`
      if (make().nameInSentence() !== `the ${marked}`) {
        failures.push(`${name}: mid-sentence reads ${make().nameInSentence()}`)
      }
      const atStart = make().nameInSentence({ atStart: true })
      if (atStart !== `The ${marked}`) {
        failures.push(`${name}: at the start reads ${atStart}`)
      }
      if (make().isPlural() !== plural) {
        failures.push(`${name}: isPlural should be ${plural}`)
      }
    }
    expect(failures).toEqual([])
  })
})

/** The characters with a name of their own keep it capitalised, alone. */
const PROPER_NAMES = [
  ['Barmaid Elena', (): Character => new BarmaidElena()],
  ['Brenn', (): Character => new Brenn()],
  ['Caravan Master Thorne', (): Character => new CaravanMasterThorne()],
  ['Innkeeper Marcus', (): Character => new InnkeeperMarcus()],
  ['Master Healer Lyria', (): Character => new MasterHealerLyria()],
  ['Master Merchant Aldric', (): Character => new MasterMerchantAldric()],
  ['Nyx', (): Character => new Nyx()],
  ['Sir Cedric', (): Character => new SirCedric()],
] as const

describe('the characters with a name of their own', () => {
  it('read without an article', () => {
    const failures: string[] = []
    for (const [name, make] of PROPER_NAMES) {
      const expected = `[character_name]${name}[/character_name]`
      if (make().nameInSentence() !== expected) {
        failures.push(`${name}: reads ${make().nameInSentence()}`)
      }
    }
    expect(failures).toEqual([])
  })
})
