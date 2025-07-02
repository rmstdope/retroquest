from ...engine.Item import Item
from ...engine.GameState import GameState
from ..characters.Priest import Priest
from ..spells.BlessSpell import BlessSpell

class Locket(Item):
    def __init__(self):
        super().__init__(
            name="locket",
            description="A small, intricately carved silver locket, clearly very old. It feels cool to the touch. Perhaps some elder in the village might know more about it.",
            short_name="locket",
            can_be_carried=True
        )

    def picked_up(self, game_state: GameState) -> str | None:
        """
        When the Locket is picked up, if the Priest is in the room and hasn't
        already reacted to the locket, he teaches the player the Bless spell.
        """
        # Teach bless spell if player doesn't know the spell yet.
        if not game_state.has_spell(BlessSpell().name):
            bless_spell = BlessSpell()
            game_state.learn_spell(bless_spell) # learn_spell already checks if known
            return (f"[event]You pick up the locket.[/event]\nAs you do this, the [character_name]priest[/character_name] gasps. The [character_name]priest[/character_name] nods gravely. [dialogue]'That locket... it is a relic of the village founders. It speaks of your connection to this place and its history. May this blessing protect you on your path.'[/dialogue]\n "
                    f"He teaches you the [spell_name]bless[/spell_name] spell!\n[event]You have learned [spell_name]bless[/spell_name].[/event]")

        return None # No special message if Priest isn't there or spell is already known
