from ...engine.Room import Room
from ..characters.ForestHermit import ForestHermit
from ..items.BoundaryStoneFragment import BoundaryStoneFragment
from ..items.StandingStones import StandingStones
from ..quests.TheHermitsWarning import TheHermitsWarning

class ForestTransition(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Forest Transition",
            description=(
                "The boundary between the civilized mountain paths and the wild Enchanted Forest. Ancient standing stones "
                "mark the threshold, covered in moss and carved with protective runes that seem to pulse with faint magic. "
                "The air grows thicker here, and you can sense the forest's ancient power awakening. Beyond lies a realm "
                "where normal rules may not apply. A mysterious figure in forest-green robes sits peacefully among the stones."
            ),
            items=[StandingStones()],
            characters=[ForestHermit()],
            exits={"west": "MountainPath", "east": "ForestEntrance"}
        )
        self.kit_used = False
        self.spell_learned = False
        self.hermit_talked = False
        self.quest_activated = False

# TODO What is this?
    # def enter(self, game_state) -> str:
    #     """Called when the player enters this room."""
    #     # Activate The Hermit's Warning quest on first entry
    #     if not self.quest_activated:
    #         self.quest_activated = True
    #         hermits_warning = TheHermitsWarning()
    #         game_state.add_quest(hermits_warning)
    #         game_state.activate_quest("The Hermit's Warning")
        
    #     return super().enter(game_state)
