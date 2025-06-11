from prompt_toolkit import PromptSession
from typing import Any

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
        if cmd in ('go north', 'north', 'n', 'move north'):
            return self.game.move('north')
        elif cmd in ('go south', 'south', 's', 'move south'):
            return self.game.move('south')
        elif cmd in ('go east', 'east', 'e', 'move east'):
            return self.game.move('east')
        elif cmd in ('go west', 'west', 'w', 'move west'):
            return self.game.move('west')
        elif cmd.startswith(('enter ', 'go in', 'go inside', 'move in', 'move inside')):
            return self.game.move('in')
        elif cmd.startswith(('leave ', 'exit ', 'go out', 'move out')):
            return self.game.move('out')
        elif cmd.startswith(('climb ', 'ascend ', 'move up')):
            return self.game.move('up')
        elif cmd.startswith(('descend ', 'go down ', 'move down')):
            return self.game.move('down')
        elif cmd.startswith(('follow ', 'walk ', 'move ')):
            arg = cmd.split(' ', 1)[1] if ' ' in cmd else None
            return self.game.move('follow', arg)
        # Interaction
        elif any(cmd.startswith(prefix) for prefix in ('talk to ', 'speak to ', 'converse with ', 'talk ')):
            for prefix in ('talk to ', 'speak to ', 'converse with ', 'talk '):
                if cmd.startswith(prefix):
                    return self.game.talk(cmd[len(prefix):])
        elif any(cmd.startswith(prefix) for prefix in ('ask ', 'question ')):
            for prefix in ('ask ', 'question '):
                if cmd.startswith(prefix):
                    return self.game.ask(cmd[len(prefix):])
        elif any(cmd.startswith(prefix) for prefix in ('give ', 'hand ')):
            for prefix in ('give ', 'hand '):
                if cmd.startswith(prefix):
                    return self.game.give(cmd[len(prefix):])
        elif cmd.startswith('show '):
            return self.game.show(cmd[5:])
        elif any(cmd.startswith(prefix) for prefix in ('trade ', 'exchange ')):
            for prefix in ('trade ', 'exchange '):
                if cmd.startswith(prefix):
                    return self.game.trade(cmd[len(prefix):])
        elif any(cmd.startswith(prefix) for prefix in ('help ', 'assist ')):
            for prefix in ('help ', 'assist '):
                if cmd.startswith(prefix):
                    return self.game.help(cmd[len(prefix):])
        # Examination
        elif cmd in ('look around', 'look', 'observe', 'survey'):
            return self.game.look()
        elif any(cmd.startswith(prefix) for prefix in ('look at ', 'inspect ', 'examine ', 'check ')):
            for prefix in ('look at ', 'inspect ', 'examine ', 'check '):
                if cmd.startswith(prefix):
                    return self.game.examine(cmd[len(prefix):])
        elif cmd.startswith('read '):
            return self.game.read(cmd[5:])
        elif any(cmd.startswith(prefix) for prefix in ('search ', 'investigate ')):
            for prefix in ('search ', 'investigate '):
                if cmd.startswith(prefix):
                    return self.game.search(cmd[len(prefix):])
        elif cmd.startswith('listen'):
            return self.game.listen(cmd[6:].strip() if len(cmd) > 6 else None)
        elif any(cmd.startswith(prefix) for prefix in ('smell', 'sniff')):
            for prefix in ('smell', 'sniff'):
                if cmd.startswith(prefix):
                    return self.game.smell(cmd[len(prefix):].strip() if len(cmd) > len(prefix) else None)
        elif cmd.startswith('taste '):
            return self.game.taste(cmd[6:])
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
            return self.game.use(cmd[4:])
        elif any(cmd.startswith(prefix) for prefix in ('eat ', 'consume ')):
            for prefix in ('eat ', 'consume '):
                if cmd.startswith(prefix):
                    return self.game.eat(cmd[len(prefix):])
        elif cmd.startswith('drink '):
            return self.game.drink(cmd[6:])
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
            return self.game.open(cmd[5:])
        elif cmd.startswith('close '):
            return self.game.close(cmd[6:])
        # Magic
        elif any(cmd.startswith(prefix) for prefix in ('cast ', 'use ')):
            for prefix in ('cast ', 'use '):
                if cmd.startswith(prefix):
                    return self.game.cast(cmd[len(prefix):])
        elif cmd.startswith('learn '):
            return self.game.learn(cmd[6:])
        elif cmd == 'use magic stone':
            return self.game.use_magic_stone()
        elif cmd in ('heal self', 'cast heal'):
            return self.game.heal()
        elif cmd in ('reveal hidden door', 'cast reveal'):
            return self.game.reveal()
        # Game Management
        elif cmd in ('save game', 'save'):
            return self.game.save()
        elif cmd in ('load game', 'load'):
            return self.game.load()
        elif cmd in ('help', '?'):
            return self.game.help()
        elif cmd in ('quit', 'exit'):
            return self.game.quit()
        elif cmd == 'restart':
            return self.game.restart()
        elif cmd == 'undo':
            return self.game.undo()
        elif cmd == 'redo':
            return self.game.redo()
        # Miscellaneous
        elif cmd in ('wait', 'pause'):
            return self.game.wait()
        elif cmd in ('sleep', 'rest'):
            return self.game.sleep()
        elif cmd in ('map'):
            return self.game.map()
        elif cmd in ('stats'):
            return self.game.stats()
        else:
            return self.game.unknown(command)
