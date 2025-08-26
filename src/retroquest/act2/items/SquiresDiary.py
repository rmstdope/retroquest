from ...engine.Item import Item
from ...engine.GameState import GameState
from ..Act2StoryFlags import FLAG_CEDRIKS_HONOR_ACCEPTED, FLAG_READ_SQUIRES_DIARY

class SquiresDiary(Item):
    def __init__(self) -> None:
        super().__init__(
            name="squire's diary",
            short_name="diary",
            description=(
                "A worn leather-bound diary belonging to a former squire. The pages are filled with observations about "
                "castle life, training exercises, and concerning notes about Sir Cedric's supposed disgrace. The entries "
                "seem to contain important information about events that transpired years ago."
            ),
            can_be_carried=True,
        )

    def use(self, game_state: GameState) -> str:
        # Set the flag that the squire's diary has been read
        game_state.set_story_flag(FLAG_READ_SQUIRES_DIARY, True)
        
        # Remove the diary from inventory and/or current room after use
        if self in game_state.inventory:
            game_state.inventory.remove(self)
        if self in game_state.current_room.items:
            game_state.current_room.items.remove(self)
        
        # The quest should already be accepted by talking to Training Master
        return ("[event]You carefully read through the squire's diary. The entries reveal a troubling story...[/event]\n\n"
                
                "*Entry from three years ago:* 'Sir Cedric has been accused of abandoning his post during the Battle of "
                "Thornfield Pass. The official reports claim he fled when the enemy charged, leaving his men to die. "
                "But this makes no sense - Sir Cedric is the most honorable knight I've ever known.'\n\n"
                
                "*Later entry:* 'I've been asking questions, and something doesn't add up. A merchant caravan was supposed "
                "to arrive from the city of Heavensforth carrying secret military documents that would prove Sir Cedric's "
                "innocence. These documents contained witness testimonies and battle reports that showed the real truth "
                "about what happened at Thornfield Pass.'\n\n"
                
                "*Final entry:* 'The caravan from Heavensforth arrived, but the secret documents were nowhere to be found! "
                "The merchants claimed they never received any such documents, but there were rumors that the caravan had "
                "been attacked or lost goods along the mountain roads. Without those documents, Sir Cedric's name could "
                "never be cleared. I pray that someday, someone will find the truth and restore his honor.'\n\n"
                
                "[success]The diary confirms what the Training Master suspected - secret documents from Heavensforth "
                "would clear Sir Cedric's name, but they mysteriously went missing when the caravan transporting them "
                "arrived. The lost caravan's missing documents might still be out there somewhere...[/success]\n\n"
                
                "[event]After thoroughly reading the diary, you carefully place it back where you found it, ensuring "
                "the precious information it contains remains safe while no longer needing to carry it with you.[/event]")

    def examine(self, game_state: GameState) -> str:
        return ("[event]You examine the [item_name]squire's diary[/item_name]. {0} The handwriting is careful and "
                "deliberate, and several entries seem to focus on Sir Cedric's supposed disgrace and missing evidence "
                "that could clear his name.[/event]".format(self.description))
