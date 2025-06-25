from ...engine.GameState import GameState
from ...engine.Item import Item
from ...engine.Character import Character
from ..spells.ReviveSpell import ReviveSpell # Import ReviveSpell
from ..items.TravelCloak import TravelCloak
from ..items.WildBerries import WildBerries
from ..items.Locket import Locket
from ..items.FadedPhotograph import FadedPhotograph
from ..Act1StoryFlags import FLAG_READ_PHOTO_MESSAGE, FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO

class Grandmother(Character):
    def __init__(self) -> None:
        super().__init__(
            name="grandmother",
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
                "[dialogue]Oh, [character.name]Elior[/character.name], my dear. The village... it feels a bit on edge lately, doesn't it? \n"
                "Willowbrook has always been a peaceful place. The [room_name]Village Square[/room_name] is usually bustling, though folks seem more hushed these days. \n"
                "If you're needing anything, the [room_name]General Store[/room_name] usually has a bit of everything. Old Man Hemlock, the [character_name]shopkeeper[/character_name], sees and hears a lot, too.\n"
                "And if it's wisdom or a remedy you seek, [character.name]Mira[/character.name] in her hut to the north of the square is the one to talk to. She has a way with herbs and... other things.\n"
                "The [character.name]Blacksmith[/character.name] down by the south end, he's a sturdy fellow, always hammering away. Keeps the tools sharp, and his spirits, mostly.\n"
                "Just... be observant, child. There's more to this world than meets the eye. And you, [character.name]Elior[/character.name], you have a good heart. Remember that.[/dialogue]"
            )
            self.dialogue_state["initial_talk"] = False # Change state after initial talk

        if game_state.get_story_flag('journal_read_prologue_entry'):
            added_dialogue = (
                "\n[dialogue]That [item_name]journal[/item_name] of yours... your father was a great writer, you know. He wrote of many things, some of which I am only now beginning to understand.\n"
                "He sensed a darkness, a shadow stretching over Eldoria, long before others did. He believed it was tied to the old tales, to the whispers of forgotten magic.\n"
                "He even researched a peculiar enchantment, one that could supposedly breathe life back into things on the very brink... a '[spell.name]revive[/spell.name]' spell, he called it.\n"
                "He thought it might be a key, a way to mend what the encroaching darkness sought to break. Keep your eyes open, [character.name]Elior[/character.name]. What you've read might be more than just stories.[/dialogue]"
            )
            dialogue += added_dialogue

            # Check if player already knows Revive spell by its name
            already_knows_revive = any(spell.get_name() == "Revive" for spell in game_state.known_spells)
            
            if not already_knows_revive:
                revive_spell_instance = ReviveSpell()
                game_state.known_spells.append(revive_spell_instance)
                dialogue += "\n\n[event]As she speak of it, the words your father wrote seem to settle in your mind. \nYou feel a new understanding... You have learned the [spell.name]Revive[/spell.name] spell![/event]"
            else:
                dialogue += "\n\n[event]You recall your father's writings on the [spell.name]Revive[/spell.name] spell. The knowledge feels familiar.[/event]"
        
        if not dialogue: # If no other dialogue was triggered
            dialogue = "[dialogue]It's good to see you, [character.name]Elior[/character.name]. Is there something you need?[/dialogue]"

        event_msg = f"[event]You speak with [character.name]{self.get_name()}[/character.name].[/event]"
        return event_msg + "\n" + dialogue

    def give_item(self, game_state: GameState, item: Item) -> str:
        if isinstance(item, Locket):
            game_state.remove_item_from_inventory(item.get_name())
            travel_cloak = TravelCloak()
            game_state.add_item_to_inventory(travel_cloak)
            event_msg = f"[event]You give the [item_name]{item.get_name()}[/item_name] to the [character_name]{self.get_name()}[/character_name].[/event]"
            return (
                event_msg + "\n" +
                f"[character_name]{self.get_name()}[/character_name]'s eyes widen as she sees the [item_name]{item.get_name()}[/item_name]. [dialogue]'This... this was your mother's. She said it would keep you safe. "
                f"And this... she wanted you to have this when you were old enough to understand its importance.'[/dialogue]\n"
                f"[character_name]{self.get_name()}[/character_name] hands you a finely made [item_name]{travel_cloak.get_name()}[/item_name].\n[dialogue]'May it protect you on your journeys, [character_name]Elior[/character_name].'[/dialogue]"
                f"\n[event]You received a [item_name]{travel_cloak.get_name()}[/item_name]![/event]"
            )

        elif isinstance(item, WildBerries) and not self.dialogue_state["given_berries"]:
            self.dialogue_state["given_berries"] = True
            # Remove WildBerries from inventory
            game_state.remove_item_from_inventory(item.get_name())
            event_msg = f"[event]You give the [item_name]{item.get_name()}[/item_name] to the [character_name]{self.get_name()}[/character_name].[/event]"
            return (
                event_msg + "\n" +
                f"[dialogue]'Oh, [item.name]{item.get_name()}[/item.name]! Thank you, dear. These look lovely. I'll make a pie later.' "
                f"[character.name]{self.get_name()}[/character.name] smiles warmly. 'It's the little things that brighten the day, isn't it?'[/dialogue]"
            )
        elif isinstance(item, WildBerries) and self.dialogue_state["given_berries"]:
            # Remove WildBerries from inventory
            game_state.remove_item_from_inventory(item.get_name())
            event_msg = f"[event]You give the [item_name]{item.get_name()}[/item_name] to the [character_name]{self.get_name()}[/character_name].[/event]"
            return event_msg + "\n" + f"[dialogue]'More [item_name]{item.get_name()}[/item_name]? You are too kind, [character_name]Elior[/character_name]. Thank you.'[/dialogue]"

        elif isinstance(item, FadedPhotograph):
            event_msg = f"[event]You show the [item_name]{item.get_name()}[/item_name] to the [character_name]{self.get_name()}[/character_name].[/event]"
            if not game_state.get_story_flag(FLAG_READ_PHOTO_MESSAGE):
                return (
                    event_msg + "\n" +
                    f"She takes the photograph, her eyes misty with memory. [dialogue]'This was taken long ago, before the troubles began. Your parents were so full of hope... They loved you dearly, Elior. I miss them every day.' She gently returns the photo to you, lost in thought.[/dialogue]"
                )
            else:
                game_state.set_story_flag(FLAG_TALKED_TO_GRANDMOTHER_ABOUT_PHOTO, True)
                return (
                    event_msg + "\n" +
                    f"She studies the back of the photograph, her expression growing serious. [dialogue]'You found the message, then? Your parents... they were involved in something much bigger than any of us realized. There is a darkness in Eldoria, and your family is tied to it. There is a secret, Elior—a truth you must uncover. Promise me you'll be careful.'[/dialogue]"
                )

        event_msg = f"[event]You offer the [item_name]{item.get_name()}[/item_name] to the [character_name]{self.get_name()}[/character_name].[/event]"
        return event_msg + "\n" + f"[dialogue][character.name]{self.get_name()}[/character.name] looks at the [item.name]{item.get_name()}[/item.name]. 'I'm not sure what to do with this, dear.'[/dialogue]"
