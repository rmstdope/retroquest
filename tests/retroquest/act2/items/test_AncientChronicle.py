"""Markup tests for studying the Ancient Chronicle."""

from retroquest.act2.Act2 import Act2
from retroquest.act2.items.AncientChronicle import AncientChronicle
from retroquest.engine.Game import Game
from ..markup_helpers import assert_dialogue_speaker, assert_markup_well_formed


def test_blocked_study_has_librarian_speak_in_tagged_dialogue():
    """While unworthy, the Spectral Librarian's warning is tagged dialogue."""
    act = Act2()
    act.music_file = ''
    game = Game([act])

    answer = AncientChronicle().use(game.state)

    assert "not for the unworthy" in answer
    assert_markup_well_formed(answer)
    assert_dialogue_speaker(answer, "Spectral Librarian")
