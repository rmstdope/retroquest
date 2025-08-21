from ...engine.Room import Room
from ..characters.MasterHealerLyria import MasterHealerLyria

class HealersHouse(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Healer's House",
            description=(
                "A cozy cottage filled with the scents of medicinal herbs and healing potions. Dried plants hang from "
                "the rafters, and shelves line the walls, packed with bottles of various sizes and colors. A warm fire "
                "crackles in the hearth, and comfortable chairs invite rest and recovery. This is clearly a place of "
                "healing and learning."
            ),
            items=[],
            characters=[MasterHealerLyria()],
            exits={"south": "ResidentialQuarter"}
        )
        self.emergency_healing_used = False

    def handle_command(self, command: str, game_state) -> str:
        """Handle room-specific commands for emergency healing scenario."""
        cmd_lower = command.lower().strip()
        
        # Use Advanced Healing Potion for emergency healing
        if cmd_lower in ["use advanced healing potion", "use healing potion", "use potion", "emergency heal"]:
            if game_state.has_item("advanced healing potion"):
                if not self.emergency_healing_used:
                    self.emergency_healing_used = True
                    game_state.set_story_flag("emergency_healing_completed", True)
                    
                    # Mark that the apprentice quest can be completed
                    game_state.set_story_flag("healers_apprentice_ready", True)
                    
                    return ("[success]You uncork the [item_name]advanced healing potion[/item_name] and drink it in "
                           "one swift motion. The liquid burns slightly as it goes down, but immediately you feel a "
                           "powerful surge of healing energy coursing through your body. Wounds close, bruises fade, "
                           "and your strength is fully restored. This is clearly the work of a master alchemist![/success]\n\n"
                           
                           "[info]Master Healer Lyria watches approvingly. 'Excellent! You've demonstrated that you can "
                           "use advanced healing techniques under pressure. This is exactly the kind of skill that marks "
                           "a true healer's apprentice. Your training is now complete!'[/info]")
                else:
                    return ("You've already used the [item_name]advanced healing potion[/item_name] for your emergency healing training.")
            else:
                return "You don't have an advanced healing potion to use."
        
        # Default room command handling
        return super().handle_command(command, game_state)
