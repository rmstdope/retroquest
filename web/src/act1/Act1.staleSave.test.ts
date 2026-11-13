import { describe, it, expect } from 'vitest'
import { Game } from '@/engine'
import { staleSaveMismatches } from '@/testing/staleSave'
import { executeCommands } from '@/testing/gameHelpers'
import { Act1 } from './Act1'
import { FLAG_MAGIC_FULLY_UNLOCKED } from './Act1StoryFlags'
import { Blacksmith } from './characters/Blacksmith'
import { Fisherman } from './characters/Fisherman'
import { Shopkeeper } from './characters/Shopkeeper'
import { Villager } from './characters/Villager'
import { Candle } from './items/Candle'
import { Fish } from './items/Fish'
import { OldNotice } from './items/OldNotice'
import { ShinyPebble } from './items/ShinyPebble'
import { BlessSpell } from './spells/BlessSpell'
import { GrowSpell } from './spells/GrowSpell'
import { HealSpell } from './spells/HealSpell'
import { LightSpell } from './spells/LightSpell'
import { PurifySpell } from './spells/PurifySpell'
import { ReviveSpell } from './spells/ReviveSpell'
import { UnlockSpell } from './spells/UnlockSpell'
import { FadedPhotographQuest } from './quests/FadedPhotograph'
import { HintOfMagicQuest } from './quests/HintOfMagic'
import { ShadowsOverWillowbrookQuest } from './quests/ShadowsOverWillowbrook'

/** An Act I game with every spell known, and the fisherman taught his spell. */
function prepare(game: Game): void {
  game.state.setStoryFlag(FLAG_MAGIC_FULLY_UNLOCKED, true)
  for (const spell of [
    new ReviveSpell(),
    new PurifySpell(),
    new BlessSpell(),
    new HealSpell(),
    new UnlockSpell(),
    new LightSpell(),
    new GrowSpell(),
  ]) {
    game.state.learnSpell(spell)
  }
  game.state.currentRoom = game.state.allRooms.Riverbank
  game.state.addItemToInventory(new Fish())
  executeCommands(game, ['give fish to fisherman'])
}

describe('Act I loading a save that holds old wording', () => {
  it('gives every object the current wording', () => {
    const mismatches = staleSaveMismatches({
      makeGame: () => new Game([new Act1()]),
      prepare,
      cases: [
        { target: Candle, fields: ['description'] },
        { target: ShinyPebble, fields: ['description'] },
        { target: OldNotice, fields: ['description'] },
        { target: Villager, fields: ['name', 'dialogueOptions'] },
        { target: Shopkeeper, fields: ['name', 'dialogueOptions'] },
        { target: Blacksmith, fields: ['name'] },
        { target: Fisherman, fields: ['dialogueStates'] },
        { target: ReviveSpell, fields: ['description'] },
        { target: PurifySpell, fields: ['description'] },
        { target: BlessSpell, fields: ['description'] },
        { target: HealSpell, fields: ['description'] },
        { target: UnlockSpell, fields: ['description'] },
        { target: LightSpell, fields: ['description'] },
        {
          target: HintOfMagicQuest,
          fields: ['name', 'completion'],
        },
        {
          target: FadedPhotographQuest,
          fields: ['name', 'completion'],
        },
        {
          target: ShadowsOverWillowbrookQuest,
          fields: ['name', 'completion'],
        },
      ],
    })

    expect(mismatches).toEqual([])
  })
})
