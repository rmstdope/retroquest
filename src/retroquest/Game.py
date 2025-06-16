from prompt_toolkit import PromptSession

from .spells import Spell
from .characters import Character
from .items.Item import Item
from .CommandParser import CommandParser
from .GameState import GameState

class Game:
    """
    Main Game class for RetroQuest: The Awakening.
    Handles the game loop, command parsing, and room transitions.
    """
    def __init__(self, starting_room, rooms):
        self.session = PromptSession()
        self.rooms = rooms
        self.is_running = True
        self.state = GameState(starting_room, all_rooms=self.rooms) # Pass all_rooms
        self.command_parser = CommandParser(self)

    def handle_command(self, command: str) -> str:
        return self.command_parser.parse(command)

    def run(self) -> None:
        print(f"Welcome to RetroQuest: The Awakening!\n")
        # Revised prologue: do NOT mention the amulet being given yet
        print(
            "You are Elior, a humble farmer boy living in the quiet village of Willowbrook on the outskirts of Eldoria. "
            "Raised by your grandmother after your parents vanished mysteriously, your life is simple—tending crops and caring for animals. "
            "One stormy night, a strange light appears in the sky, and you dream of a shadowy figure calling your name.\n"
            "\n"
            "The next morning, you awaken to find the village abuzz with rumors: livestock missing, strange footprints by the well, and the old mill's wheel turning on its own. "
            "Your grandmother, usually cheerful, seems worried and distracted, her gaze lingering on a faded photograph.\n"
            "\n"
            "As you step outside, the air feels charged with something unfamiliar. The villagers gather in the square, debating what to do. "
            "Mira, the wise woman, catches your eye and beckons you over. 'There are secrets in Willowbrook, child,' she says. 'Secrets that have waited for you.'\n"
            "\n"
            "A distant bell tolls from the chapel, and a cold wind rustles the fields. You sense that today, everything will change. "
            "With questions swirling in your mind, you take your first step into the unknown.\n"
        )
        print(self.state.current_room.describe() + "\n")
        while self.is_running:
            user_input = self.session.prompt('> ')
            self.state.history.append(user_input)
            response = self.handle_command(user_input)
            # Print a separator line before any output after a command
            if response:
                print('\n' + response + '\n')

    def find_character(self, target) -> Character:
        character_to_examine = None
        target = target.lower()
        for character in self.state.current_room.get_characters():
            if character_to_examine == None and character.get_name().lower() == target:
                character_to_examine = character
        return character_to_examine

    def find_item(self, target, look_in_inventory: bool = True, look_in_room: bool = True) -> Item:
        """
        Find an item by its name or short name in the inventory and/or current room.
        Returns a tuple of (target_name, item_object) where item_object is None if not found.
        """
        target = target.lower()
        item_to_examine = None
        # Check inventory first
        if look_in_inventory:
            for item in self.state.inventory:
                if item_to_examine == None and (item.get_name().lower() == target or item.get_short_name().lower() == target):
                    item_to_examine = item
        # Then check items in the current room
        if look_in_room:
            for item in self.state.current_room.get_items():
                if item_to_examine == None and (item.get_name().lower() == target or item.get_short_name().lower() == target):
                    item_to_examine = item
        return item_to_examine

    def move(self, direction: str, arg: str = None) -> str:
        exits = self.state.current_room.get_exits()
        if direction in exits:
            next_room_key = exits[direction]
            if next_room_key in self.rooms:
                self.state.current_room = self.rooms[next_room_key]
                self.state.mark_visited(self.state.current_room)
                return f"[You move {direction} to {self.state.current_room.name}.]\n\n" + self.state.current_room.describe()
            else:
                return "That exit leads nowhere (room not found)."
        else:
            return "You can't go that way."

    def help(self, arg: str = None) -> str:
        return (
            "Available commands:\n"
            "  Movement:\n"
            "    go <direction>, <direction>, <short_direction>\n"
            "        (e.g., go north, north, n)\n"
            "        Move in a specified direction.\n"
            "  Actions:\n"
            "    look, look around, observe, survey\n"
            "        Take a careful look around your current location.\n"
            "    examine <target>, look at <target>, inspect <target>, check <target>\n"
            "        Examine an item or character in the room or your inventory.\n"
            "    take <item>, pick up <item>, grab <item>, get <item>\n"
            "        Pick up an item from the room and add it to your inventory.\n"
            "    drop <item>, discard <item>\n"
            "        Remove an item from your inventory and leave it in the room.\n"
            "    inventory, inv, i\n"
            "        List items currently in your inventory.\n"
            "    use <item>\n"
            "        Use an item from your inventory or in the room.\n"
            "    talk <character>, talk to <character>, speak to <character>, converse with <character>\n"
            "        Speak to a character in the current room.\n"
            "  Game & Information:\n"
            "    map\n"
            "        Show a list of visited rooms and their exits.\n"
            "    quit, exit\n"
            "        Quit the game (with save prompt).\n"
            "    help, ?\n"
            "        Show this help message.\n"
        )

    def look(self) -> str:
        return self.state.current_room.describe()

    def examine(self, target: str) -> str:
        if not target:  # Check if target is an empty string or None
            return "Examine what?"
        item_to_examine = self.find_item(target)
        if item_to_examine:
            return item_to_examine.get_description()
        character_to_examine = self.find_character(target)
        if character_to_examine:
            return character_to_examine.get_description()
        return f"You don't see a '{target}' here."

    def map(self) -> str:
        # Print all visited rooms and their exits, each exit on a new indented line
        visited = set(self.state.visited_rooms)
        room_objs = {name: room for name, room in self.rooms.items() if room.name in visited}
        if not room_objs:
            return "No rooms visited yet."
        output = ["Visited Rooms and Exits:"]
        for name, room in room_objs.items():
            exits = room.get_exits()
            output.append(f"- {room.name}:")
            if exits:
                for direction, dest in exits.items():
                    dest_name = self.rooms[dest].name if dest in self.rooms else dest
                    output.append(f"    {direction} -> {dest_name}")
            else:
                output.append("    No exits")
        return output

    def unknown(self, command: str) -> str:
        return f"I don't understand the command: '{command}'. Try 'help' for a list of valid commands."

    def quit(self) -> str:
        while True:
            answer = self.session.prompt("Do you want to save before quitting? (yes/no): ").strip().lower()
            if answer in ("yes", "y"):
                self.save()
                self.is_running = False
                return "Game saved. Goodbye!"
            elif answer in ("no", "n"):
                self.is_running = False
                return "Goodbye!"
            else:
                print("Please answer 'yes' or 'no'.")
                continue

    def drop(self, item: str) -> str:
        item_to_drop = self.find_item(item, look_in_inventory=True, look_in_room=False)
        if item_to_drop:
            self.state.inventory.remove(item_to_drop)
            self.state.current_room.items.append(item_to_drop)
            return f"You drop the {item_to_drop.get_name()}."
        return f"You don't have a '{item}' to drop."

    def take(self, item: str) -> str:
        item_to_take = self.find_item(item, look_in_inventory=False, look_in_room=True)
        if not item_to_take:
            return f"There is no '{item}' here to take."
        if not item_to_take.can_be_carried():
            return f"You can't take the {item_to_take.get_name()}."
        self.state.current_room.items.remove(item_to_take)
        self.state.inventory.append(item_to_take)
        return f"You take the {item_to_take.get_name()}."

    def inventory(self) -> str:
        if not self.state.inventory:
            return "Your inventory is empty."
        lines = ["You are carrying:"]
        for item in self.state.inventory:
            lines.append(f"- {item.get_name()}")
        return "\n".join(lines)

    def talk(self, target: str) -> str:
        if not target:
            return "Talk to whom?"
        character_to_talk_to = self.find_character(target)
        if character_to_talk_to:
            return character_to_talk_to.talk_to(self.state)
        else:
            return f"There is no one named '{target}' here to talk to."

    def split_command(self, command_args: str, command: str, delimiter: str) -> tuple:
        # Expected format: "<command> <item/character_name> <delimiter> <item/character_name>"
        parts = command_args.lower().split()
        if delimiter not in parts:
            return None, None, f"Invalid command format. Please use '{command} <target1> {delimiter} <target2>'."
        del_index = parts.index(delimiter)
        if del_index == 0: # No target1 provided
            return None, None, f"What do you want to {command}?'."
        target1 = " ".join(parts[:del_index])
        if del_index >= len(parts) - 1: # No target2 provided
            return None, None, f"Who/What should I {command} {target1} {delimiter}?'."
        target2 = " ".join(parts[del_index+1:])
        return target1, target2, ''
        
    def give(self, command_args: str) -> str:
        # Split the command into item and character parts
        item_name,character_name,error = self.split_command(command_args, 'give', 'to')
        if item_name == None or character_name is None:
            return error

        # Check if item is in inventory
        item_to_give = self.find_item(item_name, look_in_inventory=True, look_in_room=False)
        if not item_to_give:
            return f"You don't have any '{item_name}'."

        # Check if character is in the room
        character_to_receive = self.find_character(character_name)
        if not character_to_receive:
            return f"'{character_name.capitalize()}' is not here."

        # Call give_item on the character
        return character_to_receive.give_item(self.state, item_to_give)

    def buy(self, command_args: str) -> str:
        # Split the command into item and character parts
        item_name,character_name,error = self.split_command(command_args, 'buy', 'from')
        if item_name == None or character_name is None:
            return error

        # Check if character is in the room
        character_to_buy_from = self.find_character(character_name)
        if not character_to_buy_from:
            return f"'{character_name.capitalize()}' is not here."

        return character_to_buy_from.buy_item(item_name, self.state)

    def read(self, item: str) -> str:
        if not item:  # Check if item name is empty or None
            return "Read what?"

        item_to_read = self.find_item(item, look_in_inventory=True, look_in_room=True)
        
        if item_to_read:
            # As per the prompt, all Item objects are assumed to have a .read(game_state) method.
            # If an item is not meant to be read, its read() method should return an appropriate message.
            return item_to_read.read(self.state)
        else:
            return f"You don't see a '{item}' to read here or in your inventory."

    def use(self, item_name_1: str, item_name_2: str = None) -> str:
        item_obj_1 = self.find_item(item_name_1, look_in_inventory=True, look_in_room=True)

        if not item_obj_1:
            return f"You don't have a '{item_name_1}' to use, and there isn't one here."

        # --- Handle two-item usage ---
        if item_name_2:
            item_obj_2 = self.find_item(item_name_2, look_in_inventory=True, look_in_room=True)
            
            if not item_obj_2:
                return f"You don't see a '{item_name_2}' to use with {item_obj_1.get_name()}."

            if item_obj_1 == item_obj_2:
                return f"You can't use the {item_obj_1.get_name()} with itself."

            return item_obj_1.use_with(self.state, item_obj_2)

        # --- Handle single-item usage ---
        else:
            return item_obj_1.use(self.state)

    def cast(self, spell_name: str) -> str:
        spell_name = spell_name.lower()
        for spell_obj in self.state.known_spells:
            if spell_obj.get_name().lower() == spell_name:
                return spell_obj.cast(self.state) # Pass game_state to the spell's cast method
        return f"You don't know the spell '{spell_name}'."

    def learn(self, spell: Spell) -> str:
        if spell not in self.state.known_spells:
            self.state.known_spells.append(spell)
            return f"You have learned the spell: {spell.get_name()}!"
        else:
            return f"You already know the spell: {spell.get_name()}."

    def spells(self) -> str: # Method to list known spells
        if not self.state.known_spells:
            return "You don't know any spells yet."
        
        output = ["Known Spells:"]
        for spell_obj in self.state.known_spells:
            output.append(f"  - {spell_obj.get_name()}: {spell_obj.get_description()}")
        return "\n".join(output)

    def search(self) -> str:
        return self.state.current_room.search(self.state) # Pass game_state

    def listen(self, target: str = None) -> str:
        if not target:
            return self.state.current_room.get_ambient_sound() 

        item_to_listen_to = self.find_item(target, look_in_inventory=True, look_in_room=True)        
        if item_to_listen_to:
            return item_to_listen_to.listen(self.state)
        else:
            return f"You don\'t see a '{target}' to listen to here or in your inventory."

    def rest(self) -> str:
        return self.state.current_room.rest(self.state)

    # --- Not Implemented Methods ---
    def ask(self, target: str) -> str:
        raise NotImplementedError("Game.ask() is not yet implemented.")

    def show(self, item: str) -> str:
        raise NotImplementedError("Game.show() is not yet implemented.")

    def trade(self, item: str) -> str:
        raise NotImplementedError("Game.trade() is not yet implemented.")

    def smell(self, target: str = None) -> str:
        raise NotImplementedError("Game.smell() is not yet implemented.")

    def taste(self, item: str) -> str:
        raise NotImplementedError("Game.taste() is not yet implemented.")

    def eat(self, item: str) -> str:
        raise NotImplementedError("Game.eat() is not yet implemented.")

    def drink(self, item: str) -> str:
        raise NotImplementedError("Game.drink() is not yet implemented.")

    def equip(self, item: str) -> str:
        raise NotImplementedError("Game.equip() is not yet implemented.")

    def unequip(self, item: str) -> str:
        raise NotImplementedError("Game.unequip() is not yet implemented.")

    def open(self, target: str) -> str:
        raise NotImplementedError("Game.open() is not yet implemented.")

    def close(self, target: str) -> str:
        raise NotImplementedError("Game.close() is not yet implemented.")

    def save(self) -> str:
        raise NotImplementedError("Game.save() is not yet implemented.")

    def load(self) -> str:
        raise NotImplementedError("Game.load() is not yet implemented.")

    def restart(self) -> str:
        raise NotImplementedError("Game.restart() is not yet implemented.")

    def undo(self) -> str:
        raise NotImplementedError("Game.undo() is not yet implemented.")

    def redo(self) -> str:
        raise NotImplementedError("Game.redo() is not yet implemented.")

    def wait(self) -> str:
        raise NotImplementedError("Game.wait() is not yet implemented.")

    def stats(self) -> str:
        raise NotImplementedError("Game.stats() is not yet implemented.")
