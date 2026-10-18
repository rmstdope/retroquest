"""Unit tests for the prompt_toolkit based (-oldschool) user interface."""

from retroquest.engine.promptui.PromptSessionApp import PromptSessionApp


def test_console_theme_styles_pending_tag() -> None:
    """Quest checklists use [pending], so the console theme must style it."""
    app = PromptSessionApp(None)
    assert str(app.console.get_style("pending")) == "dim italic"
