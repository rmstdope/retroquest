"""Fortress Gates room: the imposing entrance to Malakar's shadow fortress."""

from ...engine.Room import Room
from ..items import WardStoneFragment, GuardiansChain, GuardiansEssence, WardStones, Barriers
from ..Act4StoryFlags import (
    FLAG_ACT4_BARRIERS_DISABLED,
    FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED
)


class FortressGates(Room):
    """The dark entrance to Malakar's fortress, protected by shadow guardians.

    Narrative Role:
        First breach point requiring courage and light magic to overcome defenses.

    Key Mechanics:
        Ward stones must be examined and fragments used to disable barriers.

    Story Flags:
        Required for entering the fortress complex.

    Contents:
        - Items: Ward stone fragments, Guardian's essence, Guardian's chain.
        - Characters: Shadow guardians (defeated through light magic).

    Design Notes:
        Sets the tone for the entire fortress with immediate magical challenges.
    """

    def __init__(self) -> None:
        """Initialize the Fortress Gates with its ominous atmosphere and barriers."""
        super().__init__(
            name="Fortress Gates",
            description=(
                "Towering obsidian gates loom before you, carved with writhing shadows that "
                "seem to move in the corners of your vision. Ancient ward stones pulse with "
                "malevolent energy, casting eerie purple light across the threshold. The air "
                "crackles with dark magic, and whispers of forgotten souls echo from beyond "
                "the barrier. Spectral guardians drift between the stones, their hollow eyes "
                "fixed upon any who dare approach this cursed entrance."
            ),
            items=[
                WardStoneFragment(),
                GuardiansChain(),
                WardStones(),
                Barriers(),
            ],
            characters=[],
            exits={"north": "HallOfEchoes", "east": "OuterCourtyard"}
        )
        self._shadow_guardians_banished = False

    def light(self, game_state) -> str:
        """Cast light spell to dispel shadow guardians."""
        if not game_state.get_story_flag(FLAG_ACT4_BARRIERS_DISABLED):
            return (
                "[failure]The shadow guardians resist your light magic while the ward "
                "stones remain active. You must disable the magical barriers first.[/failure]"
            )
        elif not self._shadow_guardians_banished:
            self._shadow_guardians_banished = True
            game_state.set_story_flag(FLAG_ACT4_SHATTERED_WARD_GUARDIANS_COMPLETED, True)
            # Add Guardian's Essence to the room
            guardians_essence = GuardiansEssence()
            self.add_item(guardians_essence)
            return (
                "[event]Your light magic blazes forth, dispelling the shadow guardians in "
                "brilliant flashes of purifying energy. As they vanish, their essence "
                "coalesces into a glowing orb that settles gently on the ground - the "
                "Guardian's Essence, proof of your courage.[/event]"
            )
        else:
            return (
                "[info]The shadow guardians have already been banished. The way forward "
                "is clear.[/info]"
            )

    def examine(self, game_state, target: str) -> str:
        """Handle examining specific targets in the room."""
        target_lower = target.lower()
        if "ward stone" in target_lower or "stones" in target_lower:
            return (
                "[event]You examine the ward stones closely. Each stone is carved with "
                "ancient protective runes that pulse with dark energy. The stones appear "
                "to be the anchor points for the shadow guardians and magical barriers. "
                "A fragment has broken off from one stone, perhaps weakening the network.[/event]"
            )
        elif "guardian" in target_lower:
            if not self._shadow_guardians_banished:
                return (
                    "[event]The spectral guardians drift menacingly between the ward stones, "
                    "their forms shifting between solid and ethereal. Their hollow eyes burn "
                    "with malevolent purpose, and they seem bound to the stones' dark energy.[/event]"
                )
            else:
                return (
                    "[info]The shadow guardians have been banished by your light magic.[/info]"
                )
        elif "barrier" in target_lower:
            if not game_state.get_story_flag(FLAG_ACT4_BARRIERS_DISABLED):
                return (
                    "[event]Shimmering barriers of dark energy block the entrances to the "
                    "fortress. The barriers pulse in rhythm with the ward stones, drawing "
                    "power from their dark magic.[/event]"
                )
            else:
                return (
                    "[info]The magical barriers have been disabled and no longer block your way.[/info]"
                )
        else:
            return (
                f"[event]You examine the {target} but find nothing particularly "
                "noteworthy about it.[/event]"
            )
