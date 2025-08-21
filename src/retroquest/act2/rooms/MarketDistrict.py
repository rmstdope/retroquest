from ...engine.Room import Room
from ..characters.MasterMerchantAldric import MasterMerchantAldric
from ..characters.CaravanMasterThorne import CaravanMasterThorne
from ..items.Coins import Coins

class MarketDistrict(Room):
    def __init__(self) -> None:
        super().__init__(
            name="Market District",
            description=(
                "Narrow streets packed with shops, inns, and trading posts create a maze of commerce. The air is thick "
                "with the scents of spices, leather, and fresh bread. Merchant wagons crowd the streets, and you can "
                "hear negotiations in multiple languages. This is where serious business gets done in Greendale."
            ),
            items=[Coins(100)],  # Starting coins for purchases
            characters=[MasterMerchantAldric(), CaravanMasterThorne()],
            exits={"west": "MainSquare", "north": "SilverStagInn", "south": "MerchantsWarehouse"}
        )
