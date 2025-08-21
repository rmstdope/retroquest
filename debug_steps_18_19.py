#!/usr/bin/env python3

"""Simple debug script to test steps 18-19 functionality."""

import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from retroquest.act2.Act2 import Act2
from retroquest.engine.Game import Game
from retroquest.act2.spells.NatureSenseSpell import NatureSenseSpell

def main():
    print("🧪 Testing Steps 18-19 Implementation")
    
    # Create game
    act2 = Act2()
    game = Game(act2)
    
    # Add nature_sense spell
    nature_sense = NatureSenseSpell()
    game.state.known_spells.append(nature_sense)
    
    # Start in Forest Entrance
    game.state.current_room = game.state.all_rooms["Forest Entrance"]
    
    print(f"✅ Starting location: {game.state.current_room.name}")
    
    # Go to Whispering Glade
    response = game.handle_command("go east")
    print(f"📍 Navigation: {response[:100]}...")
    print(f"✅ Current location: {game.state.current_room.name}")
    
    # Cast nature_sense
    response = game.handle_command("cast nature_sense")
    print(f"🔮 Nature sense: {response[:100]}...")
    
    # Try to take items before riddles
    response = game.handle_command("take crystal-clear water")
    print(f"❌ Take water (before riddles): {response[:100]}...")
    
    # Talk to water nymphs
    response = game.handle_command("talk to water nymphs")
    print(f"💬 Talk to nymphs: {response[:100]}...")
    
    # Answer riddles
    print("🧩 Answering riddles:")
    response = game.handle_command("answer tree")
    print(f"  1. tree: {response[:100]}...")
    
    response = game.handle_command("answer water")
    print(f"  2. water: {response[:100]}...")
    
    response = game.handle_command("answer insects")
    print(f"  3. insects: {response[:100]}...")
    
    # Check if riddles completed
    print(f"✅ Riddles completed: {game.state.get_story_flag('water_nymph_riddles_completed')}")
    
    # Check items in room
    print(f"📦 Items in room: {[item.name for item in game.state.current_room.items]}")
    
    # Try to take items after riddles
    response = game.handle_command("take crystal-clear water")
    print(f"✅ Take water (after riddles): {response[:100]}...")
    
    response = game.handle_command("take moonflowers")
    print(f"✅ Take flowers (after riddles): {response[:100]}...")
    
    # Check inventory
    print(f"🎒 Inventory: {[item.name for item in game.state.inventory]}")
    
    print("🎉 Step 18 test complete!")

if __name__ == "__main__":
    main()
