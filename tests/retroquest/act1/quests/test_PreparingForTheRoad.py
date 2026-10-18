"""Unit tests for the Preparing for the road quest checklist."""

import unittest
from retroquest.act1.Act1 import Act1
from retroquest.act1.items.Map import Map
from retroquest.act1.items.TravelCloak import TravelCloak
from retroquest.act1.quests.PreparingForTheRoad import PreparingForTheRoadQuest
from retroquest.engine.Game import Game


class TestPreparingForTheRoadChecklist(unittest.TestCase):
    """The checklist marks done items as success and unmet items as pending."""

    def setUp(self) -> None:
        """Create a real Act I game and a fresh quest."""
        act1 = Act1()
        act1.music_file = ''
        self.game = Game([act1])
        self.quest = PreparingForTheRoadQuest()

    def test_met_requirements_are_marked_success(self) -> None:
        """Items the player already has are wrapped in [success]."""
        self.game.state.add_item_to_inventory(TravelCloak())
        self.game.state.add_item_to_inventory(Map())

        self.quest.check_completion(self.game.state)

        assert "[success] * Warm clothing[/success]" in self.quest.description
        assert "[success] * A map to find your way[/success]" in self.quest.description

    def test_unmet_requirements_are_marked_pending_not_failure(self) -> None:
        """Items still missing are "not yet", so they use [pending], never [failure]."""
        self.game.state.add_item_to_inventory(TravelCloak())

        completed = self.quest.check_completion(self.game.state)

        assert not completed
        assert "[pending] * Sturdy footwear[/pending]" in self.quest.description
        assert "[pending] * Magical protection[/pending]" in self.quest.description
        assert "[failure]" not in self.quest.description

    def test_every_requirement_is_listed_once(self) -> None:
        """All six requirements appear in the checklist exactly once."""
        self.quest.check_completion(self.game.state)

        for requirement in (
            "Warm clothing",
            "Magical protection",
            "Food for the road (at least four different types)",
            "Sturdy footwear",
            "A map to find your way",
            "All basic magic learned",
        ):
            assert self.quest.description.count(requirement) == 1, requirement
