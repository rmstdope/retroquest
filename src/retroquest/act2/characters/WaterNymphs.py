from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act2StoryFlags import (
    FLAG_WATER_NYMPH_RIDDLES_COMPLETED,
    FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED
)

class WaterNymphs(Character):
    def __init__(self) -> None:
        super().__init__(
            name="water nymphs",
            description=(
                "Graceful ethereal beings who dwell in the sacred waters of the "
                "Whispering Glade. Their forms seem to be made of living water and "
                "moonlight, constantly shifting between transparency and solidity. "
                "Their voices sound like the gentle babbling of streams mixed with "
                "wind chimes, and their eyes hold the wisdom of countless seasons. "
                "These ancient guardians are known to test visitors with riddles "
                "that reveal the true depth of one's connection to the natural world."
            )
        )
        self.riddles_completed = False
        self.current_riddle = 0
        self.riddles = [
            {
                "question": "I grow without soil, reach without roots, and sing without voice. The older I become, the more rings I show. What am I?",
                "answer": "tree",
                "explanation": "A tree grows from earth but reaches toward sky, sings in the wind, and shows age through rings."
            },
            {
                "question": "I am the forest's blood that flows without wound, the sky's gift that falls without being thrown. I give life yet can take it, am soft yet can carve stone. What am I?",
                "answer": "water",
                "explanation": "Water is the lifeblood of the forest, falls as rain, nurtures life but can flood, and over time carves through stone."
            },
            {
                "question": "We are many yet one, small yet mighty, busy yet patient. We build without hands, work without rest, and turn death into life. What are we?",
                "answer": "insects",
                "explanation": "Insects work as colonies, build complex structures, decompose matter, and are essential to the forest ecosystem."
            }
        ]

    def talk_to(self, game_state: GameState) -> str:
        event_msg = f"[event]You approach the [character_name]{self.get_name()}[/character_name] by the sacred stream.[/event]"
        
        if self.riddles_completed:
            # After completing all riddles
            return (event_msg + "\n" +
                    f"[dialogue]The [character_name]{self.get_name()}[/character_name] shimmer "
                    f"with approval. 'You have proven your wisdom and understanding of the "
                    f"forest's ways, young seeker. The sacred gifts are yours to take - "
                    f"the crystal-clear water and moonflowers that grow here. Use them "
                    f"wisely in your quest to protect the natural world.'[/dialogue]")
        
        elif self.current_riddle < len(self.riddles):
            # Present the current riddle
            riddle = self.riddles[self.current_riddle]
            return (event_msg + "\n" +
                    f"[dialogue]The [character_name]{self.get_name()}[/character_name] speak in "
                    f"harmonious, flowing voices like water over stones. 'Welcome, forest walker, "
                    f"to our sacred glade. To prove your wisdom and earn our trust, you must "
                    f"answer our riddles three. Listen carefully to the {self.current_riddle + 1} riddle:'[/dialogue]\n\n"
                    
                    f"[dialogue]'{riddle['question']}'[/dialogue]\n\n"
                    
                    f"[info]Think carefully and speak your answer when you believe you know it. "
                    f"Use the command 'say [your answer] to water nymphs' to give your solution.[/info]")
        else:
            # This shouldn't happen, but just in case
            return (event_msg + "\n" +
                    f"[dialogue]The [character_name]{self.get_name()}[/character_name] smile "
                    f"mysteriously. 'The riddles have been answered, young one.'[/dialogue]")

    def say_to(self, word: str, game_state: GameState) -> str:
        """
        Handle words said to the water nymphs, specifically riddle answers.
        Overrides the default say_to method from Character.
        """
        if self.riddles_completed:
            return f"[info]The [character_name]{self.get_name()}[/character_name] have already accepted your wisdom. They listen to your words '{word}' with gentle understanding but have no more riddles for you.[/info]"
        
        if self.current_riddle >= len(self.riddles):
            return f"[error]There are no more riddles to answer.[/error]"
        
        riddle = self.riddles[self.current_riddle]
        word_lower = word.lower().strip()
        
        if word_lower == riddle["answer"]:
            # Correct answer
            self.current_riddle += 1
            
            # Set individual riddle completion flags
            game_state.set_story_flag(f"water_nymph_riddle_{self.current_riddle}_completed", True)
            
            if self.current_riddle >= len(self.riddles):
                # All riddles completed
                self.riddles_completed = True
                game_state.set_story_flag(FLAG_WATER_NYMPH_RIDDLES_COMPLETED, True)
                game_state.set_story_flag(FLAG_FOREST_GUARDIANS_RIDDLES_COMPLETED, True)
                
                # Add the items to the room for the player to take
                from ..items.CrystalClearWater import CrystalClearWater
                from ..items.Moonflowers import Moonflowers
                
                game_state.current_room.items.append(CrystalClearWater())
                game_state.current_room.items.append(Moonflowers())
                
                return (f"[success]Correct! '{word}' is indeed the answer. {riddle['explanation']}[/success]\n\n"
                        f"[dialogue]The [character_name]{self.get_name()}[/character_name] sing "
                        f"in harmonious delight. 'Wisely spoken, all three riddles answered! You have "
                        f"proven your deep understanding of the forest's mysteries. Accept our "
                        f"gifts - the crystal-clear water and moonflowers that grow in this "
                        f"sacred place. May they serve you well in your noble quest.'[/dialogue]\n\n"
                        
                        f"[quest_completed]Quest Completed: The Forest Guardian's Riddles[/quest_completed]\n\n"
                        
                        f"[info]The water nymphs gesture toward the stream and flowers, making "
                        f"them accessible for you to take.[/info]")
            else:
                # More riddles remain
                next_riddle = self.riddles[self.current_riddle]
                return (f"[success]Correct! '{word}' is the right answer. {riddle['explanation']}[/success]\n\n"
                        f"[dialogue]The [character_name]{self.get_name()}[/character_name] nod "
                        f"approvingly. 'Well spoken! Now for the {self.current_riddle + 1} riddle:'[/dialogue]\n\n"
                        
                        f"[dialogue]'{next_riddle['question']}'[/dialogue]")
        else:
            # Incorrect answer
            return (f"[failure]The [character_name]{self.get_name()}[/character_name] shake "
                    f"their heads gently as you say '{word}'. 'Not quite, young seeker. Think more deeply about "
                    f"the forest and its ways. The answer lies in understanding the natural "
                    f"world around you.'[/failure]\n\n"
                    
                    f"[dialogue]'{riddle['question']}'[/dialogue]\n\n"
                    
                    f"[info]Consider what you've learned about the forest during your journey.[/info]")

    def examine(self, game_state: GameState) -> str:
        return (f"[event]You study the [character_name]{self.get_name()}[/character_name] in wonder. "
                f"{self.description} They move with fluid grace, and you can see the wisdom "
                f"of ages in their ever-changing features. These are ancient guardians of "
                f"the forest's deepest secrets.[/event]")
