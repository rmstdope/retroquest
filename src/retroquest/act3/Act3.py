from retroquest.engine.GameState import GameState
from retroquest.engine.Act import Act

# TODO: Import room classes when they are created
# from retroquest.act3.rooms.ExampleRoom import ExampleRoom

# TODO: Import quest classes when they are created  
# from retroquest.act3.quests.ExampleQuest import ExampleQuest

class Act3(Act):
    """Act 3 of RetroQuest: The Awakening."""
    
    def __init__(self) -> None:
        """Initialize Act 3 with all rooms and quests."""
        # TODO: Create room instances when room classes are implemented
        rooms = {
            # "example_room": ExampleRoom(),
        }
        
        # TODO: Create quest instances when quest classes are implemented
        quests = [
            # ExampleQuest(),
        ]
        
        # TODO: Update intro text for Act 3
        music_file = "Walen - Medieval Village (freetouse.com).mp3"
        music_info = 'Music track: Medieval Village by Walen\nSource: https://freetouse.com/music\nFree To Use Music for Video'
        super().__init__('Act III', rooms, quests, music_file=music_file, music_info=music_info)
