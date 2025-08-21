from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
    FLAG_HEALERS_APPRENTICE_ACCEPTED, 
    FLAG_HEALERS_APPRENTICE_COMPLETED,
    FLAG_LYRIA_RELATIONSHIP_STUDENT,
    FLAG_LYRIA_RELATIONSHIP_COLLEAGUE
)

class MasterHealerLyria(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Master Healer Lyria",
            description=(
                "A wise and nurturing healer with graying hair and gentle eyes that seem to see right through to your "
                "magical potential. She wears simple robes adorned with healing herbs, and her hands are steady from "
                "years of tending to the sick and wounded. There's an aura of calm competence about her that inspires "
                "confidence in her abilities."
            ),
        )

    def talk_to(self, game_state: GameState) -> str:
        # Check if player has healing herbs to give
        has_healing_herbs = game_state.has_item("Healing Herbs")
        
        if not game_state.get_story_flag(FLAG_HEALERS_APPRENTICE_ACCEPTED):
            if has_healing_herbs:
                # First set the accepted flag to trigger the quest
                game_state.set_story_flag(FLAG_HEALERS_APPRENTICE_ACCEPTED, True)
                game_state.set_story_flag(FLAG_LYRIA_RELATIONSHIP_STUDENT, True)
                return ("[success][character_name]Master Healer Lyria[/character_name] recognizes your magical potential "
                        "and says: 'I can see you have a natural gift for healing magic. If you're willing to give me "
                        "those [item_name]Healing Herbs[/item_name] as proof of your commitment to the healing arts, "
                        "I will teach you advanced techniques.' She gestures to her collection of healing supplies. "
                        "'Speak to me again when you're ready to begin your training.'[/success]")
            else:
                return ("[character_name]Master Healer Lyria[/character_name]: Welcome to my house of healing. I can "
                        "sense magical potential in you, but I will need to see your commitment to the healing arts. "
                        "Bring me some [item_name]Healing Herbs[/item_name] and I will teach you advanced techniques.")
        
        elif game_state.get_story_flag(FLAG_HEALERS_APPRENTICE_ACCEPTED) and not game_state.get_story_flag(FLAG_HEALERS_APPRENTICE_COMPLETED):
            if has_healing_herbs:
                # Remove healing herbs from inventory as they're given to Lyria
                game_state.remove_item_from_inventory("Healing Herbs")
                
                # Learn greater_heal spell
                from ..spells.GreaterHealSpell import GreaterHealSpell
                game_state.learn_spell(GreaterHealSpell())
                
                # Add Advanced Healing Potion to room for player to take
                from ..items.AdvancedHealingPotion import AdvancedHealingPotion
                game_state.current_room.add_item(AdvancedHealingPotion())
                
                # Complete the quest
                game_state.set_story_flag(FLAG_HEALERS_APPRENTICE_COMPLETED, True)
                
                return ("[success][character_name]Master Healer Lyria[/character_name] accepts the "
                        "[item_name]Healing Herbs[/item_name] with approval. 'Excellent! Your commitment shows you're "
                        "ready to learn.' Through careful instruction, you master the [spell_name]greater_heal[/spell_name] "
                        "spell! She also gives you an [item_name]Advanced Healing Potion[/item_name] for emergencies. "
                        "'Use this knowledge wisely, young healer. You've successfully completed your apprenticeship.'[/success]")
            else:
                return ("[character_name]Master Healer Lyria[/character_name]: I'm ready to teach you, but I still "
                        "need you to bring me those [item_name]Healing Herbs[/item_name] as proof of your commitment "
                        "to the healing arts.")
        
        elif game_state.get_story_flag(FLAG_HEALERS_APPRENTICE_COMPLETED):
            # Check if emergency healing was completed
            if game_state.get_story_flag("emergency_healing_completed"):
                if not game_state.get_story_flag(FLAG_LYRIA_RELATIONSHIP_COLLEAGUE):
                    game_state.set_story_flag(FLAG_LYRIA_RELATIONSHIP_COLLEAGUE, True)
                    return ("[success][character_name]Master Healer Lyria[/character_name] beams with pride. "
                           "'I saw how you used the [item_name]advanced healing potion[/item_name] just now. "
                           "Your technique was flawless—you've truly mastered the art of emergency healing under "
                           "pressure. You are no longer just my apprentice, but a colleague in the healing arts!'[/success]\n\n"
                           "[quest_complete]Quest Complete: The Healer's Apprentice[/quest_complete]")
                else:
                    return ("[character_name]Master Healer Lyria[/character_name]: It's wonderful to see how far you've "
                            "come with your healing abilities. You're truly a master of the healing arts now. "
                            "Continue to use your gifts to help those in need.")
            elif game_state.get_story_flag(FLAG_LYRIA_RELATIONSHIP_COLLEAGUE):
                return ("[character_name]Master Healer Lyria[/character_name]: It's wonderful to see how far you've "
                        "come with your healing abilities. You're truly becoming a master of the healing arts. "
                        "Continue to use your gifts to help those in need.")
            else:
                return ("[character_name]Master Healer Lyria[/character_name]: I'm proud of your progress with the "
                        "[spell_name]greater_heal[/spell_name] spell. Remember that healing magic requires both "
                        "knowledge and compassion. Continue to develop both aspects of your abilities.")
        
        else:
            return ("[character_name]Master Healer Lyria[/character_name]: I'm looking forward to teaching you "
                    "advanced healing techniques. Please bring me those [item_name]Healing Herbs[/item_name] so "
                    "we can begin your training.")