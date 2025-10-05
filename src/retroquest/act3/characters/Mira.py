"""Mira character for Act 3."""

from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act3StoryFlags import (
    FLAG_ACT3_MAIN_STARTED,
    FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED,
    FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED,
)


class Mira(Character):
    """Act III version of Mira: starts the main quest and handles teleportation between 
    sites."""

    def __init__(self) -> None:
        """Initialize Mira with description."""
        super().__init__(
            name="Mira",
            description=(
                "The village healer returns with renewed purpose. Her eyes shine "
                "with resolve as she speaks of the three relics needed to confront "
                "Malakar."
            ),
        )

    def talk_to(self, game_state: GameState) -> str:
        """Handle conversation with Mira, including quest start and teleportation."""
        event_msg = (
            f"[event]You speak with [character_name]{self.name}[/character_name]."
            "[/event]"
        )

        # First conversation in Act III: start the main quest
        if not game_state.get_story_flag(FLAG_ACT3_MAIN_STARTED):
            game_state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
            return (
                event_msg
                + "\n"
                + (
                    "[dialogue]'Elior, the weave bends and the hourglass shivers. "
                    "Threads of fate tighten about us.'[/dialogue]\n"
                    "[dialogue]'Malakar drains King Alden to unbind Eldoria's wards. "
                    "We will not reach him unscathed without protection.'[/dialogue]\n"
                    "[dialogue]'To walk the last road, you must embody three virtues—"
                    "Courage, Wisdom, and Selflessness—and three relics must be won to "
                    "counter his working and shield you from his influence: the Crystal "
                    "of Light from the Sunken Ruins, the Phoenix Feather from Mount "
                    "Ember, and the Dragon's Scale from the Caverns of "
                    "Shadow.'[/dialogue]\n"
                    "[dialogue]'Listen to what the tide whispers, what embers teach, "
                    "and what the deep stone remembers.'[/dialogue]\n"
                    "[dialogue]'The Crystal will part veils and steady your spirit; "
                    "the Feather will awaken guiding fire and clarity; the Scale will "
                    "turn aside shadow and bind your oath.'[/dialogue]\n"
                    "[dialogue]'We will travel by my focus. I will anchor circles at "
                    "the edges of each site: first the Tidal Causeway of the Sunken "
                    "Ruins, then the Lower Switchbacks on Mount Ember, and finally the "
                    "Cavern Mouth of the shadowed halls.'[/dialogue]\n"
                    "[dialogue]'When all three are gathered, I will set our last "
                    "circle at the fortress gate. Say the word, and I will draw the "
                    "first circle—where moonlight marries the sea.'[/dialogue]"
                )
            )

        destination_key = ""
        flavor = ""
        # Subsequent conversation: teleport onward based on current location.
        # Special-case: if we're at the Tidal Causeway, hint about the relic
        # unless the Crystal of Light has been acquired. If acquired, Mira can
        # draw the circle onward to Mount Ember.
        # If we're already at Lower Switchbacks, do not teleport; instead
        # provide lore about the second virtue and the phoenix legend.
        # Special dialogue for Cavern Mouth
        if game_state.current_room.name == "Cavern Mouth":
            return (
                event_msg
                + "\n"
                + (
                    "[dialogue]'The shadows here run deep, Elior. The miners' plight is a test of "
                    "selflessness—lend your strength, and the path to the dragon will open. "
                    "When you are ready, I can draw the next circle, but the caverns will "
                    "not yield their heart until all are safe.'[/dialogue]"
                )
            )
        elif game_state.current_room.name == "Lower Switchbacks":
            if not game_state.get_story_flag(
                FLAG_ACT3_PHOENIX_FEATHER_ACQUIRED
            ):
                return (
                    event_msg
                    + "\n"
                    + (
                        "[dialogue]'There the second virtue, Wisdom, is taught in "
                        "embers. Old guides here tell of a phoenix that nested where "
                        "the rock blooms with heat — a bird of returning flame. From "
                        "its ash a single feather rises renewed, and such a feather "
                        "is said to clear the eyes and steady a wavering hand. "
                        "Listen for songs on the wind, and tend any sparks you find; "
                        "they may be more than mere kindle.'[/dialogue]"
                    )
                )
            destination_key = "CavernMouth"
            flavor = (
                "[dialogue]'You have done well, Elior. The Phoenix Feather is a "
                "token of wisdom; it will guide you through darkness and flame. "
                "Ahead lies the Cavern Mouth—gaping stone jaws that breathe cold "
                "and shadow. Steel your heart and hold your light high.'[/dialogue]"
            )
        elif game_state.current_room.name == "Tidal Causeway":
            if not game_state.get_story_flag(
                FLAG_ACT3_CRYSTAL_OF_LIGHT_ACQUIRED
            ):
                return (
                    event_msg
                    + "\n"
                    + (
                        "[dialogue]'This place keeps its secrets in salt and song. "
                        "Within the Sunken Ruins lies the Crystal of Light—an old "
                        "relic that answers to courage. When you stand before the "
                        "tide-born guardian, speak your vow and let it steady you.'"
                        "[/dialogue]"
                    )
                )
            destination_key = "LowerSwitchbacks"
            flavor = (
                "[dialogue]'Well done, Elior. The Crystal answers to courage; you "
                "have steadied the tide. Ahead lies the Lower Switchbacks—ridges "
                "of ember and knife-rolled stone where ash chokes the air and the "
                "path winds like a fever dream. Keep your footing and watch the "
                "skies for falling cinders.'[/dialogue]"
            )
        elif game_state.current_room.name == "Mira's Hut":
            destination_key = "TidalCauseway"
            flavor = (
                "[dialogue]'The hour is upon us, Elior. We will draw the first circle "
                "at the Tidal Causeway, where moonlight marries the sea.'[/dialogue]\n"
                "[dialogue]'When the air folds and the mist closes, breathe. It will "
                "pass in a heartbeat.'[/dialogue]"
            )

        if destination_key in game_state.all_rooms:
            # Capture origin and destination rooms
            origin_room = game_state.current_room
            destination_room = game_state.all_rooms[destination_key]

            # Move Mira and Sir Cedric to the new room to accompany the player
            origin_room.characters.remove(self)
            destination_room.characters.append(self)
            sir_cedric = origin_room.get_character_by_name("Sir Cedric")
            if sir_cedric:
                origin_room.characters.remove(sir_cedric)
                destination_room.characters.append(sir_cedric)

            # Perform the teleport by switching the current room
            game_state.current_room = destination_room
            # Call room hook and mark visited for consistency
            game_state.current_room.on_enter(game_state)
            game_state.mark_visited(game_state.current_room)
            arrival_fx = (
                "[event]Mira traces a prism with her finger; the air folds and the "
                "world blurs. When it clears, you arrive at your next "
                "destination.[/event]\n"
            )
            return (
                event_msg + "\n" + flavor + "\n" + arrival_fx +
                f"[event]You arrive at "
                f"[room_name]{game_state.current_room.name}[/room_name].[/event]"
            )
        else:
            return (
                event_msg + "\n" +
                "[failure]Mira hesitates—she cannot find the proper anchor to send "
                "you there yet.[/failure]"
            )
