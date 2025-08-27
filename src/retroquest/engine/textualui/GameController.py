from ..Game import Game
from textual.message import Message
from ..theme import apply_theme

class GameController:
    """Controller to bridge RetroQuest game logic and the Textual UI."""
    def __init__(self, game: Game) -> None:
        self.game = game
        self.last_output = ""

    def start(self) -> str:
        self.game.start_music()
        # Show ASCII logo at game start
        self.last_output = self.game.get_ascii_logo()
        return self.last_output

    def handle_command(self, command: str) -> str:
        output = self.game.command_parser.parse(command)
        self.last_output = output
        return output

    def get_output(self) -> str:
        return self.last_output

    def get_active_quests(self) -> list:
        """Return a list of tuples (quest_name, description) for activated quests."""
        quest_tuples = []
        for quest in self.game.state.activated_quests:
            quest_type = "main" if quest.is_main() else "side"
            quest_name = f"[quest_name]{quest.name} ({quest_type})[/quest_name]"
            quest_tuples.append((quest_name, quest.description))
        return quest_tuples

    def get_completed_quests(self) -> list:
        """Return a list of tuples (quest_name, completion) for completed quests."""
        quest_tuples = []
        for quest in self.game.state.completed_quests:
            quest_type = "main" if quest.is_main() else "side"
            quest_name = f"[quest_name]{quest.name} ({quest_type})[/quest_name]"
            completion_text = f"[dim]{quest.completion}[/dim]"
            quest_tuples.append((quest_name, completion_text))
        return quest_tuples

    def get_inventory(self) -> list:
        """Return a list of tuples (itemname, item_description) for inventory items."""
        item_tuples = []
        inventory_summary = self.game.state.get_inventory_summary()
        
        # Create a set to track which items we've already processed
        processed_items = set()
        
        for item in self.game.state.inventory:
            item_name = item.get_name()
            if item_name in processed_items:
                continue  # Skip duplicates, we already processed this item type
            
            count = inventory_summary[item_name]
            if count > 1:
                styled_item_name = f"[item_name]{count} {item_name}[/item_name]"
            else:
                styled_item_name = f"[item_name]{item_name}[/item_name]"
            item_description = item.description
            item_tuples.append((styled_item_name, item_description))
            processed_items.add(item_name)
            
        return item_tuples

    def get_room(self) -> str:
        """Return the current room description, styled."""
        return apply_theme(self.game.state.current_room.describe(self.game.state))

    def get_spells(self) -> list:
        """Return a list of tuples (spell_name, spell_description) for known spells."""
        spell_tuples = []
        for spell in self.game.state.known_spells:
            spell_name = f"[spell_name]{spell.get_name()}[/spell_name]"
            spell_description = spell.description
            spell_tuples.append((spell_name, spell_description))
        return spell_tuples

    def save_game(self) -> None:
        """Save the game state."""
        self.game.save()

    def get_act_intro(self) -> str:
        """Get the act introduction text."""
        return self.game.get_act_intro()

    def look(self) -> str:
        """Execute the look command and return result."""
        return self.game.look()

    def complete_quest(self) -> str:
        """Check for quest completion and return popup text if any."""
        if (quest := self.game.state.next_completed_quest()) is not None:
            quest_type = "main" if quest.is_main() else "side"
            return f"[quest_name]{quest.name} ({quest_type} quest)[/quest_name]\n\n{quest.description}"
        return None

    def update_quest(self) -> str:
        """Check for quest updates and return popup text if any."""
        if (quest := self.game.state.next_updated_quest()) is not None:
            quest_type = "main" if quest.is_main() else "side"
            return f"[quest_name]{quest.name} ({quest_type} quest)[/quest_name]\n\n{quest.description}"
        return None

    def activate_quest(self) -> str:
        """Check for quest activation and return popup text if any."""
        if (quest := self.game.state.next_activated_quest()) is not None:
            quest_type = "main" if quest.is_main() else "side"
            return f"[quest_name]{quest.name} ({quest_type} quest)[/quest_name]\n\n{quest.description}"
        return None
