from textual.widgets import RichLog
from ..theme import apply_theme

class ResultPanel(RichLog):
    def __init__(self):
        super().__init__(id="result", markup=True, wrap=True, auto_scroll=False)
        self.tooltip = "Command Result"

    def update_result(self, text: str):
        self.clear()
        self.write(apply_theme(text))
