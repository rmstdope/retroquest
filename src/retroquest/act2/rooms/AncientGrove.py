from ...engine.Room import Room
from ..characters.AncientTreeSpirit import AncientTreeSpirit
from ..items.SilverLeaves import SilverLeaves
from ..items.DruidicFocus import DruidicFocus

class AncientGrove(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Ancient Grove",
            description=(
                "A circular clearing dominated by trees so old and massive they seem to touch the sky. Their bark bears "
                "carved symbols that predate human memory, and the air shimmers with concentrated magic. At the center "
                "grows a tree unlike any other - its silver bark gleams and its leaves whisper secrets in an ancient "
                "tongue. This is clearly a place of power and the sacred gateway to the forest's deepest mysteries. "
                "The Ancient Tree Spirit dwells within the great silver-barked tree, its presence filling the grove "
                "with ancient wisdom."
            ),
            items=[],
            characters=[AncientTreeSpirit()],
            exits={"north": "ForestEntrance", "south": "HeartOfTheForest"}
        )

    def handle_command(self, command: str, game_state) -> str:
        """Handle room-specific commands for the Ancient Grove."""
        command = command.lower().strip()
        
        # Handle looking at the silver-barked tree
        if command in ["look at tree", "examine tree", "look at silver tree", "examine silver tree", 
                      "look at silver-barked tree", "examine silver-barked tree"]:
            return self._examine_silver_tree(game_state)
            
        # Handle giving the Enchanted Acorn to the Ancient Tree Spirit
        elif command in ["give enchanted acorn", "offer enchanted acorn", "give acorn", "offer acorn",
                        "give enchanted acorn to tree spirit", "give acorn to tree spirit",
                        "give enchanted acorn to ancient tree spirit", "give acorn to ancient tree spirit"]:
            return self._give_enchanted_acorn(game_state)
            
        # Handle taking Silver Leaves
        elif command in ["take silver leaves", "get silver leaves", "take leaves", "get leaves"]:
            return self._take_silver_leaves(game_state)
            
        # Handle taking Druidic Focus
        elif command in ["take druidic focus", "get druidic focus", "take focus", "get focus"]:
            return self._take_druidic_focus(game_state)
            
        # Handle examining the items before taking
        elif command in ["examine silver leaves", "look at silver leaves", "examine leaves", "look at leaves"]:
            return self._examine_silver_leaves(game_state)
        elif command in ["examine druidic focus", "look at druidic focus", "examine focus", "look at focus"]:
            return self._examine_druidic_focus(game_state)
        
        return ""  # No command handled
        
    def _examine_silver_tree(self, game_state) -> str:
        """Examine the magnificent silver-barked tree."""
        if not game_state.get_story_flag("silver_tree_examined"):
            game_state.set_story_flag("silver_tree_examined", True)
            return (
                "[environment_description]The ancient tree towers above you, its silver bark shimmering "
                "with an inner light that seems to pulse in rhythm with your heartbeat. The bark is smooth "
                "as polished metal yet warm to the touch, and intricate spiraling patterns flow across its "
                "surface like living veins of starlight. Its massive canopy spreads wide, with leaves that "
                "catch and reflect light in impossible ways. You sense an ancient presence within - older "
                "than memory, wise beyond measure, and deeply connected to the very essence of the forest. "
                "This is no mere tree, but the dwelling place of the Ancient Tree Spirit.[/environment_description]"
            )
        else:
            return (
                "[environment_description]The magnificent silver-barked tree continues to radiate ancient "
                "power and wisdom. Its presence fills you with a sense of reverence and connection to "
                "the natural world.[/environment_description]"
            )
            
    def _give_enchanted_acorn(self, game_state) -> str:
        """Give the Enchanted Acorn to the Ancient Tree Spirit."""
        if not game_state.inventory.has_item("Enchanted Acorn"):
            return "[error]You don't have an Enchanted Acorn to offer.[/error]"
            
        if game_state.get_story_flag("enchanted_acorn_given"):
            return "[info]You have already offered the Enchanted Acorn to the Ancient Tree Spirit.[/info]"
            
        # Remove the acorn from inventory and set the flag
        game_state.inventory.remove_item("Enchanted Acorn")
        game_state.set_story_flag("enchanted_acorn_given", True)
        
        # This triggers the Ancient Tree Spirit to teach the forest_speech spell and offer items
        # The character's talk_to method will handle the subsequent interactions
        
        return (
            "[quest_progress]You approach the base of the great silver tree and reverently place the "
            "Enchanted Acorn among its roots. The moment the sacred offering touches the earth, the "
            "tree's bark begins to glow more brightly, and the very air around you thrums with ancient "
            "power. A deep, resonant voice emerges from within the tree - the Ancient Tree Spirit has "
            "accepted your offering and wishes to speak with you.[/quest_progress]"
        )
        
    def _take_silver_leaves(self, game_state) -> str:
        """Take the Silver Leaves (only available after speaking with the Ancient Tree Spirit)."""
        if not game_state.get_story_flag("ancient_tree_spirit_met"):
            return "[error]The silver leaves seem beyond your reach. Perhaps you need permission from the tree's guardian first.[/error]"
            
        if game_state.get_story_flag("silver_leaves_taken"):
            return "[info]You have already taken the Silver Leaves.[/info]"
            
        # Check if the leaves are available (given by the tree spirit)
        leaves_available = any(item.name.lower() == "silver leaves" for item in self.items)
        
        if leaves_available:
            # Remove from room and add to inventory
            self.items = [item for item in self.items if item.name.lower() != "silver leaves"]
            leaves = SilverLeaves()
            game_state.inventory.add_item(leaves)
            game_state.set_story_flag("silver_leaves_taken", True)
            
            return (
                "[item_acquired]You carefully gather the Silver Leaves that the Ancient Tree Spirit "
                "has blessed for you. Each leaf gleams like polished silver and tingles with forest "
                "magic when you touch it. These leaves will serve as a powerful connection to the "
                "natural world and its ancient mysteries.[/item_acquired]"
            )
        else:
            return "[error]There are no Silver Leaves here to take.[/error]"
            
    def _take_druidic_focus(self, game_state) -> str:
        """Take the Druidic Focus (only available after speaking with the Ancient Tree Spirit)."""
        if not game_state.get_story_flag("ancient_tree_spirit_met"):
            return "[error]You don't see any druidic focus here. Perhaps you need to earn the trust of the forest spirits first.[/error]"
            
        if game_state.get_story_flag("druidic_focus_taken"):
            return "[info]You have already taken the Druidic Focus.[/info]"
            
        # Check if the focus is available (given by the tree spirit)
        focus_available = any(item.name.lower() == "druidic focus" for item in self.items)
        
        if focus_available:
            # Remove from room and add to inventory
            self.items = [item for item in self.items if item.name.lower() != "druidic focus"]
            focus = DruidicFocus()
            game_state.inventory.add_item(focus)
            game_state.set_story_flag("druidic_focus_taken", True)
            
            return (
                "[item_acquired]You pick up the Druidic Focus that the Ancient Tree Spirit has "
                "crafted for you. The polished wood feels warm and alive in your hands, and you "
                "can sense its power to amplify and focus nature-based magic. This ancient tool "
                "will enhance your connection to the natural world.[/item_acquired]"
            )
        else:
            return "[error]There is no Druidic Focus here to take.[/error]"
            
    def _examine_silver_leaves(self, game_state) -> str:
        """Examine the Silver Leaves before taking them."""
        leaves_available = any(item.name.lower() == "silver leaves" for item in self.items)
        
        if leaves_available:
            return (
                "[item_description]Several leaves from the ancient silver tree lie before you, "
                "each one gleaming with an ethereal light. They are perfectly preserved, neither "
                "wilted nor brittle, and seem to pulse with the same magical energy that flows "
                "through the great tree. These are no ordinary leaves but sacred tokens imbued "
                "with the forest's ancient power.[/item_description]"
            )
        else:
            return "[error]There are no Silver Leaves here to examine.[/error]"
            
    def _examine_druidic_focus(self, game_state) -> str:
        """Examine the Druidic Focus before taking it."""
        focus_available = any(item.name.lower() == "druidic focus" for item in self.items)
        
        if focus_available:
            return (
                "[item_description]A beautifully crafted staff rests against the silver tree, "
                "its wood polished to a warm golden sheen. Intricate patterns are carved along "
                "its length, depicting vines, leaves, and forest creatures in exquisite detail. "
                "At its top sits a crystal that seems to contain swirling motes of green light. "
                "This is clearly a tool of great power, designed to focus and amplify druidic "
                "magic.[/item_description]"
            )
        else:
            return "[error]There is no Druidic Focus here to examine.[/error]"
