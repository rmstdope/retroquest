from ...engine.Character import Character
from ...engine.GameState import GameState
from ..items.TrainingSword import TrainingSword

class MountainHermit(Character):
    def __init__(self) -> None:
        super().__init__(
            name="mountain hermit",
            description="An old man wrapped in weathered robes, with wise eyes that seem to have seen many seasons pass. He sits by a small fire, watching the path between Willowbrook and Greendale with keen interest."
        )
        self.sword_given = False
        self.warned_about_times = False

    def talk_to(self, game_state: GameState, player=None) -> str:
        event_msg = f"[event]You approach the [character_name]{self.get_name()}[/character_name].[/event]"
        
        if not self.warned_about_times:
            self.warned_about_times = True
            warning_msg = (f"[dialogue]The [character_name]{self.get_name()}[/character_name] looks up from his fire with ancient eyes. "
                          f"'Ah, a traveler heading to Greendale. I sense great changes coming to these lands. "
                          f"Dark forces stir, and heroes will be needed in the days ahead. You have the look of one "
                          f"who might rise to such challenges.'[/dialogue]")
            
            if not self.sword_given:
                # Automatically give the training sword when first spoken to
                return self.give_training_sword_with_dialogue(game_state, event_msg, warning_msg)
            else:
                return event_msg + "\n" + warning_msg
        else:
            if self.sword_given:
                return (event_msg + "\n" +
                       f"[dialogue]The [character_name]{self.get_name()}[/character_name] nods sagely. "
                       f"'The [item_name]training sword[/item_name] I gave you will serve you well in Greendale. "
                       f"Show them your skill, and doors will open. May your journey be blessed with wisdom and courage.'[/dialogue]")
            else:
                return self.give_training_sword_with_dialogue(game_state, event_msg, "")

    def give_training_sword_with_dialogue(self, game_state: GameState, event_msg: str, warning_msg: str) -> str:
        """Helper method to give training sword with appropriate dialogue"""
        if self.sword_given:
            return f"[dialogue]The [character_name]{self.get_name()}[/character_name] smiles. 'I already gave you the sword, young one. Use it wisely.'[/dialogue]"
        
        self.sword_given = True
        training_sword = TrainingSword()
        game_state.add_item_to_inventory(training_sword)
        
        sword_dialogue = (f"[dialogue]He reaches into his pack and pulls out a [item_name]training sword[/item_name]. "
                         f"'Take this. If you truly are destined for greatness, you'll need to prove your skills to "
                         f"those who matter. This blade has served me well in teaching others.'[/dialogue]\n\n"
                         f"[event]You receive a [item_name]training sword[/item_name]![/event]")
        
        if warning_msg:
            return event_msg + "\n" + warning_msg + "\n\n" + sword_dialogue
        else:
            return event_msg + "\n" + sword_dialogue

    def give_training_sword(self, game_state: GameState) -> str:
        if self.sword_given:
            return f"[dialogue]The [character_name]{self.get_name()}[/character_name] smiles. 'I already gave you the sword, young one. Use it wisely.'[/dialogue]"
        
        self.sword_given = True
        training_sword = TrainingSword()
        game_state.add_item_to_inventory(training_sword)
        
        event_msg = f"[event]The [character_name]{self.get_name()}[/character_name] hands you the [item_name]training sword[/item_name].[/event]"
        return (event_msg + "\n" +
               f"[dialogue]'This blade has trained many would-be heroes. It may not be sharp enough for battle, "
               f"but it will show your skill to those who need convincing. Use it well in Greendale.'[/dialogue]\n\n"
               f"[event]You receive a [item_name]training sword[/item_name]![/event]")
