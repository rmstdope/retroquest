import pytest
from unittest.mock import MagicMock, patch
from engine.Game import Game
from engine.Room import Room

# --- Mock Room classes for testing ---
class MockRoom(Room):
    def __init__(self, name, description="A mock room."):
        super().__init__(name, description)
        self.exits = {}
        self.items = []
        self.characters = []
    def can_leave(self):
        return True
    def add_exit(self, direction, room):
        self.exits[direction] = room
    def add_item(self, item):
        self.items.append(item)
    def add_character(self, character):
        self.characters.append(character)

# Dummy room and item setup for test
ROOMS = {
    "EliorsCottage": MockRoom("Elior's Cottage", "A cozy cottage with a warm hearth."),
    "VegetableField": MockRoom("Vegetable Field", "A patch of tilled earth where vegetables struggle to grow. The soil is dry and rocky."),
    "ChickenCoop": MockRoom("Chicken Coop"),
    "VillageSquare": MockRoom("Village Square"),
    "MirasHut": MockRoom("Mira's Hut"),
    "BlacksmithsForge": MockRoom("Blacksmith's Forge"),
    "GeneralStore": MockRoom("General Store"),
    "VillageWell": MockRoom("Village Well"),
    "AbandonedShed": MockRoom("Abandoned Shed"),
    "OldMill": MockRoom("Old Mill"),
    "Riverbank": MockRoom("Riverbank"),
    "ForestPath": MockRoom("Forest Path"),
    "HiddenGlade": MockRoom("Hidden Glade"),
    "VillageChapel": MockRoom("Village Chapel"),
    "RoadToGreendale": MockRoom("Road to Greendale"),
}

@pytest.fixture
def basic_rooms():
    # Minimal room network for testing
    cottage = MockRoom("EliorsCottage", "A cozy cottage with a warm hearth.")
    field = MockRoom("VegetableField", "A patch of tilled earth where vegetables struggle to grow. The soil is dry and rocky.")
    # Add exits for movement tests
    cottage.add_exit('south', field.name)
    field.add_exit('north', cottage.name)
    return {
        "EliorsCottage": cottage,
        "VegetableField": field,
    }

@pytest.fixture
def game(basic_rooms):
    return Game(basic_rooms["EliorsCottage"], basic_rooms, all_quests=[])

def test_game_initial_state(game, basic_rooms):
    assert game.state.current_room == basic_rooms["EliorsCottage"]
    assert game.is_running is True
    assert game.state.inventory == []
    assert game.state.history == []

def test_move_valid(game, basic_rooms):
    # EliorsCottage south -> VegetableField
    result = game.move('south')
    assert game.state.current_room == basic_rooms["VegetableField"]
    assert "You move south to" in result
    assert f"[room.name]{basic_rooms['VegetableField'].name}[/room.name]" in result

def test_move_invalid(game):
    result = game.move('west')
    assert "can't go that way" in result

def test_quit_prompts_save(monkeypatch, game):
    # Simulate user saying 'no' to save
    monkeypatch.setattr(game.session, 'prompt', lambda msg: 'no')
    result = game.quit()
    assert "Goodbye!" in result
    assert game.is_running is False

    # Simulate user saying 'yes' to save, and patch save
    game.is_running = True
    monkeypatch.setattr(game.session, 'prompt', lambda msg: 'yes')
    game.save = MagicMock(return_value=None)
    result = game.quit()
    assert "Game saved. Goodbye!" in result
    assert game.save.called
    assert game.is_running is False

def test_quit_loops_on_invalid(monkeypatch, game):
    # Simulate user entering invalid, then 'no'
    responses = iter(['maybe', 'no'])
    monkeypatch.setattr(game.session, 'prompt', lambda msg: next(responses))
    result = game.quit()
    assert "Goodbye!" in result
    assert game.is_running is False

def test_visited_rooms_initial(game):
    # Only the starting room should be visited
    assert game.state.visited_rooms == [game.state.current_room.name]

def test_visited_rooms_after_move(game, basic_rooms):
    basic_rooms["EliorsCottage"].can_leave()
    # Move to another room
    game.move('south')
    assert basic_rooms["VegetableField"].name in game.state.visited_rooms
    # Both rooms should be in visited_rooms
    assert set(game.state.visited_rooms) == {basic_rooms["EliorsCottage"].name, basic_rooms["VegetableField"].name}

def test_visited_rooms_no_duplicates(game, basic_rooms):
    basic_rooms["EliorsCottage"].can_leave()
    # Move to another room and back
    game.move('south')
    game.move('north')  # Assuming VegetableField has north exit back
    # No duplicates in visited_rooms
    assert game.state.visited_rooms.count(basic_rooms["EliorsCottage"].name) == 1
    assert game.state.visited_rooms.count(basic_rooms["VegetableField"].name) == 1

def test_map_initial_state(game):
    result = game.map()
    # Only the starting room should be shown, with its exits listed
    assert "Visited Rooms and Exits:" in result
    assert "- [room.name]EliorsCottage[/room.name]:" in result
    # Should show exits for the starting room (EliorsCottage)
    assert "    south -> [room.name]VegetableField[/room.name]" in result
    # Should not show VegetableField as a room yet
    assert "- [room.name]VegetableField[/room.name]" not in result

def test_map_after_move(game):
    game.move('south')
    result = game.map()
    # Both rooms should be shown
    assert "- [room.name]EliorsCottage[/room.name]:" in result
    assert "- [room.name]VegetableField[/room.name]:" in result
    # Exits for EliorsCottage should be shown
    assert "    south -> [room.name]VegetableField[/room.name]" in result
    # Exits for VegetableField should be shown (should have north back to EliorsCottage)
    assert "    north -> [room.name]EliorsCottage[/room.name]" in result

def test_map_multiple_moves(game):
    # Move south, then north (should visit both rooms, no duplicates)
    game.move('south')
    game.move('north')
    result = game.map()
    # Both rooms should be present
    assert "- [room.name]EliorsCottage[/room.name]:" in result
    assert "- [room.name]VegetableField[/room.name]:" in result
    # Exits for both rooms should be shown
    assert "    south -> [room.name]VegetableField[/room.name]" in result
    assert "    north -> [room.name]EliorsCottage[/room.name]" in result
    assert result.count('- ') == 2

def test_take_item_from_room(game, basic_rooms):
    # Place an item in the starting room
    from retroquest.act1.items.Egg import Egg
    egg = Egg()
    game.state.current_room.items.append(egg)
    assert egg in game.state.current_room.items
    # Take the item
    result = game.take('egg')
    assert "You take the [item.name]egg[/item.name]" in result
    assert egg in game.state.inventory
    assert egg not in game.state.current_room.items

def test_take_item_not_present(game):
    # Try to take an item that isn't in the room
    result = game.take('nonexistent')
    assert "There is no 'nonexistent' here to take." in result
    assert len(game.state.inventory) == 0

def test_drop_item_from_inventory(game, basic_rooms):
    # Add an item to inventory
    from retroquest.act1.items.Lantern import Lantern
    lantern = Lantern()
    game.state.inventory.append(lantern)
    assert lantern in game.state.inventory
    # Drop the item
    result = game.drop('lantern')
    assert "You drop the [item.name]lantern[/item.name]" in result
    assert lantern not in game.state.inventory
    assert lantern in game.state.current_room.items

def test_drop_item_not_in_inventory(game):
    # Try to drop an item not in inventory
    result = game.drop('nonexistent')
    assert "You don't have a 'nonexistent' to drop." in result

def test_learn_spell(game):
    from retroquest.act1.spells.LightSpell import LightSpell
    light_spell = LightSpell()
    result = game.learn(light_spell)
    assert "You have learned the [spell.name]light[/spell.name] spell!" in result
    assert light_spell in game.state.known_spells

def test_learn_spell_already_known(game):
    from retroquest.act1.spells.LightSpell import LightSpell
    light_spell = LightSpell()
    game.learn(light_spell) # Learn it once
    result = game.learn(light_spell) # Try to learn again
    assert game.state.known_spells.count(light_spell) == 1

def test_spells_command_no_spells(game):
    result = game.spells()
    assert "You don't know any spells yet." in result

def test_spells_command_with_spells(game):
    from retroquest.act1.spells.LightSpell import LightSpell
    from retroquest.act1.spells.HealSpell import HealSpell
    light_spell = LightSpell()
    heal_spell = HealSpell()
    game.learn(light_spell)
    game.learn(heal_spell)
    result = game.spells()
    assert "Known Spells:" in result
    assert f"  - [spell.name]{light_spell.get_name()}[/spell.name]: {light_spell.get_description()}" in result
    assert f"  - [spell.name]{heal_spell.get_name()}[/spell.name]: {heal_spell.get_description()}" in result

# --- Tests for 'give' command ---

def test_give_item_to_character_successful(game, basic_rooms):
    from retroquest.act1.items.Apple import Apple
    from retroquest.act1.characters.Villager import Villager # Assuming a generic Villager character
    
    apple = Apple()
    villager = Villager() # Villager needs to be in the room
    
    game.state.inventory.append(apple)
    game.state.current_room.characters.append(villager)
    
    # Mock the villager's give_item method
    villager.give_item = MagicMock(return_value=f"[character.name]{villager.get_name()}[/character.name] takes the [item.name]{apple.get_name()}[/item.name].")
    
    result = game.give(f"{apple.get_name()} to {villager.get_name()}")
    
    assert f"[character.name]{villager.get_name()}[/character.name] takes the [item.name]{apple.get_name()}[/item.name]." in result
    villager.give_item.assert_called_once_with(game.state, apple)
    # Assuming the character's give_item method is responsible for removing the item if accepted.
    # If Game.give should remove it, add that check here.
    # For now, we only check the call and response.

def test_give_item_not_in_inventory(game, basic_rooms):
    from retroquest.act1.characters.Villager import Villager
    villager = Villager()
    game.state.current_room.characters.append(villager)
    
    result = game.give(f"nonexistent_item to {villager.get_name()}")
    assert "You don\'t have any \'nonexistent_item\' to give." in result

def test_give_item_to_character_not_in_room(game, basic_rooms):
    from retroquest.act1.items.Apple import Apple
    apple = Apple()
    game.state.inventory.append(apple)
    
    # Character "Ghost" is not added to the room
    result = game.give(f"{apple.get_name()} to Ghost")
    assert "There is no character named \'Ghost\' here." in result

def test_give_item_character_does_not_want(game, basic_rooms):
    from retroquest.act1.items.Stick import Stick # An item the character might not want
    from retroquest.engine.Character import Character # Base character
    
    stick = Stick()
    generic_char = Character(name="Grumpy Person", description="Someone grumpy.")
    
    game.state.inventory.append(stick)
    game.state.current_room.characters.append(generic_char)
    
    # The default Character.give_item should be called
    result = game.give(f"{stick.get_name()} to {generic_char.get_name()}")
    assert f"[character.name]{generic_char.get_name()}[/character.name] doesn't seem interested in the [item.name]{stick.get_name()}[/item.name]." in result

def test_give_item_invalid_format(game):
    result = game.give("apple villager") # Missing "to"
    assert "Invalid command format. Please use \'give <target1> to <target2>\'." in result

    result = game.give("to villager") # Missing item
    assert "What do you want to give?" in result

    result = game.give("apple to") # Missing character
    assert "Who/What should I give apple to?" in result

# --- Tests for \'look\' command ---

def test_look_in_room_with_items_and_characters(game, basic_rooms):
    from retroquest.act1.items.Apple import Apple
    from retroquest.act1.characters.Villager import Villager
    
    apple = Apple()
    villager = Villager()
    
    # Ensure the starting room (Elior\'s Cottage) is used for this test
    # or set current_room explicitly if needed.
    current_room = game.state.current_room 
    current_room.items.append(apple)
    current_room.characters.append(villager)
    
    # Mock the room\'s describe method to verify it\'s called
    # Or, more practically, check that the output contains expected elements
    # from the room description, item names, and character names.
    current_room.describe = MagicMock(return_value=
        f"{current_room.description}\n"
        f"Items here: {apple.get_name()}\n"
        f"You see: {villager.get_name()}"
    )

    result = game.look()
    
    current_room.describe.assert_called_once()
    assert current_room.description in result
    assert apple.get_name() in result
    assert villager.get_name() in result

def test_look_in_empty_room(game, basic_rooms):
    # Move to a room that we ensure is empty (or make it empty)
    # For simplicity, let\'s use VegetableField and clear it.
    game.move('south') # Move to VegetableField
    current_room = game.state.current_room
    current_room.items.clear()
    current_room.characters.clear()
    
    # Original description of VegetableField without items/chars
    original_description = "A patch of tilled earth where vegetables struggle to grow. The soil is dry and rocky."
    current_room.description = original_description # Ensure it\'s set for the test
    
    # Mock describe or check its output structure
    # If Room.describe() dynamically builds the string, we check for absence of item/char lines
    # For this test, let\'s assume describe() returns the base description if no items/chars
    current_room.describe = MagicMock(return_value=original_description)

    result = game.look()
    
    current_room.describe.assert_called_once()
    assert original_description in result
    # We might also want to assert that default "Items here:" or "You see:" are NOT in result
    # if the Room.describe() method omits them when empty.
    # This depends on the Room.describe() implementation.
    # For now, we assume the mocked describe handles this.

# --- Tests for \'inventory\' command ---

def test_inventory_empty(game):
    result = game.inventory()
    assert "Your inventory is empty." in result

def test_inventory_with_items(game):
    from retroquest.act1.items.Apple import Apple
    from retroquest.act1.items.Stick import Stick
    apple = Apple()
    stick = Stick()
    
    game.state.inventory.append(apple)
    game.state.inventory.append(stick)
    
    result = game.inventory()
    
    assert "You are carrying:" in result
    assert f"- [item.name]{apple.get_name()}[/item.name]" in result
    assert f"- [item.name]{stick.get_name()}[/item.name]" in result

# --- Tests for 'examine' command ---

def test_examine_item_in_inventory(game):
    from retroquest.act1.items.Apple import Apple
    from unittest.mock import MagicMock

    apple = Apple()
    apple_description = "A juicy red apple, looking perfectly ripe."
    apple.get_description = MagicMock(return_value=apple_description)
    apple.get_name = MagicMock(return_value="apple")
    
    game.state.inventory.append(apple)
    # Ensure it's not also in the room to avoid ambiguity for this specific test
    if apple in game.state.current_room.items:
        game.state.current_room.items.remove(apple)
        
    result = game.examine("apple")
    assert result == apple_description
    apple.get_description.assert_called_once()

def test_examine_item_in_room(game):
    from retroquest.act1.items.Apple import Apple
    from unittest.mock import MagicMock

    apple = Apple()
    apple_description = "A shiny green apple, lying on the ground."
    apple.get_description = MagicMock(return_value=apple_description)
    apple.get_name = MagicMock(return_value="apple")
    
    game.state.current_room.items.append(apple)
    # Ensure it's not in inventory for this specific test
    if apple in game.state.inventory:
        game.state.inventory.remove(apple)
        
    result = game.examine("apple")
    assert result == apple_description
    apple.get_description.assert_called_once()

def test_examine_character_in_room(game):
    from retroquest.act1.characters.Villager import Villager
    # Assuming Villager's get_description returns the description passed to constructor
    char_description = "A weary-looking traveler, resting by the old oak tree."
    traveler = Villager()
    traveler.description = char_description
    
    game.state.current_room.characters.append(traveler)
    
    result = game.examine("Villager")
    assert result == char_description

def test_examine_target_not_found(game):
    # Clear inventory and room items/characters to ensure target is not found
    game.state.inventory.clear()
    game.state.current_room.items.clear()
    game.state.current_room.characters.clear()
    
    result = game.examine("dragon")
    assert result == "You don't see any 'dragon' here."

def test_examine_no_argument(game):
    result = game.examine("") # Assuming CommandParser passes empty string for no arg
    assert result == "Examine what?"

def test_examine_case_insensitivity(game):
    from retroquest.act1.items.Apple import Apple
    from retroquest.act1.characters.Villager import Villager
    from unittest.mock import MagicMock

    # Test with item
    apple = Apple()
    apple_description = "A golden delicious apple."
    apple.get_description = MagicMock(return_value=apple_description)
    apple.get_name = MagicMock(return_value="Golden Apple") # Name with space and caps
    game.state.inventory.append(apple)
    
    result_item = game.examine("golden apple")
    assert result_item == apple_description
    apple.get_description.assert_called_once()
    game.state.inventory.clear() # Clean up for next part of test

    # Test with character
    char_description = "The village blacksmith, strong and sturdy."
    blacksmith = Villager()
    blacksmith.name = "Blacksmith John"
    blacksmith.description = char_description
    game.state.current_room.characters.append(blacksmith)
    
    result_char = game.examine("blacksmith JOHN")
    assert result_char == char_description
    game.state.current_room.characters.clear() # Clean up

# --- Tests for 'buy' command ---

def test_buy_item_successful(game):
    from retroquest.act1.items.Rope import Rope
    from retroquest.act1.items.Coin import Coin
    from retroquest.act1.characters.Shopkeeper import Shopkeeper # Assuming Shopkeeper has buy_item

    shopkeeper = Shopkeeper()
    rope_instance = Rope() # The item instance the shopkeeper would sell
    
    # Setup shopkeeper's wares and mock buy_item
    # For this test, we assume Shopkeeper.buy_item handles coin deduction and item addition
    # and returns a success message.
    shopkeeper.wares = {"rope": {"item": rope_instance, "price": 1}}
    shopkeeper.buy_item = MagicMock(return_value=f"You bought a [item.name]{rope_instance.get_name()}[/item.name] for 1 [item.name]coin[/item.name](s).")

    game.state.current_room.characters.append(shopkeeper)
    game.state.inventory.append(Coin()) # Player has one coin

    result = game.buy("rope from shopkeeper")
    
    assert f"You bought a [item.name]{rope_instance.get_name()}[/item.name] for 1 [item.name]coin[/item.name](s)." in result
    shopkeeper.buy_item.assert_called_once_with("rope", game.state)
    # Further checks could be:
    # - assert Coin not in game.state.inventory (if buy_item removes it)
    # - assert rope_instance in game.state.inventory (if buy_item adds it)
    # These depend on the Shopkeeper.buy_item implementation.

def test_buy_item_not_sold_by_character(game):
    from retroquest.act1.characters.Shopkeeper import Shopkeeper
    from retroquest.act1.items.Coin import Coin

    shopkeeper = Shopkeeper()
    shopkeeper.buy_item = MagicMock(return_value="Sorry, I don't have any 'magic beans' for sale.")
    game.state.current_room.characters.append(shopkeeper)
    game.state.inventory.append(Coin())

    result = game.buy("magic beans from shopkeeper")
    assert "Sorry, I don't have any 'magic beans' for sale." in result
    shopkeeper.buy_item.assert_called_once_with("magic beans", game.state)

def test_buy_item_not_enough_coins(game):
    from retroquest.act1.characters.Shopkeeper import Shopkeeper
    from retroquest.act1.items.Rope import Rope

    shopkeeper = Shopkeeper()
    rope_instance = Rope()
    # Assume rope costs 1 coin, but player has 0
    shopkeeper.wares = {"rope": {"item": rope_instance, "price": 1}}
    shopkeeper.buy_item = MagicMock(return_value="You don't have enough [item.name]coins[/item.name] for the [item.name]rope[/item.name]. It costs 1 [item.name]coin[/item.name](s).")
    
    game.state.current_room.characters.append(shopkeeper)
    # game.state.inventory is empty (no coins)

    result = game.buy("rope from shopkeeper")
    assert "You don't have enough [item.name]coins[/item.name] for the [item.name]rope[/item.name]. It costs 1 [item.name]coin[/item.name](s)." in result
    shopkeeper.buy_item.assert_called_once_with("rope", game.state)

def test_buy_item_character_not_present(game):
    from retroquest.act1.items.Coin import Coin
    game.state.inventory.append(Coin())
    
    result = game.buy("rope from Ghostly Shopkeeper")
    assert "There is no character named 'Ghostly shopkeeper' here." in result

def test_buy_item_character_cannot_sell(game):
    from retroquest.act1.characters.Villager import Villager # Villager cannot sell
    from retroquest.act1.items.Coin import Coin

    villager = Villager()
    game.state.current_room.characters.append(villager)
    game.state.inventory.append(Coin())

    result = game.buy("rope from villager")
    assert f"[character.name]{villager.get_name()}[/character.name] does not have any [item.name]rope[/item.name] to sell right now." in result

def test_buy_item_invalid_format(game):
    result = game.buy("rope shopkeeper") # Missing "from"
    assert "Invalid command format. Please use 'buy <target1> from <target2>'." in result

    result = game.buy("from shopkeeper") # Missing item
    assert "What do you want to buy?" in result

    result = game.buy("rope from") # Missing character
    assert "[failure]Who/What should I buy rope from?[/failure]" in result

# Helper classes for 'use' tests
# These are defined here to be available for the test functions below.
# They duck-type the necessary methods of game items for testing purposes.
class MockItemToUse: # Renamed to avoid conflict if Item is imported elsewhere by chance
    def __init__(self, name, short_name=None, description="A mock item."):
        self._name = name
        self._short_name = short_name if short_name else name
        self._description = description
        self.requires_pickup = False
        self.use_called_with_state = None
        self.use_with_called_with_state_and_item = None
        self.read_called_with_state = None
        self.listen_called_with_state = None # Added for listen tests

    def get_name(self):
        return self._name

    def get_short_name(self):
        return self._short_name
    
    def get_description(self):
        return self._description

    def use(self, game_state):
        self.use_called_with_state = game_state
        return f"You used the [item]{self.get_name()}[/item]."

    def use_with(self, game_state, other_item):
        self.use_with_called_with_state_and_item = (game_state, other_item)
        return f"You used the [item]{self.get_name()}[/item] with [item]{other_item.get_name()}[/item]."

    def read(self, game_state):
        self.read_called_with_state = game_state
        return f"You read the [item]{self.get_name()}[/item]. It says: \'Mock content for {self.get_name()}.\'"

    def listen(self, game_state): # Added for listen tests
        self.listen_called_with_state = game_state
        return f"You hear a faint click from the [item]{self.get_name()}[/item]."

# --- Tests for 'use <item>' command ---

def test_use_item_from_inventory_successful(game):
    item1 = MockItemToUse(name="widget")
    game.state.add_item_to_inventory(item1)
    
    result = game.use("widget")
    assert result == "You used the [item]widget[/item]."
    assert item1.use_called_with_state == game.state

def test_use_item_from_room_successful_no_pickup_needed(game):
    item1 = MockItemToUse(name="lever")
    game.state.current_room.add_item(item1)
    
    result = game.use("lever")
    assert result == "You used the [item]lever[/item]."
    assert item1.use_called_with_state == game.state

def test_use_item_not_found(game):
    result = game.use("nonexistent_item")
    assert result == "[failure]You don't have a 'nonexistent_item' to use, and there isn't one here.[/failure]"

# --- Tests for 'use <item1> with <item2>' command ---

def test_use_item1_inv_with_item2_inv_successful(game):
    item1 = MockItemToUse(name="key")
    item2 = MockItemToUse(name="chest")
    game.state.add_item_to_inventory(item1)
    game.state.add_item_to_inventory(item2)
    
    result = game.use("key", "chest")
    assert result == "You used the [item]key[/item] with [item]chest[/item]."
    assert item1.use_with_called_with_state_and_item == (game.state, item2)
    assert item2.use_called_with_state is None 

def test_use_item1_inv_with_item2_room_successful(game):
    item1 = MockItemToUse(name="key")
    item2 = MockItemToUse(name="locked_door")
    # item2.requires_pickup is False by default
    game.state.add_item_to_inventory(item1)
    game.state.current_room.add_item(item2)
    
    result = game.use("key", "locked_door")
    assert result == "You used the [item]key[/item] with [item]locked_door[/item]."
    assert item1.use_with_called_with_state_and_item == (game.state, item2)

def test_use_item1_room_with_item2_inv_successful(game):
    item1 = MockItemToUse(name="lever") 
    # item1.requires_pickup is False by default
    item2 = MockItemToUse(name="mechanism_part")
    game.state.current_room.add_item(item1)
    game.state.add_item_to_inventory(item2)
    
    result = game.use("lever", "mechanism_part")
    assert result == "You used the [item]lever[/item] with [item]mechanism_part[/item]."
    assert item1.use_with_called_with_state_and_item == (game.state, item2)

def test_use_item1_with_item2_item1_not_found(game):
    item2 = MockItemToUse(name="target")
    game.state.add_item_to_inventory(item2)
    result = game.use("nonexistent_item1", "target")
    assert result == "[failure]You don't have a 'nonexistent_item1' to use, and there isn't one here.[/failure]"

def test_use_item1_with_item2_item2_not_found(game):
    item1 = MockItemToUse(name="tool")
    game.state.add_item_to_inventory(item1)
    result = game.use("tool", "nonexistent_item2")
    assert result == "[failure]You don't see a 'nonexistent_item2' to use with the [item.name]tool[/item.name].[/failure]"

def test_use_item_with_itself(game):
    item1 = MockItemToUse(name="widget")
    game.state.add_item_to_inventory(item1)
    result = game.use("widget", "widget")
    assert result == "[failure]You can\'t use the [item.name]widget[/item.name] with itself.[/failure]"
    assert item1.use_with_called_with_state_and_item is None

# --- Tests for 'read <item>' command ---

def test_read_item_in_inventory(game):
    readable_book = MockItemToUse(name="old book")
    game.state.add_item_to_inventory(readable_book)
    
    result = game.read("old book")
    assert result == "You read the [item]old book[/item]. It says: \'Mock content for old book.\'"
    assert readable_book.read_called_with_state == game.state

def test_read_item_in_room(game):
    readable_scroll = MockItemToUse(name="ancient scroll")
    game.state.current_room.add_item(readable_scroll)
    
    result = game.read("ancient scroll")
    assert result == "You read the [item]ancient scroll[/item]. It says: \'Mock content for ancient scroll.\'"
    assert readable_scroll.read_called_with_state == game.state

def test_read_item_not_found(game):
    result = game.read("missing_tablet")
    assert result == "[failure]You don't see a 'missing_tablet' to read here or in your inventory.[/failure]"

def test_read_no_item_specified(game):
    result = game.read("")
    assert result == "[failure]Read what?[/failure]"

def test_read_item_case_insensitivity_inventory(game):
    journal = MockItemToUse(name="MyJournal")
    game.state.add_item_to_inventory(journal)
    
    result = game.read("myjournal")
    assert result == "You read the [item]MyJournal[/item]. It says: \'Mock content for MyJournal.\'"
    assert journal.read_called_with_state == game.state

def test_read_item_case_insensitivity_room(game):
    note = MockItemToUse(name="SecretNote")
    game.state.current_room.add_item(note)
    
    result = game.read("secretnote")
    assert result == "You read the [item]SecretNote[/item]. It says: \'Mock content for SecretNote.\'"
    assert note.read_called_with_state == game.state

def test_read_item_short_name_inventory(game):
    manual = MockItemToUse(name="Instruction Manual", short_name="manual")
    game.state.add_item_to_inventory(manual)
    
    result = game.read("manual")
    assert result == "You read the [item]Instruction Manual[/item]. It says: \'Mock content for Instruction Manual.\'"
    assert manual.read_called_with_state == game.state

def test_read_item_short_name_room(game):
    plaque = MockItemToUse(name="Bronze Plaque", short_name="plaque")
    game.state.current_room.add_item(plaque)
    
    result = game.read("plaque")
    assert result == "You read the [item]Bronze Plaque[/item]. It says: \'Mock content for Bronze Plaque.\'"
    assert plaque.read_called_with_state == game.state

def test_read_item_prefers_inventory_over_room(game):
    book_inv = MockItemToUse(name="common book")
    book_room = MockItemToUse(name="common book") # Same name
    
    book_inv.read = MagicMock(return_value="Read from inventory [item]book[/item].")
    book_room.read = MagicMock(return_value="Read from room [item]book[/item].")
    
    game.state.add_item_to_inventory(book_inv)
    game.state.current_room.add_item(book_room)
    
    result = game.read("common book")
    assert result == "Read from inventory [item]book[/item]."
    book_inv.read.assert_called_once_with(game.state)
    book_room.read.assert_not_called()

# --- Tests for 'listen' command ---

def test_listen_no_target_room_ambient_sound(game):
    """Tests listening with no target, expecting room's ambient sound."""
    expected_sound = "You hear the gentle rustling of leaves."
    game.state.current_room.get_ambient_sound = MagicMock(return_value=expected_sound)
    
    result = game.listen()
    
    assert result == expected_sound
    game.state.current_room.get_ambient_sound.assert_called_once()

def test_listen_item_in_inventory(game):
    """Tests listening to an item that is in the player's inventory."""
    mock_item = MockItemToUse(name="pocket_watch")
    # Override default listen message for this test
    expected_sound = "The [item]pocket_watch[/item] ticks softly."
    mock_item.listen = MagicMock(return_value=expected_sound)
    
    game.state.add_item_to_inventory(mock_item)
    
    result = game.listen("pocket_watch")
    
    assert result == expected_sound
    mock_item.listen.assert_called_once_with(game.state)

def test_listen_item_in_room(game):
    """Tests listening to an item that is in the current room."""
    mock_item = MockItemToUse(name="old_radio")
    # Override default listen message
    expected_sound = "Static crackles from the [item]old_radio[/item]."
    mock_item.listen = MagicMock(return_value=expected_sound)
    
    game.state.current_room.add_item(mock_item)
    
    result = game.listen("old_radio")
    
    assert result == expected_sound
    mock_item.listen.assert_called_once_with(game.state)

def test_listen_item_not_found(game):
    """Tests listening to an item that is neither in inventory nor in the room."""
    # Assuming Game.py's listen method returns a specific message for not found items.
    # This message might vary based on actual implementation.
    # Based on Game.examine, a similar message is "You don't see a 'dragon' here."
    # For listen, it might be "You can't find 'nonexistent_relic' to listen to."
    # or "There is no 'nonexistent_relic' here."
    
    # Clear inventory and room to be sure
    game.state.inventory.clear()
    game.state.current_room.items.clear()

    target_item_name = "nonexistent_relic"
    result = game.listen(target_item_name)
    
    # This assertion depends on the actual message from Game.listen() when an item is not found.
    # Adjust if the actual message is different.
    # A plausible message:
    assert result == f"[failure]You don't see a '{target_item_name}' to listen to here or in your inventory.[/failure]"

def test_listen_item_uses_mock_default_listen(game):
    """Tests listening to an item that uses the default listen method from MockItemToUse."""
    mock_item = MockItemToUse(name="strange_device") # Uses the default listen from MockItemToUse
    
    game.state.add_item_to_inventory(mock_item)
    
    result = game.listen("strange_device")
    
    expected_default_sound = f"You hear a faint click from the [item]{mock_item.get_name()}[/item]."
    assert result == expected_default_sound
    assert mock_item.listen_called_with_state == game.state

def test_listen_item_name_case_insensitivity(game):
    """Tests that listening to an item is case-insensitive."""
    mock_item = MockItemToUse(name="Whispering Shell")
    expected_sound = "You hear the faint echo of the sea from the [item]Whispering Shell[/item]."
    mock_item.listen = MagicMock(return_value=expected_sound)
    
    game.state.current_room.add_item(mock_item)
    
    result = game.listen("whispering SHELL") # Case-insensitive target
    
    assert result == expected_sound
    mock_item.listen.assert_called_once_with(game.state)

# Ensure this is at the very end if no other tests follow

