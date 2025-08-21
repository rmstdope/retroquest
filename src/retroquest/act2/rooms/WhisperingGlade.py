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
        
        # Handle casting nature_sense to detect water nymphs
        if command in ["cast nature_sense", "use nature_sense", "nature_sense"]:
            return self._cast_nature_sense(game_state)
            
        # Handle answering riddles from water nymphs
        elif command.startswith("answer "):
            answer = command[7:].strip()  # Remove "answer " prefix
            return self._answer_riddle(game_state, answer)
        elif command == "answer":
            return self._answer_riddle(game_state, "")
            
        # Handle taking Crystal-Clear Water
        elif command in ["take crystal-clear water", "get crystal-clear water", 
                        "take crystal water", "get crystal water", "take water", "get water"]:
            return self._take_crystal_water(game_state)
            
        # Handle taking Moonflowers
        elif command in ["take moonflowers", "get moonflowers", "take flowers", "get flowers"]:
            return self._take_moonflowers(game_state)
            
        # Handle examining the items before taking
        elif command in ["examine crystal-clear water", "look at crystal-clear water", 
                        "examine crystal water", "look at crystal water", "examine water", "look at water"]:
            return self._examine_crystal_water()
        elif command in ["examine moonflowers", "look at moonflowers", "examine flowers", "look at flowers"]:
            return self._examine_moonflowers()
        
        return ""  # No command handled
        
    def _cast_nature_sense(self, game_state) -> str:
        """Cast nature_sense to detect the water nymphs."""
        has_nature_sense = any(spell.name.lower() == "nature_sense" for spell in game_state.known_spells)
        
        if not has_nature_sense:
            return "[error]You don't know the nature_sense spell.[/error]"
            
        if not game_state.get_story_flag("nature_sense_used_whispering_glade"):
            game_state.set_story_flag("nature_sense_used_whispering_glade", True)
            return (
                "[spell_effect]You close your eyes and cast the nature_sense spell, extending "
                "your awareness throughout the glade. Immediately, you sense magical presences "
                "by the stream - graceful forms of living water and moonlight. The water nymphs "
                "reveal themselves, shimmering into visibility as they recognize your magical "
                "sensitivity and respect for the natural world.[/spell_effect]"
            )
        else:
            return (
                "[info]Your nature_sense reveals the familiar presence of the water nymphs "
                "by the sacred stream, their forms visible and welcoming.[/info]"
            )
            
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
            
    def _take_crystal_water(self, game_state) -> str:
        """Take the Crystal-Clear Water (only available after completing riddles)."""
        if not game_state.get_story_flag("water_nymph_riddles_completed"):
            return "[error]The water nymphs guard their sacred gifts. You must prove your wisdom first.[/error]"
            
        if game_state.get_story_flag("crystal_clear_water_taken"):
            return "[info]You have already taken the crystal-clear water.[/info]"
            
        # Check if the water is available in the room
        water_available = any(item.name.lower() == "crystal-clear water" for item in self.items)
        
        if water_available:
            # Remove from room and add to inventory (this will trigger picked_up)
            water_item = next(item for item in self.items if item.name.lower() == "crystal-clear water")
            self.items = [item for item in self.items if item.name.lower() != "crystal-clear water"]
            game_state.inventory.append(water_item)
            pickup_message = water_item.picked_up(game_state)
            
            response = (
                "[item_acquired]You carefully collect the crystal-clear water from the sacred "
                "spring, its purifying magic tingling against your hands. The water nymphs "
                "watch approvingly as you claim their blessed gift.[/item_acquired]"
            )
            if pickup_message:
                response += " " + pickup_message
            return response
        else:
            return "[error]There is no crystal-clear water here to take.[/error]"
            
    def _take_moonflowers(self, game_state) -> str:
        """Take the Moonflowers (only available after completing riddles)."""
        if not game_state.get_story_flag("water_nymph_riddles_completed"):
            return "[error]The moonflowers are protected by the water nymphs. You must earn their trust first.[/error]"
            
        if game_state.get_story_flag("moonflowers_taken"):
            return "[info]You have already taken the moonflowers.[/info]"
            
        # Check if the flowers are available in the room
        flowers_available = any(item.name.lower() == "moonflowers" for item in self.items)
        
        if flowers_available:
            # Remove from room and add to inventory (this will trigger picked_up)
            flower_item = next(item for item in self.items if item.name.lower() == "moonflowers")
            self.items = [item for item in self.items if item.name.lower() != "moonflowers"]
            game_state.inventory.append(flower_item)
            pickup_message = flower_item.picked_up(game_state)
            
            response = (
                "[item_acquired]You gently gather the luminescent moonflowers, their "
                "silvery petals shimmering with magical energy. The flowers seem to "
                "welcome your touch, knowing they will be used for a noble purpose.[/item_acquired]"
            )
            if pickup_message:
                response += " " + pickup_message
            return response
        else:
            return "[error]There are no moonflowers here to take.[/error]"
            
    def _examine_crystal_water(self) -> str:
        """Examine the Crystal-Clear Water."""
        water_available = any(item.name.lower() == "crystal-clear water" for item in self.items)
        
        if water_available:
            return (
                "[item_description]The sacred spring bubbles with water so pure it seems "
                "to contain captured starlight. Each drop sparkles with inner radiance, "
                "and you can sense powerful purification magic flowing through the liquid. "
                "This is clearly a gift from the water nymphs, blessed with the power to "
                "break curses and cleanse dark enchantments.[/item_description]"
            )
        else:
            return "[error]There is no crystal-clear water here to examine.[/error]"
            
    def _examine_moonflowers(self) -> str:
        """Examine the Moonflowers."""
        flowers_available = any(item.name.lower() == "moonflowers" for item in self.items)
        
        if flowers_available:
            return (
                "[item_description]These ethereal white flowers grow near the sacred stream, "
                "their petals shimmering with silvery light. They seem to glow brighter "
                "under the forest canopy, and their sweet fragrance has a calming, almost "
                "hypnotic quality. These are rare moonflowers, prized for their magical "
                "properties and ability to enhance healing and protective magic.[/item_description]"
            )
        else:
            return "[error]There are no moonflowers here to examine.[/error]"
