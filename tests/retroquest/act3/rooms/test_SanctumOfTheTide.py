"""Unit tests for the Sanctum of the Tide guardian dialogue and vow mechanics."""

from typing import Optional

from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.Act3StoryFlags import (
    FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT,
    FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED,
    FLAG_ACT3_VOW_OF_COURAGE_MADE,
)

from ...utils.utils import (
    execute_commands,
    check_story_flag,
    check_item_in_inventory,
)


class TestSanctumOfTheTide:
    """Tests for guardian interaction, vow acceptance gating and crystal acquisition.

    Tests verify that the guardian's talk_to returns a riddle-like prompt, that
    saying 'myself' is rejected unless both lanterns and sigils flags are set,
    and that once accepted the vow sets the VOW flag and the Crystal of Light
    can be picked up.
    """
    act3: Optional[Act3] = None
    game: Optional[Game] = None

    def setup_method(self):
        """ Sets up act and game for testing """
        self.act3 = Act3()
        self.act3.music_file = ''
        self.game = Game([self.act3])
        self.game.state.current_room = self.game.state.all_rooms['SanctumOfTheTide']

    def test_guardian_talks_and_rejects_vow_if_prereqs_missing(self):
        """Talking to the guardian returns a riddle; saying 'myself' fails when
        prerequisites are incomplete.

        Preconditions: Both flags are unset. Actions: 'talk to tide-born guardian',
        then 'say myself to tide-born guardian'. Expected: talk contains a prompt
        and the 'say' command returns a failure message; vow flag remains unset.
        """
        talk = execute_commands(self.game, ['talk to tide-born guardian'])
        assert 'name what you will not abandon' in talk.lower() or 'guardian' in talk.lower()

        fail = execute_commands(self.game, ['say myself to tide-born guardian'])
        assert 'wards resist' in fail.lower() or 'outer rites remain unfinished' in fail.lower()
        assert not self.game.state.get_story_flag(FLAG_ACT3_VOW_OF_COURAGE_MADE)

    def test_accept_vow_and_take_crystal_when_prereqs_met(self):
        """When both sigils and lanterns flags are set, saying 'myself' succeeds
        and allows taking the Crystal of Light.

        Preconditions: Player in Sanctum with both required flags set.
        Actions: 'say myself to tide-born guardian' then 'take crystal of light'.
        Expected: VOW flag set and Crystal of Light moves into inventory.
        """
        # Set prerequisites
        self.game.state.set_story_flag(FLAG_ACT3_LANTERNS_OF_THE_DEEPS_LIT, True)
        self.game.state.set_story_flag(FLAG_ACT3_TIDEWARD_SIGILS_COMPLETED, True)

        vow = execute_commands(self.game, ['say myself to tide-born guardian'])
        assert 'you may now take' in vow.lower() or 'waters draw back' in vow.lower()
        check_story_flag(self.game.state, FLAG_ACT3_VOW_OF_COURAGE_MADE, True)

        execute_commands(self.game, ['take crystal of light'])
        check_item_in_inventory(self.game.state, 'crystal of light', True)
