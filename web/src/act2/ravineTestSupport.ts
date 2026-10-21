import { Game } from '@/engine'
import { Act2 } from './Act2'
import { QualityRope } from './items/QualityRope'
import { ForestSpeechSpell } from './spells/ForestSpeechSpell'
import { NatureSenseSpell } from './spells/NatureSenseSpell'

/** A game with both spells known, a rope in the pack and the player at the Forest Entrance. */
export function setupForestEntrance(): Game {
  const game = new Game([new Act2()])
  game.state.learnSpell(new NatureSenseSpell())
  game.state.learnSpell(new ForestSpeechSpell())
  game.state.currentRoom = game.state.allRooms.ForestEntrance
  game.state.addItemToInventory(new QualityRope())
  return game
}

/** Whether the ravine is among the things in the player's current room. */
export function ravineHere(game: Game): boolean {
  return game.state.currentRoom.items.some((i) => i.name === 'ravine')
}

/** Save and load into a fresh game, as a player reloading would. */
export function reload(game: Game): Game {
  const fresh = new Game([new Act2()])
  fresh.loadSaveData(game.toSaveData())
  return fresh
}
