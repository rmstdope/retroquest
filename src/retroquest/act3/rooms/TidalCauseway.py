from ...engine.Room import Room
from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act3StoryFlags import FLAG_ACT3_SEA_SEALED_LETTER_FOUND


class Mural(Item):
    def __init__(self) -> None:
        super().__init__(
            name="mural",
            short_name="mural",
            description=(
                "A weathered mural along a half-drowned arch, a figure shielding a "
                "child against a storm of sigils."
            ),
            can_be_carried=False,
        )

    def examine(self, game_state: GameState) -> str:
        if game_state.get_story_flag(FLAG_ACT3_SEA_SEALED_LETTER_FOUND):
            return (
                "[event]The mural's scene is clear now: a guardian's silhouette "
                "shelters a child. The reliquary has been opened.[/event]"
            )
        # Reveal the letter in the room if not already found
        letter_present = any(
            i.get_name().lower() == "sea-sealed letter" 
            for i in game_state.current_room.get_items()
        )
        if not letter_present:
            game_state.current_room.add_item(SeaSealedLetter())
        return (
            "[event]Salt lines trace a hidden reliquary in the mural's base. Within, "
            "something pale and dry has been kept from the waves. A [item_name]Sea-Sealed "
            "Letter[/item_name] slips free.[/event]"
        )


class SeaSealedLetter(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Sea-Sealed Letter",
            short_name="letter",
            description=(
                "A scrap of vellum preserved by salt-crystal varnish. The ink hints at "
                "names and a warding bargain."
            ),
            can_be_carried=True,
        )

    def picked_up(self, game_state: GameState) -> str | None:
        if not game_state.get_story_flag(FLAG_ACT3_SEA_SEALED_LETTER_FOUND):
            game_state.set_story_flag(FLAG_ACT3_SEA_SEALED_LETTER_FOUND, True)
        return (
            "[item_effect]You carefully fold the preserved fragment — a testament "
            "kept by the sea.[/item_effect]"
        )


class TidalCauseway(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Tidal Causeway",
            description=(
                "Moon‑washed causeways slick with seaweed rise and fall with the tide, "
                "linking broken arches to half‑drowned plazas."
            ),
            items=[Mural()],
            characters=[],
            exits={"north": "ShorelineMarkers", "east": "SubmergedAntechamber"},
        )
