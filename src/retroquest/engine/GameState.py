class GameState:
    """
    Holds the mutable state of the currently played game: current room, inventory, history, and visited rooms.
    """
    def __init__(self, starting_room, all_rooms, all_quests) -> None:
        self.current_room = starting_room
        self.all_rooms = all_rooms
        self.inventory = []
        self.history = []
        self.visited_rooms = [starting_room.name]
        self.known_spells = []
        self.story_flags = [] # Replace journal_read_prologue_entry
        self.non_activated_quests = all_quests  
        self.activated_quests = []  # This will hold quests that have been activated
        self.completed_quests = []  # This will hold quests that have been completed

    def mark_visited(self, room) -> None:
        if room.name not in self.visited_rooms:
            self.visited_rooms.append(room.name)

    def set_story_flag(self, flag_name: str, value: bool) -> None:
        """Sets or updates a story flag."""
        for i, (name, _) in enumerate(self.story_flags):
            if name == flag_name:
                self.story_flags[i] = (flag_name, value)
                return
        self.story_flags.append((flag_name, value))

    def get_story_flag(self, flag_name: str) -> bool:
        """Gets the value of a story flag. Returns False if not found."""
        for name, value in self.story_flags:
            if name == flag_name:
                return value
        return False

    def has_item(self, item_name: str) -> bool:
        """Checks if an item with the given name or short name is in the player's inventory (case-insensitive)."""
        item_name_lower = item_name.lower()
        for item in self.inventory:
            if item.get_name().lower() == item_name_lower or item.get_short_name().lower() == item_name_lower:
                return True
        return False

    def remove_item_from_inventory(self, item_name: str) -> None:
        """Removes an item from the player's inventory by its name."""
        item_name_lower = item_name.lower()
        for item in self.inventory:
            if item.get_name().lower() == item_name_lower:
                self.inventory.remove(item)
                return # Assuming only one instance of an item name can exist or we remove the first one

    def add_item_to_inventory(self, item_object) -> None:
        """Adds an item object to the player's inventory."""
        self.inventory.append(item_object)

    def learn_spell(self, spell_object) -> None:
        """Adds a spell object to the player's known spells if not already learned."""
        if not self.has_spell(spell_object.name):
            self.known_spells.append(spell_object)

    def has_spell(self, spell_name: str) -> bool:
        """Checks if a spell with the given name is in the player's known spells (case-insensitive)."""
        spell_name_lower = spell_name.lower()
        for spell in self.known_spells:
            if spell.name.lower() == spell_name_lower:
                return True
        return False

    def stats(self) -> str:
        lines = [
            f"[bold]Current Room:[/bold] [room_name]{self.current_room.name}[/room_name]",
            "",
            "[bold]Inventory:[/bold]"
        ]
        if self.inventory:
            for item in self.inventory:
                lines.append(f"- [item_name]{item.get_name()}[/item_name]")
        else:
            lines.append("(empty)")
        lines.append("")
        lines.append("[bold]Known Spells:[/bold]")
        if self.known_spells:
            for spell in self.known_spells:
                lines.append(f"- [spell_name]{spell.get_name()}[/spell_name]")
        else:
            lines.append("(none)")
        lines.append("")
        lines.append("[bold]Visited Rooms:[/bold]")
        if self.visited_rooms:
            for room in self.visited_rooms:
                lines.append(f"- [room_name]{room}[/room_name]")
        else:
            lines.append("(none)")
        lines.append("")
        lines.append("[bold]Activated Quests:[/bold]")
        if self.activated_quests:
            for quest in self.activated_quests:
                quest_type = "main" if quest.is_main() else "side"
                lines.append(f"- [quest_name]{quest.name} ({quest_type})[/quest_name]: {quest.description}")
        else:
            lines.append("(none)")
        lines.append("")
        lines.append("[bold]Completed Quests:[/bold]")
        if self.completed_quests:
            for quest in self.completed_quests:
                quest_type = "main" if quest.is_main() else "side"
                lines.append(f"- [quest_name]{quest.name} ({quest_type})[/quest_name]: {quest.completion}")
        else:
            lines.append("(none)")
        return "\n".join(lines)

    def activate_quests(self):
        """
        Checks non_activated_quests for any that should be activated (triggered).
        Moves newly activated quests to activated_quests and returns a string describing them,
        or None if no new quest was activated.
        """
        newly_activated = []
        remaining = []
        for quest in self.non_activated_quests:
            if quest.check_trigger(self):
                self.activated_quests.append(quest)
                newly_activated.append(quest)
            else:
                remaining.append(quest)
        self.non_activated_quests = remaining
        if newly_activated:
            quest_lines = []
            for q in newly_activated:
                quest_type = "main" if q.is_main() else "side"
                quest_lines.append(f"[quest_name]{q.name} ({quest_type})[/quest_name]: {q.description}")
            return "New quest(s) activated:\n" + "\n".join(quest_lines)
        return None

    def complete_quests(self):
        """
        Checks activated_quests for any that are now completed.
        Moves newly completed quests to completed_quests and returns a string describing them,
        or None if no new quest was completed.
        """
        newly_completed = []
        remaining = []
        for quest in getattr(self, 'activated_quests', []):
            if quest.check_completion(self):
                self.completed_quests.append(quest)
                newly_completed.append(quest)
            else:
                remaining.append(quest)
        self.activated_quests = remaining
        if newly_completed:
            completion_lines = []
            for q in newly_completed:
                quest_type = "main" if q.is_main() else "side"
                completion_lines.append(f"[quest_name]{q.name} ({quest_type})[/quest_name]: [dim]{q.completion}[/dim]")
            return "Quest(s) completed:\n" + "\n".join(completion_lines)
        return None

    def update_quests(self):
        """
        Checks activated_quests for any that should update their quest log (dynamic quest log updates).
        Returns a string describing updated quests, or None if no quest log was updated.
        """
        updated_quests = []
        for quest in getattr(self, 'activated_quests', []):
            if quest.check_update(self):
                updated_quests.append(quest)
        if updated_quests:
            update_lines = []
            for q in updated_quests:
                quest_type = "main" if q.is_main() else "side"
                update_lines.append(f"[quest_name]{q.name} ({quest_type})[/quest_name]: {q.description}")
            return "Quest log updated:\n" + "\n".join(update_lines)
        return None

    def get_room(self, room_name: str):
        """
        Returns the room object matching the given room_name (case-insensitive, matches against all room names).
        Returns None if not found.
        """
        for room in self.all_rooms.values():
            if room.name.lower() == room_name.lower():
                return room
        return None

    def get_item(self, item_name: str):
        """
        Returns the item object matching the given item_name (case-insensitive),
        searching first in the player's inventory, then in all rooms.
        Returns None if not found.
        """
        # Search inventory
        item_name_lower = item_name.lower()
        for item in self.inventory:
            if (item.get_name().lower() == item_name_lower) or (item.get_short_name().lower() == item_name_lower):
                return item
        # Search all rooms
        for room in self.all_rooms.values():
            for room_item in getattr(room, 'items', []):
                if room_item.get_name().lower() == item_name_lower or (room_item.get_short_name().lower() == item_name_lower):
                    return room_item
        return None

    def get_quest(self, quest_name: str):
        """
        Returns the quest object matching the given quest_name (case-insensitive),
        searching in non_activated_quests, activated_quests, and completed_quests.
        Returns None if not found.
        """
        quest_name_lower = quest_name.lower()
        for quest_list in [self.non_activated_quests, self.activated_quests, self.completed_quests]:
            for quest in quest_list:
                if quest.name.lower() == quest_name_lower:
                    return quest
        return None

    def activate_quest(self):
        """
        Checks non_activated_quests for the first quest that should be activated (triggered).
        Moves the newly activated quest to activated_quests and returns a string describing it,
        or None if no new quest was activated.
        """
        for i, quest in enumerate(self.non_activated_quests):
            if quest.check_trigger(self):
                self.activated_quests.append(quest)
                del self.non_activated_quests[i]
                quest_type = "main" if quest.is_main() else "side"
                return f"[quest_name]{quest.name} ({quest_type} quest)[/quest_name]\n\n{quest.description}"
        return None

    def update_quest(self):
        """
        Checks activated_quests for the first quest that should update its quest log (dynamic quest log updates).
        Returns a string describing the updated quest, or None if no quest log was updated.
        """
        for quest in self.activated_quests:
            if quest.check_update(self):
                quest_type = "main" if quest.is_main() else "side"
                return f"[quest_name]{quest.name} ({quest_type} quest)[/quest_name]\n\n{quest.description}"
        return None

    def complete_quest(self):
        """
        Checks activated_quests for the first quest that is now completed.
        Moves the newly completed quest to completed_quests and returns a string describing it,
        or None if no new quest was completed.
        """
        for i, quest in enumerate(self.activated_quests):
            if quest.check_completion(self):
                self.completed_quests.append(quest)
                del self.activated_quests[i]
                quest_type = "main" if quest.is_main() else "side"
                return f"[quest_name]{quest.name} ({quest_type} quest)[/quest_name]\n\n[dim]{quest.completion}[/dim]"
        return None

