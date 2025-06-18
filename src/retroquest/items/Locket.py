from .Item import Item
from ..GameState import GameState
from ..characters.Priest import Priest
from ..spells.BlessSpell import BlessSpell

class Locket(Item):
    def __init__(self):
        super().__init__(
            name="locket",
            description="A small, intricately carved silver locket, clearly very old. It feels cool to the touch.",
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
            return (f"As you pick up the locket, the [character.name]priest[/character.name] gasps. The [character.name]priest[/character.name] nods gravely. [dialogue]'That locket... it is a relic of the village founders. It speaks of your connection to this place and its history. May this blessing protect you on your path.'[/dialogue]\n "
                    f"He teaches you the [spell.name]bless[/spell.name] spell! You have learned [spell.name]bless[/spell.name].")

        return None # No special message if Priest isn't there or spell is already known
