# filepath: /Users/henrikku/repos/retroquest/src/retroquest/items/__init__.py
from .AncientAmulet import AncientAmulet
from .Apple import Apple
from .Bread import Bread
from .BrokenShovel import BrokenShovel
from .Bucket import Bucket
from .Bush import Bush # Add Bush
from .Candle import Candle
from .Chicken import Chicken
from .Coin import Coin
from .DullKnife import DullKnife
from .Egg import Egg
from .EliorsJournal import EliorsJournal
from .Feather import Feather
from .Fish import Fish
from .FishingRod import FishingRod
from .MagneticFishingRod import MagneticFishingRod
from .ExtendedMagneticFishingRod import ExtendedMagneticFishingRod
from .HealingHerb import HealingHerb
from .Locket import Locket
from .Horseshoe import Horseshoe
from .Key import Key
from .Lantern import Lantern
from .Magnet import Magnet
from .Matches import Matches
from .Mechanism import Mechanism
from .MillstoneFragment import MillstoneFragment
from .MysteriousBox import MysteriousBox
from .OldNotice import OldNotice
from .PrayerBook import PrayerBook
from .RareFlower import RareFlower
from .River import River
from .Rope import Rope
from .RustyHoe import RustyHoe
from .SackOfFlour import SackOfFlour
from .SharpKnife import SharpKnife
from .ShedDoor import ShedDoor
from .ShinyPebble import ShinyPebble
from .ShinyRing import ShinyRing
from .SmoothStone import SmoothStone
from .Stick import Stick
from .TravelCloak import TravelCloak
from .Vines import Vines
from .WalkingStick import WalkingStick
from .WanderingBoots import WanderingBoots
from .Well import Well
from .WildBerries import WildBerries
from .WitheredCarrot import WitheredCarrot
from .Item import Item
from .Map import Map # Ensure Map is imported

# This list is used to dynamically instantiate items when loading the game state
# or when items are created during gameplay (e.g., by a character or a room).
# Ensure all concrete item classes are listed here.
# Abstract or base classes like 'Item' itself should not be included.
AVAILABLE_ITEMS = {
    "AncientAmulet": AncientAmulet,
    "Apple": Apple,
    "Bread": Bread,
    "BrokenShovel": BrokenShovel,
    "Bucket": Bucket,
    "Bush": Bush, # Add Bush
    "Candle": Candle,
    "Chicken": Chicken,
    "Coin": Coin,
    "DullKnife": DullKnife,
    "Egg": Egg,
    "EliorsJournal": EliorsJournal,
    "ExtendedMagneticFishingRod": ExtendedMagneticFishingRod, # Added
    "Feather": Feather,
    "Fish": Fish,
    "FishingRod": FishingRod,
    "HealingHerb": HealingHerb,
    "Locket": Locket,
    "Horseshoe": Horseshoe,
    "Key": Key,
    "Lantern": Lantern,
    "Magnet": Magnet,
    "MagneticFishingRod": MagneticFishingRod, # Added
    "Map": Map, # Ensure Map is correctly referenced
    "Matches": Matches,
    "Mechanism": Mechanism,
    "MillstoneFragment": MillstoneFragment,
    "MysteriousBox": MysteriousBox,
    "OldNotice": OldNotice,
    "PrayerBook": PrayerBook,
    "RareFlower": RareFlower,
    "River": River,
    "Rope": Rope,
    "RustyHoe": RustyHoe,
    "SackOfFlour": SackOfFlour,
    "SharpKnife": SharpKnife,
    "ShedDoor": ShedDoor,
    "ShinyPebble": ShinyPebble,
    "ShinyRing": ShinyRing,
    "SmoothStone": SmoothStone,
    "Stick": Stick,
    "TravelCloak": TravelCloak,
    "Vines": Vines,
    "WalkingStick": WalkingStick,
    "WanderingBoots": WanderingBoots,
    "Well": Well,
    "WildBerries": WildBerries,
    "WitheredCarrot": WitheredCarrot,
}

# Helper function to create an item instance by its class name
def create_item(item_class_name: str) -> Item: # Item should be imported from .Item
    '''
    Factory function to create an item instance from its class name.
    '''
    if item_class_name in AVAILABLE_ITEMS:
        return AVAILABLE_ITEMS[item_class_name]()
    else:
        raise ValueError(f"Unknown item class name: {item_class_name}")

__all__ = [
    "Item", 
    "AncientAmulet", "Apple", "Bread", "BrokenShovel", "Bucket", "Candle", 
    "Chicken", "Coin", "DullKnife", "Egg", "EliorsJournal", 
    "ExtendedMagneticFishingRod", "Feather", "Fish", "FishingRod", "HealingHerb", "Locket", 
    "Horseshoe", "Key", "Lantern", "Magnet", "MagneticFishingRod", "Map", "Matches", "Mechanism", 
    "MillstoneFragment", "MysteriousBox", "OldNotice", "PrayerBook", 
    "RareFlower", "River", "Rope", "RustyHoe", "SackOfFlour", 
    "SharpKnife", "ShedDoor", "ShinyPebble", "ShinyRing", 
    "SmoothStone", "Stick", "TravelCloak", "Vines", "WalkingStick", 
    "WanderingBoots", "Well", "WildBerries", "WitheredCarrot",
    "create_item", "AVAILABLE_ITEMS"
]
