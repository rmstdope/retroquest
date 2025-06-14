from .Character import Character
from ..items.Item import Item
from ..items.RareFlower import RareFlower
from ..items.AncientAmulet import AncientAmulet
from ..items.TravelCloak import TravelCloak # For quest check
from ..items.WildBerries import WildBerries # For quest check
from ..items.WanderingBoots import WanderingBoots # For quest check
from ..items.Map import Map as GameMap # For quest check, aliased to avoid conflict if Map is a general type
from ..spells.HealSpell import HealSpell
from ..spells.UnlockSpell import UnlockSpell
from ..spells.LightSpell import LightSpell
# Spells for quest check (names will be used)
# ReviveSpell, PurifySpell, BlessSpell, GrowSpell

class Mira(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Mira",
            description="The village healer and wise woman, Mira is known for her knowledge of herbs and magic. She guides Elior on his journey."
        )
        self.received_rare_flower = False
        self.quest_prepare_for_journey_given = False
        self.amulet_given = False
        
        self.dialogue_states = {
            "initial": "Mira smiles warmly as you enter her fragrant hut. \\'Welcome, Elior. I sense a stirring of the old powers within you. What brings you to my door?\\'",
            "flower_received_quest_pending": "Mira accepts the flower, her eyes twinkling. \\'A beautiful bloom, a sign of your connection to the living world. Speak with me again; I have much to discuss with you about your path.\\'",
            "quest_dialogue_teach_spells": "Pleased with your progress and the offering, Mira teaches you the `heal` spell for mending wounds, the `unlock` spell for revealing secrets, and the `light` spell to illuminate darkness. (Spells `heal`, `unlock`, `light` learned!)",
            "give_quest_details": "Mira then tasks you with preparing for the journey ahead. \\'The Ancient Amulet will be yours once you are truly ready. You must gather: warm clothing (like a `travel cloak`), food for the road (like `wild berries`), sturdy footwear (perhaps `wandering boots`), and a `map`. You must also learn all the basic magic our village elders can teach, and seek a `bless`ing for your travels before you return to me.\\'",
            "quest_active": "Mira nods encouragingly. \\'Continue your preparations, Elior. The path ahead requires readiness of body, mind, and spirit.\\'",
            "quest_conditions_not_met": "Mira looks at you thoughtfully. \\'You have made progress, Elior, but you are not yet fully prepared for what lies ahead. Ensure you have all necessary items, learned the essential spells, and received a blessing for your journey.\\'",
            "quest_complete_amulet_given": "Mira smiles, a deep wisdom in her eyes. \\'You have done well, Elior. You have gathered your supplies, honed your magical skills, and prepared your spirit. You are ready.\\' She presents you with the Ancient Amulet. \\'May this guide and protect you.\\' (Ancient Amulet added to inventory!)",
            "post_amulet": "Mira looks at you kindly. \\'The journey of a thousand miles begins with a single step. You have taken many already. Go now, and may your path be clear.\\'"
        }
        self.current_dialogue_key = "initial"

    def _check_quest_conditions(self, player, game_state) -> bool:
        # Items
        has_travel_cloak = player.has_item("Travel Cloak")
        has_wild_berries = player.has_item("Wild Berries")
        has_wandering_boots = player.has_item("Wandering Boots")
        has_map = player.has_item("Map")
        
        # Spells (Mira teaches heal, unlock, light, so check for others + those)
        required_spells = ["Revive", "Purify", "Bless", "Heal", "Unlock", "Light", "Grow"]
        knows_all_spells = all(player.has_spell(spell_name) for spell_name in required_spells)
        
        # Action: Bless cast for journey
        journey_bless_completed = game_state.get_story_flag("journey_bless_completed")

        return (has_travel_cloak and has_wild_berries and has_wandering_boots and has_map and
                knows_all_spells and journey_bless_completed)

    def talk_to(self, game_state, player) -> str:
        if self.amulet_given:
            self.current_dialogue_key = "post_amulet"
            return self.dialogue_states["post_amulet"]

        if self.quest_prepare_for_journey_given:
            if self._check_quest_conditions(player, game_state):
                player.add_item_to_inventory(AncientAmulet())
                self.amulet_given = True
                game_state.add_event("Received Ancient Amulet from Mira.")
                self.current_dialogue_key = "quest_complete_amulet_given"
                return self.dialogue_states["quest_complete_amulet_given"]
            else:
                self.current_dialogue_key = "quest_conditions_not_met"
                return self.dialogue_states["quest_conditions_not_met"]

        if self.received_rare_flower and not self.quest_prepare_for_journey_given:
            # Teach spells
            spells_to_teach = [HealSpell(), UnlockSpell(), LightSpell()]
            learned_spells_messages = []
            for spell in spells_to_teach:
                if not player.has_spell(spell.name):
                    player.learn_spell(spell)
                    learned_spells_messages.append(f"`{spell.name}`")
            
            spell_dialogue = self.dialogue_states["quest_dialogue_teach_spells"]
            if not learned_spells_messages: # Already knew them somehow
                spell_dialogue = "Mira sees you are already familiar with the magics of healing, unlocking, and light."
            
            self.quest_prepare_for_journey_given = True
            game_state.set_story_flag("mira_quest_started", True) # Flag for other systems if needed
            self.current_dialogue_key = "quest_active" 
            # Combine spell teaching and quest details
            full_response = f"{spell_dialogue} {self.dialogue_states['give_quest_details']}"
            game_state.add_event("Mira taught spells and gave the 'Prepare for the Journey' quest.")
            return full_response
        
        if self.current_dialogue_key == "flower_received_quest_pending":
             # This state implies they gave flower, now talking. Transition to quest giving.
             # This case is now handled by the block above (self.received_rare_flower and not self.quest_prepare_for_journey_given)
             # So, if we reach here, it's likely a repeat talk before quest is given but after flower.
             # The logic above should catch it. If not, this is a fallback.
            return "Mira smiles. \\'Speak with me again when you are ready to discuss your path, Elior.\\'"


        # Default initial dialogue
        return self.dialogue_states[self.current_dialogue_key]

    def give_item(self, item: Item, game_state, player) -> str:
        if isinstance(item, RareFlower) and not self.received_rare_flower:
            self.received_rare_flower = True
            player.remove_item_from_inventory(item.name) # Assuming item is consumed or kept by Mira
            game_state.add_event(f"Gave {item.name} to Mira.")
            self.current_dialogue_key = "flower_received_quest_pending"
            return self.dialogue_states["flower_received_quest_pending"]
        
        elif isinstance(item, RareFlower) and self.received_rare_flower:
            return "Mira smiles. \\'You are kind to bring another, but one was sufficient for now.\\'"

        return f"Mira looks at the {item.name} with a gentle smile. \\'Thank you, Elior, but this is not what I need right now.\\'"

# Ensure GameState has get_story_flag, set_story_flag, add_event
# Ensure Player has has_item, add_item_to_inventory, remove_item_from_inventory, learn_spell, has_spell
