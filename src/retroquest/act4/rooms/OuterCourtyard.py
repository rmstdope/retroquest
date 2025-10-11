"""Outer Courtyard room: corrupted servants trapped in eternal servitude."""

from ...engine.Room import Room
from ..characters import TrappedServants
from ..items import LoyaltyToken, ServantsPendant
from ..Act4StoryFlags import (
    FLAG_ACT4_SERVANTS_TRUST_EARNED,
    FLAG_ACT4_SERVANTS_FREED,
    FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED
)


class OuterCourtyard(Room):
    """A once-beautiful courtyard now tainted by shadow magic and trapped souls.

    Narrative Role:
        Introduces themes of compassion through freeing enslaved servants.

    Key Mechanics:
        Guardian's essence and blessing magic required to break servant chains.

    Story Flags:
        Provides loyalty token and pendant needed for later navigation.

    Contents:
        - Items: Loyalty token, Servant's pendant.
        - Characters: Trapped servants (freed through acts of mercy).

    Design Notes:
        Emphasizes redemption theme that will be crucial for Malakar encounter.
    """

    def __init__(self) -> None:
        """Initialize the Outer Courtyard with its tragic beauty and suffering."""
        super().__init__(
            name="Outer Courtyard",
            description=(
                "What was once a magnificent courtyard now writhes under a shroud of despair. "
                "Withered fountains weep black tears, and twisted statues reach toward a sky "
                "that seems perpetually stormy. Ethereal figures wander in endless circles, "
                "their faces etched with torment as dark chains bind their spirits to this "
                "cursed ground. The very stones beneath your feet pulse with anguish, and "
                "the air tastes of lost hope and forgotten dreams."
            ),
            items=[],
            characters=[
                TrappedServants(),
            ],
            exits={"west": "FortressGates", "north": "MirrorLabyrinth"}
        )

    def examine(self, game_state, target: str) -> str:
        """Handle examining specific targets in the room."""
        target_lower = target.lower()
        if "servant" in target_lower:
            servants = self.get_character_by_name("Trapped Servants")
            if servants:
                return servants.examine(game_state)
            else:
                return (
                    "[info]The servants have been freed and are no longer trapped here.[/info]"
                )
        else:
            return (
                f"[event]You examine the {target} but find nothing particularly "
                "noteworthy about it.[/event]"
            )

    def cast_bless(self, game_state) -> str:
        """Handle casting bless spell on servants."""
        if not game_state.get_story_flag(FLAG_ACT4_SERVANTS_TRUST_EARNED):
            return (
                "[failure]The servants do not trust you enough to accept your blessing. "
                "You must prove your worthiness first.[/failure]"
            )
        elif not game_state.get_story_flag(FLAG_ACT4_SERVANTS_FREED):
            game_state.set_story_flag(FLAG_ACT4_SERVANTS_FREED, True)
            game_state.set_story_flag(FLAG_ACT4_TRAPPED_SERVANTS_COMPLETED, True)
            # Add the loyalty token and pendant to the room
            self.add_item(LoyaltyToken())
            self.add_item(ServantsPendant())
            # Remove the trapped servants and replace with freed servants
            self.characters.clear()
            return (
                "[event]Your blessing magic flows out like golden light, shattering "
                "the dark chains that bind the servants. They cry out in joy as their "
                "spirits are freed from Malakar's curse. In gratitude, they offer you "
                "a loyalty token and a pendant that will help guide you through the "
                "trials ahead.[/event]"
            )
        else:
            return (
                "[info]The servants have already been freed from their cursed bonds.[/info]"
            )
