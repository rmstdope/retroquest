class GameState:
    """
    Holds the mutable state of the currently played game: current room, inventory, history, and visited rooms.
    """
    def __init__(self, starting_room) -> None:
        self.current_room = starting_room
        self.inventory = []
        self.history = []
        self.visited_rooms = [starting_room.name]

    def mark_visited(self, room) -> None:
        if room.name not in self.visited_rooms:
            self.visited_rooms.append(room.name)
