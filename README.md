# RetroQuest: An AI-Forged Text Adventure!

Welcome to RetroQuest, an experimental voyage into the heart of game development, powered by GitHub Copilot! This isn't just a game; it's a chronicle of collaboration between human ingenuity and artificial intelligence, exploring just how far we can push the boundaries of automated code generation.

## The Genesis: A Spark Rekindled

Picture this: December 2024. A classic text adventure, a nostalgic dream, begins to take shape in Python. But alas, the relentless march of time left this fledgling project dormant, a nearly forgotten relic in a digital tomb.

Fast forward to the vibrant spring of May 2025! A new, audacious experiment was conceived: What if an AI could breathe life into this forgotten quest? What if GitHub Copilot could not only write the code but also weave the intricate tapestry of tests and game mechanics, with minimal human intervention? And so, RetroQuest was reborn, not just as a game, but as a testament to the evolving landscape of software creation.

## The Grand Experiment: Human & AI in Concert

So, what's the human role in this AI-driven epic? Imagine a director guiding a prodigious, tireless actor:

-   **The Prompter Supreme:** I, your human collaborator, chart the course, whispering prompts and grand designs to the AI.
-   **The Discerning Eye:** I meticulously review every line of code, every test case, offering constructive feedback to refine the AI's creations.
-   **The Last Bastion:** Should the AI encounter an unyielding enigma, a bug too cunning, I step in as the final troubleshooter.

This is a dance of wits, a partnership where the human provides the vision and the AI, the tireless execution.

## The Blueprint: Crafting Worlds in Markdown

### Designing the Digital Realm

Before a single line of Python was penned, the world of RetroQuest was meticulously sculpted within the flexible confines of Markdown files. This wasn't about rigid specifications, but about creating a living, breathing design document. As the adventure unfolds, these files evolve, reflecting new insights, thrilling plot twists, and those delightful "aha!" moments that make game development so captivating. We embrace the flux, allowing the game to grow organically, becoming richer and more engaging with each iteration.

### The Golden Path: A Guiding Star

To navigate this ambitious undertaking, we've charted a "Golden Path"—a meticulously planned sequence of steps that carves the optimal route through Act I of our adventure. This path, detailed in `design/RoomsAct1.md`, serves as our North Star. It informs every implementation choice, every character interaction, and every puzzle's intricate solution when not explicitly dictated by a prompt. More than just a walkthrough, the Golden Path is the very backbone of our integration tests, ensuring that the complete journey is not only possible but also a seamless and rewarding experience for the player.

Join us as RetroQuest unfolds, one prompt, one line of code, one AI-generated marvel at a time!

---

_PS: Yes, you guessed it - this README was also artfully crafted by GitHub Copilot!_

## Development & Formatting Standards

All contributions must satisfy strict formatting and structural rules:

Hard constraints (CI enforced):

1. Max physical line length: 99 characters (including indentation).
2. No tabs; 4-space indentation.
3. No trailing whitespace; exactly one newline at EOF.
4. One-line module docstring for single-class modules.
5. All overridden methods (`search`, `get_exits`, gating helpers) have docstrings.
6. Unused parameters prefixed with underscore.

Before committing, run:

```bash
python scripts/check_line_length.py
ruff check
ruff format --check
```

(Install tooling first: `pip install pre-commit ruff` then `pre-commit install`).

Pre-commit hooks automatically enforce line length and Ruff diagnostics.

Narrative wrapping pattern:

```python
description = (
	"First clause describing the space. "
	"Second clause continuing the thought. "
	"Final clause concluding the description."
)
```

Pull requests must include the phrase: `Formatting constraints verified` in the description.
