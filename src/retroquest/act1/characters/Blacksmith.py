from ...engine.Character import Character
from ..Act1StoryFlags import FLAG_BLACKSMITH_MET, FLAG_DEER_CAN_BE_OBSERVED
from ..items.Coin import Coin
from ..items.DullKnife import DullKnife
from ..items.SharpKnife import SharpKnife # Added import
from ..items.MillstoneFragment import MillstoneFragment # Added import

class Blacksmith(Character):
    def __init__(self) -> None:
        super().__init__(
            name="blacksmith",
            description="A burly, skilled craftsman who forges tools and weapons for the village. He is always ready to offer advice or sharpen a blade."
        )

    def talk_to(self, game_state) -> str:
        # Example dialog, can be expanded
        event_msg = f"[event]You speak with the [character.name]{self.get_name()}[/character.name].[/event]"
        if game_state.get_story_flag(FLAG_BLACKSMITH_MET):
            return event_msg + "\n" + "[dialogue]'Welcome back, young [character.name]Elior[/character.name]. Need something else?'[/dialogue]"
        else:
            game_state.set_story_flag(FLAG_BLACKSMITH_MET, True)
            return event_msg + "\n" + f"[dialogue]'Well met, young one. I am Borin, the village [character.name]{self.get_name()}[/character.name]. If you need tools made or mended, I'm your man. A sharp blade can be a good friend.'[/dialogue]"

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
                event_msg = f"[event]You give the [item.name]{item_object.get_name()}[/item.name] and [item.name]{dull_knife_instance.get_name()}[/item.name] to the [character.name]{self.get_name()}[/character.name].[/event]"
                return event_msg + "\n" + f"The [character.name]{self.get_name()}[/character.name] takes your [item.name]{item_object.get_name()}[/item.name] and your [item.name]{dull_knife_instance.get_name()}[/item.name]. He expertly sharpens it on his whetstone and hands you back a gleaming [item.name]sharp knife[/item.name]!"
            else:
                event_msg = f"[event]You offer the [item.name]{item_object.get_name()}[/item.name] to the [character.name]{self.get_name()}[/character.name].[/event]"
                return event_msg + "\n" + f"The [character.name]{self.get_name()}[/character.name] eyes the [item.name]{item_object.get_name()}[/item.name]. [dialogue]'Thanks for the offer, but I can only sharpen a [item.name]dull knife[/item.name] for ye if you have one.'[/dialogue]"
        elif isinstance(item_object, MillstoneFragment):
            game_state.remove_item_from_inventory(item_object.get_name())
            # Optionally, set a story flag if needed
            game_state.set_story_flag(FLAG_DEER_CAN_BE_OBSERVED, True)
            event_msg = f"[event]You give the [item.name]{item_object.get_name()}[/item.name] to the [character.name]{self.get_name()}[/character.name].[/event]"
            return (
                event_msg + "\n" +
                f"The [character.name]{self.get_name()}[/character.name] takes the [item.name]{item_object.get_name()}[/item.name], turning it over in his calloused hands. "
                "[dialogue]'Aye, this is from the old mill, alright. Sturdy stone. You know, old tales say the mill was built on a place of ancient power. "
                "Some say a magical deer sometimes appears in the Hidden Glade, but only when all is calm and rest-ful—no voices, no footsteps, just the hush of the wind and the song of the stream. "
                "If you seek the deer, remember: it will not show itself to those who rush or bring trouble.'[/dialogue]"
            )
        else:
            event_msg = f"[event]You offer the [item.name]{item_object.get_name()}[/item.name] to the [character.name]{self.get_name()}[/character.name].[/event]"
            return event_msg + "\n" + f"The [character.name]{self.get_name()}[/character.name] looks at the [item.name]{item_object.get_name()}[/item.name]. [dialogue]'I don't have a use for this, lad.'[/dialogue]"
