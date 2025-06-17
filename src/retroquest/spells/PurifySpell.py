from .Spell import Spell
from ..items.Well import Well  # Import Well

class PurifySpell(Spell):
    def __init__(self):
        super().__init__("Purify", "A cleansing spell that removes impurities from water or other substances.")

    def cast(self, game_state, target_item=None) -> str:  # Added target_item
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return "You attempt to cast Purify, but the magic fizzles out, achieving nothing."

        if target_item:
            if isinstance(target_item, Well):
                return target_item.purify(game_state) # Delegate to Well's purify method
            return f"You cast Purify on the {target_item.get_name()}. A cleansing energy flows from your hands, but nothing else seems to happen."
        return "You cast Purify. A cleansing energy flows from your hands."
