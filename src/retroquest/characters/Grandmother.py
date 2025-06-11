from .Character import Character
from ..spells.ReviveSpell import ReviveSpell # Import ReviveSpell

class Grandmother(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Grandmother",
            description="Elior's wise and loving grandmother, always ready with advice and a gentle smile. She has raised Elior since his parents vanished."
        )

    def talk_to(self, game_state) -> str:
        dialogue = (
            "Oh, Elior, my dear. The village... it feels a bit on edge lately, doesn't it? \n\n"
            "Willowbrook has always been a peaceful place. The Village Square is usually bustling, though folks seem more hushed these days. \n\n"
            "If you're needing anything, the General Store usually has a bit of everything. Old Man Hemlock, the shopkeeper, sees and hears a lot, too.\n\n"
            "And if it's wisdom or a remedy you seek, Mira in her hut to the north of the square is the one to talk to. She has a way with herbs and... other things.\n\n"
            "The Blacksmith down by the south end, he's a sturdy fellow, always hammering away. Keeps the tools sharp, and his spirits, mostly.\n\n"
            "Just... be observant, child. There's more to this world than meets the eye. And you, Elior, you have a good heart. Remember that."
        )

        if game_state.get_story_flag('journal_read_prologue_entry'):
            added_dialogue = (
                "\n\nThat journal of yours... your father was a great writer, you know. He wrote of many things, some of which I am only now beginning to understand.\n\n"
                "He sensed a darkness, a shadow stretching over Eldoria, long before others did. He believed it was tied to the old tales, to the whispers of forgotten magic.\n\n"
                "He even researched a peculiar enchantment, one that could supposedly breathe life back into things on the very brink... a 'revive' spell, he called it.\n\n"
                "He thought it might be a key, a way to mend what the encroaching darkness sought to break. Keep your eyes open, Elior. What you've read might be more than just stories."
            )
            dialogue += added_dialogue

            # Check if player already knows Revive spell by its name
            already_knows_revive = any(spell.get_name() == "Revive" for spell in game_state.known_spells)
            
            if not already_knows_revive:
                revive_spell_instance = ReviveSpell()
                game_state.known_spells.append(revive_spell_instance)
                dialogue += "\n\nAs she speak of it, the words your father wrote seem to settle in your mind. \n\nYou feel a new understanding... You have learned the Revive spell!"
            else:
                dialogue += "\n\nYou recall your father's writings on the Revive spell. The knowledge feels familiar."

        return dialogue
