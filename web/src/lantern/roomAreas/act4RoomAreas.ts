import type { ImageArea } from '../roomAreas'

/**
 * The declared areas of each room of Act 4, by room key: every item,
 * character, scenery piece and exit that can ever be in the room, later
 * arrivals included.
 */
export const ACT4_ROOM_AREAS: Record<string, ImageArea[]> = {
  FortressGates: [
    { id: 'ward-stone-left', title: 'Left Stone' },
    { id: 'ward-stone-middle', title: 'Middle Stone' },
    { id: 'ward-stone-right', title: 'Right Stone' },
    { id: 'ward-stones', title: 'Ward Stones' },
    { id: 'barriers', title: 'Barriers' },
    { id: 'guardians', title: 'Shadow Guardians' },
    { id: 'mira-at-the-gate', title: 'Mira' },
    { id: 'sir-cedric-at-the-gate', title: 'Sir Cedric' },
    { id: 'ward-stone-fragment', title: 'Ward Stone Fragment' },
    { id: 'guardians-chain', title: "Guardian's Chain" },
    { id: 'guardians-essence', title: "Guardian's Essence" },
    { id: 'exit-north', title: 'Way north' },
    { id: 'exit-east', title: 'Way east' },
  ],
  OuterCourtyard: [
    { id: 'trapped-servants', title: 'Trapped Servants' },
    { id: 'captain-of-the-guard', title: 'Captain of the Guard' },
    { id: 'exit-west', title: 'Way west' },
    { id: 'servants-pendant', title: "Servant's Pendant" },
    { id: 'exit-north', title: 'Way north' },
  ],
  MirrorLabyrinth: [
    { id: 'mirrors', title: 'Mirrors' },
    { id: 'exit-north', title: 'Way north' },
    { id: 'exit-east', title: 'Way east' },
    { id: 'exit-west', title: 'Way west' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'true-self', title: 'True Self' },
  ],
  HallOfEchoes: [
    { id: 'echoes', title: 'Echoes' },
    { id: 'echo-stone', title: 'Echo Stone' },
    { id: 'banners', title: 'Banners' },
    { id: 'knight-of-despair', title: 'Knight of Despair' },
    { id: 'sir-cedric-in-the-hall', title: 'Sir Cedric' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'ghostly-warriors', title: 'Ghostly Warriors' },
    { id: 'exit-east', title: 'Way east' },
  ],
  TowerOfShadows: [
    { id: 'whispers', title: 'Whispers' },
    { id: 'exit-west', title: 'Way west' },
    { id: 'exit-up', title: 'Way up' },
    { id: 'exit-in', title: 'Way in' },
  ],
  ChamberOfWhispers: [
    { id: 'sorceress-staff', title: 'Staff' },
    { id: 'crystal-whispers', title: 'Whispers' },
    { id: 'sorceress-of-lies', title: 'Sorceress of Lies' },
    { id: 'exit-down', title: 'Way down' },
    { id: 'exit-north', title: 'Way north' },
  ],
  MemoryVault: [
    { id: 'memory-orbs', title: 'Memory Orbs' },
    { id: 'vault-door', title: 'Door' },
    { id: 'shadow-of-the-past', title: 'Shadow' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'exit-east', title: 'Way east' },
  ],
  ParentsVault: [
    { id: 'memories', title: 'Memories' },
    { id: 'memory-echoes', title: 'Memory Echoes of Aren and Lysa' },
    { id: 'exit-west', title: 'Way west' },
    { id: 'exit-north', title: 'Way north' },
  ],
  ThroneChamber: [
    { id: 'crystal-prison', title: 'Prison' },
    { id: 'wound', title: 'Wound' },
    { id: 'throne', title: 'Throne' },
    { id: 'malakar', title: 'Malakar' },
    { id: 'king-alden', title: 'King Alden' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'exit-north', title: 'Way north' },
  ],
  WillowbrookField: [
    { id: 'field', title: 'Field' },
    { id: 'grandmother', title: 'Grandmother' },
    { id: 'mira', title: 'Mira' },
    { id: 'sir-cedric', title: 'Sir Cedric' },
    { id: 'nyx', title: 'Nyx' },
  ],
}
