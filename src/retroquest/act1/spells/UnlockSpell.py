from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Item import Item
from ...engine.Character import Character
from ..items.MysteriousBox import MysteriousBox # Ensure MysteriousBox is imported

class UnlockSpell(Spell):
    def __init__(self) -> None:
        super().__init__("unlock", "A spell that can open magically sealed or complex mundane locks.")

    def cast_spell(self, game_state: GameState) -> str:
        return "[failure]You cast [spell_name]unlock[/spell_name] into the air, but magic requires a target to focus on. What do you wish to unlock?[/failure]"

    def cast_on_item(self, game_state: GameState, target_item: Item) -> str:
        # Check if the target_item is the Mysterious Box and if it's in the current room or inventory
        # The find_item method in Game.py already handles finding the item.
        # We just need to check its type and if it can be unlocked.
        
        if isinstance(target_item, MysteriousBox):
            return target_item.unlock(game_state) # Call unlock method of MysteriousBox
        else:
            return f"[failure]You cast [spell_name]unlock[/spell_name] on [item_name]{target_item.get_name()}[/item_name], but it seems to lack any locks or magical seals to open.[/failure]"

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        return f"[failure]You can't unlock [character_name]{target_character.get_name()}[/character_name]. They are not a locked object![/failure]"
