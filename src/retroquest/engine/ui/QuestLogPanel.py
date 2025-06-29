from textual.widgets import RichLog
from ..theme import apply_theme

class QuestLogPanel(RichLog):
    def update_questlog(self, text: str):
        self.clear()
        self.write(apply_theme(text))
