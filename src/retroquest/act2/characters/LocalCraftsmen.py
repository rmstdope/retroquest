from ...engine.Character import Character
from ...engine.GameState import GameState
from ..Act2StoryFlags import FLAG_LEARNED_MEND_FROM_CRAFTSMEN, FLAG_HELPED_ELDERLY_RESIDENTS

class LocalCraftsmen(Character):
    def __init__(self) -> None:
        super().__init__(
            name="local craftsmen",
            description="Skilled artisans working at various crafts - blacksmithing, carpentry, tailoring, and magical repair work. They demonstrate traditional techniques passed down through generations.",
        )

    def talk_to(self, game_state: GameState) -> str:
        if not game_state.get_story_flag(FLAG_HELPED_ELDERLY_RESIDENTS):
            return (f"[failure]The [character_name]{self.get_name()}[/character_name] eye you with suspicion and "
                    "refuse to talk to you. They don't seem to trust you yet. Perhaps you need to prove yourself "
                    "to the community first.[/failure]")
        
        if not game_state.get_story_flag(FLAG_LEARNED_MEND_FROM_CRAFTSMEN):
            game_state.set_story_flag(FLAG_LEARNED_MEND_FROM_CRAFTSMEN, True)
            from ..spells.MendSpell import MendSpell
            game_state.learn_spell(MendSpell())
            return (f"[success]You speak with the [character_name]{self.get_name()}[/character_name] and watch them work, "
                    "observing their techniques for repairing damaged items. As you study their methods, you begin to "
                    "understand the magical principles behind restoration and repair. Through careful observation, "
                    "you learn the [spell_name]mend[/spell_name] spell![/success]")
        else:
            return (f"[character_name]{self.get_name()}[/character_name]: Good to see you again! How has your repair magic "
                    "been working? The mend spell is one of the most useful pieces of magic a person can learn.")