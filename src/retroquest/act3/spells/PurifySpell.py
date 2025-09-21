"""Purify spell for Act 3."""

from ...engine.Character import Character
from ...engine.GameState import GameState
from ...engine.Item import Item
from ...engine.Spell import Spell
from ..items.WardingPillars import WardingPillars


class PurifySpell(Spell):
    """Act III variant of Purify, customized for Sunken Ruins interactions."""
    def __init__(self) -> None:
        super().__init__(
            name="purify",
            description=(
                "A cleansing rite tuned to salt and stone; it scours sea-grit and "
                "wakes dormant ward-glyphs."
            ),
        )

    def cast_spell(self, game_state: GameState) -> str:
        # Act III version has no global gating; it always responds with a cleansing aura
        return (
            f"[event]You cast [spell_name]{self.get_name()}[/spell_name].[/event]\n"
            "A brine-bright clarity flows from your hands, cutting through the mire."
        )

    def cast_on_item(self, game_state: GameState, target_item: Item) -> str:
        # Special handling for the warding pillars in the Outer Wards
        if isinstance(target_item, WardingPillars):
            hook = getattr(game_state.current_room, 'cast_purify_on_pillars', None)
            if hook:
                return hook(game_state)
        return (
            f"[event]You cast [spell_name]{self.get_name()}[/spell_name] on "
            f"[item_name]{target_item.get_name()}[/item_name].[/event]\n"
            "Saltlight skims its surface, though nothing more changes."
        )

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        return (
            f"[event]You cast [spell_name]{self.get_name()}[/spell_name] on "
            f"[character_name]{target_character.get_name()}[/character_name].[/event]\n"
            "A cleansing calm settles, washing away lingering dread."
        )
