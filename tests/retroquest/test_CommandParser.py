import pytest
from retroquest.CommandParser import CommandParser

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
    def help(self, arg=None):
        self.calls.append(('help', arg))
    def look(self):
        self.calls.append(('look',))
    def examine(self, target):
        self.calls.append(('examine', target))
    def read(self, item):
        self.calls.append(('read', item))
    def search(self, target):
        self.calls.append(('search', target))
    def listen(self, target=None):
        self.calls.append(('listen', target))
    def smell(self, target=None):
        self.calls.append(('smell', target))
    def taste(self, item):
        self.calls.append(('taste', item))
    def take(self, item):
        self.calls.append(('take', item))
    def drop(self, item):
        self.calls.append(('drop', item))
    def use(self, item):
        self.calls.append(('use', item))
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
    def cast(self, spell):
        self.calls.append(('cast', spell))
    def learn(self, spell):
        self.calls.append(('learn', spell))
    def use_magic_stone(self):
        self.calls.append(('use_magic_stone',))
    def heal(self):
        self.calls.append(('heal',))
    def reveal(self):
        self.calls.append(('reveal',))
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
    def sleep(self):
        self.calls.append(('sleep',))
    def map(self):
        self.calls.append(('map',))
    def stats(self):
        self.calls.append(('stats',))
    def unknown(self, command):
        self.calls.append(('unknown', command))

def test_movement_commands():
    game = DummyGame()
    parser = CommandParser(game)
    parser.parse('north')
    parser.parse('go south')
    parser.parse('east')
    parser.parse('go west')
    assert game.calls == [
        ('move', 'north', None),
        ('move', 'south', None),
        ('move', 'east', None),
        ('move', 'west', None),
    ]

def test_look_and_examine():
    game = DummyGame()
    parser = CommandParser(game)
    parser.parse('look')
    parser.parse('look at statue')
    parser.parse('examine sword')
    assert game.calls == [
        ('look',),
        ('examine', 'statue'),
        ('examine', 'sword'),
    ]

def test_inventory_commands():
    game = DummyGame()
    parser = CommandParser(game)
    parser.parse('take lantern')
    parser.parse('drop lantern')
    parser.parse('inventory')
    assert game.calls == [
        ('take', 'lantern'),
        ('drop', 'lantern'),
        ('inventory',),
    ]

def test_unknown_command():
    game = DummyGame()
    parser = CommandParser(game)
    parser.parse('foobar')
    assert game.calls == [
        ('unknown', 'foobar')
    ]

def test_help_and_quit():
    game = DummyGame()
    parser = CommandParser(game)
    parser.parse('help')
    parser.parse('quit')
    assert game.calls == [
        ('help', None),
        ('quit',),
    ]
