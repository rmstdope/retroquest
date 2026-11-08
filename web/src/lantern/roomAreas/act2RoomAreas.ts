import type { ImageArea } from '../roomAreas'

/**
 * The declared areas of each room of Act 2, by room key: every item,
 * character, scenery piece and exit that can ever be in the room, later
 * arrivals included.
 */
export const ACT2_ROOM_AREAS: Record<string, ImageArea[]> = {
  MountainPath: [
    { id: 'mountain-flower', title: 'Mountain Flower' },
    { id: 'walking-stick', title: 'Walking Stick' },
    { id: 'camp-site', title: 'Camp Site' },
    { id: 'mountain-hermit', title: 'Mountain Hermit' },
    { id: 'exit-north', title: 'Way north' },
    { id: 'entry-pass', title: 'Entry Pass' },
    { id: 'exit-east', title: 'Way east' },
  ],
  GreendaleGates: [
    { id: 'gate-captain', title: 'Gate Captain' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'exit-north', title: 'Way north' },
    { id: 'city-map', title: 'City Map' },
  ],
  MainSquare: [
    { id: 'city-notice-board', title: 'City Notice Board' },
    { id: 'merchants-flyer', title: "Merchant's Flyer" },
    { id: 'town-crier', title: 'Town Crier' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'exit-north', title: 'Way north' },
    { id: 'exit-east', title: 'Way east' },
  ],
  MarketDistrict: [
    { id: 'master-merchant-aldric', title: 'Master Merchant Aldric' },
    { id: 'caravan-master-thorne', title: 'Caravan Master Thorne' },
    { id: 'exit-west', title: 'Way west' },
    { id: 'exit-north', title: 'Way north' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'forest-survival-kit', title: 'Forest Survival Kit' },
    { id: 'enhanced-lantern', title: 'Enhanced Lantern' },
    { id: 'quality-rope', title: 'Quality Rope' },
  ],
  SilverStagInn: [
    { id: 'room-key', title: 'Room Key' },
    { id: 'door', title: 'Door' },
    { id: 'innkeeper-marcus', title: 'Innkeeper Marcus' },
    { id: 'barmaid-elena', title: 'Barmaid Elena' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'exit-east', title: 'Way east' },
  ],
  InnRooms: [
    { id: 'coins', title: 'Coins' },
    { id: 'exit-west', title: 'Way west' },
    { id: 'travelers-journal', title: "Traveler's Journal" },
  ],
  MerchantsWarehouse: [
    { id: 'brenn', title: 'Brenn' },
    { id: 'exit-north', title: 'Way north' },
  ],
  CastleApproach: [
    { id: 'herald', title: 'Herald' },
    { id: 'castle-guard-captain', title: 'Castle Guard Captain' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'exit-west', title: 'Way west' },
  ],
  CastleCourtyard: [
    { id: 'sir-cedric', title: 'Sir Cedric' },
    { id: 'training-master', title: 'Training Master' },
    { id: 'squires', title: 'Squires' },
    { id: 'exit-east', title: 'Way east' },
    { id: 'exit-north', title: 'Way north' },
    { id: 'exit-west', title: 'Way west' },
    { id: 'squires-diary', title: "Squire's Diary" },
  ],
  GreatHall: [
    { id: 'court-herald', title: 'Court Herald' },
    { id: 'historians', title: 'Historians' },
    { id: 'lord-commander', title: 'Lord Commander' },
    { id: 'exit-east', title: 'Way east' },
  ],
  ResidentialQuarter: [
    { id: 'local-craftsmen', title: 'Local Craftsmen' },
    { id: 'families', title: 'Families' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'exit-north', title: 'Way north' },
    { id: 'exit-secret-passage', title: 'Way secret_passage' },
  ],
  HealersHouse: [
    { id: 'master-healer-lyria', title: 'Master Healer Lyria' },
    { id: 'exit-south', title: 'Way south' },
  ],
  HiddenLibrary: [
    { id: 'ancient-chronicle', title: 'Ancient Chronicle' },
    { id: 'protective-enchantments', title: 'Protective Enchantments' },
    { id: 'spectral-librarian', title: 'Spectral Librarian' },
    { id: 'exit-secret-passage', title: 'Way secret_passage' },
    { id: 'crystal-focus', title: 'Crystal Focus' },
  ],
  ForestTransition: [
    { id: 'standing-stones', title: 'Standing Stones' },
    { id: 'forest-hermit', title: 'Forest Hermit' },
    { id: 'exit-west', title: 'Way west' },
    { id: 'exit-east', title: 'Way east' },
  ],
  ForestEntrance: [
    { id: 'enchanted-acorn', title: 'Enchanted Acorn' },
    { id: 'forest-sprites', title: 'Forest Sprites' },
    { id: 'exit-west', title: 'Way west' },
    { id: 'exit-south', title: 'Way south' },
    { id: 'exit-east', title: 'Way east' },
    { id: 'ravine', title: 'Ravine' },
    { id: 'caravan', title: 'Caravan' },
  ],
  AncientGrove: [
    { id: 'silver-tree', title: 'Silver-Barked Tree' },
    { id: 'exit-north', title: 'Way north' },
    { id: 'ancient-tree-spirit', title: 'Ancient Tree Spirit' },
    { id: 'silver-leaves', title: 'Silver Leaves' },
    { id: 'exit-south', title: 'Way south' },
  ],
  WhisperingGlade: [
    { id: 'exit-west', title: 'Way west' },
    { id: 'water-nymphs', title: 'Water Nymphs' },
    { id: 'crystal-clear-water', title: 'Crystal-Clear Water' },
    { id: 'moonflowers', title: 'Moonflowers' },
  ],
  HeartOfTheForest: [
    { id: 'offering-altar', title: 'Offering Altar' },
    { id: 'exit-north', title: 'Way north' },
    { id: 'nyx', title: 'Nyx' },
  ],
}
