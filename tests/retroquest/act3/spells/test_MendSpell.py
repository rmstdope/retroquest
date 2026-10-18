"""Unit tests for MendSpell in Act 3."""
from retroquest.act3.spells.MendSpell import MendSpell
from retroquest.act3.Act3 import Act3
from retroquest.engine.Game import Game
from retroquest.act3.items.RustedLockerKey import RustedLockerKey
from ..markup_helpers import assert_markup_well_formed

class DummyGameState:
    """Minimal dummy GameState for MendSpell tests."""

class DummyItem:
    """Dummy item that is not a MirrorMount."""
    def get_name(self):
        """Return the name of the dummy item."""
        return "dummy item"

def test_mendspell_init():
    """Test MendSpell initialization and description."""
    spell = MendSpell()
    assert spell.get_name() == "mend"
    assert "repair charm" in spell.get_description()

def test_cast_spell_no_target():
    """Test casting MendSpell with no target nearby."""
    spell = MendSpell()
    gs = DummyGameState()
    result = spell.cast_spell(gs)
    assert "You cast" in result
    assert "nothing to mend" in result

def test_cast_on_item_non_mirror_mount():
    """Test casting MendSpell on a non-mendable item."""
    spell = MendSpell()
    gs = DummyGameState()
    item = DummyItem()
    result = spell.cast_on_item(gs, item)
    assert "doesn't appear to need mending" in result
    assert "dummy item" in result

def test_cast_on_item_mirror_mount():
    """Test casting MendSpell on a MirrorMount triggers mend and returns success."""
    import types
    from retroquest.act3.items.MirrorMount import MirrorMount
    spell = MendSpell()
    gs = DummyGameState()
    mount = MirrorMount()
    called = {}
    def mock_mend(_self, game_state):
        called['game_state'] = game_state
        return "[success]The mirror mount is now fully restored![/success]"
    mount.mend = types.MethodType(mock_mend, mount)
    result = spell.cast_on_item(gs, mount)
    assert called['game_state'] is gs
    assert "fully restored" in result


def _create_markup_game() -> Game:
    """Create an Act III game for markup checks."""
    act = Act3()
    act.music_file = ''
    return Game([act])


def test_cast_on_item_without_need_uses_known_tags():
    """Mending an item that needs no repair uses only known, balanced tags."""
    game = _create_markup_game()

    answer = MendSpell().cast_on_item(game.state, RustedLockerKey())

    assert "doesn't appear to need mending" in answer
    assert_markup_well_formed(answer)
