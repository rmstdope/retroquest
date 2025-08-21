from ...engine.Spell import Spell
from ...engine.GameState import GameState
from ...engine.Item import Item

class MendSpell(Spell):
    def __init__(self) -> None:
        super().__init__(
            name="mend",
            description="A basic repair spell that can fix broken objects, torn clothing, and minor damage to items. This fundamental magic is essential for any aspiring mage.",
        )

    def cast_spell(self, game_state: GameState) -> str:
        return ("[success]You cast [spell_name]mend[/spell_name] into the air. The spell shimmers briefly, "
                "looking for something to repair, but finds nothing that needs mending nearby.[/success]")

    def cast_on_item(self, game_state: GameState, target_item: Item) -> str:
        # Check if the item can be repaired (this is a simple implementation)
        if "broken" in target_item.get_description().lower() or "damaged" in target_item.get_description().lower():
            return (f"[success]You cast [spell_name]mend[/spell_name] on [item_name]{target_item.get_name()}[/item_name]. "
                    f"The magical energy flows through the item, repairing damage and restoring it to working condition![/success]")
        else:
            return (f"[info]You cast [spell_name]mend[/spell_name] on [item_name]{target_item.get_name()}[/item_name], "
                    f"but it doesn't appear to need any repairs. The spell has no effect.[/info]")