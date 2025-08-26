from ...engine.Spell import Spell
from ..Act2StoryFlags import FLAG_MENDED_LIBRARY_ENCHANTMENTS
from ...engine.GameState import GameState
from ...engine.Item import Item

class MendSpell(Spell):
    def __init__(self) -> None:
        super().__init__(
            name="mend",
            description="A basic repair spell that can fix broken objects, torn clothing, and minor damage to items. This fundamental magic is essential for any aspiring mage.",
        )

    def cast_spell(self, game_state: GameState) -> str:
        return (f"[success]You cast [spell_name]{self.get_name()}[/spell_name] into the air. The spell shimmers briefly, "
                "looking for something to repair, but finds nothing that needs mending nearby.[/success]")

    def cast_on_item(self, game_state: GameState, target_item: Item) -> str:
        from ..items.ProtectiveEnchantments import ProtectiveEnchantments  # Import here to avoid circular imports
        
        # Special handling for protective enchantments in Hidden Library
        if isinstance(target_item, ProtectiveEnchantments):
            if not game_state.get_story_flag(FLAG_MENDED_LIBRARY_ENCHANTMENTS):
                game_state.set_story_flag(FLAG_MENDED_LIBRARY_ENCHANTMENTS, True)
                return (f"[success]You cast [spell_name]{self.get_name()}[/spell_name] on the damaged [item_name]{target_item.get_name()}[/item_name]. "
                        "The magical barriers flicker and stabilize as your repair magic restores their integrity. "
                        "The shimmering barriers around the most valuable texts now glow steadily. You have proven "
                        "your worthiness and respect for ancient knowledge.[/success]")
            else:
                return f"[info]The [item_name]{target_item.get_name()}[/item_name] have already been repaired and are functioning properly.[/info]"
        
        # Check if the item can be repaired (this is the original implementation)
        elif "broken" in target_item.get_description().lower() or "damaged" in target_item.get_description().lower():
            return (f"[success]You cast [spell_name]{self.get_name()}[/spell_name] on [item_name]{target_item.get_name()}[/item_name]. "
                    f"The magical energy flows through the item, repairing damage and restoring it to working condition![/success]")
        else:
            return (f"[info]You cast [spell_name]{self.get_name()}[/spell_name] on [item_name]{target_item.get_name()}[/item_name], "
                    f"but it doesn't appear to need any repairs. The spell has no effect.[/info]")