from prompt_toolkit import PromptSession
from typing import Any
from . import DEV_MODE

class CommandParser:
    """
    Parses and handles player commands for RetroQuest.
    Now calls Game methods directly for each command.
    """
    def __init__(self, game: Any) -> None:
        self.game = game
        self.last_raw: str | None = None

    def parse(self, command: str) -> Any:
        self.last_raw = command
        cmd = command.strip().lower()
        # Movement
        if cmd in ('go north', 'move north', 'north', 'n'):
            return self.game.move('north')
        elif cmd in ('go south', 'move south', 'south', 's'):
            return self.game.move('south')
        elif cmd in ('go east', 'move east', 'east', 'e'):
            return self.game.move('east')
        elif cmd in ('go west', 'move west', 'west', 'w'):
            return self.game.move('west')
        elif cmd.startswith('enter '):
            # Argument for "enter [location]" is cmd[len('enter '):].strip()
            # Current game.move('in') does not take an argument.
            return self.game.move('in', cmd[len('enter '):].strip()) 
        elif cmd in ('go in', 'go inside'):
            return self.game.move('in')
        elif cmd.startswith('leave '):
            # Argument for "leave [location]" is cmd[len('leave '):].strip()
            return self.game.move('out', cmd[len('leave '):].strip()) # Assuming 'out' handles the context
        elif cmd.startswith('exit '): # Handles "exit [location]" as per Commands.md
            # Argument for "exit [location]" is cmd[len('exit '):].strip()
            return self.game.move('out', cmd[len('exit '):].strip()) # Assuming 'out' handles the context
        elif cmd == 'go out':
            return self.game.move('out')
        elif cmd.startswith('climb '):
            # Argument for "climb [object]" is cmd[len('climb '):].strip()
            return self.game.move('up', cmd[len('climb '):].strip()) # Assuming 'up' handles the object context
        elif cmd.startswith('ascend '):
            # Argument for "ascend [object]" is cmd[len('ascend '):].strip()
            return self.game.move('up', cmd[len('ascend '):].strip()) # Assuming 'up' handles the object context
        elif cmd.startswith('descend '):
            # Argument for "descend [object]" is cmd[len('descend '):].strip()
            return self.game.move('down', cmd[len('descend '):].strip()) # Assuming 'down' handles the object context
        elif cmd.startswith('go down '): # Matches "go down [object]"
            # Argument for "go down [object]" is cmd[len('go down '):].strip()
            return self.game.move('down', cmd[len('go down '):].strip()) # Assuming 'down' handles the object context
        elif cmd.startswith('follow '):
            arg = cmd[len('follow '):].strip()
            return self.game.move('follow', arg)
        elif cmd.startswith('walk '):
            arg = cmd[len('walk '):].strip()
            return self.game.move('follow', arg) # Assuming 'walk' is an alias for 'follow' functionality

        # Interaction
        elif any(cmd.startswith(prefix) for prefix in ('talk to ', 'speak to ', 'converse with ')):
            for prefix in ('talk to ', 'speak to ', 'converse with '):
                if cmd.startswith(prefix):
                    return self.game.talk(cmd[len(prefix):])
        elif any(cmd.startswith(prefix) for prefix in ('give ', 'hand ')): # e.g. give bread to grandmother
            # This will pass "bread to grandmother". Game.give needs to parse it.
            for prefix in ('give ', 'hand '):
                if cmd.startswith(prefix):
                    return self.game.give(cmd[len(prefix):])
        elif cmd.startswith('buy '): # e.g. buy rope from shopkeeper
            # This will pass "rope from shopkeeper". Game.buy needs to parse it.
            return self.game.buy(cmd[len('buy '):])
        
        # Examination
        elif cmd in ('look around', 'look', 'observe', 'survey', 'l'):
            return self.game.look()
        elif any(cmd.startswith(prefix) for prefix in ('look at ', 'inspect ', 'examine ', 'check ', 'look ')):
            for prefix in ('look at ', 'inspect ', 'examine ', 'check ', 'look '):
                if cmd.startswith(prefix):
                    return self.game.examine(cmd[len(prefix):])
        elif cmd.startswith('read '):
            return self.game.read(cmd[len('read '):])
        elif cmd == 'search' or cmd == 'investigate':
            return self.game.search()
        elif cmd.startswith('listen to '):
            return self.game.listen(cmd[len('listen to '):])

        # Inventory Management
        elif any(cmd.startswith(prefix) for prefix in ('take ', 'pick up ', 'grab ', 'get ')):
            for prefix in ('take ', 'pick up ', 'grab ', 'get '):
                if cmd.startswith(prefix):
                    return self.game.take(cmd[len(prefix):])
        elif any(cmd.startswith(prefix) for prefix in ('drop ', 'discard ')):
            for prefix in ('drop ', 'discard '):
                if cmd.startswith(prefix):
                    return self.game.drop(cmd[len(prefix):])
        elif cmd.startswith('use '):
            args_str = cmd[len('use '):]
            if ' with ' in args_str:
                parts = args_str.split(' with ', 1)
                item1_name = parts[0].strip()
                item2_name = parts[1].strip()
                if not item1_name or not item2_name:
                    return "You need to specify two items to use with each other. Format: use <item1> with <item2>"
                return self.game.use(item1_name, item2_name)
            else:
                item_name = args_str.strip()
                if not item_name:
                    return "What do you want to use?"
                return self.game.use(item_name) # General item usage
        elif any(cmd.startswith(prefix) for prefix in ('eat ', 'consume ')):
            for prefix in ('eat ', 'consume '):
                if cmd.startswith(prefix):
                    return self.game.eat(cmd[len(prefix):])
        elif cmd.startswith('drink '):
            return self.game.drink(cmd[len('drink '):])
        elif any(cmd.startswith(prefix) for prefix in ('equip ', 'wear ')):
            for prefix in ('equip ', 'wear '):
                if cmd.startswith(prefix):
                    return self.game.equip(cmd[len(prefix):])
        elif any(cmd.startswith(prefix) for prefix in ('unequip ', 'remove ')):
            for prefix in ('unequip ', 'remove '):
                if cmd.startswith(prefix):
                    return self.game.unequip(cmd[len(prefix):])
        elif cmd in ('inventory', 'i', 'inv'):
            return self.game.inventory()
        elif cmd.startswith('open '):
            return self.game.open(cmd[len('open '):])
        elif cmd.startswith('close '):
            return self.game.close(cmd[len('close '):])

        # Magic
        elif cmd.startswith('cast '): # Handles "cast [spell]" and "cast [spell] on [target]"
            # game.cast will receive the full string after "cast ", e.g., "revive" or "fireball on goblin"
            return self.game.cast(cmd[len('cast '):])
        elif cmd == 'spells':
            return self.game.spells() # Assumes game.spells() method exists

        # Game Management
        elif cmd in ('save game', 'save'):
            return self.game.save()
        elif cmd in ('load game', 'load'):
            return self.game.load()
        elif cmd in ('help', '?'):
            return self.game.help()
        elif cmd in ('quit', 'exit'):
            return self.game.quit()

        # Miscellaneous
        elif cmd in ('sleep', 'rest'):
            return self.game.rest()
        elif cmd == 'map':
            return self.game.map()
        elif cmd == 'stats':
            return self.game.stats()
        elif cmd.startswith('dev_execute_commands ') and DEV_MODE:
            filename = cmd[len('dev_execute_commands '):].strip()
            return self.game.dev_execute_commands(filename)
        else:
            return self.game.unknown(cmd)
