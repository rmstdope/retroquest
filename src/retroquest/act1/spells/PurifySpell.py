"""Purify Spell (Act I / Cross-Act Utility)

Purpose:
    Cleansing spell that removes corruption or impurities from environmental targets (e.g., wells, warding artifacts) once full magic capability is unlocked.

Gating:
    - Requires story flag "magic_fully_unlocked"; otherwise fizzles—establishes progressive magic growth.

Core Mechanics:
    - cast_on_item:
        * Well -> delegates to Well.purify(game_state).
        * WardingPillars (Act III) -> delegates to room hook cast_purify_on_pillars enabling narrative flexibility.
        * Generic item -> fallback flavor message.
    - cast_spell / cast_on_character share gating + flavor.

Story Flags:
    - Reads: magic_fully_unlocked (string literal presently; candidate for central constant extraction).
    - Does not set flags itself.

Design Notes:
    - Uses delegation rather than embedding purification details to keep spell slim and reusable across acts.
    - Room hook pattern (cast_purify_on_pillars) allows environment-specific branching without coupling here.
    - Consider future mechanic: sanctify accumulation or purity meter.
"""

from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Item import Item
from ...engine.Character import Character
from ..items.Well import Well  # Import Well
from ...act3.items.WardingPillars import WardingPillars

class PurifySpell(Spell):
    def __init__(self) -> None:
        super().__init__("purify", "A cleansing spell that removes impurities from water or other substances.")

    def cast_spell(self, game_state: GameState) -> str:
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return f"[event]You attempt to cast [spell_name]{self.get_name()}[/spell_name], but the magic fizzles out, achieving nothing.[/event]\nIt feels like the magic is just out of reach."
        return f"[event]You cast [spell_name]{self.get_name()}[/spell_name].[/event]\nA cleansing energy flows from your hands."

    def cast_on_item(self, game_state: GameState, target_item: Item) -> str:
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return f"[event]You attempt to cast [spell_name]{self.get_name()}[/spell_name], but the magic fizzles out, achieving nothing.[/event]\nIt feels like the magic is just out of reach."
        if isinstance(target_item, Well):
            return target_item.purify(game_state) # Delegate to Well's purify method
        if isinstance(target_item, WardingPillars):
            # Delegate to the room hook to handle narrative/state
            hook = getattr(game_state.current_room, 'cast_purify_on_pillars', None)
            if hook:
                return hook(game_state)
        return f"[event]You cast [spell_name]{self.get_name()}[/spell_name] on [item_name]{target_item.get_name()}[/item_name].[/event]\nA cleansing energy flows from your hands, but nothing else seems to happen."

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return f"[event]You attempt to cast [spell_name]{self.get_name()}[/spell_name], but the magic fizzles out, achieving nothing.[/event]\nIt feels like the magic is just out of reach."
        return f"[event]You cast [spell_name]{self.get_name()}[/spell_name] on [character_name]{target_character.get_name()}[/character_name].[/event]\nA cleansing energy flows around {target_character.get_name()}, purifying their spirit and lifting any negative influences."
