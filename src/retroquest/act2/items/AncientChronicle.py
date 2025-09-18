"""Ancient Chronicle (Act II Environmental Item)

Narrative Role:
    Monumental historical tome housing genealogies and regional arcana. Acts as a lore reward and mechanical
    gateway for acquiring the Dispel spell once trust with the Spectral Librarian is secured.

Key Mechanics / Interactions:
    - Non-carriable (stationary library asset) examined/used in place.
    - use() conditionally grants DispelSpell if FLAG_SPECTRAL_LIBRARIAN_FRIENDLY is True; otherwise produces
      obstructive guardian messaging reinforcing prerequisite relationship.
    - Does not itself set completion flags (e.g., FLAG_ANCIENT_LIBRARY_COMPLETED); assumes external quest logic handles.

Story Flags:
    - Reads: FLAG_SPECTRAL_LIBRARIAN_FRIENDLY (gates spell learning)
    - Sets: (none)

Progression Effects:
    Grants access to restorative/anti-magic capabilities via DispelSpell supporting future barrier/curse encounters.

Design Notes:
    - Keeps relational gating (friendliness) decoupled; potential future expansion could include multiple study phases
      tracked by additional flags if tiered lore delivery is desired.
    - Avoids redundant learning: underlying learn_spell should internally guard against duplicate spell additions.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_SPECTRAL_LIBRARIAN_FRIENDLY

class AncientChronicle(Item):
    def __init__(self) -> None:
        super().__init__(
            name="ancient chronicle",
            short_name="chronicle",
            description="A massive tome containing historical records of the region, including detailed accounts of ancient bloodlines, family genealogies, and the significance of various settlements including Willowbrook.",
            can_be_carried=False,
        )

    def use(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_SPECTRAL_LIBRARIAN_FRIENDLY):
            # Learn dispel spell from ancient texts
            from ..spells.DispelSpell import DispelSpell
            game_state.learn_spell(DispelSpell())

            return ("[info]You study the ancient texts, reviewing the knowledge of the [spell_name]dispel[/spell_name] "
                    "spell and the revelations about your heritage. The words of the Chosen One prophecy echo "
                    "in your mind as you contemplate your destiny.[/info]")
        else:
            return ("[info]The [character_name]Spectral Librarian[/character_name] materializes before you, blocking "
                    "your access to the ancient texts. 'These sacred chronicles are not for the unworthy,' the spirit "
                    "intones. 'Prove yourself first, then perhaps I will permit you to study these treasures.'[/info]")
