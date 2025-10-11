"""Hall of Echoes room: ancient knowledge preserved in spectral whispers."""

from ...engine.Room import Room


class HallOfEchoes(Room):
    """A mystical hall where the voices of the past linger in eternal resonance.

    Narrative Role:
        Repository of ancient wisdom needed to solve fortress puzzles.

    Key Mechanics:
        Echo stone captures navigation knowledge, Knight of Despair guards deeper secrets.

    Story Flags:
        Multi-visit location: knowledge gathering, then confrontation with knight.

    Contents:
        - Items: Echo stone, Enhanced echo stone, Knight's redemption.
        - Characters: Knight of Despair (redeemable through mercy).

    Design Notes:
        Balances puzzle-solving with character development through redemption themes.
    """

    def __init__(self) -> None:
        """Initialize the Hall of Echoes with its resonant mysteries."""
        super().__init__(
            name="Hall of Echoes",
            description=(
                "This vast hall stretches into shadow, its vaulted ceiling lost in darkness "
                "above. Every footstep awakens whispers from ages past, as if the very walls "
                "have absorbed the voices of countless souls. Ethereal sounds drift through "
                "the air—fragments of conversations, battle cries, and laments that seem to "
                "come from everywhere and nowhere. At the hall's heart stands a figure in "
                "tarnished armor, motionless as a statue but radiating an aura of profound sorrow."
            ),
            items=[],
            characters=[],
            exits={"south": "FortressGates", "north": "TowerOfShadows"}
        )
