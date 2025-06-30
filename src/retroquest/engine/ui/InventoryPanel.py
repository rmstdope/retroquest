from textual.widgets import RichLog
from ..theme import apply_theme

class InventoryPanel(RichLog):
    def __init__(self):
        super().__init__(id="inventory", markup=True, wrap=True, auto_scroll=False)
        self.tooltip = "Inventory"

    def update_inventory(self, text: str):
        self.clear()
        self.write(apply_theme(text))
