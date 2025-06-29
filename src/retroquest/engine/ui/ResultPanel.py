from textual.widgets import RichLog
from ..theme import apply_theme

class ResultPanel(RichLog):
    def update_result(self, text: str):
        self.clear()
        self.write(apply_theme(text))
