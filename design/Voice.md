# Voice

How RetroQuest reads. Every room description, item line, refusal and speech in every act follows
this, so that a line written for Act I and a line written for Act IV sound like the same game.
The register that won, across three prose passes, is plain and particular: the Sea-Sealed
Letter's margin ("You would have me wait while you die. — M."), Mira's confession ("You noticed.
I saw you notice."), the vault ("It is the saddest and warmest room in the fortress"), Malakar
after the elixir ("It does not hurt. For the first time in years, it does not hurt.").

## The rules

1. **Say one true thing.** A room description names what is there and one thing that matters
   about it. "This was a garden once" does more than three sentences of atmosphere. Cut
   anything that only sets a mood.
2. **Plain words, short sentences.** No "otherworldly", "eldritch", "ancient" as a mood word,
   "radiating an aura", "kaleidoscope", "slither into your mind". If a sentence could open a
   fantasy paperback, rewrite it until it could be said across a kitchen table.
3. **Nobody calls themself ancient or wise.** Age and wisdom show in what a character notices
   and leaves unsaid. The Dragon says "Little Mira. Tell her she has grown old."; it does not
   say it is old.
4. **Nobody lists what the player needs.** The quest log carries the checklist. A character may
   want something ("You'll need warmth, protection, food, boots and a map" is Mira, and allowed,
   because a person may instruct); the game's own voice never says "You need to" or "You should".
5. **Refusals say something true in-world.** "The straps have nothing to hold." "The padlock
   holds. It is iron, rusted shut, and it has a keyhole." Never "nothing happens", never an
   instruction in disguise. See the Puzzle Rules in `design/GameOverview.md`.
6. **Each speaker has a habit.** Tilda gossips and quotes her mother's knock on wood; Cedric speaks like a soldier
   and ends on a plain promise; the Librarian is a keeper, not a teller; the Shadow speaks in
   short, tired sentences; Grandmother deflects to the bread. Reuse the habit, not a catchphrase.
7. **Let silence and gesture carry weight.** "You do." "She stops when she sees your face." A beat
   of narration beats a paragraph of explanation. Do not explain what a line means after
   saying it.
8. **Reveal by implication, in order.** Each act's canon says what may be named (see
   `design/GameStory.md`, Story Canon and the red line). A line that lands in Act I must not know what
   Act III knows. Hint with a particular ("She always crossed her sevens"), not with a label.
9. **Keep the motifs exact.** The refrain, the cradle song's three notes, the bell "with no hand
   on the rope", the turned back, the mark "a tree under two moons": repeat the same words
   every time, so the player recognises them.
10. **Quotes and markup.** Character speech goes through `speech()` or `dialogue(name, …)`;
    narration goes bare; written text through `writing()`. Do not put
    quotation marks inside the markup that already supplies them; a passage quoted inside a
    book keeps its own. Strings are split on
    sentence or clause boundaries and joined with `+` (rule 8 of the formatting rules); never
    split inside a word, and never change existing wording unless the change is the point.
11. **The echo is silent; the effect is narrated.** When the player acts, the answer has two
    kinds of line. The echo repeats what the player just did ("You till the soil with the rusty
    hoe.") and goes through `event()`: a small grey line the voice never reads. The effect says
    what happened ("The ground is tough, and you unearth a small, tarnished coin! You quickly
    pocket it.") and goes bare, as story text the voice reads. Short results ("You quickly
    pocket it.") are effects. An answer is an echo followed by its effect, or the effect alone;
    a bare echo is never the whole answer. A plain refusal ("…it doesn't seem to have much
    effect here.") is a `[failure]` and stays silent. A failure that tells the player something
    about the world or carries a clue goes through `clue()`: it keeps the red box and is read
    aloud, and any echo before it goes on its own `event()` line above, never inside the clue.
    The `remembered()` line is a marker, not an echo or an effect, and stays a silent `event()`.

## Before and after

| Before | After |
| --- | --- |
| "the air tastes of lost hope and forgotten dreams." | "This was a garden once." |
| "whispered doubts slither into your mind like poison." | "They do not answer you. They only say it again, closer: your friends have left you. No one is coming." |
| "The mysterious box is locked. You need to find a way to open it." | "The padlock holds. It is iron, rusted shut, and it has a keyhole." |
| "I am an ancient and wise spirit of the forest." (the kind of line the game refuses) | "Elior. My deer sat with you in the glade at Willowbrook, before any of this. It said you were still. Few are." |
| "Complete every side quest in Act II before sharing these visions." | "Not yet. Whatever you have seen, I would hear it with our promises kept, not with work still undone." |

The left column is what the game once said, or the kind of line it refuses; the right column is
quoted from the game as it stands.

## When writing a new line

Read the room's or character's existing lines first and match them. Then ask: is it true in the
world, does it name only what this act may name, would a person say it, and does the player
learn one thing from it. If a sentence does none of those, cut it.
