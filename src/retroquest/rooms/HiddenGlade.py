from .Room import Room
from ..items.RareFlower import RareFlower
from ..items.ShinyPebble import ShinyPebble
from ..characters.Deer import Deer
from ..GameState import GameState # Added GameState for type hinting
from ..spells.GrowSpell import GrowSpell # Import GrowSpell

class HiddenGlade(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Hidden Glade",
            description=(
                "A peaceful clearing bathed in golden sunlight, hidden deep within the forest. Wildflowers "
                "carpet the ground, and a gentle breeze stirs the tall grass. In the center, a mossy stone "
                "bears a faint, magical inscription. The glade feels enchanted, a place where "
                "the world holds its breath."
            ),
            items=[ShinyPebble()],
            characters=[],
            exits={"north": "ForestPath", "south": "VillageChapel"}
        )

    def get_room_text_description(self) -> str:
        base_description = (
            "A peaceful clearing bathed in golden sunlight, hidden deep within the forest. Wildflowers "
            "carpet the ground, and a gentle breeze stirs the tall grass. In the center, a mossy stone "
            "bears a faint, magical inscription."
        )
        dynamic_parts = []
        if self.get_character_by_name("Deer"):
            dynamic_parts.append(
                "A graceful deer grazes quietly, occasionally lifting its head to watch you with wise, gentle eyes."
            )
            # Check if flower is still in the room's items
            if any(isinstance(item, RareFlower) for item in self.items):
                dynamic_parts.append("A beautiful rare flower blooms near the mossy stone.")
            else:
                dynamic_parts.append("You recall picking a beautiful rare flower that once bloomed near the mossy stone.")


        if not dynamic_parts and not self.get_character_by_name("Deer"):
            base_description += " The glade feels quiet and expectant, as if waiting for something."
        
        description = base_description
        if dynamic_parts:
            description += " " + " ".join(dynamic_parts)
        
        description += " The glade feels enchanted, a place where the world holds its breath."
        return description

    def rest(self, game_state: GameState) -> str:
        if game_state.get_story_flag("deer_can_be_observed"):
            messages = ["You take a moment to rest in the tranquil glade."]
            appeared_something = False
            if not self.get_character_by_name("Deer"):
                deer = Deer()
                self.add_character(deer)
                messages.append("As you relax, a graceful deer emerges into the glade, its gentle eyes watching you.")
                self.add_item(RareFlower())
                messages.append("You notice a rare, beautiful flower blooming near the mossy stone.")
                appeared_something = True
            else:
                messages.append("The deer continues to graze peacefully.")

            return " ".join(messages)
        else:
            return "You rest for a while, but the glade remains quiet. Perhaps something more needs to happen for its magic to awaken."

    def describe(self) -> str:
        return self.get_room_text_description()

    def light(self, game_state: GameState) -> str:
        """Called when a light source is used or a light spell is cast in the room."""
        message = "The light illuminates the glade. The inscription on the mossy stone glows faintly, revealing ancient runes. They speak of a seed, a song, and the sun's embrace to awaken life."
        if not game_state.has_spell("Grow"):
            grow_spell = GrowSpell()
            game_state.learn_spell(grow_spell)
            message += " As you read the runes, you feel a connection to the ancient magic of nature. You have learned the `grow` spell!"
        return message