"""Training Sword (Act II Item)

Narrative Role:
    Proof-of-competence tool enabling the player to demonstrate martial capability to Sir Cedric, advancing
    early Greendale progression and unlocking guidance toward forest preparation objectives.

Key Mechanics / Interactions:
    - Contextual use only meaningful in CastleCourtyard when SirCedric present.
    - On first successful demonstration: sets FLAG_DEMONSTRATED_COMBAT_SKILLS and removes itself from inventory
      (symbolic of the demonstration's completion / no repeated need for proof artifact).
    - Subsequent contextual uses (after flag) provide reinforcing advisory dialogue without re-consuming item (since removed).
    - Generic practice messaging shown if used elsewhere.

Story Flags:
    - Sets: FLAG_DEMONSTRATED_COMBAT_SKILLS (first successful courtyard demo)
    - Reads: FLAG_DEMONSTRATED_COMBAT_SKILLS (to branch first vs. repeat dialogue)

Progression Effects:
    Unlocks Cedric's deeper exposition pointing player toward acquisition of key forest preparation items (survival kit,
    enhanced lantern, rope) guiding transition to wilderness arc.

Design Notes:
    - Removes itself only on first contextual success avoiding inventory clutter.
    - Lazy imports inside use() prevent circular dependencies with character and room modules.
    - Could be extended with a combat mini-tutorial system if combat mechanics later expand.
"""

from ...engine.GameState import GameState
from ...engine.Item import Item
from ..Act2StoryFlags import FLAG_DEMONSTRATED_COMBAT_SKILLS

class TrainingSword(Item):
    def __init__(self) -> None:
        super().__init__(
            name="training sword",
            short_name="sword",
            description="A well-balanced practice sword with a dulled blade. Though not sharp enough for real combat, it's perfect for demonstrating martial skills and training exercises.",
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        from ..characters.SirCedric import SirCedric  # Import here to avoid circular imports
        from ..rooms.CastleCourtyard import CastleCourtyard  # Import here to avoid circular imports
        
        # Check if we're in the Castle Courtyard with Sir Cedric present
        if (isinstance(game_state.current_room, CastleCourtyard) and 
            any(isinstance(char, SirCedric) for char in game_state.current_room.get_characters())):
            
            if not game_state.get_story_flag(FLAG_DEMONSTRATED_COMBAT_SKILLS):
                # First time demonstrating combat skills
                game_state.set_story_flag(FLAG_DEMONSTRATED_COMBAT_SKILLS, True)
                
                # Remove the training sword from inventory after successful demonstration
                game_state.remove_item_from_inventory("training sword")
                
                return ("[success]You draw the training sword and perform a series of combat forms for "
                        "[character_name]Sir Cedric[/character_name]. Your movements are fluid and precise, "
                        "demonstrating skill with both offensive and defensive techniques.\n\n"
                        
                        "Sir Cedric nods approvingly. 'Excellent! Your martial training is evident. I can "
                        "trust someone with such disciplined combat skills.'\n\n"
                        
                        "He pauses, his expression growing more serious. 'Since you've proven your combat "
                        "prowess, I can share more about what lies ahead. The dark forces gathering aren't "
                        "ordinary threats - they're connected to ancient magical energies that have been "
                        "dormant for centuries.'\n\n"
                        
                        "[character_name]Sir Cedric[/character_name] leans closer, lowering his voice. "
                        "'There are legends of a being known as [character_name]Nyx[/character_name] - a "
                        "mystical entity who dwells deep within the enchanted forest beyond our borders. "
                        "Nyx is said to possess knowledge of the oldest magics, including secrets that "
                        "could help us understand and combat these gathering shadows.'\n\n"
                        
                        "'But the enchanted forest is treacherous,' he continues. 'You'll need proper "
                        "supplies before attempting such a journey. Visit the Market District and gather "
                        "essential equipment: a forest survival kit, an enhanced lantern for the dark "
                        "woods, and quality rope for navigating difficult terrain. Only when you're "
                        "properly equipped should you venture into those mystical lands to seek out Nyx.'\n\n"
                        
                        "He straightens up, his voice returning to its commanding tone. 'Time is of the "
                        "essence, Elior. The darkness grows stronger each day, and we need Nyx's ancient "
                        "wisdom to understand what we're truly facing.'[/success]")
                        
            elif game_state.get_story_flag(FLAG_DEMONSTRATED_COMBAT_SKILLS):
                # Subsequent uses after mission explanation
                return ("[success]You practice a few more combat forms with the training sword, and "
                        "[character_name]Sir Cedric[/character_name] watches with approval.\n\n"
                        
                        "'Your skills remain sharp,' he observes. 'Remember what I told you about the "
                        "enchanted forest and seeking out [character_name]Nyx[/character_name]. Gather "
                        "those supplies from the Market District first - a forest survival kit, enhanced "
                        "lantern, and quality rope. The mystical being Nyx holds ancient knowledge that "
                        "could be crucial in our fight against the gathering darkness.'\n\n"
                        
                        "He looks toward the forest beyond the city walls. 'The enchanted forest is "
                        "dangerous, but with proper preparation and your proven combat skills, you may "
                        "succeed where others have failed. Nyx's wisdom could be the key to saving both "
                        "Greendale and the surrounding lands.'[/success]")
            else:
                # Fallback if flags are inconsistent
                return ("[success]You practice combat forms with the training sword. [character_name]Sir Cedric[/character_name] "
                        "nods approvingly at your continued martial discipline.[/success]")
        else:
            return "You practice a few sword forms with the training sword. The balance feels good in your hands, and it would be perfect for demonstrating combat skills to someone who needs proof of your abilities."
