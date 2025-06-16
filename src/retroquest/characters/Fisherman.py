from .Character import Character
from ..items.Item import Item # Added import
from ..items.Fish import Fish # Added import
from ..spells.PurifySpell import PurifySpell # Added import
from ..GameState import GameState # Added import

class Fisherman(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Fisherman",
            description="A weathered old man who spends his days by the riverbank, fishing and humming quiet tunes. He knows much about the river and its secrets."
        )
        self.knows_fishing_basics = False
        self.received_fish = False
        self.dialogue_states = {
            "initial": "The fisherman nods at you. 'The river's been a bit strange lately. Not many fish biting, and my arm... well, it's seen better days.'",
            "taught_fishing": "The fisherman smiles. 'Good to see you trying your luck with the rod. Any luck yet?'",
            "received_fish_thanks": "The fisherman's eyes light up. 'Ah, a fine catch! Thank you kindly. It's been a while since I've had a fresh river fish.'",
            "taught_spells": "The fisherman looks out over the water. 'The river has many moods. Treat it with respect, and it might share its secrets with you.'"
        }
        self.current_dialogue_key = "initial"

    def talk_to(self, game_state: GameState) -> str: # Removed player argument
        # Check if player has a fishing rod in game_state.inventory
        player_has_rod = game_state.has_item("fishing rod") # Use game_state.has_item

        if self.current_dialogue_key == "initial":
            if player_has_rod and not game_state.get_story_flag("learned_fishing_basics"):
                game_state.set_story_flag("learned_fishing_basics", True)
                self.knows_fishing_basics = True # Keep this for internal state if needed by other dialogue
                self.current_dialogue_key = "taught_fishing"
                return "The fisherman notices your fishing rod. 'Ah, a fellow angler! My arm's busted, can't fish myself. But I can tell you a thing or two. Cast your line near the reeds, that's where they like to hide. Patience is key, my friend, patience.' He teaches you the basics of fishing."
            elif game_state.get_story_flag("learned_fishing_basics"):
                 # If already taught, but current_dialogue_key is somehow still initial, switch to taught_fishing
                self.current_dialogue_key = "taught_fishing"
                # Fall through to return self.dialogue_states[self.current_dialogue_key] below
            else:
                return self.dialogue_states["initial"]
        
        if self.current_dialogue_key == "taught_fishing" and self.received_fish:
            # This state transition happens in give_item
            pass

        return self.dialogue_states[self.current_dialogue_key]

    def give_item(self, game_state: GameState, item: Item) -> str:
        if isinstance(item, Fish) and not self.received_fish:
            self.received_fish = True
            game_state.remove_item_from_inventory(item.name)
            
            # Teach spell
            game_state.learn_spell(PurifySpell())            
            self.current_dialogue_key = "taught_spells"
            return (f"You give the {item.name} to the Fisherman. {self.dialogue_states['received_fish_thanks']} "
                    f"'The river's water... it's not been right. Murky. But I sense you have a connection to the old ways. "
                    f"Let me teach you something to help. With this, you can cleanse water,' he says, teaching you the `purify` spell. "
                    f"You have learned `purify`!")

        elif isinstance(item, Fish) and self.received_fish:
            return "The fisherman smiles. 'Thank you, but I've already eaten. Save it for yourself!'"
        
        return f"The fisherman looks at the {item.name} curiously but doesn't seem to need it."
