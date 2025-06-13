from ..items.Item import Item

class EliorsJournal(Item):
    def __init__(self) -> None:
        super().__init__(
            name="Elior's journal",
            description="A leather-bound journal filled with Elior's careful handwriting. The pages are full of notes, sketches, and secrets.",
            short_name="journal"
        )

    def read(self, game_state) -> str:
        entry = (
            "The ink is slightly smudged on this page, as if written in haste or with a trembling hand...\n\n"
            "\"What a night. The wind howled like a hungry wolf, and rain lashed against the shutters. "
            "I swear the whole cottage shook with each thunderclap. Sleep was impossible for hours. "
            "Then, through a gap in the curtains, I saw it – a searing, unnatural light that split the sky. "
            "It wasn't lightning; it was... different. Pulsating, almost.\n\n"
            "When I finally drifted off, the dreams came. Not the usual ones of fields and harvests. "
            "This was dark, filled with swirling shadows. And a figure, tall and indistinct, "
            "its voice a whisper on the edge of hearing, yet it felt like it was calling my name. Elior... "
            "I woke with a start, my heart pounding. Even now, the memory sends a shiver down my spine. "
            "What did it mean?\""
        )
        game_state.set_story_flag('journal_read_prologue_entry', True) # Set the flag when this entry is read
        return entry
