"""Whispering Glade (Act II)

Narrative Role:
    Tranquil sub-biome offering contrast to denser forest areas. Anticipated future site for water nymph
    interaction / riddle challenge and potential restorative or lore functions.

Current Mechanics:
    - Simple pass-through destination unlocked jointly with AncientGrove via ForestEntrance dual-flag gating.
    - No active items or characters populated yet (empty lists by design).

Planned / Scaffolded Features:
    - Commented handle_command / riddle-answering pipeline referencing WaterNymphs (character not yet integrated).
    - Future reward hooks could include purification, temporary buffs, or nature-aligned spell acquisition.

Story Flags:
    - Reads none directly; accessibility indirectly depends on lantern + protective charm flags at ForestEntrance.
    - Sets none currently.

Design Notes:
    - Left minimal to allow incremental narrative layering without refactor overhead.
    - When activating riddle system, ensure consistent command verbs (e.g., 'answer <text>') across puzzle rooms.
"""

from ...engine.Room import Room

class WhisperingGlade(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Whispering Glade",
            description=(
                "A peaceful meadow where the forest opens to reveal a small stream babbling over smooth stones. "
                "Wildflowers carpet the ground in brilliant colors, and butterflies dance in the warm sunlight. "
                "The sound of moving water creates a soothing melody, but you occasionally hear voices in the wind - "
                "whispers from unseen forest dwellers sharing ancient secrets. By the crystal-clear stream, "
                "you sense the presence of water nymphs, guardians of this sacred place."
            ),
            items=[],
            characters=[],
            exits={"west": "ForestEntrance"}
        )

    # def handle_command(self, command: str, game_state) -> str:
    #     """Handle room-specific commands for the Whispering Glade."""
    #     command = command.lower().strip()
        
    #     # Handle answering riddles from water nymphs
    #     if command.startswith("answer "):
    #         answer = command[7:].strip()  # Remove "answer " prefix
    #         return self._answer_riddle(game_state: GameState, answer)
    #     elif command == "answer":
    #         return self._answer_riddle(game_state: GameState, "")
            
    #     return ""  # No command handled
        
    # def _answer_riddle(self, game_state: GameState, answer: str) -> str:
    #     """Handle riddle answers directed to the water nymphs."""
    #     if not answer:
    #         return "[error]You must provide an answer to the riddle.[/error]"
            
    #     # Find the water nymphs character
    #     water_nymphs = next((char for char in self.characters if isinstance(char, WaterNymphs)), None)
    #     if water_nymphs:
    #         return water_nymphs.answer_riddle(game_state: GameState, answer)
    #     else:
    #         return "[error]There are no water nymphs here to answer.[/error]"
