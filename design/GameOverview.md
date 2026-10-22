# Game Overview

**Title:** RetroQuest: The Awakening

## High-Level Concept

RetroQuest: The Awakening is a retro-style text adventure game set in a vibrant fantasy world. Players take on the role of a humble farmer boy who discovers latent magical powers and learns that his vanished parents, a fallen sorcerer and the kingdom's fate are one story, and that he carries it. The game blends classic interactive fiction mechanics with a rich narrative and memorable characters.

## Setting

The story unfolds in the magical kingdom of Eldoria, a land of rolling farmlands, enchanted forests, mystical mountains, and ancient castles. Magic is woven into the fabric of everyday life, but a dark force threatens to plunge the realm into chaos.

## Main Characters

- **Elior:** The protagonist, a young farmer boy raised by his grandmother, who discovers his magic is his parents' inheritance and that the ward that protects the kingdom lives in him.
- **Mira:** A wise village healer who mentors Elior and helps him unlock his powers.
- **Sir Cedric:** A loyal knight who becomes Elior’s protector and guide.
- **Nyx:** A mischievous forest sprite who aids Elior with riddles and secrets.
- **Malakar:** A fallen Warden and his parents' closest friend, who tore a wound in time to save them and was corrupted by the power he found there; he drains the king to break the ward and bring his friends back.
- **King Alden:** The benevolent ruler of Eldoria, whose fate rests in Elior’s hands.

## Gameplay Overview

Players interact with the world by typing text commands. The game responds with detailed descriptions, presenting challenges, puzzles, and narrative choices. Exploration, inventory management, and decision-making are key to progressing through the story.

## Voice

Every line of the game, in every act, follows `design/Voice.md`: plain and particular, one true thing per room, no character calling themself ancient or wise, no instruction in the game's own voice, the motifs repeated in the same words.

## Puzzle Rules

Every puzzle in every act follows these rules, so the game stays puzzling without ever being hard.

1. **The clue lives in a different room from the lock.** The blacksmith tells you to rest in the glade; the Phoenix Guardian says to count the breath; the Pier Warden's father knew what the sanctum water asks. A puzzle whose hint is in the same paragraph as its lock is a step, not a puzzle.
2. **Wrong answers teach.** Every refusal says something true in-world ("Then you would be taking"). Nothing ever just fails to happen.
3. **No fail state, ever.** A wrong turn returns you; a wrong word repeats the question.
4. **One word-riddle per site.** The word must have meaning once answered (myself, patience, everything), and the near-misses get specific refusals. The one exception is the Throne Chamber, the climax, which asks two: the refrain and then the ending word.
5. **Each learned spell is used twice** before its act ends: once where it is required, once where it is only rewarded.
6. **Order gates are in-world.** "Not yet" comes from a character with a reason, never from the game.
7. **A stuck player can ask.** `hint` answers in-world with the active quests' newest journal line, or a checklist's lead-in and next open item, the main quest first; a quest may say something sharper. It never names a command.

## Example Commands

The full list, with every synonym, is `design/Commands.md`. A few that the game answers:

- **Movement:** `go north`, `north`, `n`
- **Interaction:** `talk to Mira`, `say patience to shadow`, `give locket to grandmother`, `buy rope from shopkeeper`
- **Examination:** `look`, `examine offering altar`, `search`, `listen`, `listen to shell`
- **Inventory:** `take lantern`, `drop apple`, `use bucket with well`, `inventory`
- **Magic:** `cast light`, `cast purify on well`, `spells`
- **When stuck:** `hint`, `wait`, `map`
- **Game Management:** `save`, `load`, `help`

## Target Audience

Fans of classic adventure games, interactive fiction, and fantasy stories who enjoy immersive storytelling and puzzle-solving in a nostalgic, text-driven format.
