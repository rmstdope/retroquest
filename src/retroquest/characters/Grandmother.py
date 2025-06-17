from ..GameState import GameState
from ..items.Item import Item
from .Character import Character
from ..spells.ReviveSpell import ReviveSpell # Import ReviveSpell
from ..items.TravelCloak import TravelCloak
from ..items.WildBerries import WildBerries
from ..items.HiddenLocket import HiddenLocket

class Grandmother(Character):
    def __init__(self) -> None:
        super().__init__(
            name="Grandmother",
            description="Elior's wise and loving grandmother, always ready with advice and a gentle smile. She has raised Elior since his parents vanished."
        )
        self.dialogue_state = {
            "initial_talk": True,
            "given_locket": False,
            "given_berries": False,
        }

    def talk_to(self, game_state) -> str:
        dialogue = ""
        if self.dialogue_state["initial_talk"]:
            dialogue = (
                "Oh, Elior, my dear. The village... it feels a bit on edge lately, doesn't it? \n\n"
                "Willowbrook has always been a peaceful place. The Village Square is usually bustling, though folks seem more hushed these days. \n\n"
                "If you're needing anything, the General Store usually has a bit of everything. Old Man Hemlock, the shopkeeper, sees and hears a lot, too.\n\n"
                "And if it's wisdom or a remedy you seek, Mira in her hut to the north of the square is the one to talk to. She has a way with herbs and... other things.\n\n"
                "The Blacksmith down by the south end, he's a sturdy fellow, always hammering away. Keeps the tools sharp, and his spirits, mostly.\n\n"
                "Just... be observant, child. There's more to this world than meets the eye. And you, Elior, you have a good heart. Remember that."
            )
            self.dialogue_state["initial_talk"] = False # Change state after initial talk

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
        
        if not dialogue: # If no other dialogue was triggered
            dialogue = "It's good to see you, Elior. Is there something you need?"

        return dialogue

    def give_item(self, game_state: GameState, item: Item) -> str:
        if isinstance(item, HiddenLocket):
            game_state.remove_item_from_inventory(item.get_name())
            travel_cloak = TravelCloak()
            game_state.add_item_to_inventory(travel_cloak)
            return (
                "Grandmother's eyes widen as she sees the locket. 'This... this was your mother's. She said it would keep you safe. "
                "And this... she wanted you to have this when you were old enough to understand its importance.' "
                "Grandmother hands you a finely made TravelCloak. 'May it protect you on your journeys, Elior.\'\\n\\n"
                "You received a TravelCloak!"
            )

        elif isinstance(item, WildBerries) and not self.dialogue_state["given_berries"]:
            self.dialogue_state["given_berries"] = True
            # Remove WildBerries from inventory
            game_state.remove_item_from_inventory(item.get_name())
            return (
                "'Oh, Wild Berries! Thank you, dear. These look lovely. I'll make a pie later.' "
                "Grandmother smiles warmly. 'It's the little things that brighten the day, isn't it?'"
            )
        elif isinstance(item, WildBerries) and self.dialogue_state["given_berries"]:
            # Remove WildBerries from inventory
            game_state.remove_item_from_inventory(item.get_name())
            return "'More berries? You are too kind, Elior. Thank you.'"
        
        return f"Grandmother looks at the {item.get_name()}. 'I'm not sure what to do with this, dear.'"
