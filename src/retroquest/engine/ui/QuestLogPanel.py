from textual.widgets import RichLog
from ..theme import apply_theme

class QuestLogPanel(RichLog):
    def __init__(self):
        super().__init__(id="questlog", markup=True, wrap=True, auto_scroll=False)
        self.tooltip = "Quest Log"

    def update_questlog(self, text: str):
        self.clear()
        self.write(apply_theme(text))
