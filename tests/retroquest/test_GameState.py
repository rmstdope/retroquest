import unittest
from src.retroquest.GameState import GameState

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

if __name__ == "__main__":
    unittest.main()
