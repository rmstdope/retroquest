from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Item import Item
from ..items.WitheredCarrot import WitheredCarrot

class GrowSpell(Spell):
    def __init__(self) -> None:
        super().__init__("grow", "A nature spell that encourages plants to flourish.")

    def cast_spell(self, game_state: GameState) -> str:
        return "[event]You cast [spell_name]grow[/spell_name].[/event]\nThe nearby plants seem to respond with vibrant energy, but nothing else happens."

    def cast_on_item(self, game_state: GameState, target_item: Item) -> str:
        return target_item.grow(game_state)
