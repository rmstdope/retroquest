from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Static, Input
from textual.containers import Container, Horizontal
from .game_controller import GameController
from ...act1.Act1 import Act1

class OutputPanel(Static):
    def update_output(self, text: str):
        self.update(text)

class QuestLogPanel(Static):
    def update_questlog(self, text: str):
        self.update(text)

class InventoryPanel(Static):
    def update_inventory(self, text: str):
        self.update(text)

class CommandInput(Input):
    pass

class RetroQuestApp(App):
    CSS_PATH = None
    TITLE = "RetroQuest"
    SUB_TITLE = "A Text Adventure"

    def __init__(self):
        super().__init__()
        self.controller = GameController(Act1())

    def compose(self) -> ComposeResult:
        self.output_panel = OutputPanel(id="output")
        self.questlog_panel = QuestLogPanel(id="questlog")
        self.inventory_panel = InventoryPanel(id="inventory")
        self.command_input = CommandInput(placeholder="What will you do?", id="command_input")
        yield Header()
        yield Container(
            Horizontal(
                self.output_panel,
                self.questlog_panel,
                self.inventory_panel,
            ),
            self.command_input,
        )
        yield Footer()

    async def on_mount(self) -> None:
        # Initialize game and display intro
        output = self.controller.start()
        self.output_panel.update_output(output)
        self.questlog_panel.update_questlog(self.controller.get_quest_log())
        self.inventory_panel.update_inventory(self.controller.get_inventory())
        await self.command_input.focus()

    async def on_input_submitted(self, message: Input.Submitted) -> None:
        command = message.value.strip()
        if command:
            output = self.controller.handle_command(command)
            self.output_panel.update_output(output)
            self.questlog_panel.update_questlog(self.controller.get_quest_log())
            self.inventory_panel.update_inventory(self.controller.get_inventory())
            self.command_input.value = ""
