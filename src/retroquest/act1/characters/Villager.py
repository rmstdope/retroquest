from ...Character import Character

class Villager(Character):
    def __init__(self) -> None:
        super().__init__(
            name="villager",
            description="A friendly Willowbrook local, always eager to share the latest gossip or rumors about the village."
        )
        self.dialogue_options = [
            "Heard ol' Man Willow's been acting stranger than usual. Says he's seen shadows dancing in the woods at night!",
            "The blacksmith's been busy. Lots of folks are looking for sturdy tools with all the talk of the encroaching darkness.",
            "Mira, over in her hut, she knows a thing or two about the old ways. Might be worth a visit if you're looking for answers.",
            "They say the well water hasn't been tasting right lately. Some even whisper it's cursed!",
            "Watch out for the chickens in the coop south of the vegetable field. They're a feisty bunch, but sometimes they guard little treasures."
        ]
        self.dialogue_index = 0

    def talk_to(self, game) -> str:
        dialogue = self.dialogue_options[self.dialogue_index]
        self.dialogue_index = (self.dialogue_index + 1) % len(self.dialogue_options) # Cycle through dialogue
        event_msg = f"[event]You speak with the [character.name]{self.get_name()}[/character.name].[/event]"
        return event_msg + "\n" + f"'{dialogue}'"
