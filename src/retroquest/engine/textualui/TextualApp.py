from typing import Any, Union
from textual.app import App, ComposeResult
from textual.widgets import Header, Footer, Input
from textual.containers import Horizontal, Vertical
from textual.css.query import NoMatches

from audio.soundeffects.SoundEffects import NEW_QUEST_SOUND, QUEST_COMPLETED_SOUND

from ...engine.Game import Game
from .GameController import GameController
from .RoomPanel import RoomPanel
from .ResultPanel import ResultPanel
from .QuestLogPanel import QuestLogPanel
from .InventoryPanel import InventoryPanel
from .CommandInput import CommandInput
from .Popup import Popup, PopupType
from .SpellPanel import SpellPanel

class TextualApp(App):
    TITLE = "RetroQuest"
    SUB_TITLE = "A Text Adventure"
    CSS_PATH = "styles.tcss"

    STATE_LOGO = 0
    STATE_INTRO = 1
    STATE_RUNNING = 2
    STATE_SAVING = 3
    STATE_QUITTING = 4

    def __init__(self, game: Game) -> None:
        super().__init__()
        self.controller = GameController(game)
        self.state = self.STATE_LOGO
        self._popup_queue = []
        self._focus_before_popup = None

    def compose(self) -> ComposeResult:
        self.room_panel = RoomPanel()
        self.result_panel = ResultPanel()
        self.questlog_panel = QuestLogPanel()
        self.inventory_panel = InventoryPanel()
        self.spell_panel = SpellPanel()
        self.command_input = CommandInput(self.controller)
        yield Header()
        yield Horizontal(
                Vertical(
                    self.room_panel,
                    self.result_panel,
                    classes="main_column frame"
                ),
                Vertical(
                    Horizontal(
                        self.inventory_panel,
                        self.spell_panel,
                        id="inventory_spell_row"
                    ),
                    self.questlog_panel,  # Questlog below
                    classes="frame"
                ),
                id="main_row"
            )
        yield self.command_input
        yield Footer()

    async def on_mount(self) -> None:
        # Initialize game and display intro
        self.room_panel.update_room(self.controller.start(), wide=True)
        self.questlog_panel.update_questlog('')
        self.inventory_panel.update_inventory([])
        self.spell_panel.update_spells([])
        self.command_input.focus()

    def open_popup(self, border_text: str, text: str, popup_type: PopupType) -> None:
        try:
            self.get_widget_by_id("popup")
        except NoMatches:
            # Save currently focused widget before opening popup
            self._focus_before_popup = self.focused
            popup = Popup(border_text, text, popup_type)
            self.mount(popup)
            popup.focus()
            return
        # If a popup already exists, queue the new one
        self._popup_queue.append((border_text, text, popup_type))
 
    def close_popup(self, response: str = None) -> None:
        popup = self.get_widget_by_id("popup")
        if self.state == self.STATE_QUITTING:
            if response == "y":
                self.controller.save_game()
            self.exit()
        # Show next popup in queue if any
        if self._popup_queue:
            next_border, next_text, next_type = self._popup_queue.pop(0)
            popup.set_content(next_border, next_text, next_type)
        else:
            # Restore focus to the widget that was focused before popup
            if self._focus_before_popup and self._focus_before_popup.is_attached:
                self._focus_before_popup.focus()
            else:
                self.command_input.focus()
            self._focus_before_popup = None
            popup.remove()

    def on_input_submitted(self, message: Input.Submitted) -> None:
        command = message.value.strip()
        if self.state == self.STATE_LOGO:
            # Transition to intro
            self.room_panel.update_room(self.controller.get_act_intro(), wide=False)
            self.command_input.placeholder = 'Press Enter to continue'
            self.command_input.value = ""
            self.state = self.STATE_INTRO
            return
        elif self.state == self.STATE_INTRO:
            command = 'look'
            self.state = self.STATE_RUNNING
        if self.state == self.STATE_RUNNING and command:
            self.command_input.placeholder = 'What do you want to do?'
            self.command_input.value = ""
            self.execute(command)
            if self.controller.game.is_act_transitioning():
                pass
            if not self.controller.game.is_running:
                self.state = self.STATE_QUITTING
                self.open_popup("Quit Game", "Do you want to save before quitting?", PopupType.QUESTION)
                return

    def execute(self, command: str) -> None:
        result = self.controller.handle_command(command)
        self.result_panel.update_result(result)
        room = self.controller.look()
        self.room_panel.update_room(self.controller.get_room(), wide=False)
        self.inventory_panel.update_inventory(self.controller.get_inventory())
        self.spell_panel.update_spells(self.controller.get_spells())
        # Check for quest completion popups
        while True:
            quest_complete_popup = self.controller.complete_quest()
            if isinstance(quest_complete_popup, str) and quest_complete_popup.strip():
                self.controller.play_soundeffect(QUEST_COMPLETED_SOUND)
                self.open_popup("Quest Completed", quest_complete_popup, PopupType.INFO)
            else:
                break
        while True:
            quest_update_popup = self.controller.update_quest()
            if isinstance(quest_update_popup, str) and quest_update_popup.strip():
                self.controller.play_soundeffect(NEW_QUEST_SOUND)
                self.open_popup("Quest Updated", quest_update_popup, PopupType.INFO)
            else:
                break
        while True:
            quest_popup = self.controller.activate_quest()
            if isinstance(quest_popup, str) and quest_popup.strip():
                self.controller.play_soundeffect(NEW_QUEST_SOUND)
                self.open_popup("Quest Activated", quest_popup, PopupType.INFO)
            else:
                break
        self.questlog_panel.update_questlog(self.controller.get_active_quests(), self.controller.get_completed_quests())
        self.command_input.value = ""

    # Add default CSS for layout if not present
    BINDINGS = [
        ("ctrl+q", "quit", "Quit")
    ]

    def action_quit(self) -> None:
        self.exit()
