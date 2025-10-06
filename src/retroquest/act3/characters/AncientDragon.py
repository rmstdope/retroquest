"""AncientDragon character for the Dragon's Hall in Act 3."""
from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act3StoryFlags import FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, FLAG_ACT3_DRAGON_OATH_SPOKEN


class AncientDragon(Character):
    """The ancient dragon who guards the Dragon's Scale and holds memories."""

    def __init__(self) -> None:
        """Initialize AncientDragon with majestic and wise appearance."""
        super().__init__(
            name="ancient dragon",
            description=(
                "A magnificent dragon of immense age, scales gleaming like polished "
                "obsidian in the ember-light. Ancient wisdom burns in golden eyes "
                "that have witnessed countless ages. Slow breaths stir the air like "
                "distant thunder."
            )
        )

    def talk_to(self, game_state: GameState) -> str:
        """Provide the Dragon's Memory for the storytelling quest."""
        # Check if this is the first conversation
        if not game_state.get_story_flag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED):
            game_state.set_story_flag(FLAG_ACT3_DRAGONS_MEMORY_RECEIVED, True)
            return (
                "[dialogue]The dragon's voice resonates through your mind like "
                "distant thunder: 'Young one, I remember your parents well. Lyra "
                "and Theron came to me when shadows first stirred. They spoke of "
                "a child who must be hidden from Malakar's sight, protected until "
                "the time of choosing arrived. They forged a ward—not of stone or "
                "steel, but of love itself. This ward yet shields you, woven into "
                "your very being. They did not perish, child. They walk paths "
                "beyond sight, guardians still, waiting for the moment when all "
                "debts are paid and all bonds may be renewed.'[/dialogue]"
            )
        else:
            return (
                "[dialogue]'The memory has been shared,' the dragon rumbles softly. "
                "'Your path leads forward now, not back. The scale awaits when you "
                "are ready to bear its burden.'[/dialogue]"
            )

    def say_to(self, words: str, game_state: GameState) -> str:
        """Handle saying something to the dragon, particularly oaths."""
        if words.lower() == "oath":
            # Check if the oath has already been spoken
            if game_state.get_story_flag(FLAG_ACT3_DRAGON_OATH_SPOKEN):
                return (
                    "[dialogue]'The oath has been given and accepted,' the dragon "
                    "rumbles. 'The scale is yours to claim.'[/dialogue]"
                )
            else:
                # Accept the oath and make the scale available
                game_state.set_story_flag(FLAG_ACT3_DRAGON_OATH_SPOKEN, True)
                # Import and add the dragon's scale to the current room
                from ..items.DragonsScale import DragonsScale
                dragons_scale = DragonsScale()
                game_state.current_room.add_item(dragons_scale)
                return (
                    "[event]You speak your oath to the ancient dragon, pledging "
                    "your commitment to selflessness and the protection of others. "
                    "The dragon's golden eyes regard you with ancient wisdom. "
                    "'Your words ring true, young one. The scale is yours to bear. "
                    "May you carry its burden with honor.'[/event]"
                )
        else:
            return (
                "[dialogue]The dragon listens but does not respond to those words. "
                "Perhaps you need to speak a more meaningful pledge.[/dialogue]"
            )
