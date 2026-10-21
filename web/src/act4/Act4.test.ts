import { describe, it, expect } from 'vitest'
import { Act4 } from './Act4'

describe('Act4', () => {
  it('can be instantiated correctly', () => {
    const act4 = new Act4()
    // The TS act name is the short id used in saves (see the porting guide),
    // not the Python display title "Act IV".
    expect(act4.name).toBe('Act4')
    expect(Object.keys(act4.rooms)).toHaveLength(8)
    expect(act4.quests.map((quest) => quest.name)).toEqual([
      'The Final Stand',
      'Shattered Ward Guardians',
      'The Trapped Servants',
    ])
  })

  it('has all expected rooms', () => {
    const act4 = new Act4()
    const expectedRooms = [
      'FortressGates',
      'OuterCourtyard',
      'MirrorLabyrinth',
      'HallOfEchoes',
      'TowerOfShadows',
      'ChamberOfWhispers',
      'MemoryVault',
      'ThroneChamer',
    ]
    for (const roomName of expectedRooms) {
      expect(roomName in act4.rooms, `${roomName} in rooms`).toBe(true)
    }
  })

  it('no longer has the cut stub rooms', () => {
    const act4 = new Act4()
    expect('ThroneChamberApproach' in act4.rooms).toBe(false)
    expect('RoyalGardens' in act4.rooms).toBe(false)
  })

  it('has proper intro text', () => {
    const act4 = new Act4()
    const intro = act4.getActIntro()
    expect(intro).toContain('ACT IV: THE FINAL CONFRONTATION')
    expect(intro).toContain('Lifelight Elixir')
  })
})
