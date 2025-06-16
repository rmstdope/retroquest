from .Character import Character
from ..items.Coin import Coin
from ..items.DullKnife import DullKnife
from ..items.SharpKnife import SharpKnife # Added import
from ..items.MillstoneFragment import MillstoneFragment # Added import

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
            dull_knife_instance = None
            for item in game_state.inventory:
                if isinstance(item, DullKnife):
                    dull_knife_instance = item
                    break
            
            if dull_knife_instance:
                # Remove coin from inventory
                game_state.remove_item_from_inventory(item_object.get_name())
                # Remove the dull knife from inventory
                game_state.remove_item_from_inventory(dull_knife_instance.get_name())
                # Add a new sharp knife to inventory
                game_state.add_item_to_inventory(SharpKnife())

                return "The blacksmith takes your coin and your dull knife. He expertly sharpens it on his whetstone and hands you back a gleaming sharp knife!"
            else:
                return "The blacksmith eyes the coin. 'Thanks for the offer, but I can only sharpen a dull knife for ye if you have one.'"
        elif isinstance(item_object, MillstoneFragment):
            game_state.remove_item_from_inventory(item_object.get_name())
            # Optionally, set a story flag if needed
            game_state.set_story_flag("deer_can_be_observed", True)
            return "The blacksmith takes the millstone fragment, turning it over in his calloused hands. 'Aye, this is from the old mill, alright. Sturdy stone. You know, old tales say the mill was built on a place of ancient power. Some say a magical deer sometimes appears in the Hidden Glade, drawn to such remnants. Perhaps this fragment holds a deeper secret than it seems.'"
        else:
            return f"The blacksmith looks at the {item_object.get_name()}. 'I don't have a use for this, lad.'"
