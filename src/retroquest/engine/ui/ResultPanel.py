from textual.widgets import Static
from textual.containers import ScrollableContainer
from ..theme import apply_theme

class ResultPanel(ScrollableContainer):
    def __init__(self):
        """Initialize the ResultPanel as a scrollable container for command results."""
        super().__init__(classes="result", can_focus=False)
        self.tooltip = "Command Result"
        self.content_widget = Static("", classes='room-text', markup=True)
        self.content_widget.can_focus = True
        
    def on_mount(self):
        """Mount the content widget when the panel is added to the DOM."""
        self.mount(self.content_widget)

    def update_result(self, text: str):
        """Update the panel with new command result text.
        
        Args:
            text: The result text to display, will be processed through apply_theme
        """
        self.content_widget.update(apply_theme(text))
