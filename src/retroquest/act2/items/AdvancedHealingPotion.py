from ...engine.Item import Item

class AdvancedHealingPotion(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Advanced Healing Potion",
            description=(
                "A crystal vial containing a luminescent healing elixir created by Master Healer Lyria. "
                "The potion glows with a soft blue light and has the power to heal even the most serious "
                "injuries and ailments. This potent remedy represents the pinnacle of the healing arts."
            ),
            can_be_carried=True,
        )

    def use(self, game_state) -> str:
        # Check if we're in the Healer's House for emergency healing scenario
        current_room_name = game_state.current_room.name.lower()
        if "healer" in current_room_name and "house" in current_room_name:
            # This is the emergency healing scenario for step 14
            if not game_state.get_story_flag("emergency_healing_completed"):
                game_state.set_story_flag("emergency_healing_completed", True)
                game_state.set_story_flag("healers_apprentice_ready", True)
                
                return ("[success]You uncork the [item_name]Advanced Healing Potion[/item_name] and drink it in "
                       "one swift motion. The liquid burns slightly as it goes down, but immediately you feel a "
                       "powerful surge of healing energy coursing through your body. Wounds close, bruises fade, "
                       "and your strength is fully restored. This is clearly the work of a master alchemist![/success]\n\n"
                       
                       "[info]Master Healer Lyria watches approvingly. 'Excellent! You've demonstrated that you can "
                       "use advanced healing techniques under pressure. This is exactly the kind of skill that marks "
                       "a true healer's apprentice. Your training is now complete!'[/info]")
            else:
                return ("You've already used the [item_name]Advanced Healing Potion[/item_name] for your emergency healing training.")
        
        # General use outside of emergency healing scenario
        return ("[success]You drink the [item_name]Advanced Healing Potion[/item_name]. Powerful healing energy "
                "courses through your body, restoring your health to peak condition and curing any ailments. "
                "The potion's magic is so potent it could save lives that normal healing couldn't reach.[/success]")