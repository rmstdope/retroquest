from ...engine.Character import Character
from ..items.ShinyRing import ShinyRing
from ..items.WanderingBoots import WanderingBoots
from ..items.Coin import Coin

class Merchant(Character):
    def __init__(self) -> None:
        super().__init__(
            name="merchant",
            description="A traveling merchant with a cart full of wares and stories from distant lands. Always ready to trade or offer travel advice."
        )
        self.boots_given = False  # Track if boots have been given

    def talk_to(self, game_state, player=None) -> str:
        # Use boots_given flag instead of checking inventory
        event_msg = f"[event]You speak with the [character.name]{self.get_name()}[/character.name].[/event]"
        if not self.boots_given:
            return (event_msg + "\n" +
                    f"[dialogue]The [character.name]{self.get_name()}[/character.name] offers a friendly nod. 'Looking for something specific, or just browsing? "
                    f"If you have any fine jewelry, especially a [item.name]shiny ring[/item.name], I'm ready to exchange it for a pair of sturdy [item.name]wandering boots[/item.name].'[/dialogue]")
        else:
            return (event_msg + "\n" +
                    f"[dialogue]The [character.name]{self.get_name()}[/character.name] grins. 'Those [item.name]boots[/item.name] should serve you well on the road ahead! Let me know if you find anything else of value.'[/dialogue]")

    def give_item(self, game_state, item):
        from ..items.ShinyRing import ShinyRing
        from ..items.WanderingBoots import WanderingBoots
        if isinstance(item, ShinyRing):
            game_state.remove_item_from_inventory(item.get_name())
            boots = WanderingBoots()
            game_state.add_item_to_inventory(boots)
            self.boots_given = True  # Set flag when boots are given
            event_msg = f"[event]You give the [item.name]{item.get_name()}[/item.name] to the [character.name]{self.get_name()}[/character.name].[/event]"
            return (event_msg + "\n" +
                    f"[dialogue]The [character.name]{self.get_name()}[/character.name]'s eyes widen as you hand over the [item.name]{item.get_name()}[/item.name]. 'A fine piece! As promised, here are the [item.name]{boots.get_name()}[/item.name]. They'll serve you well on the road to Greendale.'[/dialogue]\n\n[event]You receive a pair of [item.name]{boots.get_name()}[/item.name]![/event]")
        event_msg = f"[event]You offer the [item.name]{item.get_name()}[/item.name] to the [character.name]{self.get_name()}[/character.name].[/event]"
        return event_msg + "\n" + f"[dialogue]The [character.name]{self.get_name()}[/character.name] examines the [item.name]{item.get_name()}[/item.name] but shakes his head. 'Not interested in that, friend.'[/dialogue]"

