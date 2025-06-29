from textual.widgets import RichLog
from ..theme import apply_theme

class RoomPanel(RichLog):
    def update_room(self, text: str):
        self.clear()
        self.write(apply_theme(text))
