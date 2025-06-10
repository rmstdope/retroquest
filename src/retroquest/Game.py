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
            "  north, south, east, west, n, s, e, w, go <direction>\n"
            "      Move in a direction.\n"
            "  look\n"
            "      Take a careful look around your current location.\n"
            "  examine <item>\n"
            "      Examine an item in the room or your inventory. You can use the item's name or short name.\n"
            "  map\n"
            "      Show a list of visited rooms and their exits.\n"
            "  quit\n"
            "      Quit the game (with save prompt).\n"
            "  help\n"
            "      Show this help message.\n"
        )

    def look(self) -> str:
        return self.state.current_room.describe()

    def examine(self, target: str) -> str:
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
        raise NotImplementedError("Game.talk() is not yet implemented.")

    def ask(self, target: str) -> str:
        raise NotImplementedError("Game.ask() is not yet implemented.")

    def give(self, item: str) -> str:
        raise NotImplementedError("Game.give() is not yet implemented.")

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

    def use(self, item: str) -> str:
        raise NotImplementedError("Game.use() is not yet implemented.")

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

    def cast(self, spell: str) -> str:
        raise NotImplementedError("Game.cast() is not yet implemented.")

    def learn(self, spell: str) -> str:
        raise NotImplementedError("Game.learn() is not yet implemented.")

    def use_magic_stone(self) -> str:
        raise NotImplementedError("Game.use_magic_stone() is not yet implemented.")

    def heal(self) -> str:
        raise NotImplementedError("Game.heal() is not yet implemented.")

    def reveal(self) -> str:
        raise NotImplementedError("Game.reveal() is not yet implemented.")

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
