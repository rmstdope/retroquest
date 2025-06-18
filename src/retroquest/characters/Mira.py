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
            "initial": f"[dialogue][character.name]{self.get_name()}[/character.name] smiles warmly as you enter her fragrant hut. 'Welcome, [character.name]Elior[/character.name]. I sense a stirring of the old powers within you. What brings you to my door?'[/dialogue]",
            "quest_conditions_not_met": f"[dialogue][character.name]{self.get_name()}[/character.name] looks at you thoughtfully. 'You have made progress, [character.name]Elior[/character.name], but you are not yet fully prepared for what lies ahead. Ensure you have all necessary items, learned the essential spells, and received a blessing for your journey.'[/dialogue]",
            "quest_complete_amulet_given": f"[dialogue][character.name]{self.get_name()}[/character.name] smiles, a deep wisdom in her eyes. 'You have done well, [character.name]Elior[/character.name]. You have gathered your supplies, honed your magical skills, and prepared your spirit. You are ready.'[/dialogue] She presents you with the [item.name]Ancient Amulet[/item.name]. [dialogue]'May this guide and protect you.'[/dialogue] [event]([item.name]Ancient Amulet[/item.name] added to inventory!)[/event]",
            "post_amulet": f"[dialogue][character.name]{self.get_name()}[/character.name] looks at you kindly. 'The journey of a thousand miles begins with a single step. You have taken many already. Go now, and may your path be clear.'[/dialogue]"
        }

    def _check_quest_conditions(self, game_state: GameState) -> bool:
        # Items
        has_travel_cloak = game_state.has_item("travel cloak")
        # Food items
        has_wild_berries = game_state.has_item("wild berries")
        has_apple = game_state.has_item("apple")
        has_egg = game_state.has_item("egg")
        has_carrot = game_state.has_item("fresh carrot")
        all_food_collected = has_wild_berries and has_apple and has_egg and has_carrot

        has_wandering_boots = game_state.has_item("wandering boots")
        has_map = game_state.has_item("map")

        # Spells
        required_spells = ["revive", "purify", "bless", "heal", "unlock", "light", "grow"]
        knows_all_spells = all(game_state.has_spell(spell_name) for spell_name in required_spells)
        
        # Action: Bless cast for journey (assuming this flag is set elsewhere when player casts bless on self)
        journey_bless_completed = game_state.get_story_flag("journey_bless_completed")

        return (has_travel_cloak and all_food_collected and has_wandering_boots and has_map and
                knows_all_spells and journey_bless_completed)

    def give_item(self, game_state: GameState, item: Item) -> str:
        if isinstance(item, RareFlower):
            game_state.remove_item_from_inventory(item.get_name()) 

            spells_to_teach = [HealSpell(), UnlockSpell(), LightSpell()]
            for spell_instance in spells_to_teach:
                game_state.learn_spell(spell_instance)

            game_state.set_story_flag("magic_fully_unlocked", True) 

            # This is the combined dialogue for receiving flower, teaching spells, and giving quest.
            return (
                "[dialogue][character.name]Mira[/character.name] smiles, accepting the [item.name]flower[/item.name]. 'This bloom,' she says, her voice soft, 'is a testament to your growing bond with the living world, Elior. "
                "It shows you are ready to truly channel the energies around us.'[/dialogue] She then guides you through ancient words and gestures, awakening your innate abilities. "
                "[event]You feel a new understanding dawn as she imparts the knowledge of [spell.name]heal[/spell.name] to mend, [spell.name]unlock[/spell.name] to reveal, and [spell.name]light[/spell.name] to illuminate the path.[/event] "
                "[dialogue]'The spark was always within you,' [character.name]Mira[/character.name] explains, 'but now, you can truly command these magics.' "
                "With your newfound power, she tasks you with preparing for the journey ahead, mentioning that the [item.name]Ancient Amulet[/item.name] will be yours "
                "once you are truly ready. She tells you she needs:\n"
                "- Warm clothing (like a [item.name]travel cloak[/item.name])\n"
                "- Magical protection (cast [spell.name]bless[/spell.name] on yourself)\n"
                "- Food for the road (like [item.name]wild berries[/item.name], [item.name]apple[/item.name], [item.name]egg[/item.name])\n"
                "- Sturdy footwear (perhaps [item.name]wandering boots[/item.name])\n"
                "- A [item.name]map[/item.name] to find your way\n"
                "- To have learned all the basic magic the village elders can teach you.[/dialogue]"
            )
        return f"[dialogue][character.name]Mira[/character.name] looks at the [item.name]{item.name}[/item.name] but shakes her head gently. 'I have no need for this, child.'[/dialogue]"

    def talk_to(self, game_state: GameState) -> str:
        # 1. Give the post_amulet message if amulet is in inventory
        if game_state.has_item("Ancient Amulet"):
            return self.dialogue_states["post_amulet"]

        # 2. Give the initial message if the story flag 'magic_fully_unlocked' is not set 
        #    (i.e., flower hasn't been given yet)
        if not game_state.get_story_flag("magic_fully_unlocked"):
            return self.dialogue_states["initial"]
        
        # 3. If 'magic_fully_unlocked' is set (flower given) and player doesn't have amulet:
        #    Quest is active or completable.
        if self._check_quest_conditions(game_state):
            # Conditions are fulfilled: give amulet and quest_complete_amulet_given message
            game_state.add_item_to_inventory(AncientAmulet())
            self.amulet_given = True 
            return self.dialogue_states["quest_complete_amulet_given"]
        else:
            # Conditions not fulfilled: give quest_conditions_not_met message
            return self.dialogue_states["quest_conditions_not_met"]
