from textual.widgets import Input
from .NestedSuggester import NestedSuggester

class CommandInput(Input):
    def __init__(self, controller):
        super().__init__(placeholder="Press Enter to continue", id="command_input")
        self.controller = controller
        self.tooltip = "Type your command here"
        # If suggester logic is needed, instantiate and assign directly
        self.suggester = NestedSuggester(self, controller)
