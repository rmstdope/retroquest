from ...engine.Quest import Quest
from ..Act2StoryFlags import FLAG_HERMITS_WARNING_COMPLETED

class TheHermitsWarning(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="The Hermit's Warning",
            description=(
                "A mysterious forest hermit has warned you about the dangers of the Enchanted Forest. "
                "They spoke of ancient guardians, dark spirits, and ever-shifting paths that trap the unwary. "
                "The hermit has given you a protective charm to help safeguard your journey through the magical wilderness."
            ),
            objectives=[
                "Listen to the forest hermit's warnings about the Enchanted Forest",
                "Receive the protective charm for your journey"
            ],
            experience_reward=150,
            completed=False
        )

    def update_progress(self, game_state) -> str:
        """Check if the quest can be completed based on story flags."""
        if game_state.get_story_flag(FLAG_HERMITS_WARNING_COMPLETED) and not self.completed:
            self.completed = True
            return self.complete_quest(game_state)
        return ""

    def complete_quest(self, game_state) -> str:
        """Complete the quest and give rewards."""
        if not self.completed:
            self.completed = True
            
        # Add experience
        if hasattr(game_state, 'add_experience'):
            game_state.add_experience(self.experience_reward)
            exp_msg = f" You gain {self.experience_reward} experience!"
        else:
            exp_msg = ""
        
        return f"[quest_complete]Quest Complete: {self.name}[/quest_complete]{exp_msg}"

    def get_status(self) -> str:
        """Return the current status of the quest."""
        if self.completed:
            return f"[quest_status_complete]{self.name} - COMPLETED[/quest_status_complete]"
        else:
            status = f"[quest_status_active]{self.name} - IN PROGRESS[/quest_status_active]\n"
            for i, objective in enumerate(self.objectives):
                if i == 0:
                    status += f"  ✓ {objective}\n"
                elif i == 1:
                    status += f"  ✓ {objective}\n"
                else:
                    status += f"  • {objective}\n"
            return status
