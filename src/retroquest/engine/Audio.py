"""Audio subsystem: handles music and sound effects playback."""

import threading
import pygame

class Audio:
    """Encapsulate audio playback (music and sound effects)."""

    def __init__(self) -> None:
        """Create an Audio helper bound to the owning Game instance."""

    def play_soundeffect(self, filename: str) -> None:
        """Play a sound effect (wav/ogg) mixed with music. Non-blocking."""
        def play_fx():
            try:
                if not pygame.mixer.get_init():
                    pygame.mixer.init()
                sound = pygame.mixer.Sound('audio/soundeffects/' + filename)
                sound.play()
            except RuntimeError as e:
                print(f"[dim]Could not play sound effect '{filename}': {e}[/dim]")
        threading.Thread(target=play_fx, daemon=True).start()

    def start_music(self, music_file: str) -> None:
        """Start background music in a non-blocking thread if a file is provided."""
        def play_music() -> None:
            try:
                if pygame.mixer.get_init():
                    pygame.mixer.music.stop()
                else:
                    pygame.mixer.init()
                music_path = 'audio/music/' + music_file
                pygame.mixer.music.load(music_path)
                pygame.mixer.music.play(loops=-1)
            except RuntimeError as e:
                print(f"[dim]Could not play music: {e}[/dim]")

        if music_file is not None and music_file != '':
            threading.Thread(target=play_music, daemon=True).start()
