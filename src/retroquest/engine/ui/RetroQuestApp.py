import asyncio
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Input
from textual.containers import Container, Horizontal
from textual import events
from textual.css.query import NoMatches
from .GameController import GameController
from ...act1.Act1 import Act1
from ..theme import apply_theme
from .RoomPanel import RoomPanel
from .ResultPanel import ResultPanel
from .QuestLogPanel import QuestLogPanel
from .InventoryPanel import InventoryPanel
from .CommandInput import CommandInput
from .Popup import Popup

# TODO Panel for spell list
# TODO Quests should be expandable and not horizonrtally scrollable

class RetroQuestApp(App):
    TITLE = "RetroQuest"
    SUB_TITLE = "A Text Adventure"

    STATE_LOGO = 0
    STATE_INTRO = 1
    STATE_RUNNING = 2

    def __init__(self):
        super().__init__()
        self.controller = GameController(Act1())
        self.state = self.STATE_LOGO
        self._popup_queue = []

    def compose(self) -> ComposeResult:
        self.room_panel = RoomPanel(id="room", markup=True, wrap=True, auto_scroll=False)
        self.room_panel.tooltip = "Current Room Description"
        self.result_panel = ResultPanel(id="result", markup=True, wrap=True, auto_scroll=False)
        self.result_panel.tooltip = "Command Result"
        self.questlog_panel = QuestLogPanel(id="questlog", markup=True, wrap=True, auto_scroll=False)
        self.questlog_panel.tooltip = "Quest Log"
        self.inventory_panel = InventoryPanel(id="inventory", markup=True, wrap=True, auto_scroll=False)
        self.inventory_panel.tooltip = "Inventory"
        self.command_input = CommandInput(self.controller, placeholder="Press Enter to continue", id="command_input")
        yield Header()
        yield Container(
            Horizontal(
                Container(
                    self.room_panel,
                    self.result_panel,
                    id="output_column"
                ),
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
        self.room_panel.update_room(self.controller.start())
        self.questlog_panel.update_questlog('')
        self.inventory_panel.update_inventory('')
        self.command_input.focus()  # Remove 'await' here, as focus() is not async

    async def open_popup(self, border_text: str, text: str):
        try:
            self.get_widget_by_id("popup")
        except NoMatches:
            popup = Popup(border_text, text)
            await self.mount(popup)
            popup.focus()
            return
        # If a popup already exists, queue the new one
        self._popup_queue.append((border_text, text))
 
    async def close_popup(self):
        popup = self.get_widget_by_id("popup")
        # Show next popup in queue if any
        if self._popup_queue:
            next_border, next_text = self._popup_queue.pop(0)
            popup.border_title = apply_theme(next_border)
            popup.text_area.update(apply_theme(next_text))
        else:
            self.command_input.focus()
            await popup.remove()

    async def on_input_submitted(self, message: Input.Submitted) -> None:
        command = message.value.strip()
        if self.state == self.STATE_LOGO:
            # Transition to intro
            self.room_panel.update_room(self.controller.game.act.get_act_intro())
            self.command_input.placeholder = 'Press Enter to continue'
            self.command_input.value = ""
            self.state = self.STATE_INTRO
            return
        elif self.state == self.STATE_INTRO:
            command = 'look around'
            self.state = self.STATE_RUNNING
        if command:
            result = self.controller.handle_command(command)
            self.result_panel.update_result(result)
            room = self.controller.game.look()
            self.room_panel.update_room(self.controller.get_room())
            self.inventory_panel.update_inventory(self.controller.get_inventory())
            # Check for quest completion popups
            while True:
                quest_complete_popup = self.controller.game.state.complete_quest()
                if isinstance(quest_complete_popup, str) and quest_complete_popup.strip():
                    await self.open_popup("Quest Completed", quest_complete_popup)
                else:
                    break
            # Check for quest update popups
            while True:
                quest_update_popup = self.controller.game.state.update_quest()
                if isinstance(quest_update_popup, str) and quest_update_popup.strip():
                    await self.open_popup("Quest Updated", quest_update_popup)
                else:
                    break
            # Check for quest activation popups
            while True:
                quest_popup = self.controller.game.state.activate_quest()
                if isinstance(quest_popup, str) and quest_popup.strip():
                    await self.open_popup("Quest Activated", quest_popup)
                else:
                    break
                # Update quest log and clear command input
            self.questlog_panel.update_questlog(self.controller.get_quest_log())
            self.command_input.value = ""

    # Add default CSS for layout if not present
    BINDINGS = [
        ("ctrl+q", "quit", "Quit")
    ]

    def action_quit(self) -> None:
        self.exit()

    CSS = '''
Screen {
    layers: main popup;
    align: center middle;
}
Container{
    layer: main;
}
#main_row {
    height: 1fr;
}
#output_column {
    width: 2fr;
    min-width: 60;
    border: solid #666;
    height: 100%;
    min-height: 20;
    layout: vertical;
}
#room {
    height: 2fr;
    min-height: 10;
    border-bottom: solid #444;
}
#result {
    height: 1fr;
    min-height: 5;
    border-bottom: none;
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
    border-bottom: none;
}
#inventory {
    border-bottom: solid #444;
}
#popup {
    background: #222;
    color: #fff;
    border: solid #ff0;
    border-title-align: center;
    border-title-color: #ff0;
    padding: 0;
    layer: popup;
    position: relative;
    width: 50%;
    height: auto;
    align: center middle;
    layout: vertical;
}
#popup_textarea {
    padding: 1 0;
    width: 100%;
    height: auto;
    border: none;
    content-align: center middle;
    text-align: center;
    overflow: auto;
}
#popup_static {
    padding: 0;
    width: 100%;
    height: 1;
    align: center middle;
    border: none;
    text-align: center;
}
'''
