from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
    FLAG_WHISPERS_IN_WIND_COMPLETED,
    FLAG_GAVE_ACORN_TO_TREE_SPIRIT,
    FLAG_LEARNED_FOREST_SPEECH,
    FLAG_WHISPERS_IN_WIND_OFFERED
)

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
        self.whispers_quest_completed = False

    def talk_to(self, game_state: GameState, player=None) -> str:
        event_msg = f"[event]You approach the [character_name]{self.get_name()}[/character_name] with reverence.[/event]"
        
        if not self.acorn_received:
            # Player hasn't brought the acorn yet
            return (event_msg + "\n" +
                    f"[dialogue]The [character_name]{self.get_name()}[/character_name] acknowledges "
                    f"your presence with a slow, measured gaze. 'Welcome, young seeker, to my ancient "
                    f"domain. You show proper reverence, which speaks well of your character.'[/dialogue]\n\n"

                    f"[dialogue]'However, respect alone does not earn the deepest wisdom of the forest. "
                    f"If you would learn the ancient ways, you must first demonstrate your understanding "
                    f"of forest customs. Bring me a gift that shows your connection to the natural world, "
                    f"and I will consider sharing my knowledge with you.'[/dialogue]")
        
        elif not game_state.get_story_flag(FLAG_WHISPERS_IN_WIND_COMPLETED):
            # Player has given the acorn but hasn't completed the Whispers in the Wind quest yet
            return (event_msg + "\n" +
                    f"[dialogue]The [character_name]{self.get_name()}[/character_name] senses your "
                    f"presence and turns its ancient gaze upon you. 'Ah, young forest friend, you "
                    f"return to me. I sense you have been learning to use the gift of forest speech, "
                    f"but your task is not yet complete.'[/dialogue]\n\n"

                    f"[dialogue]'Remember what I asked of you - to restore harmony to this sacred "
                    f"grove by helping the creatures in distress. The water nymphs of the Whispering "
                    f"Glade to the north hold ancient wisdom and sacred gifts, but they will only "
                    f"share them with those who prove their understanding through their trials.'[/dialogue]\n\n"

                    f"[dialogue]'Seek them out, young one. Answer their challenges, earn their trust, "
                    f"and gather what they offer. Only when you have shown that you truly comprehend "
                    f"the interconnected nature of all forest life will your quest be complete. Return "
                    f"to me when you carry both crystal-clear water and moonflowers - the symbols of "
                    f"their acceptance.'[/dialogue]")
        
        else:
            # General conversation after all interactions
            return (event_msg + "\n" +
                    f"[dialogue]The [character_name]{self.get_name()}[/character_name] rustles gently "
                    f"in a breeze that touches only its silver branches. 'You have learned much, "
                    f"young forest friend. Use your knowledge wisely, and remember that the greatest "
                    f"magic comes from understanding the connections between all living things.'[/dialogue]")

    def give_item(self, game_state: GameState, item_object) -> str:
        """Handle giving items to the Ancient Tree Spirit."""
        event_msg = f"[event]You offer the [item_name]{item_object.get_name()}[/item_name] to the [character_name]{self.get_name()}[/character_name].[/event]"
        
        if item_object.get_name().lower() == "enchanted acorn":
            if self.acorn_received:
                return f"[dialogue]The [character_name]{self.get_name()}[/character_name] gently refuses. 'You have already offered me the sacred acorn, young one. One gift of such significance is enough.'[/dialogue]"
            
            # First meaningful interaction - receive the acorn
            self.acorn_received = True
            game_state.remove_item_from_inventory("enchanted acorn")
            game_state.set_story_flag(FLAG_GAVE_ACORN_TO_TREE_SPIRIT, True)
            
                        # Teach the forest speech spell
            from ..spells.ForestSpeechSpell import ForestSpeechSpell
            game_state.learn_spell(ForestSpeechSpell())
            game_state.set_story_flag(FLAG_LEARNED_FOREST_SPEECH, True)

            # Give the Whispers in the Wind quest
            game_state.set_story_flag(FLAG_WHISPERS_IN_WIND_OFFERED, True)

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
                    f"of communication with the natural world.\n\n"

                    f"You have learned the [spell_name]Forest Speech[/spell_name] spell![/success]\n\n"

                    f"[dialogue]The [character_name]{self.get_name()}[/character_name] regards you "
                    f"with ancient, knowing eyes. 'Now that you can speak with the forest, there "
                    f"is another service you could provide. The balance of this grove has been "
                    f"disturbed by creatures in distress.'[/dialogue]\n\n"

                    f"[dialogue]'Use your newfound abilities to help the forest creatures who dwell "
                    f"here. Listen to their troubles, ease their burdens, and restore harmony to "
                    f"this sacred place. When you have shown that you truly understand the ways "
                    f"of the forest, return to me with two gifts the forest has bestowed upon you.'[/dialogue]")

        elif item_object.get_name().lower() in ["crystal-clear water", "moonflowers"]:
            # Check if quest is already completed
            if game_state.get_story_flag(FLAG_WHISPERS_IN_WIND_COMPLETED):
                return f"[dialogue]The [character_name]{self.get_name()}[/character_name] nods approvingly but gently refuses. 'You have already proven yourself, young one. Keep these sacred gifts as tokens of the forest's trust in you.'[/dialogue]"
            
            # Check if player has both required items
            has_water = game_state.has_item("crystal-clear water")
            has_moonflowers = game_state.has_item("moonflowers")
            
            if has_water and has_moonflowers:
                # Complete the quest - player has both items
                game_state.set_story_flag(FLAG_WHISPERS_IN_WIND_COMPLETED, True)
                self.whispers_quest_completed = True
                
                # Remove the moonflowers from inventory since they take root at the silver tree
                game_state.remove_item_from_inventory("moonflowers")
                
                return ("You approach the Ancient Tree Spirit with the sacred items from the "
                        "Whispering Glade - the Crystal-Clear Water and the Moonflowers. At the spirit's gentle "
                        "guidance, you pour some of the crystal-clear water at the base of the silver tree, "
                        "where the moonflowers immediately take root in the blessed soil. The Ancient Tree Spirit's "
                        "voice fills the grove with warmth and approval as the flowers begin to glow with ethereal light.\n\n"
                        
                        "[dialogue]'You have done well, forest wanderer. The water nymphs have tested your wisdom and found "
                        "you worthy. These sacred items - water blessed with purification magic and flowers touched "
                        "by moonlight - are treasures of the forest's heart. You have shown respect for the old ways "
                        "and proven yourself a true friend to the woodland spirits.'[/dialogue]\n\n"
                        
                        "The great tree's bark glows more brightly, and you feel a deep sense of "
                        "accomplishment. The forest itself seems to acknowledge your achievement, and the whispers "
                        "in the wind now carry words of welcome and gratitude.\n\n"
                        
                        "[dialogue]'Your dedication has earned you a great privilege, young seeker. I now open the path to "
                        "the Heart of the Forest - Nyx's sacred home. The way south from here shall be revealed to you.'[/dialogue]\n\n"
                        
                        "The spirit's ancient voice takes on a more serious tone.\n\n"
                        
                        "[dialogue]'However, know this - Nyx dwells between the realms, and to summon the forest sprite to "
                        "this plane of existence, you will need three sacred charms. These powerful tokens must be "
                        "gathered from across the forest realm. Only when you possess all three charms can you "
                        "call upon Nyx and receive the ultimate wisdom you seek.'[/dialogue]")
            else:
                # Player only has one of the required items
                missing_item = "moonflowers" if has_water else "crystal-clear water"
                return (f"[dialogue]The [character_name]{self.get_name()}[/character_name] examines the "
                        f"[item_name]{item_object.get_name()}[/item_name] with approval. 'This is indeed "
                        f"a sacred gift from the water nymphs, young one. However, to complete your task "
                        f"and prove your full understanding of the forest's ways, you must bring me both "
                        f"the crystal-clear water and the moonflowers. Return when you have the "
                        f"[item_name]{missing_item}[/item_name] as well.'[/dialogue]")
        
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
