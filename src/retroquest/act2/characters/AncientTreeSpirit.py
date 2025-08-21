from ...engine.Character import Character
from ...engine.GameState import GameState

class AncientTreeSpirit(Character):
    def __init__(self) -> None:
        super().__init__(
            name="ancient tree spirit",
            description=(
                "A magnificent presence that dwells within the silver-barked tree, ancient beyond "
                "measure and wise beyond mortal understanding. The spirit manifests as a shifting "
                "form of bark, leaves, and silver light, with eyes like deep forest pools that have "
                "witnessed the passing of countless seasons. Its voice sounds like wind through "
                "old growth forests, carrying the weight of millennia."
            )
        )
        self.acorn_received = False
        self.forest_speech_taught = False
        self.whispers_quest_given = False

    def talk_to(self, game_state: GameState, player=None) -> str:
        event_msg = f"[event]You approach the [character_name]{self.get_name()}[/character_name] with reverence.[/event]"
        
        # Check if player has enchanted acorn
        has_acorn = game_state.has_item("enchanted acorn")
        
        if not self.acorn_received and has_acorn:
            # First meaningful interaction - receive the acorn
            self.acorn_received = True
            game_state.remove_item_from_inventory("enchanted acorn")
            game_state.set_story_flag("gave_acorn_to_tree_spirit", True)
            
            return (event_msg + "\n" +
                   f"[dialogue]The [character_name]{self.get_name()}[/character_name] stirs as you "
                   f"offer the [item_name]enchanted acorn[/item_name]. The ancient being's form "
                   f"brightens with approval. 'Ah, young one, you bring me a gift of great significance. "
                   f"This acorn carries the essence of new growth, the promise of future forests.'[/dialogue]\n\n"
                   
                   f"[dialogue]'You have shown respect and understanding by bringing this offering. "
                   f"In return, I shall share with you the ancient knowledge of forest speech - the "
                   f"ability to commune with all growing things and understand the voices of tree "
                   f"and beast alike.'[/dialogue]\n\n"
                   
                   f"[success]The tree spirit's wisdom flows into your mind, teaching you the secrets "
                   f"of communication with the natural world. You have learned the [spell_name]Forest Speech[/spell_name] spell![/success]")
        
        elif self.acorn_received and not self.forest_speech_taught:
            # Teach the forest speech spell
            self.forest_speech_taught = True
            from ..spells.ForestSpeechSpell import ForestSpeechSpell
            game_state.learn_spell(ForestSpeechSpell())
            game_state.set_story_flag("learned_forest_speech", True)
            
            # Also provide the items (Silver Leaves and Druidic Focus)
            from ..items.SilverLeaves import SilverLeaves
            from ..items.DruidicFocus import DruidicFocus
            
            game_state.add_item_to_inventory(SilverLeaves())
            game_state.add_item_to_inventory(DruidicFocus())
            
            return (f"[success]The ancient magic settles into your consciousness. You now understand "
                   f"the language of leaves and bark, the songs of birds and the whispered secrets "
                   f"of the wind through branches.[/success]\n\n"
                   
                   f"[dialogue]'Take these gifts as well, young forest friend.' The spirit extends "
                   f"branches laden with shimmering silver leaves and offers a crystalline focus "
                   f"carved from living wood. 'The [item_name]silver leaves[/item_name] will help "
                   f"you commune with plant life, and the [item_name]druidic focus[/item_name] will "
                   f"amplify your natural magic.'[/dialogue]\n\n"
                   
                   f"[event]You receive [item_name]silver leaves[/item_name] and [item_name]druidic focus[/item_name]![/event]")
        
        elif self.forest_speech_taught and not self.whispers_quest_given:
            # Give the Whispers in the Wind quest
            self.whispers_quest_given = True
            game_state.set_story_flag("whispers_in_wind_offered", True)
            
            return (event_msg + "\n" +
                   f"[dialogue]The [character_name]{self.get_name()}[/character_name] regards you "
                   f"with ancient, knowing eyes. 'Now that you can speak with the forest, there "
                   f"is another service you could provide. The balance of this grove has been "
                   f"disturbed by creatures in distress.'[/dialogue]\n\n"
                   
                   f"[dialogue]'Use your newfound abilities to help the forest creatures who dwell "
                   f"here. Listen to their troubles, ease their burdens, and restore harmony to "
                   f"this sacred place. When you have shown that you truly understand the ways "
                   f"of the forest, return to me.'[/dialogue]\n\n"
                   
                   f"[quest_offered]Quest Offered: Whispers in the Wind[/quest_offered]")
        
        elif not has_acorn and not self.acorn_received:
            # Player hasn't brought the acorn yet
            return (event_msg + "\n" +
                   f"[dialogue]The [character_name]{self.get_name()}[/character_name] acknowledges "
                   f"your presence with a slow, measured gaze. 'Welcome, young seeker, to my ancient "
                   f"domain. You show proper reverence, which speaks well of your character.'[/dialogue]\n\n"
                   
                   f"[dialogue]'However, respect alone does not earn the deepest wisdom of the forest. "
                   f"If you would learn the ancient ways, you must first demonstrate your understanding "
                   f"of forest customs. Bring me a gift that shows your connection to the natural world, "
                   f"and I will consider sharing my knowledge with you.'[/dialogue]")
        
        else:
            # General conversation after all interactions
            return (event_msg + "\n" +
                   f"[dialogue]The [character_name]{self.get_name()}[/character_name] rustles gently "
                   f"in a breeze that touches only its silver branches. 'You have learned much, "
                   f"young forest friend. Use your knowledge wisely, and remember that the greatest "
                   f"magic comes from understanding the connections between all living things.'[/dialogue]")

    def give_item(self, game_state: GameState, item_object) -> str:
        """Handle giving items to the Ancient Tree Spirit."""
        if item_object.get_name().lower() == "enchanted acorn":
            if self.acorn_received:
                return f"[dialogue]The [character_name]{self.get_name()}[/character_name] gently refuses. 'You have already offered me the sacred acorn, young one. One gift of such significance is enough.'[/dialogue]"
            
            # Accept the acorn
            self.acorn_received = True
            game_state.inventory.remove(item_object)  # Remove from player's inventory
            game_state.set_story_flag("enchanted_acorn_given", True)
            game_state.set_story_flag("ancient_tree_spirit_met", True)
            
            # Teach forest speech spell immediately 
            if not self.forest_speech_taught:
                self.forest_speech_taught = True
                from ..spells.ForestSpeechSpell import ForestSpeechSpell
                game_state.learn_spell(ForestSpeechSpell())
                game_state.set_story_flag("forest_speech_learned", True)
                
                # Also provide the items (Silver Leaves and Druidic Focus) 
                from ..items.SilverLeaves import SilverLeaves
                from ..items.DruidicFocus import DruidicFocus
                
                # Add items to the room for the player to pick up
                game_state.current_room.items.append(SilverLeaves())
                game_state.current_room.items.append(DruidicFocus())
            
            return (f"[quest_progress]You approach the base of the great silver tree and reverently offer the "
                   f"[item_name]enchanted acorn[/item_name]. The [character_name]{self.get_name()}[/character_name] "
                   f"accepts your gift with great solemnity.[/quest_progress]\n\n"
                   
                   f"[dialogue]'Ah, young one, you bring me a gift of great significance. This acorn carries "
                   f"the essence of new growth, the promise of future forests. You have shown respect and "
                   f"understanding by bringing this offering.'[/dialogue]\n\n"
                   
                   f"[dialogue]'In return, I shall share with you the ancient knowledge of forest speech - "
                   f"the ability to commune with all growing things and understand the voices of tree and "
                   f"beast alike.'[/dialogue]\n\n"
                   
                   f"[success]The tree spirit's wisdom flows into your mind, teaching you the secrets of "
                   f"communication with the natural world. You have learned the [spell_name]Forest Speech[/spell_name] spell![/success]\n\n"
                   
                   f"[dialogue]'Take these gifts as well, young forest friend.' The spirit causes silver leaves "
                   f"to fall at your feet and manifests a druidic focus of living wood. 'These will aid you "
                   f"in your forest communion.'[/dialogue]")
        else:
            # Default response for other items
            return (f"[dialogue]The [character_name]{self.get_name()}[/character_name] regards the "
                   f"[item_name]{item_object.get_name()}[/item_name] with ancient wisdom. 'This is not "
                   f"what I seek, young one. The forest calls for a more sacred offering.'[/dialogue]")

    def examine(self, game_state: GameState) -> str:
        return (f"[event]You study the [character_name]{self.get_name()}[/character_name] in wonder. "
               f"{self.description} The silver bark seems to contain swirling galaxies of light, "
               f"and you can sense the vast network of roots that connect this ancient being to "
               f"every living thing in the forest. This is truly one of the oldest and most "
               f"powerful guardians of the natural world.[/event]")
