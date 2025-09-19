"""Advanced healing potion item: potent restorative future combat balancing hook."""

from ...engine.Item import Item


class AdvancedHealingPotion(Item):  # pylint: disable=too-few-public-methods
    """High-tier curative consumable placeholder.

    Purpose:
        Reserved for later encounter tuning (mid-act spike recovery or boss prep) so
        early scaffolding exists for inventory, UI, and potential crafting trees.

    Mechanics:
        Currently inert (no specialized ``use`` override) to avoid premature balance
        shifts. Will later restore significant health or cleanse multi-effect debuffs.

    Design Notes:
        Introduced early to anchor narrative hints (alchemical refinement, apothecary
        requests). Implementation deferred until core combat / damage systems mature.
    """

    def __init__(self) -> None:
        super().__init__(
            name="advanced healing potion",
            short_name="adv heal",
            description=(
                "A sealed crystal vial swirling with layered iridescent strata that "
                "pulse faintly when held. Even unopened it radiates clean restorative "
                "potential—clearly beyond a common herbal tincture."
            ),
            can_be_carried=True,
        )
