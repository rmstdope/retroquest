import type { GameState } from '@/engine'

/**
 * Let the current room rebuild a description that follows the state of its
 * items or story flags (the Village Well, the Old Mill, the Vegetable Field),
 * so the room card changes the moment that state does. Rooms without a
 * `refreshDescription` method are left alone.
 */
export function refreshRoomDescription(gameState: GameState): void {
  const room: object = gameState.currentRoom
  if (
    'refreshDescription' in room &&
    typeof room.refreshDescription === 'function'
  ) {
    room.refreshDescription(gameState)
  }
}
