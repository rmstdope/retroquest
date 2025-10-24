"""Audio subsystem: handles music and sound effects playback."""

import threading
import os
from pathlib import Path
from typing import Optional


def _import_pygame() -> Optional[object]:
    """Attempt to import pygame; return module or None if unavailable.

    Importing pygame can fail in headless CI or test environments. Defer the
    import until audio is actually requested so the rest of the engine can be
    imported without a hard dependency on pygame.
    """
    try:
        import pygame as pygame_module  # type: ignore

        return pygame_module
    except ImportError:
        return None

# TODO Change volume through the command interface
# Default playback volume for music and sound effects (0.0 .. 1.0)
DEFAULT_VOLUME = 0.4


# Expose a module-level `pygame` object. If pygame isn't available, provide a
# small dummy with a `mixer` attribute so tests can monkeypatch
# `audio_module.pygame.mixer.*` without AttributeError.
_pygame_module = _import_pygame()
if _pygame_module is None:
    class _DummyMixer:
        """Minimal dummy mixer namespace used in tests when pygame is absent."""

    class _DummyPygame:
        mixer = _DummyMixer()

    pygame = _DummyPygame()
else:
    pygame = _pygame_module


def _audio_root() -> str:
    """Return the absolute path to the package's `audio` directory.

    This keeps audio assets colocated under `src/retroquest/audio` while
    allowing the code to resolve them regardless of the current working
    directory.
    """
    here = Path(__file__).resolve().parent
    # ../audio from engine/ -> retroquest/audio
    audio_dir = (here.parent / 'audio').resolve()
    return str(audio_dir)


class Audio:
    """Encapsulate audio playback (music and sound effects)."""

    def __init__(self) -> None:
        """Create an Audio helper bound to the owning Game instance."""

    def play_soundeffect(self, filename: str) -> None:
        """Play a sound effect (wav/ogg) mixed with music. Non-blocking."""
        pygame = _import_pygame()
        if pygame is None:
            print("[dim]Could not import pygame. Audio will not be available.[/dim]")
            return

        def play_fx():
            try:
                if not pygame.mixer.get_init():
                    pygame.mixer.init()
                sound_path = os.path.join(_audio_root(), 'soundeffects', filename)
                sound = pygame.mixer.Sound(sound_path)
                try:
                    # ensure reasonable default volume for sound effects
                    sound.set_volume(DEFAULT_VOLUME)
                except Exception:
                    # some pygame implementations may not support set_volume
                    pass
                sound.play()
            except RuntimeError as e:
                print(f"[dim]Could not play sound effect '{filename}': {e}[/dim]")

        threading.Thread(target=play_fx, daemon=True).start()

    def start_music(self, music_file: str) -> None:
        """Start background music in a non-blocking thread if a file is provided."""
        pygame = _import_pygame()
        if pygame is None:
            return

        def play_music() -> None:
            try:
                if pygame.mixer.get_init():
                    pygame.mixer.music.stop()
                else:
                    pygame.mixer.init()
                music_path = os.path.join(_audio_root(), 'music', music_file)
                pygame.mixer.music.load(music_path)
                try:
                    # set default music volume (0.0 .. 1.0)
                    pygame.mixer.music.set_volume(DEFAULT_VOLUME)
                except Exception:
                    pass
                pygame.mixer.music.play(loops=-1)
            except RuntimeError as e:
                print(f"[dim]Could not play music: {e}[/dim]")

        if music_file is not None and music_file != '':
            threading.Thread(target=play_music, daemon=True).start()
