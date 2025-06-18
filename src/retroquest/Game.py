from prompt_toolkit import PromptSession
from rich.console import Console
from rich.theme import Theme

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
        custom_theme = Theme({
            "character.name": "bold blue",
            "dialogue": "italic cyan",
            "item.name": "bold green",
            "spell.name": "bold magenta",
            "room.name": "bold cyan",
            "event": "dim",
            "exits": "bold yellow"
        })
        self.console = Console(theme=custom_theme)
        self.session = PromptSession()
        self.rooms = rooms
        self.is_running = True
        self.state = GameState(starting_room, all_rooms=self.rooms) # Pass all_rooms
        self.command_parser = CommandParser(self)

    def handle_command(self, command: str) -> str:
        return self.command_parser.parse(command)

    def print_intro(self):
        self.console.print("\033[47;30m", end="")
        self.console.clear()
        self.console.print("Welcome to")
        self.console.print(r'''
########  ######### ######### ########   #######   #######  ##     ## #########  #######  #########
##     ## ##           ##     ##     ## ##     ## ##     ## ##     ## ##        ##     ##    ##
##     ## ##           ##     ##     ## ##     ## ##     ## ##     ## ##        ##           ##
########  #######      ##     ########  ##     ## ##     ## ##     ## #######    #######     ##
##   ##   ##           ##     ##   ##   ##     ## ##  ## ## ##     ## ##               ##    ##
##    ##  ##           ##     ##    ##  ##     ## ##   #### ##     ## ##        ##     ##    ##
##     ## #########    ##     ##     ##  #######   #######   #######  #########  #######     ##
''', style="bold yellow")
        self.session.prompt('Press Enter to continue...')
        self.console.clear()
        # Revised prologue: do NOT mention the amulet being given yet
        self.console.print(
            "You are Elior, a humble farmer boy living in the quiet village of Willowbrook on the outskirts of Eldoria. "
            "Raised by your grandmother after your parents vanished mysteriously, your life is simple—tending crops and caring for animals. "
            "One stormy night, a strange light appears in the sky, and you dream of a shadowy figure calling your name.\n"
        )
        self.session.prompt('Press Enter to continue...')
        self.console.print(
            "\nThe next morning, you awaken to find the village abuzz with rumors: livestock missing, strange footprints by the well, and the old mill's wheel turning on its own. "
            "Your grandmother, usually cheerful, seems worried and distracted, her gaze lingering on a faded photograph.\n"
        )
        self.session.prompt('Press Enter to continue...')
        self.console.print(
            "\nAs you step outside, the air feels charged with something unfamiliar. The villagers gather in the square, debating what to do. "
            "Mira, the wise woman, catches your eye and beckons you over. 'There are secrets in Willowbrook, child,' she says. 'Secrets that have waited for you.'\n"
        )
        self.session.prompt('Press Enter to continue...')
        self.console.print(
            "\nA distant bell tolls from the chapel, and a cold wind rustles the fields. You sense that today, everything will change. "
            "With questions swirling in your mind, you take your first step into the unknown.\n"
        )
        self.console.print("\nLet's get started! (Type 'help' for a list of commands.)\n")
        self.session.prompt('Press Enter to continue...')

    def run(self) -> None:
        self.print_intro()
        self.console.clear()
        self.console.print(self.state.current_room.describe() + "\n")
        while self.is_running:
            user_input = self.session.prompt('> ')
            self.state.history.append(user_input)
            response = self.handle_command(user_input)
            # Print a separator line before any output after a command
            if response:
                self.console.print('\n' + response + '\n')

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
                return f"[event][You move {direction} to [room.name]{self.state.current_room.name}[/room.name].][/event]\n\n" + self.state.current_room.describe()
            else:
                return "That exit leads nowhere (room not found)."
        else:
            return "You can't go that way."

    def help(self, arg: str = None) -> str:
        return (
            "[bold]Available Commands:[/bold]\n"
            "\n"
            "[bold]Movement:[/bold]\n"
            "  go <direction>, move <direction>, <direction>, <short_direction> (e.g., go north, n)\n"
            "  enter <location>, go in, go inside\n"
            "  leave <location>, exit <location>, go out\n"
            "  climb <object>, ascend <object>\n"
            "  descend <object>, go down <object>\n"
            "  follow <path>, walk <path>\n"
            "\n"
            "[bold]Interaction:[/bold]\n"
            "  talk to <character>, speak to <character>, converse with <character>\n"
            "  ask <character> about <topic>, question <character> about <topic>\n"
            "  give <item> to <character>, hand <item> to <character>\n"
            "  show <item> to <character>\n"
            "  trade <item> with <character>, exchange <item> with <character>\n"
            "  buy <item> from <character>\n"
            "\n"
            "[bold]Examination:[/bold]\n"
            "  look around, look, observe, survey, l\n"
            "  look at <object>, inspect <object>, examine <object>, check <object>\n"
            "  search, investigate\n"
            "  listen to <object/location>\n"
            "  smell, sniff <object>\n"
            "  taste <item>\n"
            "\n"
            "[bold]Inventory Management:[/bold]\n"
            "  take <item>, pick up <item>, grab <item>, get <item>\n"
            "  drop <item>, discard <item>\n"
            "  use <item>, use <item> with <item>\n"
            "  eat <item>, consume <item>\n"
            "  drink <item>\n"
            "  equip <item>, wear <item>\n"
            "  unequip <item>, remove <item>\n"
            "  inventory, i, inv\n"
            "  open <container>\n"
            "  close <container>\n"
            "\n"
            "[bold]Magic:[/bold]\n"
            "  cast <spell>\n"
            "  cast <spell> on <object/character>\n"
            "  learn <spell>\n"
            "  spells\n"
            "\n"
            "[bold]Game Management:[/bold]\n"
            "  save game, save\n"
            "  load game, load\n"
            "  help, ?\n"
            "  quit, exit\n"
            "  restart\n"
            "  undo\n"
            "  redo\n"
            "\n"
            "[bold]Miscellaneous:[/bold]\n"
            "  wait, pause\n"
            "  sleep, rest\n"
            "  map\n"
            "  stats\n"
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
        return f"You don't see any '{target}' here."

    def map(self) -> str:
        # Print all visited rooms and their exits, each exit on a new indented line
        visited = set(self.state.visited_rooms)
        room_objs = {name: room for name, room in self.rooms.items() if room.name in visited}
        if not room_objs:
            return "No rooms visited yet."
        output = ["[bold]Visited Rooms and Exits:[/bold]"]
        for name, room in room_objs.items():
            exits = room.get_exits()
            output.append(f"- [room.name]{room.name}[/room.name]:")
            if exits:
                for direction, dest in exits.items():
                    dest_name = self.rooms[dest].name if dest in self.rooms else dest
                    output.append(f"    {direction} -> [room.name]{dest_name}[/room.name]")
            else:
                output.append("    No exits")
        return "\n".join(output)

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
                self.console.print("Please answer 'yes' or 'no'.")
                continue

    def drop(self, item: str) -> str:
        item_to_drop = self.find_item(item, look_in_inventory=True, look_in_room=False)
        if item_to_drop:
            self.state.inventory.remove(item_to_drop)
            self.state.current_room.items.append(item_to_drop)
            return f"You drop the [item.name]{item_to_drop.get_name()}[/item.name]."
        return f"You don't have a '{item}' to drop."

    def take(self, item: str) -> str:
        item_to_take = self.find_item(item, look_in_inventory=False, look_in_room=True)
        if not item_to_take:
            return f"There is no '{item}' here to take."
        if not item_to_take.can_be_carried():
            return f"You can't take the [item.name]{item_to_take.get_name()}[/item.name]."
        self.state.current_room.items.remove(item_to_take)
        self.state.inventory.append(item_to_take)
        
        # Call picked_up on the item
        pickup_message = item_to_take.picked_up(self.state)
        
        response = f"You take the [item.name]{item_to_take.get_name()}[/item.name]."
        if pickup_message:
            response += " " + pickup_message
        return response

    def inventory(self) -> str:
        if not self.state.inventory:
            return "Your inventory is empty."
        lines = ["[bold]You are carrying:[/bold]"]
        for item in self.state.inventory:
            lines.append(f"- [item.name]{item.get_name()}[/item.name]")
        return "\n".join(lines)

    def talk(self, target: str) -> str:
        if not target:
            return "Talk to whom?"
        character_to_talk_to = self.find_character(target)
        if character_to_talk_to:
            return character_to_talk_to.talk_to(self.state)
        else:
            return f"There is no character named '[character.name]{target}[/character.name]' here to talk to."

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
            return f"You don't have any '{item_name}' to give."

        # Check if character is in the room
        character_to_receive = self.find_character(character_name)
        if not character_to_receive:
            return f"There is no character named '{character_name.capitalize()}' here."

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
            return f"There is no character named '{character_name.capitalize()}' here."

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
                return f"You don't see a '{item_name_2}' to use with the [item.name]{item_obj_1.get_name()}[/item.name]."

            if item_obj_1 == item_obj_2:
                return f"You can't use the [item.name]{item_obj_1.get_name()}[/item.name] with itself."

            return item_obj_1.use_with(self.state, item_obj_2)

        # --- Handle single-item usage ---
        else:
            return item_obj_1.use(self.state)

    def cast(self, command_args: str) -> str:
        # Try to split for "cast <spell> on <target>"
        parts = command_args.lower().split(' on ', 1)
        spell_name = parts[0].strip()
        target_name = None
        if len(parts) > 1:
            target_name = parts[1].strip()

        spell_to_cast = None
        for spell_obj in self.state.known_spells:
            if spell_obj.get_name().lower() == spell_name:
                spell_to_cast = spell_obj
                break
        
        if not spell_to_cast:
            return f"You don't know any spell called '{spell_name}'."

        target_item = None
        if target_name:
            target_item = self.find_item(target_name, look_in_inventory=True, look_in_room=True)
            if not target_item:
                return f"You don't see a '{target_name}' to cast [spell.name]{spell_name}[/spell.name] on."
            return spell_to_cast.cast(self.state, target_item) # Pass game_state and target_item
        else:
            # Spells that don't require a target
            return spell_to_cast.cast(self.state) # Pass game_state only

    def learn(self, spell: Spell) -> str:
        if spell not in self.state.known_spells:
            self.state.known_spells.append(spell)
            return f"You have learned the [spell.name]{spell.get_name()}[/spell.name] spell!"
        else:
            return f"You already know the [spell.name]{spell.get_name()}[/spell.name] spell."

    def spells(self) -> str: # Method to list known spells
        if not self.state.known_spells:
            return "You don't know any spells yet."
        
        output = ["[bold]Known Spells:[/bold]"]
        for spell_obj in self.state.known_spells:
            output.append(f"  - [spell.name]{spell_obj.get_name()}[/spell.name]: {spell_obj.get_description()}")
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
            return f"You don't see a '{target}' to listen to here or in your inventory."

    def rest(self) -> str:
        return self.state.current_room.rest(self.state)

    def open(self, target: str) -> str:
        if not target:
            return "Open what?"
        item_to_open = self.find_item(target, look_in_inventory=True, look_in_room=True)
        if item_to_open:
            return item_to_open.open(self.state) # Pass game_state to the item's open method
        else:
            return f"You don't see a '{target}' to open here or in your inventory."

    # --- Not Implemented Methods ---
    def ask(self, target: str) -> str:
        return "The 'ask' command is not yet implemented."

    def show(self, item: str) -> str:
        return "The 'show' command is not yet implemented."

    def trade(self, item: str) -> str:
        return "The 'trade' command is not yet implemented."

    def smell(self, target: str = None) -> str:
        return "The 'smell' command is not yet implemented."

    def taste(self, item: str) -> str:
        return "The 'taste' command is not yet implemented."

    def eat(self, item: str) -> str:
        return "The 'eat' command is not yet implemented."

    def drink(self, item: str) -> str:
        return "The 'drink' command is not yet implemented."

    def equip(self, item: str) -> str:
        return "The 'equip' command is not yet implemented."

    def unequip(self, item: str) -> str:
        return "The 'unequip' command is not yet implemented."

    def close(self, target: str) -> str:
        return "The 'close' command is not yet implemented."

    def save(self) -> str:
        return "The 'save' command is not yet implemented."

    def load(self) -> str:
        return "The 'load' command is not yet implemented."

    def restart(self) -> str:
        return "The 'restart' command is not yet implemented."

    def undo(self) -> str:
        return "The 'undo' command is not yet implemented."

    def redo(self) -> str:
        return "The 'redo' command is not yet implemented."

    def wait(self) -> str:
        return "The 'wait' command is not yet implemented."

    def stats(self) -> str:
        return "The 'stats' command is not yet implemented."
