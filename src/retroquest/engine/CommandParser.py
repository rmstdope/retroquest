"""Command parser for processing player input in RetroQuest."""
from __future__ import annotations

from typing import Any, TYPE_CHECKING

_ACT_1_CHEAT_COMMANDS: list[str] = [
    "use lantern", "take bread", "use journal", "talk to grandmother",
    "e", "talk to villager", "w", "s", "take carrot", "use hoe",
    "take knife", "s", "take egg", "take feather",
    "use bread with chicken", "take key", "n", "e", "examine well",
    "e", "take horseshoe", "talk to blacksmith",
    "give coin to blacksmith", "w", "w", "use hoe", "n", "e", "n",
    "talk to mira", "s", "e", "buy rope from shopkeeper", "w",
    "take bucket", "talk to villager", "w", "s", "use hoe", "e",
    "use bucket with well", "s", "use key with door", "take shovel",
    "search", "take fishing rod", "take magnet", "s",
    "use rope with mechanism", "take fragment", "e", "take stone",
    "talk to fisherman", "use rod with river",
    "give fish to fisherman", "s", "use knife with vines",
    "take stick", "s", "take pebble", "s", "e", "take saw",
    "use fishing rod with magnet",
    "use stick with magnetic fishing rod",
    "w", "n", "n", "n", "w", "n", "n", "e",
    "give millstone fragment to blacksmith", "w", "s", "s", "e",
    "s", "s", "rest", "take rare flower", "n", "n", "w", "n", "n",
    "w", "n", "e", "n", "give rare flower to mira", "s", "w", "s",
    "e", "cast purify on well",
    "use extended magnetic fishing rod with well",
    "cast revive on withered carrot", "s",
    "cast unlock on mysterious box", "open box", "s", "e", "s", "s",
    "cast light", "n", "cast grow on bush", "take wild berries",
    "s", "s", "talk to priest", "n", "n", "n", "w", "n", "n", "e",
    "n", "talk to shopkeeper", "s", "w", "s", "s", "e", "s", "s",
    "s", "use matches with candle", "take locket", "n", "n", "n",
    "w", "n", "n", "w", "n", "give locket to grandmother",
    "cast bless", "s", "e", "s", "s", "e", "s", "s", "s", "e",
    "give shiny ring to merchant",
]

_ACT_2_CHEAT_COMMANDS: list[str] = [
    "take flower", "take stick", "talk to mountain hermit",
    "examine camp", "take pass", "n",
    "give pass to gate captain", "talk to gate captain", "search",
    "take map", "n", "use map", "examine city notice board",
    "talk to town crier", "take flyer", "n",
    "give pass to herald", "talk to castle guard captain", "w",
    "talk to sir cedric", "use training sword",
    "talk to sir cedric", "e", "s", "e",
    "give flyer to master merchant aldric",
    "buy forest survival kit from master merchant aldric",
    "buy enhanced lantern from master merchant aldric",
    "talk to caravan master thorne", "n",
    "talk to innkeeper marcus", "talk to barmaid elena",
    "buy room key from innkeeper marcus", "use key with door",
    "e", "search", "take coins", "take journal", "use journal",
    "w", "s", "buy quality rope from master merchant aldric",
    "w", "n", "w", "w", "give entry pass to court herald",
    "give traveler's journal to historians", "search", "e", "n",
    "give walking stick to families", "talk to local craftsmen",
    "talk to families", "n", "talk to master healer lyria",
    "give healing herbs to master healer lyria", "s", "search",
    "go secret_passage", "cast mend on protective enchantments",
    "talk to spectral librarian", "use ancient chronicle",
    "take crystal focus", "go secret_passage", "n",
    "give crystal focus to master healer lyria",
    "s", "s", "e", "s", "s", "s", "e", "examine stones",
    "talk to forest hermit", "use forest survival kit", "e",
    "take enchanted acorn", "use protective charm",
    "use enhanced lantern", "talk to forest sprites", "s",
    "look at silver-barked tree",
    "give enchanted acorn to ancient tree spirit",
    "take silver leaves", "n", "e", "cast nature_sense",
    "talk to water nymphs", "say tree to water nymphs",
    "say water to water nymphs", "say ants to water nymphs",
    "take crystal-clear water", "take moonflowers", "w", "s",
    "give moonflowers to ancient tree spirit", "n", "w", "w",
    "n", "n", "e", "n",
    "cast greater_heal on barmaid elena",
    "use crystal-clear water with barmaid elena",
    "cast dispel on barmaid elena", "talk to innkeeper marcus",
    "s", "w", "s", "s", "e", "e", "cast forest_speech",
    "use quality rope with ravine", "w", "w", "n", "n", "e",
    "talk to caravan master thorne", "w", "n", "w",
    "talk to training master", "talk to squires", "search",
    "take squire's diary", "use squire's diary", "w",
    "examine secret documents",
    "give secret documents to lord commander", "e",
    "talk to sir cedric", "e", "s", "s", "s", "e", "e", "s", "s",
    "use druidic charm with offering altar", "talk to nyx",
    "n", "n", "w", "w", "n", "n", "n", "w",
]

_ACT_3_CHEAT_COMMANDS: list[str] = [
    "talk to mira", "examine note", "talk to mira",
    "examine mural", "take letter", "examine letter",
    "cast light", "take key", "n", "search",
    "take moon rune shards", "e",
    "cast purify on pillars",
    "use moon rune shards with pillars", "e",
    "use key with locker", "cast unlock on locker",
    "open locker", "take lantern", "w", "s", "search",
    "use lantern with bracket", "use lantern with bracket",
    "use lantern with bracket", "cast light", "e",
    "talk to tide-born guardian",
    "say myself to tide-born guardian", "take crystal",
    "w", "w", "talk to mira", "talk to ash scholar",
    "examine canteen", "take mirror segment", "n", "search",
    "take brass mirror segment", "take binding resin", "e",
    "examine inscription", "examine mirror mount",
    "take brass mirror segment",
    "use brass mirror segment with mirror mount",
    "use binding resin with mirror mount",
    "cast mend on mirror mount", "s", "search", "take ash-fern",
    "take cooled slag", "use cooled slag with ash-fern",
    "n", "e", "use vent stone", "use vent stone", "use vent stone",
    "use heat-ward mix", "s", "rest", "talk to phoenix",
    "say patience to phoenix", "n", "w", "w", "s", "talk to mira",
    "talk to mine overseer", "n", "search",
    "use key with supply crate", "open supply crate",
    "take reinforced braces", "take support straps",
    "take wedge blocks", "e", "examine rock",
    "use reinforced braces with rock", "use wedge blocks with rock",
    "talk to miners", "e", "examine walls", "take rubbings",
    "search", "take old oath scrolls", "w", "s",
    "examine stones", "cast bless on stones",
    "use stones with rubbings", "e", "examine scrolls",
    "talk to ancient dragon", "say oath to ancient dragon",
    "take scale", "w", "w", "talk to mira", "talk to mira",
    "take elixir", "talk to mira",
]

_CHEAT_COMMANDS: dict[str, list[str]] = {
    '1': _ACT_1_CHEAT_COMMANDS,
    '2': _ACT_2_CHEAT_COMMANDS,
    '3': _ACT_3_CHEAT_COMMANDS,
}


class CommandParser:
    """Parses and handles player commands for RetroQuest.

    Uses runtime calls into the Game instance; type hints use forward
    references to avoid circular imports.
    """

    if TYPE_CHECKING:
        from .Game import Game

    def __init__(self, game: "Game", dev_mode: bool = False) -> None:
        self.game = game
        self.last_raw: str | None = None
        self.dev_mode = dev_mode

    def parse(self, command: str) -> Any:
        """Parse and execute a player command, returning the result."""
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
        elif cmd in ('go up', 'move up', 'up'):
            return self.game.move('up')
        elif cmd in ('go down', 'move down', 'down'):
            return self.game.move('down')
        elif cmd.startswith('go '):
            # Handle other directions like "go secret_passage"
            direction = cmd[len('go '):].strip()
            return self.game.move(direction)

        # Interaction
        elif any(cmd.startswith(prefix) for prefix in
                 ('talk to ', 'speak to ', 'converse with ')):
            for prefix in ('talk to ', 'speak to ', 'converse with '):
                if cmd.startswith(prefix):
                    return self.game.talk(cmd[len(prefix):])
        elif cmd.startswith('say '):
            # Handle "say [word] to [character]"
            say_args = cmd[len('say '):].strip()
            if ' to ' in say_args:
                parts = say_args.split(' to ', 1)
                word = parts[0].strip()
                character = parts[1].strip()
                if word and character:
                    return self.game.say(word, character)
                else:
                    return (
                        "You need to specify both what to say and who to say it to. "
                        "Use say <word> to <character>"
                    )
            else:
                return (
                    "You need to specify who to say that to. "
                    "Use say <word> to <character>"
                )
        elif any(cmd.startswith(prefix) for prefix in
                 ('give ', 'hand ')):  # e.g. give bread to grandmother
            # This will pass "bread to grandmother". Game.give needs to parse it.
            for prefix in ('give ', 'hand '):
                if cmd.startswith(prefix):
                    return self.game.give(cmd[len(prefix):])
        elif cmd.startswith('buy '):  # e.g. buy rope from shopkeeper
            # This will pass "rope from shopkeeper". Game.buy needs to parse it.
            return self.game.buy(cmd[len('buy '):])
        # Examination
        elif cmd in ('look', 'observe', 'survey', 'l'):
            return self.game.look()
        elif any(cmd.startswith(prefix) for prefix in
                 ('look at ', 'inspect ', 'examine ', 'check ', 'look ')):
            for prefix in ('look at ', 'inspect ', 'examine ', 'check ', 'look '):
                if cmd.startswith(prefix):
                    return self.game.examine(cmd[len(prefix):])
        elif cmd == 'search' or cmd == 'investigate':
            return self.game.search()

        # Inventory Management
        elif any(cmd.startswith(prefix) for prefix in
                 ('take ', 'pick up ', 'grab ', 'get ')):
            for prefix in ('take ', 'pick up ', 'grab ', 'get '):
                if cmd.startswith(prefix):
                    return self.game.take(cmd[len(prefix):])
        elif any(cmd.startswith(prefix) for prefix in ('drop ', 'discard ')):
            for prefix in ('drop ', 'discard '):
                if cmd.startswith(prefix):
                    return self.game.drop(cmd[len(prefix):])
        elif cmd == 'use':
            return "What do you want to use?"
        elif cmd.startswith('use '):
            # Use the original command (not fully stripped) to preserve trailing spaces
            # to detect incomplete patterns
            original_tail = command[len('use '):]
            stripped_tail = original_tail.strip()
            if not stripped_tail:
                return "What do you want to use?"
            # Detect pattern ending with ' with' meaning second item missing
            if original_tail.lower().rstrip().endswith(' with'):
                return (
                    "You need to specify two items to use with each other. "
                    "Format: use <item1> with <item2>"
                )
            lower_tail = stripped_tail.lower()
            if ' with ' in lower_tail:
                # Split on the first occurrence of ' with ' using the original
                # (case-sensitive) stripped_tail for item names
                split_index = lower_tail.find(' with ')
                item1_name = stripped_tail[:split_index].strip()
                object_name = stripped_tail[split_index + 6:].strip()
                if not item1_name or not object_name:
                    return (
                        "You need to specify two items to use with each other. "
                        "Format: use <item1> with <item2>"
                    )
                return self.game.use(item1_name, object_name)
            else:
                return self.game.use(stripped_tail)  # General single-item usage
        elif cmd in ('inventory', 'i', 'inv'):
            return self.game.inventory()
        elif cmd.startswith('open '):
            return self.game.open(cmd[len('open '):])
        elif cmd.startswith('close '):
            return self.game.close(cmd[len('close '):])

        # Magic
        elif cmd.startswith('cast '):  # Handles "cast [spell]" and "cast [spell] on [target]"
            # game.cast will receive the full string after "cast ", e.g., "revive" or
            # "fireball on goblin"
            return self.game.cast(cmd[len('cast '):])
        elif cmd == 'spells':
            return self.game.spells()  # Assumes game.spells() method exists

        # Game Management
        elif cmd in ('save',) or cmd.startswith('save '):
            if cmd.startswith('save '):
                return self.game.save(cmd[len('save '):].strip())
            return self.game.save()
        elif cmd in ('load',) or cmd.startswith('load '):
            if cmd.startswith('load '):
                return self.game.load(cmd[len('load '):].strip())
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
        elif cmd.startswith('dev_execute_commands ') and self.dev_mode:
            filename = cmd[len('dev_execute_commands '):].strip()
            return self.game.dev_execute_commands(filename)
        elif cmd.startswith('cheat act '):
            act_num = cmd[len('cheat act '):].strip()
            commands = _CHEAT_COMMANDS.get(act_num)
            if commands is not None:
                return self._execute_cheat(commands)
            return self.game.unknown(cmd)
        else:
            return self.game.unknown(cmd)

    def _execute_cheat(self, commands: list[str]) -> str:
        """Execute a sequence of commands and return their combined output."""
        results = []
        for command in commands:
            result = self.parse(command)
            if result is not None:
                results.append(str(result))
        return '\n'.join(results)
