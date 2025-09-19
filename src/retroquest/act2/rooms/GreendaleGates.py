"""Greendale Gates room: formal entry gate with etiquette-based search unlock."""

from ...engine.Room import Room
from ...engine.GameState import GameState
from ..characters.GateCaptain import GateCaptain
from ..items.CityMap import CityMap

class GreendaleGates(Room):
    """Urban threshold enforcing protocol and staged discovery.

    Narrative Role:
        Shifts player from wilderness traversal to structured civic space while
        introducing formal access control.

    Key Mechanics:
        - ``get_exits()`` withholds ``north`` until the gate captain grants entry.
        - ``search()`` blocked while captain present; afterwards first search
          spawns a ``CityMap`` (idempotent via local boolean).

    Story Flags:
        - None; relies on NPC state attribute ``entry_pass_given``.

    Contents:
        - NPC: ``GateCaptain``.
        - Conditional Item: ``CityMap``.

    Design Notes:
        Local state keeps transient discovery scoped; could elevate to a story
        flag if later cross-room logic depends on map acquisition.
    """

    def __init__(self) -> None:
        """Initialize gates with gate captain and gated northern exit."""
        gate_captain = GateCaptain()
        super().__init__(
            name="Greendale Gates",
            description=(
                "A magnificent stone archway marks the entrance to Greendale, the largest settlement "
                "you have encountered. Guards in polished mail stand watch, banners fluttering in the "
                "mountain breeze. Beyond, cobblestone streets wind between stone houses and bustling "
                "shops. The air carries the sounds of commerce—a stark contrast to Willowbrook's quiet "
                "charm."
            ),
            items=[],
            characters=[gate_captain],
            exits={"south": "MountainPath", "north": "MainSquare"}  # Include north exit in static definition
        )
        self.gate_captain = gate_captain
        self.city_map_found = False

    def get_exits(self, game_state: GameState) -> dict:
        """Return exits; hide north until entry granted by gate captain.

        Parameters:
            game_state: Unused; maintained for interface consistency.

        Returns:
            Mapping of exits including ``south`` and conditionally ``north``.
        """
        exits = super().get_exits(game_state).copy()
        
        # Remove north exit until entry pass is given
        if not self.gate_captain.entry_pass_given and "north" in exits:
            del exits["north"]
            
        return exits

    def search(self, _game_state: GameState, _target: str = None) -> str:
        """Search area; map appears only after protocol and first search.

        Parameters:
            game_state: Unused here beyond interface uniformity.
            _target: Ignored placeholder for future targeted search.

        Returns:
            Narrative feedback string reflecting etiquette gating or discovery.
        """
        if self.gate_captain in self.characters:
            return (
                "The Gate Captain stands vigilant, watching all who approach. It would be improper to "
                "search while he observes you so closely. Perhaps speak with him first."
            )
        if self.city_map_found:
            return (
                "You've already searched thoroughly. Nothing more of value stands out here."
            )
        self.city_map_found = True
        city_map = CityMap()
        self.add_item(city_map)
        return (
            "With the Gate Captain gone, you're free to look around. A small information post nearby "
            "holds items left by travelers. Among them you discover a detailed "
            f"[item_name]{city_map.get_name()}[/item_name] of Greendale—exactly what you need to navigate "
            "the city's winding streets!"
        )
