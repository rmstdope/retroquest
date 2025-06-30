from textual.widgets import RichLog
from ..theme import apply_theme

class SpellPanel(RichLog):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tooltip = "Spell List"

    def update_spells(self, spells: str):
        self.clear()
        self.write(apply_theme(spells))
