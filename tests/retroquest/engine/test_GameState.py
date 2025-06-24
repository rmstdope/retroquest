import unittest
from engine.GameState import GameState

class DummyRoom:
    def __init__(self, name):
        self.name = name

class DummyQuest:
    def __init__(self, name, description=False, completion=False):
        self.name = name
        self.description = description
        self.completion = completion
    def check_trigger(self, game_state):
        return self.description
    def check_completion(self, game_state):
        return self.completion

class TestGameState(unittest.TestCase):
    def setUp(self):
        self.room = DummyRoom("TestRoom")
        self.quest1 = DummyQuest("Quest1", description=True, completion=False)
        self.quest2 = DummyQuest("Quest2", description=False, completion=True)
        self.gs = GameState(self.room, all_rooms=None, all_quests=[self.quest1, self.quest2])

    def test_activate_quests(self):
        msg = self.gs.activate_quests()
        self.assertIn("Quest1", msg)
        self.assertIn(self.quest1, getattr(self.gs, 'activated_quests', []))
        self.assertNotIn(self.quest1, self.gs.non_activated_quests)

    def test_complete_quests(self):
        # Activate quest1 first
        self.gs.activate_quests()
        # Now set quest1 to be completable
        self.quest1.completion = True
        msg = self.gs.complete_quests()
        self.assertIn("Quest1", msg)
        self.assertIn(self.quest1, getattr(self.gs, 'completed_quests', []))
        self.assertNotIn(self.quest1, getattr(self.gs, 'activated_quests', []))

    def test_mark_visited(self):
        new_room = DummyRoom("AnotherRoom")
        self.gs.mark_visited(new_room)
        self.assertIn("AnotherRoom", self.gs.visited_rooms)

    def test_story_flag(self):
        self.gs.set_story_flag("flag1", True)
        self.assertTrue(self.gs.get_story_flag("flag1"))
        self.gs.set_story_flag("flag1", False)
        self.assertFalse(self.gs.get_story_flag("flag1"))

    def test_inventory(self):
        class DummyItem:
            def get_name(self): return "item1"
            def get_short_name(self): return "itm1"
        item = DummyItem()
        self.gs.add_item_to_inventory(item)
        self.assertTrue(self.gs.has_item("item1"))
        self.assertTrue(self.gs.has_item("itm1"))
        self.gs.remove_item_from_inventory("item1")
        self.assertFalse(self.gs.has_item("item1"))

    def test_learn_spell_and_has_spell(self):
        class DummySpell:
            def __init__(self, name): self.name = name
        spell = DummySpell("fireball")
        self.gs.learn_spell(spell)
        self.assertTrue(self.gs.has_spell("fireball"))

    def test_stats(self):
        # Add some items and spells
        class DummyItem:
            def get_name(self): return "item1"
            def get_short_name(self): return "itm1"
        class DummySpell:
            def __init__(self, name): self.name = name
            def get_name(self): return self.name
        self.gs.add_item_to_inventory(DummyItem())
        self.gs.learn_spell(DummySpell("fireball"))
        self.gs.set_story_flag("flag1", True)
        # Mark a room as visited
        self.gs.mark_visited(self.room)
        # Call stats and check output
        stats_output = self.gs.stats()
        self.assertIn("item1", stats_output)
        self.assertIn("fireball", stats_output)
        # self.assertIn("flag1", stats_output)
        self.assertIn("TestRoom", stats_output)
        # Check that the output is a string
        self.assertIsInstance(stats_output, str)

    def test_get_room_by_name(self):
        # Add another room to all_rooms and test lookup by name
        another_room = DummyRoom("AnotherRoom")
        self.gs.all_rooms = {self.room.name: self.room, another_room.name: another_room}
        self.assertEqual(self.gs.get_room("AnotherRoom"), another_room)
        # Test for a room that does not exist
        self.assertIsNone(self.gs.get_room("NonExistentRoom"))

    def test_get_item_inventory_and_room(self):
        # Dummy item for inventory
        class DummyItem:
            def get_name(self): return "item1"
            def get_short_name(self): return "itm1"
        # Dummy item for room
        class DummyRoomItem:
            def get_name(self): return "item2"
            def get_short_name(self): return "itm2"
        item_inventory = DummyItem()
        item_room = DummyRoomItem()
        self.gs.add_item_to_inventory(item_inventory)
        # Patch all_rooms to be a dict for get_item
        room_with_item = DummyRoom("RoomWithItem")
        room_with_item.items = [item_room]
        self.gs.all_rooms = {self.room.name: self.room, room_with_item.name: room_with_item}
        # Test inventory (long and short name)
        self.assertEqual(self.gs.get_item("item1"), item_inventory)
        self.assertEqual(self.gs.get_item("itm1"), item_inventory)
        # Test room (long and short name)
        self.assertEqual(self.gs.get_item("item2"), item_room)
        self.assertEqual(self.gs.get_item("itm2"), item_room)
        # Test not found
        self.assertIsNone(self.gs.get_item("notfound"))

    def test_get_quest(self):
        # Should find quests by name (case-insensitive) in all quest lists
        self.gs.non_activated_quests = [self.quest1]
        self.gs.activated_quests = [self.quest2]
        completed_quest = DummyQuest("Quest3", description=True, completion=True)
        self.gs.completed_quests = [completed_quest]
        # Find in non_activated_quests
        self.assertEqual(self.gs.get_quest("Quest1"), self.quest1)
        self.assertEqual(self.gs.get_quest("quest1"), self.quest1)
        # Find in activated_quests
        self.assertEqual(self.gs.get_quest("Quest2"), self.quest2)
        # Find in completed_quests
        self.assertEqual(self.gs.get_quest("Quest3"), completed_quest)
        # Not found
        self.assertIsNone(self.gs.get_quest("NotAQuest"))



# if __name__ == "__main__":
#     unittest.main()
