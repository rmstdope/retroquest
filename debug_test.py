#!/usr/bin/env python3
import sys
sys.path.append('/Users/henrikku/repos/retroquest/src')

from retroquest.act2.Act2 import Act2
from retroquest.engine.Game import Game
from retroquest.act2.items.EnchantedAcorn import EnchantedAcorn

# Create test game
act = Act2()
game = Game(act)

# Set up the test scenario
game.state.inventory.append(EnchantedAcorn())
game.state.current_room = game.state.all_rooms["AncientGrove"]

# Test the give command
print("Testing 'give enchanted acorn' command:")
result = game.handle_command("give enchanted acorn")
print(f"Result: {result}")

print("\nTesting 'give enchanted acorn to ancient tree spirit' command:")
result2 = game.handle_command("give enchanted acorn to ancient tree spirit")
print(f"Result: {result2}")
