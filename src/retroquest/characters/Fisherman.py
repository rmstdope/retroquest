from .Character import Character
from ..items.Item import Item # Added import
from ..items.Fish import Fish # Added import
from ..spells.PurifySpell import PurifySpell # Added import
from ..spells.FreezeSpell import FreezeSpell # Added import

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

    def talk(self, game_state) -> str:
        player_has_rod = game_state.inventory.has_item("fishing rod")

        if self.current_dialogue_key == "initial":
            if player_has_rod and not self.knows_fishing_basics:
                self.knows_fishing_basics = True
                self.current_dialogue_key = "taught_fishing"
                return "The fisherman notices your fishing rod. 'Ah, a fellow angler! My arm's busted, can't fish myself. But I can tell you a thing or two. Cast your line near the reeds, that's where they like to hide. Patience is key, my friend, patience.' He teaches you the basics of fishing."
            return self.dialogue_states["initial"]
        
        if self.current_dialogue_key == "taught_fishing" and self.received_fish:
            # This state transition happens in give_item
            pass

        return self.dialogue_states[self.current_dialogue_key]

    def give_item(self, item: Item, game_state) -> str:
        if isinstance(item, Fish) and not self.received_fish:
            self.received_fish = True
            game_state.remove_item_from_inventory(item.name)
            
            # Teach spells
            purify_spell = PurifySpell()
            freeze_spell = FreezeSpell()
            if not game_state.has_spell(purify_spell.name):
                game_state.learn_spell(purify_spell)
            if not game_state.has_spell(freeze_spell.name):
                game_state.learn_spell(freeze_spell)
            
            self.current_dialogue_key = "taught_spells"
            return (f"You give the {item.name} to the Fisherman. {self.dialogue_states['received_fish_thanks']} "
                    f"'The river's water... it's not been right. Murky. But I sense you have a connection to the old ways. "
                    f"Let me teach you something to help. With this, you can cleanse water,' he says, teaching you the `purify` spell. "
                    f"'And this... this will let you master its very form,' he adds, teaching you the `freeze` spell. You have learned `purify` and `freeze`!")

        elif isinstance(item, Fish) and self.received_fish:
            return "The fisherman smiles. 'Thank you, but I've already eaten. Save it for yourself!'"
        
        return f"The fisherman looks at the {item.name} curiously but doesn't seem to need it."
