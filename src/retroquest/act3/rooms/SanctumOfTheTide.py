from ...engine.Character import Character
from ...engine.GameState import GameState
from ...engine.Room import Room
from ..Act3StoryFlags import (
    FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
    FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED,
    FLAG_ACT3_VOW_OF_COURAGE_MADE,
)
from ..items import CrystalOfLight


class TideBornGuardian(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Tide-Born Guardian",
            description=(
                "A figure of gathered waters and ward-sigils, its form rippling with the "
                "tide's breath."
            ),
        )

    def talk_to(self, _game_state: GameState) -> str:
        return (
            "[dialogue]The guardian's voice is the hush of a turning tide: 'Name what "
            "you will not abandon.'[/dialogue]"
        )

    def say_to(self, words: str, game_state: GameState) -> str:
        w = words.strip().lower()
        if w == "myself":
            # Only accept if local rites are complete
            sigils_attuned = game_state.get_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_ATTUNED)
            lanterns_lit = game_state.get_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT)
            if not (sigils_attuned and lanterns_lit):
                return (
                    "[failure]The guardian stirs, but the chamber's wards resist. The "
                    "outer rites remain unfinished. Complete the sigils and light the "
                    "path before the waters will part.[/failure]"
                )
            game_state.set_story_flag(FLAG_ACT3_VOW_OF_COURAGE_MADE, True)
            return (
                "[success]The waters draw back as if breathing in. Your vow anchors the "
                "chamber's heart, and the relic heeds your courage. You may now take the "
                "[item_name]Crystal of Light[/item_name].[/success]"
            )
        return (
            "[dialogue]The tide listens, then falls quiet. That is not the vow the "
            "guardian will bind to.[/dialogue]"
        )


class SanctumOfTheTide(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Sanctum of the Tide",
            description=(
                "A domed chamber where water stands glass‑still; sigils ripple across "
                "the surface like starlight."
            ),
            items=[CrystalOfLight()],
            characters=[TideBornGuardian()],
            exits={"north": "CollapsedPier", "west": "SubmergedAntechamber"},
        )

    def on_enter(self, game_state: GameState) -> None:
        # Ensure Mira and Sir Cedric are present when entering the sanctum
        for name in ("Mira", "Sir Cedric"):
            # If they exist in any room, move them here
            for room in game_state.all_rooms.values():
                char = room.get_character_by_name(name)
                if char:
                    room.get_characters().remove(char)
                    self.add_character(char)
                    break
