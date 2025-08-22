from ...engine.Room import Room
from ..characters.WaterNymphs import WaterNymphs

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
            characters=[WaterNymphs()],
            exits={"west": "ForestEntrance"}
        )

    def handle_command(self, command: str, game_state) -> str:
        """Handle room-specific commands for the Whispering Glade."""
        command = command.lower().strip()
        
        # Handle answering riddles from water nymphs
        if command.startswith("answer "):
            answer = command[7:].strip()  # Remove "answer " prefix
            return self._answer_riddle(game_state, answer)
        elif command == "answer":
            return self._answer_riddle(game_state, "")
            
        return ""  # No command handled
        
    def _answer_riddle(self, game_state, answer: str) -> str:
        """Handle riddle answers directed to the water nymphs."""
        if not answer:
            return "[error]You must provide an answer to the riddle.[/error]"
            
        # Find the water nymphs character
        water_nymphs = next((char for char in self.characters if isinstance(char, WaterNymphs)), None)
        if water_nymphs:
            return water_nymphs.answer_riddle(game_state, answer)
        else:
            return "[error]There are no water nymphs here to answer.[/error]"
