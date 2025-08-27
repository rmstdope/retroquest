from textual.widgets import Static
from textual.containers import ScrollableContainer
from ..theme import apply_theme

class RoomPanel(ScrollableContainer):
    def __init__(self) -> None:
        """Initialize the RoomPanel as a scrollable container for room descriptions."""
        super().__init__(classes="room", can_focus=False)
        self.tooltip = "Current Room Description"
        self.content_widget = Static("", classes='room-text', markup=True)
        self.content_widget.can_focus = True

    def on_mount(self) -> None:
        """Mount the content widget when the panel is added to the DOM."""
        self.mount(self.content_widget)

    def update_room(self, text: str, wide: bool = False) -> None:
        """Update the panel with new room description text.
        
        Args:
            text: The room description text to display, will be processed through apply_theme
            wide: If True, applies wide formatting (for ASCII logo), otherwise normal formatting
        """
        # pass
        self.content_widget.classes = 'room-text room-text-wide' if wide else 'room-text'
        self.content_widget.update(apply_theme(text))
