from ..Game import Game
from textual.message import Message

class GameController:
    """Controller to bridge RetroQuest game logic and the Textual UI."""
    def __init__(self, act):
        self.game = Game(act)
        self.last_output = ""

    def start(self):
        self.game.print_intro()
        self.last_output = self.game.handle_command('look around')
        return self.last_output

    def handle_command(self, command: str) -> str:
        output = self.game.handle_command(command)
        self.last_output = output
        return output

    def get_output(self) -> str:
        return self.last_output

    def get_quest_log(self) -> str:
        return self.game.state.stats().split("[bold]Completed Quests:[/bold]")[0]  # crude split for demo

    def get_inventory(self) -> str:
        lines = ["[bold]Inventory:[/bold]"]
        if self.game.state.inventory:
            for item in self.game.state.inventory:
                lines.append(f"- [item.name]{item.get_name()}[/item.name]")
        else:
            lines.append("(empty)")
        return "\n".join(lines)
