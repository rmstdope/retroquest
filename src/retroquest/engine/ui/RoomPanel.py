from textual.widgets import RichLog
from ..theme import apply_theme

class RoomPanel(RichLog):
    def __init__(self):
        super().__init__(id="room", markup=True, wrap=True, auto_scroll=False)
        self.tooltip = "Current Room Description"

    def update_room(self, text: str):
        self.clear()
        self.write(apply_theme(text))
