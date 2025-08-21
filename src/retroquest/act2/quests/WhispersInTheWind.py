from ...engine.Quest import Quest

class WhispersInTheWind(Quest):
    def __init__(self) -> None:
        super().__init__(
            name="Whispers in the Wind",
            description=(
                "The Ancient Tree Spirit has sensed a disturbance in the heart of the forest. "
                "Strange whispers carry on the wind, speaking of corruption that threatens the "
                "very essence of nature. You must journey to the Heart of the Forest and "
                "investigate these ominous whispers to discover their source."
            ),
            completion="You have investigated the mysterious whispers and discovered their source, protecting the forest from the growing corruption."
        )
        self.objectives = [
            "Travel to the Heart of the Forest",
            "Investigate the source of the mysterious whispers",
            "Discover what threatens the forest's essence",
            "Report back to the Ancient Tree Spirit with your findings"
        ]
        self.experience_reward = 300

    def check_trigger(self, game_state) -> bool:
        """Check if this quest should be activated."""
        return game_state.get_story_flag("whispers_in_wind_offered")

    def check_completion(self, game_state) -> bool:
        """Check if the quest can be completed based on story flags."""
        return game_state.get_story_flag("whispers_in_the_wind_completed") and not self.is_completed_flag

    def complete(self, game_state) -> str:
        """Complete the quest and give rewards."""
        if not self.is_completed_flag:
            self.is_completed_flag = True
            
            # Add experience
            if hasattr(game_state, 'add_experience'):
                game_state.add_experience(self.experience_reward)
                exp_msg = f" You gain {self.experience_reward} experience!"
            else:
                exp_msg = ""
        
            return f"[quest_complete]Quest Complete: {self.name}[/quest_complete]{exp_msg}"
        
        return self.completion

    def get_status(self) -> str:
        """Return the current status of the quest."""
        if self.is_completed_flag:
            return f"[quest_status_complete]{self.name} - COMPLETED[/quest_status_complete]"
        else:
            status = f"[quest_status_active]{self.name} - IN PROGRESS[/quest_status_active]\n"
            for objective in self.objectives:
                status += f"  • {objective}\n"
            return status
