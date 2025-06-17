from .Spell import Spell
from ..items.WitheredCarrot import WitheredCarrot

class GrowSpell(Spell):
    def __init__(self):
        super().__init__("Grow", "A nature spell that encourages plants to flourish.")

    def cast(self, game_state, player) -> str:  # Added player argument
        # Check if player has a WitheredCarrot
        withered_carrot_instance = None
        for item in player.inventory:  # Changed from game_state.inventory to player.inventory
            if isinstance(item, WitheredCarrot):
                withered_carrot_instance = item
                break

        if withered_carrot_instance:
            # Revive the carrot in place
            revival_message = withered_carrot_instance.revive()
            # game_state.add_event(f"The {withered_carrot_instance.get_name()} in your pack plumps up!") # Assuming add_event exists
            return f"You cast Grow. As the magic flows, {revival_message}"

        # Add other Grow spell effects here if needed, e.g., interacting with room features
        # current_room = game_state.get_current_room()
        # if current_room.name == "Some Specific Room with a Plant":
        #     # ... logic to make plant grow ...
        #     return "The plant in the room flourishes under your spell!"

        return "You cast Grow. The nearby plants seem to respond with vibrant energy, but nothing else happens."
