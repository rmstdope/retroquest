from retroquest.engine.Act import Act
from retroquest.act2.rooms.MountainPath import MountainPath

# TODO: Import other room classes when they are created
# from retroquest.act2.rooms.GreendaleGates import GreendaleGates
# from retroquest.act2.rooms.MainSquare import MainSquare
# from retroquest.act2.rooms.MarketDistrict import MarketDistrict
# from retroquest.act2.rooms.SilverStagInn import SilverStagInn
# from retroquest.act2.rooms.CastleCourtyard import CastleCourtyard
# from retroquest.act2.rooms.GreatHall import GreatHall
# from retroquest.act2.rooms.ResidentialQuarter import ResidentialQuarter
# from retroquest.act2.rooms.HealersHouse import HealersHouse
# from retroquest.act2.rooms.HiddenLibrary import HiddenLibrary
# from retroquest.act2.rooms.ForestTransition import ForestTransition
# from retroquest.act2.rooms.ForestEntrance import ForestEntrance
# from retroquest.act2.rooms.AncientGrove import AncientGrove
# from retroquest.act2.rooms.WhisperingGlade import WhisperingGlade
# from retroquest.act2.rooms.HeartOfTheForest import HeartOfTheForest

# TODO: Import quest classes when they are created
# from retroquest.act2.quests.TheGatheringStorm import TheGatheringStormQuest
# from retroquest.act2.quests.TheKnightsTest import TheKnightsTestQuest
# from retroquest.act2.quests.SuppliesForTheJourney import SuppliesForTheJourneyQuest
# from retroquest.act2.quests.TheMerchantsLostCaravan import TheMerchantsLostCaravanQuest
# from retroquest.act2.quests.EchoesOfThePast import EchoesOfThePastQuest
# from retroquest.act2.quests.TheHealersApprentice import TheHealersApprenticeQuest
# from retroquest.act2.quests.CedricsLostHonor import CedricsLostHonorQuest
# from retroquest.act2.quests.TheInnkeepersDaughter import TheInnkeepersDaughterQuest
# from retroquest.act2.quests.TheAncientLibrary import TheAncientLibraryQuest
# from retroquest.act2.quests.TheHermitsWarning import TheHermitsWarningQuest
# from retroquest.act2.quests.TheForestGuardiansRiddles import TheForestGuardiansRiddlesQuest
# from retroquest.act2.quests.WhispersInTheWind import WhispersInTheWindQuest

class Act2(Act):
    def __init__(self):
        rooms = {
            "MountainPath": MountainPath(),
        }
        quests = [
        ]
        music_file = "music/Conquest - Market (freetouse.com).mp3"
        super().__init__(name="Act II: Greendale & The Forest Edge", rooms=rooms, quests=quests, music_file=music_file)
    
    def get_act_intro(self) -> str:
        return (
            "After the mysterious events in Willowbrook and the revelation of your growing magical abilities, you have left your quiet village behind. "
            "The mountain path stretches before you, winding through rocky terrain toward your destination: Greendale, a bustling city that serves as the gateway between civilization and the mystical Enchanted Forest.\n"
            "\nAs you crest the final ridge, the sight takes your breath away. Below lies Greendale—larger than any settlement you've ever seen, with stone buildings, busy market squares, and an impressive castle rising majestically above the city walls. "
            "Smoke rises from countless chimneys, and you can hear the distant sounds of commerce and conversation carried on the mountain breeze.\n"
            "\nYour grandmother's words echo in your mind: [dialogue]'Seek out Sir Cedric at the castle. He will help you understand your heritage and the growing darkness that threatens our world.'[/dialogue] "
            "The ancient amulet she gave you feels warm against your chest, a reminder of the mysteries you must uncover.\n"
            "\nBeyond Greendale, you glimpse the edge of the Enchanted Forest—an ancient woodland where magic flows like water and spirits older than memory dwell among the trees. "
            "The very air seems to shimmer with possibility and danger.\n"
            "\nThis is where your true journey begins. In Greendale, you must prove yourself worthy, forge alliances with powerful allies, and master the magical arts. "
            "Only then will you be ready to face the forest's deepest secrets and the growing storm that threatens all you hold dear.\n"
            "\nTake a deep breath and step forward into your destiny.\n"
        )
    
    def is_complete(self):
        """Check if all required quests for Act II have been completed"""
        # According to design rules, all side quests must be completed before main quest
        required_quests = [
            # Greendale Phase Quests
            "the_knights_test",
            "supplies_for_the_journey", 
            "echoes_of_the_past",
            "the_healers_apprentice",
            "cedriks_lost_honor",
            "the_innkeepers_daughter",

            "the_ancient_library",
            # Forest Phase Quests
            "the_hermits_warning",
            "the_forest_guardians_riddles",
            "whispers_in_the_wind",
            "the_merchants_lost_caravan",
            # Main Quest (can only complete after all side quests)
            "the_gathering_storm"
        ]
        
        # TODO: Implement proper quest completion checking when quests are created
        # For now, return False as a placeholder
        return False
