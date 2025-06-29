from ..Game import Game
from textual.message import Message
from ..theme import apply_theme

class GameController:
    """Controller to bridge RetroQuest game logic and the Textual UI."""
    def __init__(self, act):
        self.game = Game(act)
        self.last_output = ""

    def start(self):
        # Show ASCII logo at game start
        self.last_output = self.game.get_ascii_logo()
        return self.last_output

    def handle_command(self, command: str) -> str:
        output = self.game.command_parser.parse(command)
        self.last_output = output
        return output

    def get_output(self) -> str:
        return self.last_output

    def get_quest_log(self) -> str:
        """Return a formatted list of activated quests, similar to GameState.stats()."""
        lines = ["[bold]Activated Quests:[/bold]"]
        if self.game.state.activated_quests:
            for quest in self.game.state.activated_quests:
                quest_type = "main" if quest.is_main() else "side"
                lines.append(f"- [quest_name]{quest.name} ({quest_type})[/quest_name]: {quest.description}")
                # lines.append(f"- [quest_name]{quest.get_name()}[/quest_name]")
        else:
            lines.append("(none)")
        return apply_theme("\n".join(lines))

    def get_inventory(self) -> str:
        lines = ["[bold]Inventory:[/bold]"]
        if self.game.state.inventory:
            for item in self.game.state.inventory:
                lines.append(f"- [item_name]{item.get_name()}[/item_name]")
        else:
            lines.append("(empty)")
        return apply_theme("\n".join(lines))

    def get_room(self) -> str:
        """Return the current room description, styled."""
        return apply_theme(self.game.state.current_room.describe())
