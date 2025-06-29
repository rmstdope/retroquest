from textual.containers import Container
from textual.widgets import Static
from textual import events
from ..theme import apply_theme

class Popup(Container):
    def __init__(self, border_text: str, text: str, **kwargs):
        super().__init__(**kwargs)
        self.can_focus = True
        self.border_title = apply_theme(border_text)
        self.text_area = Static(apply_theme(text), id="popup_textarea")
        self.static = Static("Press Enter to close", id="popup_static")
        self.id = "popup"

    async def on_key(self, event: events.Key) -> None:
        if event.key == "enter":
            await self.app.close_popup()

    def compose(self):
        yield self.text_area
        yield self.static

    def on_mount(self):
        self.text_area.focus()
