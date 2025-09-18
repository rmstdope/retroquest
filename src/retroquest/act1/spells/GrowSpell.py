"""Grow Spell (Act I)

Purpose:
    Simple botanical encouragement magic teaching item-targeted interaction and enabling plant progression.

Acquisition:
    Early nature-aligned reward (often paired with revive/purify family in tutorial progression).

Core Mechanics:
    - cast_on_item delegates completely to target item's grow(game_state) method allowing each item to define its own response.
    - cast_spell baseline returns ambient growth flavor with no mechanical effect (placeholder for future growth systems).

Design Notes:
    - Minimal internal logic encourages item-driven polymorphism.
    - If growth stages system is added, manage those states within items or a GrowthManager rather than expanding this spell.
"""

from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Item import Item

class GrowSpell(Spell):
    def __init__(self) -> None:
        super().__init__("grow", "A nature spell that encourages plants to flourish.")

    def cast_spell(self, game_state: GameState) -> str:
        return "[event]You cast [spell_name]grow[/spell_name].[/event]\nThe nearby plants seem to respond with vibrant energy, but nothing else happens."

    def cast_on_item(self, game_state: GameState, target_item: Item) -> str:
        return target_item.grow(game_state)
