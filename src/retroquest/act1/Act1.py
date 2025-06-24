from retroquest.engine.Act import Act
from retroquest.act1.rooms.EliorsCottage import EliorsCottage
from retroquest.act1.rooms.VegetableField import VegetableField
from retroquest.act1.rooms.ChickenCoop import ChickenCoop
from retroquest.act1.rooms.VillageSquare import VillageSquare
from retroquest.act1.rooms.MirasHut import MirasHut
from retroquest.act1.rooms.BlacksmithsForge import BlacksmithsForge
from retroquest.act1.rooms.GeneralStore import GeneralStore
from retroquest.act1.rooms.VillageWell import VillageWell
from retroquest.act1.rooms.AbandonedShed import AbandonedShed
from retroquest.act1.rooms.OldMill import OldMill
from retroquest.act1.rooms.Riverbank import Riverbank
from retroquest.act1.rooms.ForestPath import ForestPath
from retroquest.act1.rooms.HiddenGlade import HiddenGlade
from retroquest.act1.rooms.VillageChapel import VillageChapel
from retroquest.act1.rooms.RoadToGreendale import RoadToGreendale
from retroquest.act1.quests.HintOfMagic import HintOfMagicQuest
from retroquest.act1.quests.CuriosityKilledTheCat import CuriosityKilledTheCatQuest
from retroquest.act1.quests.FishingExpedition import FishingExpeditionQuest
from retroquest.act1.quests.KnowYourVillage import KnowYourVillageQuest
from retroquest.act1.quests.LetThereBeLight import LetThereBeLightQuest
from retroquest.act1.quests.MagicForReal import MagicForRealQuest
from retroquest.act1.quests.MagnetFishingExpedition import MagnetFishingExpeditionQuest
from retroquest.act1.quests.OhDeerOhDeer import OhDeerOhDeerQuest
from retroquest.act1.quests.PreparingForTheRoad import PreparingForTheRoadQuest

class Act1(Act):
    def __init__(self):
        rooms = {
            "EliorsCottage": EliorsCottage(),
            "VegetableField": VegetableField(),
            "ChickenCoop": ChickenCoop(),
            "VillageSquare": VillageSquare(),
            "MirasHut": MirasHut(),
            "BlacksmithsForge": BlacksmithsForge(),
            "GeneralStore": GeneralStore(),
            "VillageWell": VillageWell(),
            "AbandonedShed": AbandonedShed(),
            "OldMill": OldMill(),
            "Riverbank": Riverbank(),
            "ForestPath": ForestPath(),
            "HiddenGlade": HiddenGlade(),
            "VillageChapel": VillageChapel(),
            "RoadToGreendale": RoadToGreendale(),
        }
        quests = [
            HintOfMagicQuest(),
            CuriosityKilledTheCatQuest(),
            FishingExpeditionQuest(),
            KnowYourVillageQuest(),
            LetThereBeLightQuest(),
            MagicForRealQuest(),
            MagnetFishingExpeditionQuest(),
            OhDeerOhDeerQuest(),
            PreparingForTheRoadQuest(),
        ]
        super().__init__(name="Retroquest - Act 1", rooms=rooms, quests=quests)
