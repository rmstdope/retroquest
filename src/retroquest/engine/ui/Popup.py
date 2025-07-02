from enum import Enum
from textual.containers import VerticalScroll
from textual.widgets import Static
from textual import events
from ..theme import apply_theme

class PopupType(Enum):
    INFO = "info"
    QUESTION = "question"

class Popup(VerticalScroll):
    def __init__(self, border_text: str, text: str, popup_type: PopupType):
        super().__init__(id = "popup")
        self.can_focus = True
        self.animation_duration = 0.3  # Duration for all animations in seconds
        self.text_area = Static("", id="popup_textarea")
        self.static = Static("", id="popup_static")
        self.tooltip = "Popup Dialog"
        self.set_content(border_text, text, popup_type)

    def set_content(self, border_text: str, text: str, popup_type: PopupType):
        if self.is_mounted:
            # Animate out, update content, then animate back in
            self.styles.animate("opacity", 0.0, duration=self.animation_duration, on_complete=lambda: self._update_content_and_fade_in(border_text, text, popup_type))
        else:
            # Widget not mounted yet, set content directly
            self._update_content(border_text, text, popup_type)
    
    def _update_content(self, border_text: str, text: str, popup_type: PopupType):
        """Internal method to update the popup content."""
        self.border_title = apply_theme(border_text)
        self.text_area.update(apply_theme(text))
        self.popup_type = popup_type
        if popup_type == PopupType.QUESTION:
            self.static.update("Press Y or N")
        else:
            self.static.update("Press Enter to close")
    
    def _update_content_and_fade_in(self, border_text: str, text: str, popup_type: PopupType):
        """Update content and fade back in."""
        self._update_content(border_text, text, popup_type)
        self.styles.animate("opacity", 1.0, duration=self.animation_duration)

    def on_key(self, event: events.Key) -> None:
        if self.popup_type == PopupType.INFO:
            if event.key == "enter":
                self.app.close_popup()
        elif self.popup_type == PopupType.QUESTION:
            if event.key.lower() == "y":
                self.app.close_popup(response="y")
            elif event.key.lower() == "n":
                self.app.close_popup(response="n")

    def compose(self):
        yield self.text_area
        yield self.static

    def on_mount(self):
        self.text_area.focus()
        # Animate opacity from 0.0 to 1.0 for a fade-in effect
        self.styles.opacity = 0.0
        self.styles.animate("opacity", 1.0, duration=self.animation_duration)


    def on_blur(self, event: events.Blur) -> None:
        """Restore focus to popup when it loses focus (maintains modal behavior)"""
        # Use call_next to avoid infinite recursion
        self.call_next(self.focus)
