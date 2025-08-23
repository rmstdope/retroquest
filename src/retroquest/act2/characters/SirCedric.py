from ...engine.Character import Character
from ...engine.GameState import GameState
from ..quests.TheGatheringStorm import TheGatheringStormQuest
from ..quests.TheKnightsTest import TheKnightsTestQuest
from ..items.Coins import Coins
from ..Act2StoryFlags import FLAG_SPOKEN_TO_SIR_CEDRIC, FLAG_CEDRIC_TRUSTS_ELIOR

class SirCedric(Character):
    def __init__(self) -> None:
        super().__init__(
            name="sir cedric",
            description="A noble knight in gleaming armor, bearing the scars of many battles. His eyes hold wisdom and determination as he prepares for the challenges ahead.",
        )

    def talk_to(self, game_state: GameState) -> str:
        if not game_state.get_story_flag(FLAG_SPOKEN_TO_SIR_CEDRIC):
            # First meeting - explain the main quest and give knight's test
            game_state.set_story_flag(FLAG_SPOKEN_TO_SIR_CEDRIC, True)
            return ("[character_name]Sir Cedric[/character_name]: Greetings, traveler. I am [character_name]Sir Cedric[/character_name], "
                    "and I have been seeking individuals of courage and skill for a matter of great importance. "
                    "Dark forces are gathering - what I call 'The Gathering Storm' - and I need allies with "
                    "magical knowledge and proven abilities. Before I can trust you with this responsibility, "
                    "I need proof of your combat skills. Can you demonstrate your martial abilities?")
        elif game_state.is_quest_completed("The Knight's Test") and not game_state.get_story_flag(FLAG_CEDRIC_TRUSTS_ELIOR):
            game_state.set_story_flag(FLAG_CEDRIC_TRUSTS_ELIOR, True)
            
            # Give Elior 100 individual coins using the new batching system
            coin = Coins(1)  # Create a single coin worth 1 gold
            game_state.add_item_to_inventory(coin, count=100)  # Add 100 of them
            
            return ("[character_name]Sir Cedric[/character_name]: Excellent demonstration! Your combat skills are impressive. "
                    "I can see you have the training and discipline needed for the challenges ahead. "
                    "\n\n*Sir Cedric reaches into his pouch and hands you a bag of coins*\n\n"
                    "Please accept these 100 gold coins - I should have provided them earlier for your "
                    "supply purchasing. You'll need proper equipment for the forest expedition: a survival kit, "
                    "enhanced lantern, and quality rope from the Market District. The realm faces a great threat, "
                    "and we must be prepared.")
        elif game_state.get_story_flag(FLAG_CEDRIC_TRUSTS_ELIOR):
            return ("[character_name]Sir Cedric[/character_name]: How goes your preparation? The gathering storm grows "
                    "stronger each day. I trust you are making good progress in gathering allies and supplies.")
        else:
            return ("[character_name]Sir Cedric[/character_name]: I await your demonstration of combat skills before "
                    "we can proceed with more serious matters.")