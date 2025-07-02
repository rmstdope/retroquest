from enum import Enum
from textual.containers import Container
from textual.widgets import Static
from textual import events
from ..theme import apply_theme

class PopupType(Enum):
    INFO = "info"
    QUESTION = "question"

class Popup(Container):
    def __init__(self, border_text: str, text: str, popup_type: PopupType):
        super().__init__(id = "popup")
        self.can_focus = True
        self.text_area = Static("", id="popup_textarea")
        self.static = Static("", id="popup_static")
        self.tooltip = "Popup Dialog"
        self.set_content(border_text, text, popup_type)

    def set_content(self, border_text: str, text: str, popup_type: PopupType):
        self.border_title = apply_theme(border_text)
        self.text_area.update(apply_theme(text))
        self.popup_type = popup_type
        if popup_type == PopupType.QUESTION:
            self.static.update("Press Y or N")
        else:
            self.static.update("Press Enter to close")

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

    def on_blur(self, event: events.Blur) -> None:
        """Restore focus to popup when it loses focus (maintains modal behavior)"""
        # Use call_next to avoid infinite recursion
        self.call_next(self.focus)
