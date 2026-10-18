"""Unit tests for the shared engine theme."""

from retroquest.engine.theme import apply_theme, custom_theme


def test_pending_tag_is_part_of_the_theme() -> None:
    """The [pending] tag marks "not yet done" items and must have a style."""
    assert "pending" in custom_theme


def test_pending_tag_is_distinct_from_failure() -> None:
    """Pending items must not look like real failures."""
    assert custom_theme["pending"] != custom_theme["failure"]


def test_apply_theme_replaces_pending_tags() -> None:
    """apply_theme converts [pending] markup to its Rich style."""
    styled = apply_theme("[pending]Sturdy footwear[/pending]")
    style = custom_theme["pending"]
    assert styled == f"[{style}]Sturdy footwear[/{style}]"
