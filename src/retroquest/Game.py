from prompt_toolkit import PromptSession
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
        self.state = GameState(starting_room)
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
        target = target.lower()
        # Check inventory first
        for item in self.state.inventory:
            if item.get_name().lower() == target or item.get_short_name().lower() == target:
                return item.get_description()
        # Then check items in the current room
        for item in self.state.current_room.get_items():
            if item.get_name().lower() == target or item.get_short_name().lower() == target:
                return item.get_description()
        # Then check characters in the current room
        for character in self.state.current_room.get_characters():
            if character.get_name().lower() == target:
                return character.get_description()
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
        item = item.lower()
        for obj in self.state.inventory:
            if obj.get_name().lower() == item or obj.get_short_name().lower() == item:
                self.state.inventory.remove(obj)
                self.state.current_room.items.append(obj)
                return f"You drop the {obj.get_name()}."
        return f"You don't have a '{item}' to drop."

    def take(self, item: str) -> str:
        item = item.lower()
        # Find item in current room by name or short_name
        room_items = self.state.current_room.get_items()
        for obj in room_items:
            if obj.get_name().lower() == item or obj.get_short_name().lower() == item:
                if not obj.can_be_carried():
                    return f"You can't take the {obj.get_name()}."
                # Remove from room
                self.state.current_room.items.remove(obj)
                # Add to inventory
                self.state.inventory.append(obj)
                return f"You take the {obj.get_name()}."
        return f"There is no '{item}' here to take."

    def inventory(self) -> str:
        if not self.state.inventory:
            return "Your inventory is empty."
        lines = ["You are carrying:"]
        for item in self.state.inventory:
            lines.append(f"- {item.get_name()}")
        return "\n".join(lines)

    # --- Not Implemented Methods ---
    def talk(self, target: str) -> str:
        target = target.lower()
        # Find character in the current room by name
        for character in self.state.current_room.get_characters():
            if character.get_name().lower() == target:
                # Call the character's talk_to method
                return character.talk_to(self.state)
        return f"There is no one named '{target}' here to talk to."

    def ask(self, target: str) -> str:
        raise NotImplementedError("Game.ask() is not yet implemented.")

    def give(self, command_args: str) -> str:
        # Expected format: "give <item_name> to <character_name>"
        parts = command_args.lower().split()
        
        item_name = ""
        character_name = ""

        if "to" not in parts:
            return "Invalid command format. Please use 'give <item> to <character>'."
        to_index = parts.index("to")

        if to_index == 0: # No item name provided
            return "What do you want to give? Use 'give <item> to <character>'."
        
        item_name = " ".join(parts[:to_index])
        
        if to_index >= len(parts) - 1: # No character name provided
            return "Who do you want to give it to? Use 'give <item> to <character>'."
            
        character_name = " ".join(parts[to_index+1:])

        # Check if item is in inventory
        item_to_give = None
        for inv_item in self.state.inventory:
            if inv_item.get_name().lower() == item_name or \
               inv_item.get_short_name().lower() == item_name:
                item_to_give = inv_item
                break
        
        if not item_to_give:
            return f"You don't have any '{item_name}'."

        # Check if character is in the room
        character_to_receive = None
        for char_in_room in self.state.current_room.get_characters():
            if char_in_room.get_name().lower() == character_name:
                character_to_receive = char_in_room
                break
        
        if not character_to_receive:
            return f"'{character_name.capitalize()}' is not here."

        # Call give_item on the character
        return character_to_receive.give_item(self.state, item_to_give)

    def show(self, item: str) -> str:
        raise NotImplementedError("Game.show() is not yet implemented.")

    def trade(self, item: str) -> str:
        raise NotImplementedError("Game.trade() is not yet implemented.")

    def read(self, item: str) -> str:
        raise NotImplementedError("Game.read() is not yet implemented.")

    def search(self, target: str) -> str:
        raise NotImplementedError("Game.search() is not yet implemented.")

    def listen(self, target: str = None) -> str:
        raise NotImplementedError("Game.listen() is not yet implemented.")

    def smell(self, target: str = None) -> str:
        raise NotImplementedError("Game.smell() is not yet implemented.")

    def taste(self, item: str) -> str:
        raise NotImplementedError("Game.taste() is not yet implemented.")

    def use(self, item_name: str) -> str:
        item_name = item_name.lower()
        # Check inventory for the item
        for item_obj in self.state.inventory:
            if item_obj.get_name().lower() == item_name or item_obj.get_short_name().lower() == item_name:
                return item_obj.use(self.state) # Pass game_state to the item's use method
        
        # Check items in the current room if not in inventory (e.g. a lever)
        for item_obj in self.state.current_room.get_items():
            if item_obj.get_name().lower() == item_name or item_obj.get_short_name().lower() == item_name:
                # Check if the item needs to be in inventory to be used
                if hasattr(item_obj, 'requires_pickup') and item_obj.requires_pickup:
                    return f"You need to pick up the {item_obj.get_name()} first."
                return item_obj.use(self.state) # Pass game_state to the item's use method

        return f"You don't have a '{item_name}' to use, and there isn't one here."

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

    def cast(self, spell_name: str) -> str:
        spell_name = spell_name.lower()
        for spell_obj in self.state.known_spells:
            if spell_obj.get_name().lower() == spell_name:
                return spell_obj.cast(self.state) # Pass game_state to the spell's cast method
        return f"You don't know the spell '{spell_name}'."

    def learn(self, spell: str) -> str:
        # For now, let's assume `spell` is an object of a Spell subclass
        # In a real scenario, you might look up the spell by name and then add its instance
        if hasattr(spell, 'get_name') and hasattr(spell, 'get_description'):
            if spell not in self.state.known_spells:
                self.state.known_spells.append(spell)
                return f"You have learned the spell: {spell.get_name()}!"
            else:
                return f"You already know the spell: {spell.get_name()}."
        return "You can't learn that."

    def spells(self) -> str: # Method to list known spells
        if not self.state.known_spells:
            return "You don't know any spells yet."
        
        output = ["Known Spells:"]
        for spell_obj in self.state.known_spells:
            output.append(f"  - {spell_obj.get_name()}: {spell_obj.get_description()}")
        return "\n".join(output)

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

    def sleep(self) -> str:
        raise NotImplementedError("Game.sleep() is not yet implemented.")

    def stats(self) -> str:
        raise NotImplementedError("Game.stats() is not yet implemented.")
