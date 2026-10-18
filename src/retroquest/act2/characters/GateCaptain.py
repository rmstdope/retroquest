"""GateCaptain class: entry authority NPC for Greendale's outer gate."""

from ...engine.Character import Character
from ...engine.GameState import GameState

class GateCaptain(Character):
    """Entry authority who validates `EntryPass` and may leave the gate area."""
    def __init__(self) -> None:
        super().__init__(
            name="gate captain",
            description=(
                "A seasoned officer of Greendale's guard, wearing polished mail and "
                "bearing the insignia of the city watch. His weathered face shows years "
                "of experience maintaining order at the gates."
            ),
        )
        self.entry_pass_given = False

    def talk_to(self, game_state: GameState) -> str:
        """Ask for entry papers, or bid farewell and leave once the pass was shown."""
        if not self.entry_pass_given:
            return (
                "The [character_name]Gate Captain[/character_name] looks at you with a "
                "professional but guarded expression. [dialogue]'State your business in "
                "Greendale, traveler. Do you have proper documentation for entry?'[/dialogue]"
            )
        else:
            if self in game_state.current_room.characters:
                # Remove self from the current room
                game_state.current_room.characters.remove(self)
                return (
                    "The [character_name]Gate Captain[/character_name] nods respectfully. "
                    "[dialogue]'Welcome to Greendale, honored visitor. You'll need a map "
                    "to navigate the city - the streets can be quite maze-like for "
                    "newcomers. Feel free to look around here for anything that might "
                    "help you find your way.'[/dialogue] With that, "
                    "he salutes smartly and walks back to his patrol duties, leaving "
                    "you free to explore the gate area."
                )
            else:
                return (
                    "The Gate Captain has already returned to his duties and is "
                    "no longer present."
                )

    def give_item(
        self, _game_state: GameState, item_object
    ) -> str:  # parameter name aligned with base class
        """Accept the entry pass and politely decline any other item."""
        from ..items.EntryPass import EntryPass  # Import here to avoid circular imports

        if isinstance(item_object, EntryPass):
            if self.entry_pass_given:
                name = self.get_name()
                return (
                    "You have already shown the entry pass to the "
                    f"[character_name]{name}[/character_name]. "
                    "He waves you through with respect."
                )

            self.entry_pass_given = True

            return (
                "The [character_name]Gate Captain[/character_name] examines the entry pass "
                "carefully when you show it to him, noting the official seal. His expression "
                "changes to one of respect as he recognizes the authority behind it. "
                "[dialogue]'This is legitimate documentation indeed. You are welcome in "
                "Greendale, honored visitor. Please, proceed with our blessing.'[/dialogue] "
                "He steps aside and gestures toward the city."
            )

        return (
            "The [character_name]Gate Captain[/character_name] politely declines the "
            f"{item_object.get_name()}. "
            "[dialogue]'I only need to see proper entry documentation.'[/dialogue]"
        )
