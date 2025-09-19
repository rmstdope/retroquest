"""Shadows Over Willowbrook main quest (Act I).

Narrative Role:
    Establishes the central mystery afflicting the village (blight, fear, subtle corruption) and
    guides the player through key discovery beats that ultimately unlock progression to Act II.

Golden Path / Progressive Beats:
    1. Initial dream sequence hinting at a shadow in the fields (implied narrative tone setting).
    2. Investigate withered crops (``FLAG_INVESTIGATED_WITHERED_CROPS``) – confirms physical decay.
    3. Speak with a villager (``FLAG_VILLAGER_TALKED_TO``) – surfaces communal fear & rumors.
    4. Examine the well (``FLAG_WELL_EXAMINED``) – introduces environmental corruption source.
    5. Connect with nature at Mira's urging (``FLAG_CONNECT_WITH_NATURE``) – frames druidic path.
    6. Fully unlock magic (``FLAG_MAGIC_FULLY_UNLOCKED``) – affirms player capability.
    7. Quest completes once the act resolution flag is set
       (``FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED``), enabling transition toward Greendale.

Dynamic Description System:
    The quest text is rebuilt each time ``check_update`` runs. Previously revealed segments are
    preserved but visually de-emphasised using a dim style tag (``[dim]...[/dim]``) to provide a
    layered recap while highlighting the newest narrative beat.

Story Flags (Reads):
    - ``FLAG_INVESTIGATED_WITHERED_CROPS``
    - ``FLAG_VILLAGER_TALKED_TO``
    - ``FLAG_WELL_EXAMINED``
    - ``FLAG_CONNECT_WITH_NATURE``
    - ``FLAG_MAGIC_FULLY_UNLOCKED``
    - ``FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED`` (completion condition)

Story Flags (Sets):
    This quest does not itself set flags; it reacts to state established by rooms, characters,
    and related sub‑activities in Act I.

Progression Effects:
    Completion signals that the player has gathered all essential context and is narratively
    prepared to leave Willowbrook and pursue deeper druidic knowledge in Act II.

Design Notes:
    - Uses an internal ``_flag_state`` dict to detect first-time revelation of each beat so the
      UI (or log) can optionally highlight updates.
    - ``check_trigger`` currently always returns ``True`` allowing early visibility; could be
      gated later if desired (e.g., after dream sequence initialization).
    - Keeps recomposed description both concise for current step and archival for prior beats.
"""

from ...engine.Quest import Quest
from ...engine.GameState import GameState
from ..Act1StoryFlags import (
    FLAG_INVESTIGATED_WITHERED_CROPS,
    FLAG_VILLAGER_TALKED_TO,
    FLAG_WELL_EXAMINED,
    FLAG_CONNECT_WITH_NATURE,
    FLAG_MAGIC_FULLY_UNLOCKED,
    FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED,
)

class ShadowsOverWillowbrookQuest(Quest):
    """Main Act I quest tracking the unfolding village corruption mystery.

    This quest incrementally reveals narrative segments as key investigative and
    character-interaction flags are raised elsewhere in the act. Each update:
        - Rebuilds ``self.description`` from scratch.
        - Pushes previously current text into a dimmed recap block.
        - Appends the newly active narrative segment as plain (highlighted) text.

    Attributes:
        _flag_state (dict[str, bool]): Internal record of which story flags have already
            contributed a segment so we can signal an update only once per flag.

    Methods:
        check_trigger(game_state): Always returns True; kept for architectural consistency.
        check_update(game_state): Recomputes description; returns True if new segment added.
        check_completion(game_state): Returns True when the act completion flag is set.
        is_main(): Identifies this as the act's primary quest (affects UI / ordering).
    """
    def __init__(self) -> None:
        super().__init__(
            name="Shadows Over Willowbrook",
            description=(
                "Strange events are plaguing the village: crops are withering, animals are restless, and villagers whisper of a shadowy figure seen at night. "
                "Investigate the source of these disturbances."
            ),
            completion="You have confirmed that a dark force is at work in Willowbrook. Mira warns you that your magical abilities may be the key to protecting the village."
        )
        self._flag_state = {}

    def check_trigger(self, game_state: GameState) -> bool:
        return True

    def check_update(self, game_state: GameState) -> bool:
        updated = False
        self.description = ''
        new_desc = (
            "Elior dreams of a shadowy figure lurking in the fields, its presence felt even in the waking world. "
            "The dream is unsettling, leaving him with a sense of foreboding that something is wrong in Willowbrook."
        )
        if game_state.get_story_flag(FLAG_INVESTIGATED_WITHERED_CROPS):
            if not self._flag_state.get(FLAG_INVESTIGATED_WITHERED_CROPS):
                self._flag_state[FLAG_INVESTIGATED_WITHERED_CROPS] = True
                updated = True
            self.description += '[dim]' + new_desc + '[/dim]'
            new_desc = (
                "\nElior has witnessed the devastation firsthand: once lush rows of crops now stand wilted and brown, their leaves curled and brittle. "
                "The earth beneath his feet is cracked and dry, and the air is thick with the scent of decay. "
                "Where there was once the promise of a bountiful harvest, there is now only ruin. "
            )
        if game_state.get_story_flag(FLAG_VILLAGER_TALKED_TO):
            if not self._flag_state.get(FLAG_VILLAGER_TALKED_TO):
                self._flag_state[FLAG_VILLAGER_TALKED_TO] = True
                updated = True
            self.description += '[dim]' + new_desc + '[/dim]'
            new_desc = (
                "\nVillagers speak in hushed tones of strange happenings: animals refusing to leave their shelters, and shadows moving where none should be. "
                "Elior senses the fear growing among his neighbors, and the mystery deepens. "
            )
        if game_state.get_story_flag(FLAG_WELL_EXAMINED):
            if not self._flag_state.get(FLAG_WELL_EXAMINED):
                self._flag_state[FLAG_WELL_EXAMINED] = True
                updated = True
            self.description += '[dim]' + new_desc + '[/dim]'
            new_desc = (
                "\nRumors spread of the village well: a foul stench rising from its depths, and water that no one dares to drink. "
                "Elior wonders if the source of the corruption lies beneath the surface. "
            )
        if game_state.get_story_flag(FLAG_CONNECT_WITH_NATURE):
            if not self._flag_state.get(FLAG_CONNECT_WITH_NATURE):
                self._flag_state[FLAG_CONNECT_WITH_NATURE] = True
                updated = True
            self.description += '[dim]' + new_desc + '[/dim]'
            new_desc = (
                "\nMira has urged Elior to connect with the living world and learn from its magic. The path forward is uncertain, but hope stirs in the heart of Willowbrook." 
            )
        if game_state.get_story_flag(FLAG_MAGIC_FULLY_UNLOCKED):
            if not self._flag_state.get(FLAG_MAGIC_FULLY_UNLOCKED):
                self._flag_state[FLAG_MAGIC_FULLY_UNLOCKED] = True
                updated = True
            self.description += '[dim]' + new_desc + '[/dim]'
            new_desc = (
                "\nElior has proven his magical abilities are real. The villagers will look to him with new hope, and Mira believes he may be the key to dispelling the darkness. "
                "Mira tells Elior that his journey must continue to Greendale, where he is to seek out the old druid at the forest's edge. "
                "Only there can he learn the deeper mysteries of nature's magic and find the knowledge needed to save Willowbrook."
            )
        self.description += new_desc
        return updated

    def check_completion(self, game_state: GameState) -> bool:
        return game_state.get_story_flag(FLAG_SHADOWS_OVER_WILLOWBROOK_COMPLETED)

    def is_main(self) -> bool:
        return True
