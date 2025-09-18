from ...engine.Spell import Spell
from ...engine.GameState import GameState


class LightSpell(Spell):
    def __init__(self) -> None:
        super().__init__(
            name="light",
            description="A steady kindling that coaxes prisms to life.",
        )

    def cast_spell(self, game_state: GameState) -> str:
        hook = getattr(game_state.current_room, 'cast_light_here', None)
        if hook:
            return hook(game_state)
        return "[event]A warm spark flares in your palm and fades—nothing here seems to catch.[/event]"
