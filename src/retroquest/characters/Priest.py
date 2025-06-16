from .Character import Character
from ..items.Item import Item # Added
from ..items.HiddenLocket import HiddenLocket # Added
from ..spells.BlessSpell import BlessSpell # Added
from ..GameState import GameState

class Priest(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Priest",
            description="A kindly priest who tends the chapel, offering blessings and sharing the lore of Eldoria."
        )
        self.shown_locket = False
        self.dialogue_states = {
            "initial": "The priest offers a serene smile. 'Welcome, child. The chapel is a sanctuary for all who seek peace. The shadows in our land grow long, but faith can be a guiding light.'",
            "shown_locket_and_taught_bless": "The priest nods gravely. 'That locket... it is a relic of the village founders. It speaks of your connection to this place and its history. May this blessing protect you on your path.'",
            "after_bless": "The priest smiles. 'Remember the words of the blessing, child. Carry its light with you.'"
        }
        self.current_dialogue_key = "initial"

    def talk_to(self, game_state: GameState) -> str:
        game_state.set_story_flag("priest_talked_to", True) # Set the story flag
        return self.dialogue_states[self.current_dialogue_key]

    def give_item(self, item: Item, game_state: GameState) -> str:
        if isinstance(item, HiddenLocket) and not self.shown_locket:
            self.shown_locket = True
            # The locket is not consumed, just shown
            bless_spell = BlessSpell()
            if not game_state.has_spell(bless_spell.name):
                game_state.learn_spell(bless_spell)
            
            self.current_dialogue_key = "shown_locket_and_taught_bless"
            return (f"You show the {item.name} to the Priest. {self.dialogue_states['shown_locket_and_taught_bless']} "
                    f"He recognizes it as a relic of the village's founders and, seeing your earnestness, teaches you the `bless` spell to seek protection. You have learned `bless`!")

        elif isinstance(item, HiddenLocket) and self.shown_locket:
            return "The priest nods. 'A significant find, indeed. Keep it safe.'"
        
        return f"The priest looks at the {item.name} with gentle eyes but does not take it. 'May your path be guided, child.'"
