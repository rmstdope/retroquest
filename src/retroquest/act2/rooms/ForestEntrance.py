from ...engine.Room import Room
from ..items.EnchantedAcorn import EnchantedAcorn
from ..items.ForestMapFragment import ForestMapFragment
from ..characters.ForestSprites import ForestSprites

class ForestEntrance(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Forest Entrance",
            description=(
                "Massive trees create a natural cathedral as you enter the Enchanted Forest. Dappled sunlight filters "
                "through the dense canopy, and the path ahead disappears into green shadows. The air is alive with the "
                "sounds of birds and rustling leaves, but underneath lies an expectant silence, as if the forest itself "
                "is watching and waiting. Two paths diverge deeper into the forest - one leads to an ancient grove that "
                "serves as the sacred gateway to the forest's heart, while the other leads to a peaceful glade. "
                "Small motes of light dance between the trees - forest sprites watching your every move."
            ),
            items=[EnchantedAcorn(), ForestMapFragment()],
            characters=[ForestSprites()],
            exits={"west": "ForestTransition", "south": "AncientGrove", "east": "WhisperingGlade"}
        )

    def handle_command(self, command: str, game_state) -> str:
        """Handle room-specific commands for the Forest Entrance."""
        command = command.lower().strip()
        
        # Handle using Protective Charm for spiritual protection
        if command == "use protective charm":
            return self._use_protective_charm(game_state)
        elif command == "use charm":
            return self._use_protective_charm(game_state)
            
        # Handle using Enhanced Lantern for illumination
        elif command == "use enhanced lantern":
            return self._use_enhanced_lantern(game_state)
        elif command == "use lantern":
            return self._use_enhanced_lantern(game_state)
            
        # Handle using Forest Map Fragment for navigation
        elif command == "use forest map fragment":
            return self._use_forest_map_fragment(game_state)
        elif command == "use map":
            return self._use_forest_map_fragment(game_state)
        elif command == "use forest map":
            return self._use_forest_map_fragment(game_state)
            
        # Handle taking the Enchanted Acorn
        elif command == "take enchanted acorn":
            return self._take_enchanted_acorn(game_state)
        elif command == "take acorn":
            return self._take_enchanted_acorn(game_state)
        elif command == "get enchanted acorn":
            return self._take_enchanted_acorn(game_state)
        elif command == "get acorn":
            return self._take_enchanted_acorn(game_state)
            
        # Handle taking the Forest Map Fragment
        elif command == "take forest map fragment":
            return self._take_forest_map_fragment(game_state)
        elif command == "take map fragment":
            return self._take_forest_map_fragment(game_state)
        elif command == "take forest map":
            return self._take_forest_map_fragment(game_state)
        elif command == "get forest map fragment":
            return self._take_forest_map_fragment(game_state)
        elif command == "get map fragment":
            return self._take_forest_map_fragment(game_state)
        
        # Handle examining the acorn before taking
        elif command == "examine enchanted acorn":
            return self._examine_enchanted_acorn()
        elif command == "examine acorn":
            return self._examine_enchanted_acorn()
        elif command == "look at acorn":
            return self._examine_enchanted_acorn()
            
        return ""  # No command handled
        
    def _use_protective_charm(self, game_state) -> str:
        """Use the Protective Charm for spiritual protection."""
        if game_state.inventory.has_item("Protective Charm"):
            if not game_state.get_story_flag("protective_charm_used_forest_entrance"):
                game_state.set_story_flag("protective_charm_used_forest_entrance", True)
                return (
                    "[spell_effect]The Protective Charm radiates a warm, golden light as you invoke its power. "
                    "A shimmering barrier of spiritual energy surrounds you, and you feel the watchful gaze of "
                    "the forest spirits become less threatening. The ancient magic recognizes your respect and "
                    "preparation, granting you safe passage through these sacred woods.[/spell_effect]"
                )
            else:
                return (
                    "[info]The Protective Charm's energy still surrounds you, providing continued spiritual "
                    "protection in this mystical place.[/info]"
                )
        else:
            return "[error]You don't have a Protective Charm to use.[/error]"
            
    def _use_enhanced_lantern(self, game_state) -> str:
        """Use the Enhanced Lantern for improved navigation."""
        if game_state.inventory.has_item("Enhanced Lantern"):
            if not game_state.get_story_flag("enhanced_lantern_used_forest_entrance"):
                game_state.set_story_flag("enhanced_lantern_used_forest_entrance", True)
                return (
                    "[item_effect]The Enhanced Lantern's crystal core pulses with magical energy, casting "
                    "ethereal blue light that reveals hidden paths through the dense undergrowth. The light "
                    "seems to resonate with the forest's natural magic, illuminating safe routes and warning "
                    "you away from dangerous areas. With this enhanced vision, you can navigate the forest "
                    "with confidence.[/item_effect]"
                )
            else:
                return (
                    "[info]The Enhanced Lantern continues to provide magical illumination, keeping "
                    "the forest paths clearly visible.[/info]"
                )
        else:
            return "[error]You don't have an Enhanced Lantern to use.[/error]"
            
    def _use_forest_map_fragment(self, game_state) -> str:
        """Use the Forest Map Fragment for navigation guidance."""
        if game_state.inventory.has_item("Forest Map Fragment"):
            if not game_state.get_story_flag("forest_map_used_forest_entrance"):
                game_state.set_story_flag("forest_map_used_forest_entrance", True)
                return (
                    "[item_effect]The Forest Map Fragment glows softly as you study it, revealing ancient "
                    "pathways and sacred sites within the Enchanted Forest. The map shows the Ancient Grove "
                    "to the south as a place of great power, where the oldest tree spirit dwells. To the east, "
                    "the Whispering Glade is marked as a place of reflection and water magic. The map's "
                    "enchantment guides you, ensuring you won't lose your way in these mystical woods.[/item_effect]"
                )
            else:
                return (
                    "[info]Consulting the Forest Map Fragment again, you confirm your bearings. The Ancient "
                    "Grove lies to the south, and the Whispering Glade to the east.[/info]"
                )
        else:
            return "[error]You don't have a Forest Map Fragment to use.[/error]"
            
    def _take_enchanted_acorn(self, game_state) -> str:
        """Take the Enchanted Acorn from the forest floor."""
        # Check if the acorn is still in the room (case-insensitive)
        acorn_in_room = any(item.name.lower() == "enchanted acorn" for item in self.items)
        
        if acorn_in_room:
            # Remove from room and add to inventory
            self.items = [item for item in self.items if item.name.lower() != "enchanted acorn"]
            acorn = EnchantedAcorn()
            game_state.inventory.add_item(acorn)
            game_state.set_story_flag("enchanted_acorn_taken", True)
            
            return (
                "[item_acquired]You carefully pick up the Enchanted Acorn from where it rests among the "
                "fallen leaves. The moment you touch it, you feel a surge of natural magic - this is no "
                "ordinary acorn, but a sacred offering imbued with the forest's blessing. The forest "
                "sprites whisper approvingly as you claim this gift.[/item_acquired]"
            )
        elif game_state.inventory.has_item("enchanted acorn"):
            return "[info]You already have the Enchanted Acorn.[/info]"
        else:
            return "[error]There is no Enchanted Acorn here to take.[/error]"
            
    def _examine_enchanted_acorn(self) -> str:
        """Examine the Enchanted Acorn before taking it."""
        acorn_in_room = any(item.name.lower() == "enchanted acorn" for item in self.items)
        
        if acorn_in_room:
            return (
                "[item_description]Nestled among the fallen leaves is a perfectly formed acorn that "
                "practically glows with inner light. Unlike any ordinary acorn, this one pulses with "
                "gentle green energy and seems to hum with natural magic. Ancient runes are barely "
                "visible on its surface, marking it as a sacred offering of the forest itself - a "
                "gift meant for those who would commune with the eldest spirits of nature.[/item_description]"
            )
        else:
            return "[error]There is no Enchanted Acorn here to examine.[/error]"
            
    def _take_forest_map_fragment(self, game_state) -> str:
        """Take the Forest Map Fragment from the forest floor."""
        # Check if the map fragment is still in the room (case-insensitive)
        fragment_in_room = any(item.name.lower() == "forest map fragment" for item in self.items)
        
        if fragment_in_room:
            # Remove from room and add to inventory
            self.items = [item for item in self.items if item.name.lower() != "forest map fragment"]
            from ..items.ForestMapFragment import ForestMapFragment
            fragment = ForestMapFragment()
            game_state.inventory.add_item(fragment)
            game_state.set_story_flag("forest_map_fragment_taken", True)
            
            return (
                "[item_acquired]You carefully pick up the Forest Map Fragment from where it lies "
                "partially buried beneath some moss. The ancient parchment feels surprisingly durable "
                "despite its age, and the ink seems to shimmer with a faint magical glow. This fragment "
                "clearly shows important forest paths and landmarks that could be crucial for safe "
                "navigation through the Enchanted Forest.[/item_acquired]"
            )
        elif game_state.inventory.has_item("forest map fragment"):
            return "[info]You already have the Forest Map Fragment.[/info]"
        else:
            return "[error]There is no Forest Map Fragment here to take.[/error]"
