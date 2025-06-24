from ...engine.Spell import Spell
from ..items.Well import Well  # Import Well

class PurifySpell(Spell):
    def __init__(self):
        super().__init__("purify", "A cleansing spell that removes impurities from water or other substances.")

    def cast(self, game_state, target_item=None) -> str:  # Added target_item
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return f"[event]You attempt to cast {self.get_name()}, but the magic fizzles out, achieving nothing.[/event]\nIt feels like the magic is just out of reach."

        if target_item:
            if isinstance(target_item, Well):
                return target_item.purify(game_state) # Delegate to Well's purify method
            return f"[event]You cast {self.get_name()} on the {target_item.get_name()}.[/event]\nA cleansing energy flows from your hands, but nothing else seems to happen."
        return f"[event]You cast {self.get_name()}.[/event]\nA cleansing energy flows from your hands."
