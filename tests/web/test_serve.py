"""Tests for the RetroQuest development web server."""

import importlib.util
import os
from pathlib import Path

# serve.py lives in web/ which is not a Python package; load it directly.
_web_dir = Path(__file__).resolve().parents[2] / 'web'
_spec = importlib.util.spec_from_file_location('serve', _web_dir / 'serve.py')
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
RetroQuestHandler = _module.RetroQuestHandler


def _make_handler(tmp_path: Path) -> RetroQuestHandler:
    """Instantiate RetroQuestHandler without a live socket connection."""
    handler = RetroQuestHandler.__new__(RetroQuestHandler)
    handler.web_dir = str(tmp_path / 'web')
    handler.src_dir = str(tmp_path / 'src')
    return handler


class TestTranslatePath:
    """Tests for RetroQuestHandler.translate_path."""

    def test_src_path_with_url_encoded_spaces_is_decoded(
        self, tmp_path: Path
    ) -> None:
        """translate_path must URL-decode %20 to spaces for /src/ routes.

        Without decoding, a request for a music file whose name contains
        spaces will resolve to a path with literal '%20' characters that
        does not exist on the filesystem.
        """
        handler = _make_handler(tmp_path)
        encoded = (
            '/src/retroquest/audio/music/'
            'Conquest%20-%20Market%20(freetouse.com).mp3'
        )
        result = handler.translate_path(encoded)
        expected = os.path.join(
            str(tmp_path / 'src'),
            'retroquest/audio/music/'
            'Conquest - Market (freetouse.com).mp3',
        )
        assert result == expected

    def test_src_path_without_encoding_is_passed_through(
        self, tmp_path: Path
    ) -> None:
        """translate_path leaves already-plain src paths unchanged."""
        handler = _make_handler(tmp_path)
        result = handler.translate_path('/src/retroquest/__init__.py')
        expected = os.path.join(
            str(tmp_path / 'src'), 'retroquest/__init__.py'
        )
        assert result == expected
