"""Light Spell (Act I)

Purpose:
    Illumination cantrip enabling interaction with dark or light-sensitive rooms via room.light().

Acquisition:
    One of the earliest spells; teaches environmental interaction model.

Core Mechanics:
    - Delegates behavior to current room's light(game_state) method allowing contextual overrides (e.g., revealing items, unlocking paths).
    - Returns whatever narrative outcome the room defines; this spell is a dispatcher.

Story / Flags:
    - Does not set or read flags itself; flags may be manipulated inside room implementations.

Design Notes:
    - Keep this spell thin. Room polymorphism should handle complexity.
    - If future magical light duration tracking is added, introduce a LightEffect state in GameState rather than adding logic here.
"""

from ...engine.Spell import Spell
from ...engine.GameState import GameState

class LightSpell(Spell):
    def __init__(self) -> None:
        super().__init__("light", "A simple spell that conjures a sphere of light to illuminate dark areas.")

    def cast_spell(self, game_state: GameState) -> str:
        current_room = game_state.current_room
        return current_room.light(game_state) # Pass game_state to light method
