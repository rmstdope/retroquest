from textual.widgets import RichLog
from ..theme import apply_theme

class InventoryPanel(RichLog):
    def update_inventory(self, text: str):
        self.clear()
        self.write(apply_theme(text))
