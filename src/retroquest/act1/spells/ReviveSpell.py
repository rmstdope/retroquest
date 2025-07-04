from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Item import Item
from ...engine.Character import Character
from ..items.WitheredCarrot import WitheredCarrot # Assuming WitheredCarrot is an item

class ReviveSpell(Spell):
    def __init__(self) -> None:
        super().__init__("revive", "A potent spell that can restore life to withered plants or even recently deceased small creatures.")

    def cast_spell(self, game_state: GameState) -> str:
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return "[event]You focus your will, a faint warmth spreads from your fingertips, but nothing happens. It feels like the magic is just out of reach.[/event]"
        return "[failure]What do you want to cast [spell_name]revive[/spell_name] on?[/failure]"

    def cast_on_item(self, game_state: GameState, target_item: Item) -> str:
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return "[event]You focus your will, a faint warmth spreads from your fingertips, but nothing happens. It feels like the magic is just out of reach.[/event]"

        if isinstance(target_item, WitheredCarrot):
            # The WitheredCarrot is revived in place (in inventory or room).
            # The revive() method on WitheredCarrot changes its name and description.
            revival_message = target_item.revive() 

            # The item, now a "Fresh carrot", remains in its original location.
            return f"[event]You channel the life-giving energy into the [item_name]Withered Carrot[/item_name].[/event]\n {revival_message}"
        else:
            return f"[failure]You can't revive [item_name]{target_item.get_name()}[/item_name].[/failure]"

    def cast_on_character(self, game_state: GameState, target_character: Character) -> str:
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return "[event]You focus your will, a faint warmth spreads from your fingertips, but nothing happens. It feels like the magic is just out of reach.[/event]"
        
        return f"[failure]You can't revive [character_name]{target_character.get_name()}[/character_name]. They are very much alive![/failure]"
