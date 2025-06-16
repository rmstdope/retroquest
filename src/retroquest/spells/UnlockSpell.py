from .Spell import Spell

class UnlockSpell(Spell):
    def __init__(self):
        super().__init__("Unlock", "A spell that can open magically sealed or complex mundane locks.")

    def cast(self, game_state) -> str:
        # Implement the logic for the unlock spell
        # For example, it might open a locked chest or door
        # target_object = game_state.get_object_in_room("Mysterious Box")
        # if target_object and target_object.is_locked:
        #     target_object.unlock()
        #     return "A soft click is heard, and the lock springs open."
        return "You cast Unlock. You hear a faint click nearby."
