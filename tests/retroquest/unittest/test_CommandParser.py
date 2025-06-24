import pytest
from engine.CommandParser import CommandParser

class DummyGame:
    def __init__(self):
        self.calls = []
    def move(self, direction, arg=None):
        self.calls.append(('move', direction, arg))
    def talk(self, target):
        self.calls.append(('talk', target))
    def ask(self, target):
        self.calls.append(('ask', target))
    def give(self, item):
        self.calls.append(('give', item))
    def show(self, item):
        self.calls.append(('show', item))
    def trade(self, item):
        self.calls.append(('trade', item))
    def buy(self, args): # Added for buy command
        self.calls.append(('buy', args))
    def help(self, arg=None): # arg is for "help <target>" which isn't parsed to a separate method yet
        self.calls.append(('help', arg))
    def look(self):
        self.calls.append(('look',))
    def examine(self, target):
        self.calls.append(('examine', target))
    def read(self, item):
        self.calls.append(('read', item))
    def search(self):
        self.calls.append(('search'))
    def listen(self, target=None): # Added this method
        self.calls.append(('listen', target))
    def smell(self, target=None):
        self.calls.append(('smell', target))
    def taste(self, item):
        self.calls.append(('taste', item))
    def take(self, item):
        self.calls.append(('take', item))
    def drop(self, item):
        self.calls.append(('drop', item))
    def use(self, item1, item2=None): # For "use <item>" or "use <item1> with <item2>"
        self.calls.append(('use', item1, item2))
    def eat(self, item):
        self.calls.append(('eat', item))
    def drink(self, item):
        self.calls.append(('drink', item))
    def equip(self, item):
        self.calls.append(('equip', item))
    def unequip(self, item):
        self.calls.append(('unequip', item))
    def inventory(self):
        self.calls.append(('inventory',))
    def open(self, target):
        self.calls.append(('open', target))
    def close(self, target):
        self.calls.append(('close', target))
    def cast(self, spell_and_target): # e.g. "revive" or "fireball on goblin"
        self.calls.append(('cast', spell_and_target))
    def learn(self, spell):
        self.calls.append(('learn', spell))
    def spells(self): # New method based on Commands.md
        self.calls.append(('spells',))
    def save(self):
        self.calls.append(('save',))
    def load(self):
        self.calls.append(('load',))
    def quit(self):
        self.calls.append(('quit',))
    def restart(self):
        self.calls.append(('restart',))
    def undo(self):
        self.calls.append(('undo',))
    def redo(self):
        self.calls.append(('redo',))
    def wait(self):
        self.calls.append(('wait',))
    def rest(self):
        self.calls.append(('rest',))
    def map(self):
        self.calls.append(('map',))
    def stats(self):
        self.calls.append(('stats',))
    def unknown(self, command):
        self.calls.append(('unknown', command))

@pytest.fixture
def game_parser():
    game = DummyGame()
    parser = CommandParser(game)
    return game, parser

def test_movement_commands(game_parser):
    game, parser = game_parser
    commands = {
        "go north": ("move", "north", None),
        "move north": ("move", "north", None),
        "north": ("move", "north", None),
        "n": ("move", "north", None),
        "go south": ("move", "south", None),
        "move south": ("move", "south", None),
        "south": ("move", "south", None),
        "s": ("move", "south", None),
        "go east": ("move", "east", None),
        "move east": ("move", "east", None),
        "east": ("move", "east", None),
        "e": ("move", "east", None),
        "go west": ("move", "west", None),
        "move west": ("move", "west", None),
        "west": ("move", "west", None),
        "w": ("move", "west", None),
        "enter cottage": ("move", "in", "cottage"), # CommandParser sends "cottage" as arg
        "go in": ("move", "in", None),
        "go inside": ("move", "in", None),
        "leave cottage": ("move", "out", "cottage"), # CommandParser sends "cottage" as arg
        "exit room": ("move", "out", "room"), # CommandParser sends "room" as arg
        "go out": ("move", "out", None),
        "climb tree": ("move", "up", "tree"), # CommandParser sends "tree" as arg
        "ascend stairs": ("move", "up", "stairs"), # CommandParser sends "stairs" as arg
        "descend ladder": ("move", "down", "ladder"), # CommandParser sends "ladder" as arg
        "go down path": ("move", "down", "path"), # CommandParser sends "path" as arg
        "follow trail": ("move", "follow", "trail"),
        "walk road": ("move", "follow", "road"), # walk is alias for follow
    }
    expected_calls = []
    for cmd_text, expected_call in commands.items():
        parser.parse(cmd_text)
        expected_calls.append(expected_call)
    assert game.calls == expected_calls

def test_interaction_commands(game_parser):
    game, parser = game_parser
    commands = {
        "talk to mira": ("talk", "mira"),
        "speak to blacksmith": ("talk", "blacksmith"),
        "converse with villager": ("talk", "villager"),
        "give bread to grandmother": ("give", "bread to grandmother"),
        "hand coin to merchant": ("give", "coin to merchant"),
        "buy rope from shopkeeper": ("buy", "rope from shopkeeper"),
        "buy apple from merchant": ("buy", "apple from merchant"),
    }
    expected_calls = []
    for cmd_text, expected_call in commands.items():
        parser.parse(cmd_text)
        expected_calls.append(expected_call)
    assert game.calls == expected_calls

def test_examination_commands(game_parser):
    game, parser = game_parser
    commands = {
        "look around": ("look",),
        "look": ("look",),
        "observe": ("look",),
        "survey": ("look",),
        "look at statue": ("examine", "statue"),
        "inspect scroll": ("examine", "scroll"),
        "examine book": ("examine", "book"),
        "read sign": ("read", "sign"),
        "search": ("search"),
        "investigate": ("search"),
        "listen to door": ("listen", "door"),
    }
    expected_calls = []
    for cmd_text, expected_call in commands.items():
        parser.parse(cmd_text)
        expected_calls.append(expected_call)
    assert game.calls == expected_calls

def test_inventory_management_commands(game_parser):
    game, parser = game_parser
    commands = {
        "take key": ("take", "key"),
        "pick up sword": ("take", "sword"),
        "grab apple": ("take", "apple"),
        "get shield": ("take", "shield"),
        "drop key": ("drop", "key"),
        "discard rock": ("drop", "rock"),
        "use lantern": ("use", "lantern", None),
        "use key with chest": ("use", "key", "chest"), # New test case
        "use bread with chicken": ("use", "bread", "chicken"), # New test case
        "eat bread": ("eat", "bread"),
        "consume apple": ("eat", "apple"),
        "drink water": ("drink", "water"),
        "equip sword": ("equip", "sword"),
        "wear cloak": ("equip", "cloak"),
        "unequip sword": ("unequip", "sword"),
        "remove helmet": ("unequip", "helmet"),
        "inventory": ("inventory",),
        "i": ("inventory",),
        "inv": ("inventory",),
        "open chest": ("open", "chest"),
        "close door": ("close", "door"),
    }
    expected_calls = []
    for cmd_text, expected_call in commands.items():
        parser.parse(cmd_text)
        expected_calls.append(expected_call)
    assert game.calls == expected_calls

def test_magic_commands(game_parser):
    game, parser = game_parser
    # Corrected expected calls based on CommandParser.py
    expected_calls = []
    parser.parse("cast fireball") # Generic cast
    expected_calls.append(("cast", "fireball"))
    parser.parse("cast fireball on goblin") # Generic cast with target
    expected_calls.append(("cast", "fireball on goblin"))
    parser.parse("spells")
    expected_calls.append(("spells",))

    assert game.calls == expected_calls


def test_game_management_commands(game_parser):
    game, parser = game_parser
    commands = {
        "save game": ("save",),
        "save": ("save",),
        "load game": ("load",),
        "load": ("load",),
        "help": ("help", None), # Parameterless help
        "?": ("help", None),   # Parameterless help
        "quit": ("quit",),
        "exit": ("quit",),
    }
    expected_calls = []
    for cmd_text, expected_call in commands.items():
        parser.parse(cmd_text)
        expected_calls.append(expected_call)
    assert game.calls == expected_calls

def test_miscellaneous_commands(game_parser):
    game, parser = game_parser
    commands = {
        "sleep": ("rest",),
        "rest": ("rest",),
        "map": ("map",),
        "stats": ("stats",),
    }
    expected_calls = []
    for cmd_text, expected_call in commands.items():
        parser.parse(cmd_text)
        expected_calls.append(expected_call)
    assert game.calls == expected_calls

def test_unknown_command(game_parser):
    game, parser = game_parser
    parser.parse("xyzzy")
    assert game.calls == [("unknown", "xyzzy")]
