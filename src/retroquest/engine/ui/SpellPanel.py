from textual.widgets import RichLog
from ..theme import apply_theme

class SpellPanel(RichLog):
    def __init__(self):
        super().__init__(id="spells", markup=True, wrap=True, auto_scroll=False)
        self.tooltip = "Spell List"

    def update_spells(self, spells: str):
        self.clear()
        self.write(apply_theme(spells))
