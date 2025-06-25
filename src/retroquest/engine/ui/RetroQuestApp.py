from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Static, Input
from textual.containers import Container, Horizontal
from .GameController import GameController
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

    STATE_LOGO = 0
    STATE_INTRO = 1
    STATE_RUNNING = 2

    def __init__(self):
        super().__init__()
        self.controller = GameController(Act1())
        self.state = self.STATE_LOGO

    def compose(self) -> ComposeResult:
        self.output_panel = OutputPanel(id="output")
        self.questlog_panel = QuestLogPanel(id="questlog")
        self.inventory_panel = InventoryPanel(id="inventory")
        self.command_input = CommandInput(placeholder="Press Enter to continue", id="command_input")
        yield Header()
        yield Container(
            Horizontal(
                self.output_panel,
                Container(
                    self.inventory_panel,  # Inventory on top
                    self.questlog_panel,  # Questlog below
                    id="side_panels"
                ),
                id="main_row"
            ),
            self.command_input,
        )
        yield Footer()

    async def on_mount(self) -> None:
        # Initialize game and display intro
        self.output_panel.update_output(self.controller.start())
        self.questlog_panel.update_questlog('')
        self.inventory_panel.update_inventory('')
        self.command_input.focus()  # Remove 'await' here, as focus() is not async

    async def on_input_submitted(self, message: Input.Submitted) -> None:
        command = message.value.strip()
        if self.state == self.STATE_LOGO:
            # Transition to intro
            self.output_panel.update_output(self.controller.game.act.get_act_intro())
            self.command_input.placeholder = 'Press Enter to continue'
            self.command_input.value = ""
            self.state = self.STATE_INTRO
        elif self.state == self.STATE_INTRO:
            # Transition to running
            # self.output_panel.update_output(self.controller.handle_command('look around'))
            # self.questlog_panel.update_questlog(self.controller.get_quest_log())
            # self.inventory_panel.update_inventory(self.controller.get_inventory())
            self.command_input.placeholder = 'What will you do?'
            self.command_input.value = ""
            self.state = self.STATE_RUNNING
        elif self.state == self.STATE_RUNNING:
            if command:
                output = self.controller.handle_command(command)
                self.output_panel.update_output(output)
                self.questlog_panel.update_questlog(self.controller.get_quest_log())
                self.inventory_panel.update_inventory(self.controller.get_inventory())
                self.command_input.value = ""

    # Add default CSS for layout if not present
    BINDINGS = [
        ("ctrl+q", "quit", "Quit")
    ]

    def action_quit(self) -> None:
        self.exit()

    CSS = '''
#main_row {
    height: 1fr;
}
#output {
    width: 2fr;
    min-width: 60;
    border: solid #666;
    height: 100%;
    min-height: 20;
}
#side_panels {
    width: 1fr;
    min-width: 30;
    layout: vertical;
    border: solid #666;
    height: 100%;
}
#questlog, #inventory {
    height: 1fr;
    min-height: 10;
    border-bottom: solid #444;
}
#questlog {
    border-bottom: solid #444;
}
#inventory {
    border-bottom: none;
}
'''
