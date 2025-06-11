from .Spell import Spell

class ReviveSpell(Spell):
    def __init__(self):
        super().__init__(name="Revive", description="A potent life-affirming spell that breathes vitality back into withered or dying plant life. It can cause dead flowers to bloom anew or shriveled crops to become bountiful. While powerful in its domain, it has no effect on creatures or inanimate objects beyond plants.")

    def cast(self, game_state) -> str:
        if not game_state.get_story_flag("knows_magic"):
            return "You focus on the withered plants, a faint warmth spreads from your fingertips, but nothing happens. It feels like the magic is just out of reach."
        else:
            current_room_name = game_state.current_room.name
            if current_room_name == "Vegetable Field":
                withered_carrot = next((item for item in game_state.current_room.get_items() if item.get_name() == "Withered Carrot"), None)
                if withered_carrot:
                    # Remove withered carrot, add a "Revived Carrot" or similar
                    # For now, just a specific message
                    return "You channel the life-giving energy into the ground. The withered carrot in the patch before you trembles and slowly regains its vibrant orange hue! It looks healthy and edible now."

            return "You channel the life-giving energy into the ground. A few nearby wildflowers, once wilted, straighten and unfurl their petals, vibrant with newfound life!"
