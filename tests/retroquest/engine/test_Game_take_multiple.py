import pytest
from retroquest.engine.Game import Game
from retroquest.engine.Room import Room
from retroquest.engine.Item import Item
from retroquest.engine.GameState import GameState
from retroquest.engine.Act import Act

class MockItem(Item):
    """Mock item for testing purposes."""
    def __init__(self, name, description="A test item", can_pickup=True, pickup_message=None):
        super().__init__(name, description)
        self._can_pickup = can_pickup
        self._pickup_message = pickup_message
    
    def prevent_pickup(self):
        if not self._can_pickup:
            return f"[failure]The {self.name} is too heavy to lift.[/failure]"
        return None
    
    def picked_up(self, game_state):
        return self._pickup_message

class MockAct(Act):
    """Mock act for testing purposes."""
    def __init__(self):
        # Create test rooms
        test_room = Room("Test Room", "A room for testing the take command.")
        empty_room = Room("Empty Room", "A room with no items.")
        
        # Create test quests (empty for engine testing)
        test_quests = {}
        
        super().__init__(
            name="Test Act",
            rooms={"TestRoom": test_room, "EmptyRoom": empty_room},
            quests=test_quests,
            music_file='',
            music_info=''
        )

def test_take_multiple_identical_items():
    """Test taking multiple items of the same type."""
    # Create mock act and game
    act = MockAct()
    game = Game([act])
    
    # Create multiple identical items
    coins = [MockItem("coins", "A gold coin") for _ in range(5)]
    
    # Add items to test room
    test_room = game.state.all_rooms["TestRoom"]
    for coin in coins:
        test_room.add_item(coin)
    
    game.state.current_room = test_room
    
    # Verify initial state
    initial_coins = [item for item in test_room.get_items() if item.get_name().lower() == "coins"]
    assert len(initial_coins) == 5, f"Expected 5 coins in room, found {len(initial_coins)}"
    
    # Test taking all coins
    result = game.command_parser.parse("take coins")
    
    # Verify the result message shows correct count
    assert "[event]You take 5 [item_name]coins[/item_name].[/event]" in result, f"Unexpected result: {result}"
    
    # Verify all coins were moved to inventory
    remaining_coins = [item for item in test_room.get_items() if item.get_name().lower() == "coins"]
    inventory_coins = [item for item in game.state.inventory if item.get_name().lower() == "coins"]
    
    assert len(remaining_coins) == 0, f"Expected 0 coins remaining in room, found {len(remaining_coins)}"
    assert len(inventory_coins) == 5, f"Expected 5 coins in inventory, found {len(inventory_coins)}"

def test_take_single_item():
    """Test taking a single item shows correct message format."""
    # Create mock act and game
    act = MockAct()
    game = Game([act])
    
    # Create single item
    sword = MockItem("sword", "A sharp sword")
    
    # Add item to test room
    test_room = game.state.all_rooms["TestRoom"]
    test_room.add_item(sword)
    game.state.current_room = test_room
    
    # Test taking the sword
    result = game.command_parser.parse("take sword")
    
    # Should use singular form with "the"
    assert "[event]You take the [item_name]sword[/item_name].[/event]" in result, f"Unexpected result: {result}"
    
    # Verify item was moved to inventory
    assert len(test_room.get_items()) == 0, "Room should be empty after taking the sword"
    assert len(game.state.inventory) == 1, "Inventory should contain 1 item"
    assert game.state.inventory[0].get_name() == "sword", "Inventory should contain the sword"

def test_take_mixed_pickupable_and_non_pickupable_items():
    """Test taking items when some can be picked up and others cannot."""
    # Create mock act and game
    act = MockAct()
    game = Game([act])
    
    # Create mixed items - 3 books, 2 can be picked up, 1 cannot
    book1 = MockItem("book", "A readable book", can_pickup=True)
    book2 = MockItem("book", "Another book", can_pickup=True, pickup_message="This book is heavy!")
    book3 = MockItem("book", "A chained book", can_pickup=False)
    
    # Add items to test room
    test_room = game.state.all_rooms["TestRoom"]
    for book in [book1, book2, book3]:
        test_room.add_item(book)
    
    game.state.current_room = test_room
    
    # Test taking books
    result = game.command_parser.parse("take book")
    
    # Should mention taking 2 books
    assert "[event]You take 2 [item_name]book[/item_name].[/event]" in result, f"Result should mention taking 2 books: {result}"
    
    # Should include pickup message from book2
    assert "This book is heavy!" in result, f"Should include pickup message: {result}"
    
    # Should include prevention message from book3
    assert "too heavy to lift" in result, f"Should include prevention message: {result}"
    
    # Verify final state
    remaining_books = [item for item in test_room.get_items() if item.get_name().lower() == "book"]
    inventory_books = [item for item in game.state.inventory if item.get_name().lower() == "book"]
    
    assert len(remaining_books) == 1, f"Expected 1 book remaining in room, found {len(remaining_books)}"
    assert len(inventory_books) == 2, f"Expected 2 books in inventory, found {len(inventory_books)}"

def test_take_nonexistent_item():
    """Test taking an item that doesn't exist."""
    # Create mock act and game
    act = MockAct()
    game = Game([act])
    
    # Use empty room
    game.state.current_room = game.state.all_rooms["EmptyRoom"]
    
    # Test taking non-existent item
    result = game.command_parser.parse("take unicorn")
    
    # Should get failure message
    assert "[failure]There is no 'unicorn' here to take.[/failure]" in result, f"Expected failure message, got: {result}"

def test_take_with_pickup_messages():
    """Test that pickup messages from individual items are preserved."""
    # Create mock act and game
    act = MockAct()
    game = Game([act])
    
    # Create items with pickup messages
    gem1 = MockItem("gem", "A sparkling gem", pickup_message="The gem glows as you touch it!")
    gem2 = MockItem("gem", "Another gem", pickup_message="This gem feels warm.")
    gem3 = MockItem("gem", "A third gem", pickup_message=None)  # No message
    
    # Add items to test room
    test_room = game.state.all_rooms["TestRoom"]
    for gem in [gem1, gem2, gem3]:
        test_room.add_item(gem)
    
    game.state.current_room = test_room
    
    # Test taking gems
    result = game.command_parser.parse("take gem")
    
    # Should include both pickup messages
    assert "The gem glows as you touch it!" in result, f"Should include first pickup message: {result}"
    assert "This gem feels warm." in result, f"Should include second pickup message: {result}"
    
    # Should mention taking 3 gems
    assert "[event]You take 3 [item_name]gem[/item_name].[/event]" in result, f"Should mention taking 3 gems: {result}"
    
    # Verify all gems were taken
    assert len(test_room.get_items()) == 0, "Room should be empty after taking all gems"
    assert len(game.state.inventory) == 3, "Inventory should contain 3 gems"

def test_take_backward_compatibility_with_existing_behavior():
    """Ensure the take command maintains backward compatibility."""
    # Create mock act and game
    act = MockAct()
    game = Game([act])
    
    # Test single item scenarios (should work exactly as before)
    test_items = [
        MockItem("sword", "A sharp sword"),
        MockItem("shield", "A sturdy shield"),
        MockItem("potion", "A healing potion"),
    ]
    
    for item in test_items:
        # Reset game state for each test
        game = Game([act])
        test_room = game.state.all_rooms["TestRoom"]
        test_room.add_item(item)
        game.state.current_room = test_room
        
        # Test taking the item
        result = game.command_parser.parse(f"take {item.get_name()}")
        
        # Should not be a failure message
        assert "[failure]" not in result, f"Failed to take {item.get_name()}: {result}"
        
        # Should have success message
        assert "[event]You take the" in result, f"No success message for {item.get_name()}: {result}"
        
        # Should be in inventory
        assert len(game.state.inventory) == 1, f"Item {item.get_name()} should be in inventory"
        assert game.state.inventory[0].get_name() == item.get_name(), f"Wrong item in inventory"
