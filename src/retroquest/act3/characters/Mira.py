from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act3StoryFlags import FLAG_ACT3_MAIN_STARTED


class Mira(Character):
    """Act III version of Mira: starts the main quest and handles teleportation between sites."""

    def __init__(self) -> None:
        super().__init__(
            name="Mira",
            description=(
                "The village healer returns with renewed purpose. Her eyes shine with resolve as she speaks of the"
                " three relics needed to confront Malakar."
            ),
        )

    def talk_to(self, game_state: GameState) -> str:
        event_msg = f"[event]You speak with [character_name]{self.name}[/character_name].[/event]"

        # First conversation in Act III: start the main quest
        if not game_state.get_story_flag(FLAG_ACT3_MAIN_STARTED):
            game_state.set_story_flag(FLAG_ACT3_MAIN_STARTED, True)
            return (
                event_msg
                + "\n"
                + (
                    "[dialogue]'Elior, the weave bends and the hourglass shivers. Threads of fate tighten about us.'[/dialogue]\n"
                    "[dialogue]'Malakar drains King Alden to unbind Eldoria's wards. We will not reach him unscathed without protection.'[/dialogue]\n"
                    "[dialogue]'To walk the last road, you must embody three virtues—Courage, Wisdom, and Selflessness—"
                    "and three relics must be won to counter his working and shield you from his influence: the Crystal of Light from the Sunken Ruins, the Phoenix Feather "
                    "from Mount Ember, and the Dragon's Scale from the Caverns of Shadow.'[/dialogue]\n"
                    "[dialogue]'Listen to what the tide whispers, what embers teach, and what the deep stone remembers.'[/dialogue]\n"
                    "[dialogue]'The Crystal will part veils and steady your spirit; the Feather will awaken guiding fire and clarity; the Scale will turn aside shadow and bind your oath.'[/dialogue]\n"
                    "[dialogue]'We will travel by my focus. I will anchor circles at the edges of each site: first the Tidal Causeway of the Sunken Ruins, then the Lower Switchbacks on Mount Ember, and finally the Cavern Mouth of the shadowed halls.'[/dialogue]\n"
                    "[dialogue]'When all three are gathered, I will set our last circle at the fortress gate. Say the word, and I will draw the first circle—"
                    "where moonlight marries the sea.'[/dialogue]"
                )
            )

        # Subsequent conversation: teleport onward based on current location.
        # - From Sanctum of the Tide -> Mount Ember (Lower Switchbacks)
        # - Otherwise -> Sunken Ruins entry (Tidal Causeway)
        if game_state.current_room.name == "Sanctum of the Tide":
            destination_key = "LowerSwitchbacks"
            flavor = (
                "[dialogue]'The circle to Mount Ember is set. Brace for ash on the wind.'[/dialogue]"
            )
        else:
            destination_key = "TidalCauseway"
            flavor = (
                "[dialogue]'Hold steady, Elior. I will draw a circle to the Tidal Causeway—salt and moonlight will carry us.'[/dialogue]" 
                "\n[dialogue]'When the air folds and the mist closes, breathe. It will pass in a heartbeat.'[/dialogue]"
            )
        if destination_key in game_state.all_rooms:
            # Capture origin and destination rooms
            origin_room = game_state.current_room
            destination_room = game_state.all_rooms[destination_key]

            # Move Mira and Sir Cedric to the new room to accompany the player
            origin_room.characters.remove(self)
            destination_room.characters.append(self)
            sir_cedric = origin_room.get_character_by_name("Sir Cedric")
            origin_room.characters.remove(sir_cedric)
            destination_room.characters.append(sir_cedric)

            # Perform the teleport by switching the current room
            game_state.current_room = destination_room
            # Call room hook and mark visited for consistency
            game_state.current_room.on_enter(game_state)
            game_state.mark_visited(game_state.current_room)
            arrival_fx = (
                "[event]Mira traces a prism with her finger; the air folds and the world blurs." 
                " When it clears, you arrive at your next destination.[/event]\n"
            )
            return event_msg + "\n" + flavor + "\n" + arrival_fx + f"[event]You arrive at [room_name]{game_state.current_room.name}[/room_name].[/event]"
        else:
            return event_msg + "\n" + "[failure]Mira hesitates—she cannot find the proper anchor to send you there yet.[/failure]"
