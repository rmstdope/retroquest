"""Castle Guard Captain (Act II)

Role:
    Frontline protocol NPC at Greendale's castle grounds who orients the player toward
    Sir Cedric and establishes courtly tone and respect conventions.

Key Interactions / Gating:
    - Provides guidance directing the player to speak with Sir Cedric in the courtyard.
    - Light narrative framing only; does not gate quests with flags, but reinforces
      thematic expectations of honor and proper address prior to engaging Cedric's arcs.

Story Flags Influenced:
    - None directly. Purely informational / atmospheric to strengthen setting.

Rewards & Progression Impact:
    - No tangible reward. Serves as a soft signpost toward knightly quest lines
      (e.g., Cedric's honor / training related content) and helps new players orient.

Design Notes:
    - Kept intentionally minimal for quick early interaction in Greendale.
    - Avoids flag usage to remain a stable ambient guidance source.
    - If future complexity is added (like formal salute requirements), integrate
      via an act-specific etiquette flag—do not overload this class.
"""

from ...engine.Character import Character
from ...engine.GameState import GameState

class CastleGuardCaptain(Character):
    def __init__(self) -> None:
        super().__init__(
            name="castle guard captain",
            description="A stern-looking officer in polished armor who oversees security for the castle grounds. He provides guidance on proper protocol for meeting with nobility.",
        )

    def talk_to(self, _game_state: GameState) -> str:
        return (f"[character_name]{self.get_name()}[/character_name]: Welcome to the castle grounds. "
                "[character_name]Sir Cedric[/character_name] can be found in the courtyard. When speaking with him, "
                "address him as 'Sir' and show proper respect. He's been seeking capable individuals for important "
                "work, so if you're here about that, be prepared to demonstrate your abilities.")
