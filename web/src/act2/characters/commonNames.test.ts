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
describe.each([
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
] as const)('the %s, a common-noun character', (name, plural, make) => {
  const marked = `[character_name]${name}[/character_name]`

  it('reads "the" mid-sentence and "The" at the start', () => {
    expect(make().nameInSentence()).toBe(`the ${marked}`)
    expect(make().nameInSentence({ atStart: true })).toBe(`The ${marked}`)
  })

  it(plural ? 'takes plural verbs' : 'takes singular verbs', () => {
    expect(make().isPlural()).toBe(plural)
  })
})

/** The characters with a name of their own keep it capitalised, alone. */
describe.each([
  ['Barmaid Elena', (): Character => new BarmaidElena()],
  ['Brenn', (): Character => new Brenn()],
  ['Caravan Master Thorne', (): Character => new CaravanMasterThorne()],
  ['Innkeeper Marcus', (): Character => new InnkeeperMarcus()],
  ['Master Healer Lyria', (): Character => new MasterHealerLyria()],
  ['Master Merchant Aldric', (): Character => new MasterMerchantAldric()],
  ['Nyx', (): Character => new Nyx()],
  ['Sir Cedric', (): Character => new SirCedric()],
] as const)('%s, a proper name', (name, make) => {
  it('reads without an article', () => {
    expect(make().nameInSentence()).toBe(
      `[character_name]${name}[/character_name]`,
    )
  })
})
