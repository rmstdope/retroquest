from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.LocalCraftsmen import LocalCraftsmen
from ..characters.Families import Families
from ..items.HealingHerbs import HealingHerbs
from ..Act2StoryFlags import (
    FLAG_HELPED_ELDERLY_RESIDENTS, 
    FLAG_LEARNED_MEND_FROM_CRAFTSMEN,
    FLAG_ANCIENT_LIBRARY_ACCEPTED
)

class ResidentialQuarter(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Residential Quarter",
            description=(
                "Quiet streets lined with comfortable two-story homes, each with small gardens and workshops. Smoke rises "
                "from chimneys, and the sound of craftsmen at work echoes from various buildings. This is where Greendale's "
                "skilled artisans and middle-class citizens live and work. The atmosphere is peaceful and industrious."
            ),
            items=[HealingHerbs()],
            characters=[LocalCraftsmen(), Families()],
            exits={"south": "CastleCourtyard", "north": "HealersHouse", "secret_passage": "HiddenLibrary"}
        )

    def search(self, game_state: GameState, target: str = None) -> str:
        """Handle searching for the Hidden Library entrance"""
        if not game_state.get_story_flag(FLAG_ANCIENT_LIBRARY_ACCEPTED):
            game_state.set_story_flag(FLAG_ANCIENT_LIBRARY_ACCEPTED, True)
            return ("[success]You search through the basement areas of the residential buildings. Behind some old "
                    "storage crates and forgotten furniture, you discover a concealed entrance hidden in the stone "
                    "wall. A narrow tunnel leads deeper underground to what appears to be an ancient chamber. "
                    "You've found a secret passage to a [location_name]Hidden Library[/location_name]! You can now "
                    "use 'go secret_passage' to enter this mysterious underground repository.[/success]")
        else:
            return "[info]You've already discovered the secret passage to the Hidden Library.[/info]"

    def handle_command(self, command: str, game_state: GameState) -> str:
        # Handle "use walking stick" command to help elderly residents
        if "use walking stick" in command.lower():
            walking_stick = next((item for item in game_state.inventory if "walking stick" in item.get_name().lower()), None)
            if walking_stick and not game_state.get_story_flag(FLAG_HELPED_ELDERLY_RESIDENTS):
                game_state.set_story_flag(FLAG_HELPED_ELDERLY_RESIDENTS, True)
                return ("[success]You use your walking stick to help several elderly residents navigate the uneven "
                        "cobblestones and carry their heavy loads. Your assistance is greatly appreciated, and the "
                        "community takes note of your kind and helpful nature. Word spreads that you are someone "
                        "who cares about others.[/success]")
            elif not walking_stick:
                return "[failure]You don't have a walking stick to assist the elderly residents.[/failure]"
            else:
                return "[info]You've already helped the elderly residents in this area.[/info]"
        
        # Handle "look at craftsmen" command to learn mend spell
        elif "look at local craftsmen" in command.lower() or "look at craftsmen" in command.lower():
            if not game_state.get_story_flag(FLAG_LEARNED_MEND_FROM_CRAFTSMEN):
                game_state.set_story_flag(FLAG_LEARNED_MEND_FROM_CRAFTSMEN, True)
                from ..spells.MendSpell import MendSpell
                game_state.learn_spell(MendSpell())
                return ("[success]You watch the [character_name]Local Craftsmen[/character_name] work, observing their "
                        "techniques for repairing damaged items. As you study their methods, you begin to understand "
                        "the magical principles behind restoration and repair. Through careful observation, you learn "
                        "the [spell_name]mend[/spell_name] spell![/success]")
            else:
                return "[info]You've already learned what you can from watching the craftsmen work.[/info]"
        
        return super().handle_command(command, game_state)
