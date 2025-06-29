from textual.widgets import Input
from .NestedSuggester import NestedSuggester

class CommandInput(Input):
    def __init__(self, controller, *args, **kwargs):
        kwargs['suggester'] = NestedSuggester(self, controller)
        super().__init__(*args, **kwargs)
