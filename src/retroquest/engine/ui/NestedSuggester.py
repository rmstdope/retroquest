from textual.suggester import Suggester
from textual.widgets import Input
from .GameController import GameController

class NestedSuggester(Suggester):
    """
    Suggester that provides word completions based on Game.build_use_with_completions.
    The completions variable is a nested dictionary of words.
    """
    def __init__(self, input_widget: Input, controller: GameController):
        super().__init__(use_cache=False)
        self.input_widget = input_widget
        self.controller = controller

    async def get_suggestion(self, value: str) -> str | None:
        next_word = value.split(' ')[-1]  # Get the last word only
        words = value.split(' ')[:-1]  # Exclude the last word
        node = self.controller.game.get_command_completions()
        for word in words:
            if isinstance(node, dict) and word in node:
                node = node[word]
            else:
                node = None
                break
        
        # Now node is the dict/list of possible next words
        # Only suggest if next_word is a prefix of exactly one possible next word
        candidates = []
        if isinstance(node, dict):
            candidates = [w for w in node.keys() if w.startswith(next_word)]
        elif isinstance(node, list):
            candidates = [w for w in node if w.startswith(next_word)]
        
        if len(candidates) == 1:
            # Found exactly one candidate, add it to words
            words.append(candidates[0])
            current_node = node[candidates[0]] if isinstance(node, dict) else None
            
            # Keep adding words if there's only one option at each level
            while isinstance(current_node, dict) and len(current_node) == 1:
                next_key = next(iter(current_node.keys()))
                words.append(next_key)
                current_node = current_node[next_key]
            
            return ' '.join(words) + ' '
        return None
