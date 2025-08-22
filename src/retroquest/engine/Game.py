from prompt_toolkit import PromptSession
from prompt_toolkit.completion import NestedCompleter
from rich.console import Console
from rich.theme import Theme
import pickle
import os
import threading
import pygame

from .Character import Character
from .CommandParser import CommandParser
from .GameState import GameState
from .Item import Item
from .Spell import Spell
from . import DEV_MODE
from .Act import Act

class Game:
    """
    Main Game class for RetroQuest: The Awakening.
    Handles the game loop, command parsing, and room transitions.
    """
    def __init__(self, act):
        custom_theme = Theme({
            "character_name": "bold blue",
            "dialogue": "italic cyan",
            "item_name": "bold green",
            "spell.name": "bold magenta",
            "room_name": "bold cyan",
            "quest_name": "red",
            "event": "dim",
            "failure": "bold red",
            "success": "bold green",
            "exits": "bold yellow"
        })
        self.console = Console(theme=custom_theme)
        self.completer = NestedCompleter.from_nested_dict({})
        self.session = PromptSession(completer=self.completer, complete_while_typing=True)
        self.is_running = True
        # Use the first room in act.rooms as the starting room
        starting_room = next(iter(act.rooms.values())) if act.rooms else None
        self.state = GameState(starting_room, all_rooms=act.rooms, all_quests=act.quests)
        self.command_parser = CommandParser(self)
        self.act = act
        self.describe_room = False  # Flag to indicate if we need to describe the room after a command

    def handle_command(self, command: str) -> str:
        result = self.command_parser.parse(command)
        if self.describe_room:
            # If the command resulted in a room change, describe the new room
            self.describe_room = False
            result += self.state.current_room.describe()
        activated = self.state.activate_quests()
        updated = self.state.update_quests()
        completed = self.state.complete_quests()
        responses = [result]
        if activated:
            responses.append('\n')
            responses.append(activated)
        if updated:
            responses.append('\n')
            responses.append(updated)
        if completed:
            responses.append('\n')
            responses.append(completed)
        return "\n".join([r for r in responses if r])

    def start_music(self):
        """Start act music in a separate thread so it doesn't block the prompt."""
        def play_music():
            try:
                pygame.mixer.init()
                pygame.mixer.music.load(self.act.music_file)
                pygame.mixer.music.play(loops=-1)  # Loop indefinitely
            except Exception as e:
                self.console.print(f"[dim]Could not play music: {e}[/dim]")
        threading.Thread(target=play_music, daemon=True).start()

    def get_ascii_logo(self):
        return r'''
Welcome to
[bold yellow]
########  ######### ######## ########   #######   #######  ##     ## #########  #######  ########
##     ## ##           ##    ##     ## ##     ## ##     ## ##     ## ##        ##           ##
##     ## ##           ##    ##     ## ##     ## ##     ## ##     ## ##        ##           ##.
########  #########    ##    ########  ##     ## ##     ## ##     ## #########  #######     ##
##   ##   ##           ##    ##   ##   ##     ## ##  ## ## ##     ## ##               ##    ##.
##    ##  ##           ##    ##    ##  ##     ## ##   #### ##     ## ##        ##     ##    ##.
##     ## #########    ##    ##     ##  #######   #######   #######  #########  #######     ##.
[/bold yellow]
[bold]Music track:[/bold] Market by Conquest
Source: https://freetouse.com/music
Copyright Free Background Music'''

    def print_intro(self):
        self.console.clear()
        self.console.print(self.get_ascii_logo())
        self.session.prompt('Press Enter to continue...')
        self.console.clear()
        self.console.print(self.act.get_act_intro())
        self.session.prompt('Press Enter to continue...')

    def get_command_completions(self):
        # Helper to build nested dict for multi-word item names
        def build_nested_names(names):
            nested = {}
            for name in names:
                parts = name.split()
                d = nested
                for i, part in enumerate(parts):
                    if i == len(parts) - 1:
                        d[part] = None
                    else:
                        if part not in d or not isinstance(d[part], dict):
                            d[part] = {}
                        d = d[part]
            return nested

        all_items = self.state.current_room.get_items() + self.state.inventory
        item_names = [item.get_name().lower() for item in all_items]
        item_short_names = [item.get_short_name().lower() for item in all_items if item.get_short_name()]
        all_item_names = item_names + item_short_names

        inventory_item_names = [item.get_name().lower() for item in self.state.inventory]
        inventory_item_short_names = [item.get_short_name().lower() for item in self.state.inventory if item.get_short_name()]
        all_inventory_item_names = inventory_item_names + inventory_item_short_names

        room_item_names = [item.get_name().lower() for item in self.state.current_room.get_items()]
        room_item_short_names = [item.get_short_name().lower() for item in self.state.current_room.get_items() if item.get_short_name()]
        all_room_item_names = room_item_names + room_item_short_names

        character_names = [char.get_name().lower() for char in self.state.current_room.get_characters()]
        spell_names = [spell.get_name().lower() for spell in self.state.known_spells]
        exit_names = {direction: None for direction in self.state.current_room.get_exits()}
        file_names = {f: None for f in os.listdir('.') if f.endswith('.txt') and os.path.isfile(f)}

        # # Build 'use' completions so that 'with' is suggested only after the full item name
        # use_with_dict = build_nested_names(all_item_names)
        # use_completions = build_command_with_preposition(all_item_names, 'with', use_with_dict)

        # # Build 'give' completions so that 'to' is suggested only after the full item name
        # give_to_dict = build_nested_names(character_names)
        # give_completions = build_command_with_preposition(all_inventory_item_names, 'to', give_to_dict)

        # Build directional completions based on actual exits
        directional_completions = {}
        available_exits = self.state.current_room.get_exits()
        
        # Short directions
        if 'north' in available_exits:
            directional_completions['n'] = None
        if 'south' in available_exits:
            directional_completions['s'] = None
        if 'east' in available_exits:
            directional_completions['e'] = None
        if 'west' in available_exits:
            directional_completions['w'] = None
            
        # Long directions
        for direction in ['north', 'south', 'east', 'west']:
            if direction in available_exits:
                directional_completions[direction] = None

        completions = {
            'go': exit_names,
            'move': exit_names,
            **directional_completions,  # Only include available directions
            # 'enter': None,
            # 'leave': None,
            # 'exit': None,
            # 'climb': build_nested_names(all_item_names),
            # 'ascend': build_nested_names(all_item_names),
            # 'descend': build_nested_names(all_item_names),
            # 'follow': None,
            # 'walk': None,

            'talk': {'to': build_nested_names(character_names)},
            'speak': {'to': build_nested_names(character_names)},
            'converse': {'with': build_nested_names(character_names)},
            'give': {**{k: {'to': {**build_nested_names(character_names)}} for k in all_inventory_item_names}},
            'hand': build_nested_names(all_inventory_item_names),
            'buy': {**{k: {'from': {**build_nested_names(character_names)}} for k in all_room_item_names}},

            'look': {
                'at': {**build_nested_names(all_item_names), **build_nested_names(character_names)},
                **build_nested_names(all_item_names),
                **build_nested_names(character_names),
            },
            'l': None,
            'observe': None,
            'survey': None,
            'inspect': {**build_nested_names(all_item_names), **build_nested_names(character_names)},
            'examine': {**build_nested_names(all_item_names), **build_nested_names(character_names)},
            'check': {**build_nested_names(all_item_names), **build_nested_names(character_names)},
            'read': build_nested_names(all_item_names),
            'search': None,
            'investigate': None,
            # 'listen': {'to': build_nested_names(all_item_names)},

            'take': build_nested_names(all_room_item_names),
            'pick': {'up': build_nested_names(all_room_item_names)},
            'grab': build_nested_names(all_room_item_names),
            'get': build_nested_names(all_room_item_names),
            'drop': build_nested_names(all_inventory_item_names),
            'discard': build_nested_names(all_inventory_item_names),
            'use': {**{k: {'@': None, 'with': {**build_nested_names(all_item_names), **build_nested_names(character_names)}} for k in all_item_names}},
            # 'eat': build_nested_names(all_inventory_item_names),
            # 'consume': build_nested_names(all_inventory_item_names),
            # 'drink': build_nested_names(all_inventory_item_names),
            # 'equip': build_nested_names(all_inventory_item_names),
            # 'wear': build_nested_names(all_inventory_item_names),
            # 'unequip': build_nested_names(all_inventory_item_names),
            # 'remove': build_nested_names(all_inventory_item_names),
            'inventory': None, 'i': None, 'inv': None,
            'open': build_nested_names(all_item_names),
            'close': build_nested_names(all_item_names),

            'cast': {**{k: {'@': None, 'on': {**build_nested_names(all_item_names), **build_nested_names(character_names)}} for k in spell_names}},
            'spells': None,

            'save': None,
            'load': None,
            'help': None, '?': None,
            'quit': None, 'exit': None,

            'sleep': None,
            'rest': None,
            'map': None,
            'stats': None,
        }

        # Add dev_execute_commands to completions if DEV_MODE is True
        if DEV_MODE:
            completions['dev_execute_commands'] = file_names

        # Process completions to split multi-word keys into nested levels
        def split_multiword_keys(comp_dict):
            if not isinstance(comp_dict, dict):
                return comp_dict
                
            new_dict = {}
            for key, value in comp_dict.items():
                parts = key.split()
                if len(parts) > 1:
                    # Multi-word key, create nested structure
                    d = new_dict
                    for i, part in enumerate(parts):
                        if i == len(parts) - 1:
                            # Last part, assign the recursively processed value
                            d[part] = split_multiword_keys(value)
                        else:
                            # Intermediate part, create nested dict if needed
                            if part not in d:
                                d[part] = {}
                            elif not isinstance(d[part], dict):
                                # If it's not a dict, convert it to one
                                d[part] = {}
                            d = d[part]
                else:
                    # Single word key, recursively process the value
                    new_dict[key] = split_multiword_keys(value)
            return new_dict

        completions = split_multiword_keys(completions)

        return completions

    def run(self) -> None:
        self.start_music()
        self.print_intro()
        self.console.clear()
        response = self.handle_command('look')  # Initial look at the room
        # Print a separator line before any output after a command
        self.console.print('\n' + response + '\n')
        while self.is_running:
            completions = self.get_command_completions()
            self.session.completer = NestedCompleter.from_nested_dict(completions)
            user_input = self.session.prompt('> ')
            self.state.history.append(user_input)
            response = self.handle_command(user_input)
            # Print a separator line before any output after a command
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
        
        # Special handling for MainSquare navigation restriction
        if (self.state.current_room.name == "Main Square" and 
            not self.state.get_story_flag("used_city_map") and 
            direction != "south"):
            # Check if this would have been a valid direction with the map
            all_exits = self.state.current_room.exits  # Get unrestricted exits
            if direction in all_exits:
                return ("[event]You wander through Greendale's winding streets, but without a proper map to guide you, "
                       "you quickly become lost in the maze of alleys and buildings. Eventually, you find your way "
                       "back to the Main Square, feeling disoriented.[/event]")
        
        if direction in exits:
            next_room_key = exits[direction]
            if next_room_key in self.state.all_rooms:
                self.state.current_room = self.state.all_rooms[next_room_key]
                self.state.current_room.on_enter(self.state)
                self.state.mark_visited(self.state.current_room)
                self.describe_room = True
                return f"[event]You move {direction} to [room_name]{self.state.current_room.name}[/room_name].[/event]\n\n"
            else:
                return "[failure]That exit leads nowhere (room not found).[/failure]"
        else:
            return "[failure]You can't go that way.[/failure]"

    def help(self, arg: str = None) -> str:
        return (
            "[bold]Available Commands:[/bold]\n"
            "\n"
            "[bold]Movement:[/bold]\n"
            "  go <direction>, move <direction>, <direction>, <short_direction> (e.g., go north, n)\n"
            #"  enter <location>, go in, go inside\n"
            #"  leave <location>, exit <location>, go out\n"
            #"  climb <object>, ascend <object>\n"
            #"  descend <object>, go down <object>\n"
            #"  follow <path>, walk <path>\n"
            "\n"
            "[bold]Interaction:[/bold]\n"
            "  talk to <character>, speak to <character>, converse with <character>\n"
            "  say <word(s)> to <character>\n"
            "  give <item> to <character>, hand <item> to <character>\n"
            "  buy <item> from <character>\n"
            "\n"
            "[bold]Examination:[/bold]\n"
            "  look, observe, survey, l\n"
            "  look at <object>, inspect <object>, examine <object>, check <object>\n"
            "  search, investigate\n"
            #"  listen to <object/location>\n"
            "\n"
            "[bold]Inventory Management:[/bold]\n"
            "  take <item>, pick up <item>, grab <item>, get <item>\n"
            "  drop <item>, discard <item>\n"
            "  use <item>, use <item> with <item>\n"
            #"  eat <item>, consume <item>\n"
            #"  drink <item>\n"
            #"  equip <item>, wear <item>\n"
            #"  unequip <item>, remove <item>\n"
            "  inventory, i, inv\n"
            "  open <container>\n"
            "  close <container>\n"
            "\n"
            "[bold]Magic:[/bold]\n"
            "  cast <spell>\n"
            "  cast <spell> on <object/character>\n"
            "  spells\n"
            "\n"
            "[bold]Game Management:[/bold]\n"
            "  save, load\n"
            "  help, ?\n"
            "  quit, exit\n"
            "\n"
            "[bold]Miscellaneous:[/bold]\n"
            "  sleep, rest\n"
            "  map\n"
            "  stats\n"
        )

    def look(self) -> str:
        self.describe_room = True
        return "[event]You take a look at your surroundings.[/event]\n\n"

    def examine(self, target: str) -> str:
        if not target:  # Check if target is an empty string or None
            return "Examine what?"
        
        # Check for items and characters as usual
        item_to_examine = self.find_item(target)
        if item_to_examine:
            return item_to_examine.examine(self.state)
        character_to_examine = self.find_character(target)
        if character_to_examine:
            return character_to_examine.examine(self.state)
        return f"You don't see any '{target}' here."

    def map(self) -> str:
        # Print all visited rooms and their exits, each exit on a new indented line
        visited = set(self.state.visited_rooms)
        room_objs = {name: room for name, room in self.state.all_rooms.items() if room.name in visited}
        if not room_objs:
            return "No rooms visited yet."
        output = ["[bold]Visited Rooms and Exits:[/bold]"]
        for name, room in room_objs.items():
            exits = room.get_exits()
            output.append(f"- [room_name]{room.name}[/room_name]:")
            if exits:
                for direction, dest in exits.items():
                    dest_name = self.state.all_rooms[dest].name if dest in self.state.all_rooms else dest
                    output.append(f"    {direction} -> [room_name]{dest_name}[/room_name]")
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
            return f"You drop the [item_name]{item_to_drop.get_name()}[/item_name]."
        return f"[failure]You don't have a '{item}' to drop.[/failure]"

    def take(self, item: str) -> str:
        item_to_take = self.find_item(item, look_in_inventory=False, look_in_room=True)
        if not item_to_take:
            return f"[failure]There is no '{item}' here to take.[/failure]"
        no_pickup = item_to_take.prevent_pickup()
        if no_pickup:
            # If the item has a prevent_pickup method that returns a message, use that
            return f"{no_pickup}"
        self.state.current_room.items.remove(item_to_take)
        self.state.inventory.append(item_to_take)

        # Call picked_up on the item
        pickup_message = item_to_take.picked_up(self.state)

        response = f"[event]You take the [item_name]{item_to_take.get_name()}[/item_name].[/event]"
        if pickup_message:
            response += " " + pickup_message
        return response

    def inventory(self) -> str:
        if not self.state.inventory:
            return "Your inventory is empty."
        lines = ["[bold]You are carrying:[/bold]"]
        for item in self.state.inventory:
            lines.append(f"- [item_name]{item.get_name()}[/item_name]")
        return "\n".join(lines)

    def talk(self, target: str) -> str:
        if not target:
            return "[failure]Talk to whom?[/failure]"
        character_to_talk_to = self.find_character(target)
        if character_to_talk_to:
            return character_to_talk_to.talk_to(self.state)
        else:
            return f"[failure]There is no character named '[character_name]{target}[/character_name]' here to talk to.[/failure]"

    def say(self, word: str, character_name: str) -> str:
        """Say a specific word or phrase to a character."""
        if not word:
            return "[failure]What do you want to say?[/failure]"
        if not character_name:
            return "[failure]Who do you want to say that to?[/failure]"
            
        character_to_speak_to = self.find_character(character_name)
        if character_to_speak_to:
            return character_to_speak_to.say_to(word, self.state)
        else:
            return f"[failure]There is no character named '[character_name]{character_name}[/character_name]' here to speak to.[/failure]"

    def split_command(self, command_args: str, command: str, delimiter: str) -> tuple:
        # Expected format: "<command> <item/character_name> <delimiter> <item/character_name>"
        parts = command_args.lower().split()
        if delimiter not in parts:
            return None, None, f"[failure]Invalid command format. Please use '{command} <target1> {delimiter} <target2>'.[/failure]"
        del_index = parts.index(delimiter)
        if del_index == 0: # No target1 provided
            return None, None, f"[failure]What do you want to {command}?[/failure]"
        target1 = " ".join(parts[:del_index])
        if del_index >= len(parts) - 1: # No target2 provided
            return None, None, f"[failure]Who/What should I {command} {target1} {delimiter}?[/failure]"
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
            return f"[failure]You don't have any '{item_name}' to give.[/failure]"

        # Check if character is in the room
        character_to_receive = self.find_character(character_name)
        if not character_to_receive:
            return f"[failure]There is no character named '{character_name.capitalize()}' here.[/failure]"

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
            return f"[failure]There is no character named '{character_name.capitalize()}' here.[/failure]"

        return character_to_buy_from.buy_item(item_name, self.state)

    def read(self, item: str) -> str:
        if not item:  # Check if item name is empty or None
            return "[failure]Read what?[/failure]"

        item_to_read = self.find_item(item, look_in_inventory=True, look_in_room=True)

        if item_to_read:
            # As per the prompt, all Item objects are assumed to have a .read(game_state) method.
            # If an item is not meant to be read, its read() method should return an appropriate message.
            return item_to_read.read(self.state)
        else:
            return f"[failure]You don't see a '{item}' to read here or in your inventory.[/failure]"

    def use(self, item_name_1: str, item_name_2: str = None) -> str:
        item_obj_1 = self.find_item(item_name_1, look_in_inventory=True, look_in_room=True)

        if not item_obj_1:
            return f"[failure]You don't have a '{item_name_1}' to use, and there isn't one here.[/failure]"

        # --- Handle two-item usage ---
        if item_name_2:
            item_obj_2 = self.find_item(item_name_2, look_in_inventory=True, look_in_room=True)

            if not item_obj_2:
                return f"[failure]You don't see a '{item_name_2}' to use with the [item_name]{item_obj_1.get_name()}[/item_name].[/failure]"

            if item_obj_1 == item_obj_2:
                return f"[failure]You can't use the [item_name]{item_obj_1.get_name()}[/item_name] with itself.[/failure]"

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
            return f"[failure]You don't know any spell called '{spell_name}'.[/failure]"

        target_item = None
        target_character = None
        if target_name:
            # First try to find an item
            target_item = self.find_item(target_name, look_in_inventory=True, look_in_room=True)
            if not target_item:
                # If no item found, try to find a character
                target_character = self.find_character(target_name)
                if not target_character:
                    return f"[failure]You don't see a '{target_name}' to cast [spell_name]{spell_name}[/spell_name] on.[/failure]"
            
            # Cast spell on the found target (item or character)
            if target_item:
                return spell_to_cast.cast_on_item(self.state, target_item) # Pass game_state and target_item
            else:
                return spell_to_cast.cast_on_character(self.state, target_character) # Pass game_state and target_character
        else:
            # Spells that don't require a target
            return spell_to_cast.cast_spell(self.state) # Pass game_state only

    def learn(self, spell: Spell) -> str:
        if spell not in self.state.known_spells:
            self.state.known_spells.append(spell)
            return f"[event]You have learned the [spell_name]{spell.get_name()}[/spell_name] spell![/event]"

    def spells(self) -> str: # Method to list known spells
        if not self.state.known_spells:
            return "You don't know any spells yet."

        output = ["[bold]Known Spells:[/bold]"]
        for spell_obj in self.state.known_spells:
            output.append(f"  - [spell_name]{spell_obj.get_name()}[/spell_name]: {spell_obj.get_description()}")
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
            return f"[failure]You don't see a '{target}' to listen to here or in your inventory.[/failure]"

    def rest(self) -> str:
        return self.state.current_room.rest(self.state)

    def open(self, target: str) -> str:
        if not target:
            return "[failure]Open what?[/failure]"
        item_to_open = self.find_item(target, look_in_inventory=True, look_in_room=True)
        if item_to_open:
            return item_to_open.open(self.state) # Pass game_state to the item's open method
        else:
            return f"[failure]You don't see a '{target}' to open here or in your inventory.[/failure]"

    def close(self, target: str) -> str:
        if not target:
            return "[failure]Close what?[/failure]"
        item_to_close = self.find_item(target, look_in_inventory=True, look_in_room=True)
        if item_to_close:
            return item_to_close.close(self.state) # Pass game_state to the item's close method
        else:
            return f"[failure]You don't see a '{target}' to close here or in your inventory.[/failure]"

    def eat(self, item: str) -> str:
        if not item:
            return "[failure]Eat what?[/failure]"
        item_to_eat = self.find_item(item, look_in_inventory=True, look_in_room=True)
        if item_to_eat:
            return item_to_eat.eat(self.state)
        else:
            return f"[failure]You don't see a '{item}' to eat here or in your inventory.[/failure]"

    def drink(self, item: str) -> str:
        if not item:
            return "[failure]Drink what?[/failure]"
        item_to_drink = self.find_item(item, look_in_inventory=True, look_in_room=True)
        if item_to_drink:
            return item_to_drink.drink(self.state)
        else:
            return f"[failure]You don't see a '{item}' to drink here or in your inventory.[/failure]"

    def equip(self, item: str) -> str:
        if not item:
            return "[failure]Equip what?[/failure]"
        item_to_equip = self.find_item(item, look_in_inventory=True, look_in_room=True)
        if item_to_equip:
            return item_to_equip.equip(self.state)
        else:
            return f"[failure]You don't see a '{item}' to equip here or in your inventory.[/failure]"

    def unequip(self, item: str) -> str:
        if not item:
            return "[failure]Unequip what?[/failure]"
        item_to_unequip = self.find_item(item, look_in_inventory=True, look_in_room=True)
        if item_to_unequip:
            return item_to_unequip.unequip(self.state)
        else:
            return f"[failure]You don't see a '{item}' to unequip here or in your inventory.[/failure]"

    def save(self) -> str:
        try:
            with open('retroquest.save', 'wb') as f:
                pickle.dump(self.state, f)
            return "[event]Game saved successfully.[/event]"
        except Exception as e:
            return f"[failure]Failed to save game: {e}[/failure]"

    def load(self) -> str:
        if not os.path.exists('retroquest.save'):
            return "[failure]No save file found.[/failure]"
        try:
            with open('retroquest.save', 'rb') as f:
                self.state = pickle.load(f)
            return "[event]Game loaded successfully.[/event]"
        except Exception as e:
            return f"[failure]Failed to load game: {e}[/failure]"

    def stats(self) -> str:
        return self.state.stats()

    def dev_execute_commands(self, filename: str) -> str:
        """
        Execute a list of commands from a file, one per line, for dev/testing purposes.
        Returns a summary of the results.
        """
        if not os.path.exists(filename):
            return f"[failure]File not found: {filename}[/failure]"
        results = []
        with open(filename, 'r') as f:
            for line in f:
                command = line.strip()
                if not command or command.startswith('#'):
                    continue  # Skip empty lines and comments
                result = self.handle_command(command)
                results.append(f"> {command}\n{result}")
        return "\n".join(results)
