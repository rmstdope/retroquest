from .Spell import Spell
from ..items.MysteriousBox import MysteriousBox # Ensure MysteriousBox is imported

class UnlockSpell(Spell):
    def __init__(self):
        super().__init__("unlock", "A spell that can open magically sealed or complex mundane locks.")

    def cast(self, game_state, target_item=None) -> str:
        if not target_item:
            return "[failure]You need to specify what you want to unlock.[/failure]"

        # Check if the target_item is the Mysterious Box and if it's in the current room or inventory
        # The find_item method in Game.py already handles finding the item.
        # We just need to check its type and if it can be unlocked.
        
        if isinstance(target_item, MysteriousBox):
            return target_item.unlock(game_state) # Call unlock method of MysteriousBox
        else:
            return super().cast(game_state, target_item)
