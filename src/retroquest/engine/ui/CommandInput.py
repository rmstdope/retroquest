from textual.widgets import Input
from textual.events import Key
from .NestedSuggester import NestedSuggester

class CommandInput(Input):
    def __init__(self, controller):
        super().__init__(placeholder="Press Enter to continue", id="command_input")
        self.controller = controller
        self.tooltip = "Command Input"
        self.suggester = NestedSuggester(self, controller)

    async def on_key(self, event: Key) -> None:
        """Override on_key to handle tab key auto-completion."""
        if event.key == "tab":
            # Check if there's a suggestion available
            suggestion = await self.suggester.get_suggestion(self.value)
            if suggestion is not None:
                # Apply the suggestion and prevent normal submission
                self.value = suggestion
                self.cursor_position = len(suggestion)
                event.prevent_default(True)
                event.stop()
