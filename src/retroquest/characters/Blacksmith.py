from .Character import Character
from ..items.Coin import Coin
from ..items.Knife import Knife # Assuming Knife has a way to be sharpened or its name can be changed

class Blacksmith(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Blacksmith",
            description="A burly, skilled craftsman who forges tools and weapons for the village. He is always ready to offer advice or sharpen a blade."
        )

    def talk_to(self, game_state) -> str:
        # Example dialog, can be expanded
        if game_state.get_story_flag("blacksmith_met"):
            return "Welcome back, young Elior. Need something else?"
        else:
            game_state.set_story_flag("blacksmith_met", True)
            return "Well met, young one. I am Borin, the village blacksmith. If you need tools made or mended, I'm your man. A sharp blade can be a good friend."

    def give_item(self, game_state, item_object) -> str:
        if isinstance(item_object, Coin):
            # Check for "knife (dull)" in inventory
            dull_knife = None
            for item in game_state.inventory:
                if isinstance(item, Knife) and item.get_name().lower() == "knife (dull)":
                    dull_knife = item
                    break
            
            if dull_knife:
                # Remove coin from inventory
                game_state.remove_item_from_inventory(item_object.get_name()) # Assumes coin is named "Coin" or similar unique name
                
                # Rename the knife
                # This assumes the Knife item's name can be directly modified.
                # A more robust approach might be a method like dull_knife.sharpen()
                # or replacing the item instance with a new one.
                dull_knife.name = "knife (sharp)" 
                # If Knife has a specific description for sharp, update it too
                if hasattr(dull_knife, 'description'):
                    dull_knife.description = "A finely sharpened knife, ready for action."

                return "The blacksmith takes your coin and expertly sharpens your dull knife. It's now a trusty sharp knife!"
            else:
                return "The blacksmith eyes the coin. 'Thanks for the tip, but I can only sharpen a dull knife for ye if you have one.'"
        else:
            return f"The blacksmith looks at the {item_object.get_name()}. 'I don't have a use for this, lad.'"
