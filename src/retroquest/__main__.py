from retroquest.Game import Game
from retroquest.rooms.EliorsCottage import EliorsCottage
from retroquest.rooms.VegetableField import VegetableField
from retroquest.rooms.ChickenCoop import ChickenCoop
from retroquest.rooms.VillageSquare import VillageSquare
from retroquest.rooms.MirasHut import MirasHut
from retroquest.rooms.BlacksmithsForge import BlacksmithsForge
from retroquest.rooms.GeneralStore import GeneralStore
from retroquest.rooms.VillageWell import VillageWell
from retroquest.rooms.AbandonedShed import AbandonedShed
from retroquest.rooms.OldMill import OldMill
from retroquest.rooms.Riverbank import Riverbank
from retroquest.rooms.ForestPath import ForestPath
from retroquest.rooms.HiddenGlade import HiddenGlade
from retroquest.rooms.VillageChapel import VillageChapel
from retroquest.rooms.RoadToGreendale import RoadToGreendale
from retroquest.quests.HintOfMagic import HintOfMagicQuest
from retroquest.quests.CuriosityKilledTheCat import CuriosityKilledTheCatQuest
from retroquest.quests.FishingExpedition import FishingExpeditionQuest
from retroquest.quests.KnowYourVillage import KnowYourVillageQuest
from retroquest.quests.LetThereBeLight import LetThereBeLightQuest
from retroquest.quests.MagicForReal import MagicForRealQuest
from retroquest.quests.MagnetFishingExpedition import MagnetFishingExpeditionQuest
from retroquest.quests.OhDeerOhDeer import OhDeerOhDeerQuest
from retroquest.quests.PreparingForTheRoad import PreparingForTheRoadQuest

def main():
    # Instantiate all rooms
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
    starting_room = rooms["EliorsCottage"]
    all_quests = [
        HintOfMagicQuest(),
        CuriosityKilledTheCatQuest(),
        FishingExpeditionQuest(),
        KnowYourVillageQuest(),
        LetThereBeLightQuest(),
        MagicForRealQuest(),
        MagnetFishingExpeditionQuest(),
        OhDeerOhDeerQuest(),
        PreparingForTheRoadQuest([
            "travel cloak", "wild berries", "apple", "egg", "fresh carrot", "wandering boots", "map"
        ]),
    ]
    game = Game(starting_room, rooms, all_quests=all_quests)
    game.run()

if __name__ == '__main__':
    main()
