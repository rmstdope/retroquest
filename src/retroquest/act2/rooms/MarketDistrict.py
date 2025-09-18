"""Market District (Act II)

Narrative Role:
    Commerce epicenter enabling acquisition of preparation gear for wilderness and forest progression.

Key Mechanics:
    - add_wares() populates non-carriable display items (ForestSurvivalKit, EnhancedLantern, QualityRope) with can_be_carried=False until purchase flow triggers conversion.
    - Static exits connect economic triangle (MainSquare, SilverStagInn, MerchantsWarehouse).

Story Flags:
    - None directly; purchase state managed per-item (could elevate to flags if narrative reacts to acquisition).

Contents:
    - NPCs: MasterMerchantAldric (merchant logic), CaravanMasterThorne (travel hooks / future expansion).
    - Items: Initially empty until add_wares invoked to stage merchant inventory.

Design Notes:
    - Display item pattern suggests future transactional system (toggle can_be_carried after payment).
    - Consider central MerchantInventory service if multiple markets appear across acts.
"""

from ...engine.Room import Room
from ..characters.MasterMerchantAldric import MasterMerchantAldric
from ..characters.CaravanMasterThorne import CaravanMasterThorne
from ..items.ForestSurvivalKit import ForestSurvivalKit
from ..items.EnhancedLantern import EnhancedLantern
from ..items.QualityRope import QualityRope

class MarketDistrict(Room):
    def __init__(self) -> None:
        # Create merchant items that are not carriable initially (display items)
        
        super().__init__(
            name="Market District",
            description=(
                "Narrow streets packed with shops, inns, and trading posts create a maze of commerce. The air is thick "
                "with the scents of spices, leather, and fresh bread. Merchant wagons crowd the streets, and you can "
                "hear negotiations in multiple languages. This is where serious business gets done in Greendale."
            ),
            items=[],
            characters=[MasterMerchantAldric(), CaravanMasterThorne()],
            exits={"west": "MainSquare", "north": "SilverStagInn", "south": "MerchantsWarehouse"}
        )

    def add_wares(self) -> None:
        """Create and add the merchant's display items (non-carriable)"""
        survival_kit = ForestSurvivalKit()
        survival_kit.can_be_carried = False
        
        enhanced_lantern = EnhancedLantern()
        enhanced_lantern.can_be_carried = False
        
        quality_rope = QualityRope()
        quality_rope.can_be_carried = False
        
        self.items = [survival_kit, enhanced_lantern, quality_rope]
