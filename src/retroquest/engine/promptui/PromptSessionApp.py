import os
from typing import Any
from prompt_toolkit import PromptSession
from prompt_toolkit.completion import NestedCompleter
from rich.console import Console
from rich.theme import Theme

from retroquest.engine import Game

class PromptSessionApp:
    """
    Prompt-based user interface for RetroQuest.
    """

    def __init__(self, game: Game) -> None:
        custom_theme = Theme({
            "character_name": "bold blue",
            "dialogue": "italic cyan",
            "item_name": "bold green",
            "spell.name": "bold magenta",
            "room_name": "bold cyan",
            "quest_name": "red",
            "event": "dim",
            "failure": "bold red",
            "success": "bold green",
            "exits": "bold yellow"
        })
        self.console = Console(theme=custom_theme)
        self.completer = NestedCompleter.from_nested_dict({})
        self.session = PromptSession(completer=self.completer, complete_while_typing=True)
        self.game = game
        self.console = Console(theme=custom_theme)
        self.completer = NestedCompleter.from_nested_dict({})
        self.session = PromptSession(completer=self.completer, complete_while_typing=True)

    def handle_command(self, command: str) -> str:
        result = self.game.command_parser.parse(command)
        if self.game.describe_room:
            # If the command resulted in a room change, describe the new room
            self.describe_room = False
            result += self.game.state.current_room.describe(self.game.state)
        txt = []
        while (quest := self.game.state.next_activated_quest()):
            quest_type = "main" if quest.is_main() else "side"
            txt.append(f"[quest_name]{quest.name} ({quest_type} quest)[/quest_name]\n{quest.description}")
        if txt:
            result += "\nQuest(s) activated:\n" + "\n".join(txt)
        txt = []
        while (quest := self.game.state.next_updated_quest()):
            quest_type = "main" if quest.is_main() else "side"
            txt.append(f"[quest_name]{quest.name} ({quest_type} quest)[/quest_name]\n{quest.description}")
        if txt:
            result += "\nQuest(s) updated:\n" + "\n".join(txt)
        txt = []
        while (quest := self.game.state.next_completed_quest()):
            quest_type = "main" if quest.is_main() else "side"
            txt.append(f"[quest_name]{quest.name} ({quest_type} quest)[/quest_name]\n{quest.description}")
        if txt:
            result += "\nQuest(s) completed:\n" + "\n".join(txt)
        return result

    def run(self) -> None:
        self.game.start_music()

        # Print Logo
        self.console.clear()
        self.console.print(self.game.get_ascii_logo())
        self.session.prompt('Press Enter to continue...')

        # Print Intro
        self.console.clear()
        self.console.print(self.game.get_act_intro())
        self.session.prompt('Press Enter to continue...')

        # Run
        self.console.clear()
        response = self.handle_command('look')  # Initial look at the room
        self.console.print('\n' + response + '\n')
        while self.game.is_running:
            completions = self.game.get_command_completions()
            self.session.completer = NestedCompleter.from_nested_dict(completions)
            user_input = self.session.prompt('> ')
            self.game.state.history.append(user_input)
            response = self.handle_command(user_input)
            if not self.game.is_running:
                break
            # Print a separator line before any output after a command
            self.console.print('\n' + response + '\n')
        while True:
            answer = self.session.prompt("Do you want to save before quitting? (yes/no): ").strip().lower()
            if answer in ("yes", "y"):
                self.game.save()
                self.console.print("Game saved. Goodbye!")
                break
            elif answer in ("no", "n"):
                self.console.print("Goodbye!")
                break
            else:
                self.console.print("Please answer 'yes' or 'no'.")
                continue



