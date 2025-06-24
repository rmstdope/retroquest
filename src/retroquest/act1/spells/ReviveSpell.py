from ...engine.Spell import Spell
from ..items.WitheredCarrot import WitheredCarrot # Assuming WitheredCarrot is an item

class ReviveSpell(Spell):
    def __init__(self):
        super().__init__("revive", "A potent spell that can restore life to withered plants or even recently deceased small creatures.")

    def cast(self, game_state, target_item=None) -> str:
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return "You focus your will, a faint warmth spreads from your fingertips, but nothing happens. It feels like the magic is just out of reach."

        if target_item:
            if isinstance(target_item, WitheredCarrot):
                # The WitheredCarrot is revived in place (in inventory or room).
                # The revive() method on WitheredCarrot changes its name and description.
                revival_message = target_item.revive() 
                
                # The item, now a "Fresh carrot", remains in its original location.
                return f"[event]You channel the life-giving energy into the Withered Carrot.[/event]\n {revival_message}"
            else:
                return f"[failure]You can't revive the {target_item.get_name()}.[/failure]"
        else:
            return "[failure]What do you want to cast Revive on?[/failure]"
