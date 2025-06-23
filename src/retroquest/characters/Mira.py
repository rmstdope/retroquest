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
from ..GameState import GameState

class Mira(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Mira",
            description="The village healer and wise woman, Mira is known for her knowledge of herbs and magic. She guides Elior on his journey."
        )
        self.quest_prepare_for_journey_given = False # This flag is set when flower is given
        self.amulet_given = False
        
        self.dialogue_states = {
            "initial": f"[character.name]{self.get_name()}[/character.name] smiles warmly as you enter her fragrant hut. [dialogue]'Welcome, [character.name]Elior[/character.name]. I sense a stirring of the old powers within you. What brings you to my door?'[/dialogue]",
            "quest_conditions_not_met": f"[character.name]{self.get_name()}[/character.name] looks at you thoughtfully. [dialogue]'You have made progress, [character.name]Elior[/character.name], but you are not yet fully prepared for what lies ahead. Ensure you have all necessary items, learned the essential spells, and received a blessing for your journey.'[/dialogue]",
            "quest_complete_amulet_given": f"[character.name]{self.get_name()}[/character.name] smiles, a deep wisdom in her eyes. [dialogue]'You have done well, [character.name]Elior[/character.name]. You have gathered your supplies, honed your magical skills, and prepared your spirit. You are ready.'[/dialogue] She presents you with the [item.name]Ancient Amulet[/item.name]. [dialogue]'May this guide and protect you.'[/dialogue] [event]([item.name]Ancient Amulet[/item.name] added to inventory!)[/event]",
            "post_amulet": f"[character.name]{self.get_name()}[/character.name] looks at you kindly. [dialogue]'The journey of a thousand miles begins with a single step. You have taken many already. Go now, and may your path be clear.'[/dialogue]"
        }

    def give_item(self, game_state: GameState, item: Item) -> str:
        if isinstance(item, RareFlower):
            game_state.remove_item_from_inventory(item.get_name()) 

            spells_to_teach = [HealSpell(), UnlockSpell(), LightSpell()]
            for spell_instance in spells_to_teach:
                game_state.learn_spell(spell_instance)

            game_state.set_story_flag("magic_fully_unlocked", True) 

            # This is the combined dialogue for receiving flower, teaching spells, and giving quest.
            return (
                "[character.name]Mira[/character.name] smiles, accepting the [item.name]flower[/item.name]. [dialogue]'This bloom,' she says, her voice soft, 'is a testament to your growing bond with the living world, Elior. "
                "It shows you are ready to truly channel the energies around us.'[/dialogue] She then guides you through ancient words and gestures, awakening your innate abilities. "
                "[event]You feel a new understanding dawn as she imparts the knowledge of [spell.name]heal[/spell.name] to mend, [spell.name]unlock[/spell.name] to reveal, and [spell.name]light[/spell.name] to illuminate the path.[/event] "
                "[dialogue]'The spark was always within you,'[/dialogue] [character.name]Mira[/character.name] explains, [dialogue]'but now, you can truly command these magics.'[/dialogue] "
                "With your newfound power, she tasks you with preparing for the journey ahead, mentioning that the [item.name]Ancient Amulet[/item.name] will be yours "
                "once you are truly ready. She tells you that you will need:\n"
                "- Warm clothing\n"
                "- Magical protection\n"
                "- Food for the road\n"
                "- Sturdy footwear\n"
                "- A [item.name]map[/item.name] to find your way\n"
                "- To have learned all the basic magic the village elders can teach you."
            )
        return f"[character.name]Mira[/character.name] looks at the [item.name]{item.name}[/item.name] but shakes her head gently. [dialogue]'I have no need for this, child.'[/dialogue]"

    def talk_to(self, game_state: GameState) -> str:
        event_msg = f"[event]You speak with [character.name]Mira[/character.name].[/event]"
        # 1. Give the post_amulet message if amulet is in inventory
        if game_state.has_item("Ancient Amulet"):
            return event_msg + "\n" + self.dialogue_states["post_amulet"]

        # 2. Give the initial message if the story flag 'magic_fully_unlocked' is not set 
        #    (i.e., flower hasn't been given yet)
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return event_msg + "\n" + self.dialogue_states["initial"]
        
        # 3. If 'magic_fully_unlocked' is set (flower given) and player doesn't have amulet:
        #    Quest is active or completable.
        if game_state.get_quest("Preparing for the Road").check_completion(game_state):
            # Conditions are fulfilled: give amulet and quest_complete_amulet_given message
            game_state.add_item_to_inventory(AncientAmulet())
            self.amulet_given = True 
            return event_msg + "\n" + self.dialogue_states["quest_complete_amulet_given"]
        else:
            # Conditions not fulfilled: give quest_conditions_not_met message
            return event_msg + "\n" + self.dialogue_states["quest_conditions_not_met"]
