"""Binding resin for repairing brass mirror segments."""
from ...engine.Item import Item


class BindingResin(Item):
    """A viscous resin useful for securing mirror segments in mounts."""

    def __init__(self) -> None:
        """Initialize a Binding Resin item."""
        super().__init__(
            name="Binding Resin",
            description=(
                "A sticky, heat-cured resin used by mirrorwrights to bind brass "
                "segments into place."
            ),
            short_name="resin",
            can_be_carried=True,
        )
