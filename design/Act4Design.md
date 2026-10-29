# Act IV: The Final Confrontation

## Narrative Overview

**Note:** At the end of Act III, Mira combined the three relics (Crystal of Light, Phoenix
Feather, and Dragon's Scale) into the Lifelight Elixir, a potion that channels the combined
virtues of courage, wisdom and selflessness. Elior enters Act IV carrying the elixir and the
**Ancient Amulet** Mira gave him in Act I.

Act IV is the climax of Elior's journey and pays off the whole game. Elior infiltrates Malakar's
fortress, redeems or overcomes his two lieutenants, meets the **Shadow of the Past** (the dream
voice he has heard since the Prologue), and opens **the Parents' Vault** with the amulet. He
walks into the throne room already knowing the truth: Malakar, Aren and Lysa were three friends
and fellow Wardens of the Dawn; Malakar tore a wound in time to save them, and the parents became
the ward that hides Elior and holds the wound shut.

In the throne room there is **one final choice**. King Alden hangs in a crystal prison, drained
by the wound, and Malakar is failing, bound to the same wound. The Lifelight Elixir can only be used once:
it either **breaks Alden's prison** or it is **offered to heal Malakar's wound**. Elior answers
Malakar's temptation with the refrain, "Power follows purpose; purpose follows truth.", and the
choice leads to one of three endings: **Redemption**, **Justice** or **Sacrifice**. All three end
at home in Willowbrook, where the withered field from Act I turns green again as Elior casts
`grow`.

The act explores forgiveness versus vengeance, truth versus comfort, and what heroism costs.

## Story Canon Used in This Act

This act follows the Story Canon in `GameStory.md`. In short:

-   The parents are **Aren** and **Lysa**; with **Malakar** they were the Wardens of the Dawn and
    made the three virtue relics together. Malakar was the Warden of Wisdom.
-   Malakar fell through grief first and power second: he reached for time magic to save his
    friends, tore a wound that feeds on life, and the power he found there corrupted him.
-   The parents are the ward. It is anchored in the Ancient Amulet and in King Alden's royal
    bindings, which is why Malakar drains the king. When the wound is healed the parents speak to
    Elior one last time and rest in peace. They are not alive.
-   The dream voice is the Shadow of the Past, the uncorrupted remnant of Malakar. It feels
    familiar because Malakar held baby Elior. It is a dream only in Acts I-III (once each); in Act IV
    it speaks openly in the Memory Vault and once more at the climax, as the bead asks. This
    stretches the canon's "heard once per act" and is flagged for the navigator.
-   The cloaked stranger in Willowbrook is Malakar's agent, who also framed Sir Cedric.

## Quest Management Structure

### Main Quest Chain Architecture

The main quest "The Final Stand" is built from completing all side quests, following the design
rule that all side quests must be completed before the main quest can be finished.

**Phase 1: Fortress Infiltration**

-   The outer fortress quests open the way to the lieutenants.

**Phase 2: Lieutenant Confrontations and the Truth**

-   The Knight of Despair, the Sorceress of Lies and the Shadow of the Past. Each is redeemed or
    understood, not slain.

**Phase 3: The Parent's Legacy**

-   The vault of the parents' memories, opened with the Ancient Amulet, before the throne room.

**Phase 4: The Final Stand**

-   One scene, one choice: the Lifelight Elixir breaks Alden's prison or heals Malakar's wound.

## Quests in Act IV

### Main Quest

-   **Name:** The Final Stand

    -   **Type:** Main Quest
    -   **Trigger:** Arrival at Malakar's fortress with the Lifelight Elixir
    -   **Prerequisites:** Completion of Act III
    -   **Dependencies:** ALL seven side quests in Act IV must be completed before the Throne
        Chamber opens
    -   **Quest Chain Phases:**
        1. **Fortress Breach:** Penetrate the outer defenses with courage and cunning
        2. **Inner Trials:** Face the Knight and the Sorceress and meet the Shadow of the Past
        3. **The Revelation:** See the parents' memories in the vault
        4. **Final Choice:** In the throne room, answer Malakar with the refrain, then decide what
           the Lifelight Elixir is for
    -   **Completion:** Elior chooses an ending (Redemption, Justice or Sacrifice) and the wound
        is closed; the quest is completed at the moment the ending is chosen
    -   **Rewards:** The kingdom's salvation, the parents' farewell, the `Forgiveness` spell
        (Redemption ending only), the return home
    -   **Story Impact:** Determines the ending

    **King Alden's Rescue is no longer a separate quest.** Freeing the king and deciding
    Malakar's fate are the same choice, made once, in the throne room.

### Side Quests

#### Fortress Infiltration Phase Quests

-   **Name:** Shattered Ward Guardians

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Attempt to enter the fortress's outer courtyard
    -   **Prerequisites:** None
    -   **Completion:** Cast light on the right ward stone, the one out of time, to break the barrier and dispel the shadow guardians
    -   **Rewards:** Safe passage, Guardian's Essence
    -   **Story Impact:** Courage against Malakar's servants

-   **Name:** The Trapped Servants

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Discover fortress servants enslaved by dark magic
    -   **Prerequisites:** Guardian's Essence (completion of "Shattered Ward Guardians")
    -   **Completion:** Use Guardian's Essence and selfless magic (`bless`) to break the enchantment
    -   **Rewards:** Servant's Pendant, knowledge of the fortress layout
    -   **Story Impact:** Courage enables selflessness

-   **Name:** The Maze of Mirrors

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Enter the mirror labyrinth
    -   **Prerequisites:** Servant's Pendant and the Echo Stone from the Hall of Echoes
    -   **Completion:** Walk the maze inside the one room: the Echoes give the route ("Left, then left, then the way your reflection does not go"), which the Echo Stone repeats inside the maze; `west`, `west`, then at the last fork the Servant's Pendant shows which corridor the reflection does not follow (east). A wrong turn, or a turn without the stone, returns Elior to the entrance with the reflections' laugh. Reaching the heart teaches `truth_sight`
    -   **Rewards:** The spell `truth_sight`
    -   **Story Impact:** Wisdom combines several sources of knowledge. `truth_sight` lets Elior
        see the Knight of Despair as he really is.

#### Lieutenant Confrontation Phase Quests

-   **Name:** The Knight of Despair

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Encounter the first lieutenant in the Hall of Echoes
    -   **Prerequisites:** `truth_sight` (from the maze) and a shield against his despair: the Guardian's Chain, still carried, or the Loyalty Token
    -   **Completion:** See through all three of the hall's sights with `truth_sight`: the knight, the banners (the sigil of the king's own gate company, under the grime) and the Echo Stone (the knight weeping "Sorry" under the hall's voices). Then raise the Guardian's Chain (or, if it was given to the captain, the Loyalty Token) and say redemption to the knight (nothing is consumed). With none of the sights seen the word means nothing to him; with only some, "there is more in this hall to see through". Any other word is refused in-world: "The visor does not move. Whatever that word was, it is not the one he is waiting for."
    -   **Rewards:** Knight's Redemption, Enhanced Echo Stone, the spell `redemptions_light`,
        access to the Tower of Shadows
    -   **Who he is:** **Malakar's agent from Acts I and II.** With `truth_sight` Elior sees that
        the shredded grey cloak is the one worn by the cloaked stranger in Willowbrook, and the
        seal on the cloak's clasp is the seal on the Secret Documents that cleared Sir Cedric.
        The knight searched Willowbrook for the amulet, framed Sir Cedric, and has been in despair
        since because he no longer believes the king can be saved. In his redemption he confesses all
        three to Sir Cedric, who has followed Elior into the hall and stands by the south door. Cedric forgives him and gives him his hand only in the optional mercy moment (Redemption's Light on the ghostly warriors); otherwise he answers "I heard you. That will have to be enough, for now."
    -   **Story Impact:** Mercy triumphs over corruption; closes the loop on Acts I and II

-   **Name:** The Sorceress of Lies

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Face the second lieutenant in the Chamber of Whispers
    -   **Prerequisites:** "The Knight of Despair" completed; Knight's Redemption
    -   **Completion:** Use the Knight's Redemption, then hear all three of the chamber's hearts with `hearts_truth`: the Sorceress herself (the girl sold for grain), her staff (the lonely silver mask) and the whispers (her own voice, repeating every lie so that she never has to hear the silence). Then say understanding, or simply `listen`: standing still and listening to all of it is understanding too, with the same gates
    -   **Rewards:** Sorceress's Truth, the secret passage to the Memory
        Vault
    -   **Who she is:** **The mark on Elena's curse in Greendale (Act II)** was the silver mask
        she set on Elena's wrist. The same smiling mask crowns the Sorceress's staff. She cursed
        Elena on Malakar's orders to draw healers away from the king, and as bait: she watched the
        inn door to see which healer would come for a mark like that, and the healer from Willowbrook
        never did ("I should have known then what that meant"). She is lonely because
        no one has ever spoken to her without a lie. Her own lie to Elior, that his parents sold
        him to save themselves, is her story, not his: `hearts_truth` hears the girl sold for a
        sack of grain in a hungry winter, and her confession says so once she is redeemed. Because
        no one has ever spoken to her without a lie.
    -   **Story Impact:** Understanding pain leads to true victory

-   **Name:** The Shadow of the Past

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Enter the Memory Vault
    -   **Prerequisites:** "The Sorceress of Lies" completed; Enhanced Echo Stone and Sorceress's Truth
    -   **Completion:** Restore the memory orbs with the Enhanced Echo Stone, show the Sorceress's
        Truth to the Shadow, talk to it and say patience, or simply `rest`: waiting in the vault is
        patience too, with the same gates
    -   **Rewards:** The Shadow tells Elior the amulet will open the Parents' Vault, and the vault
        door opens to the amulet
    -   **Who it is:** **The dream voice from the Prologue.** Elior knows the voice at once. The
        Shadow is the uncorrupted remnant of Malakar, asking his friends' son for help. It feels
        familiar because Malakar held baby Elior. Once the orbs are mended it says, whole, the
        sentence Elior has caught in pieces since the first dream: "Be patient where I was not.
        Close what I opened, and let them rest." The amulet repeats it at the climax.
    -   **Story Impact:** Reveals who has been calling Elior and prepares the vault

#### The Parents' Vault

-   **Name:** The Parent's Legacy

    -   **Type:** Side Quest (Required; comes before the throne room)
    -   **Trigger:** Find the sealed door east of the Memory Vault
    -   **Prerequisites:** "The Shadow of the Past" completed; the Ancient Amulet
    -   **Completion:** Use the Ancient Amulet on the vault door, then examine the parents' memories
    -   **Rewards:** The whole truth, so Elior walks into the throne room knowing; the Throne
        Chamber door opens
    -   **What the memories show:** Aren, Lysa and Malakar making the relics together; the
        catastrophe; Malakar tearing the wound to save them; the parents pouring themselves into
        the ward, anchored in the amulet and the royal bindings, so that Elior would be hidden and
        the wound held shut; baby Elior in Malakar's arms. The amulet opens the door because it is
        part of the ward.
    -   **Story Impact:** Elior learns that Malakar began out of love and was corrupted by the power, and that the
        ward is the parents themselves and lives in Elior. After Lysa's "Hold it shut, Aren" the
        memories say it in so many words: the ward is Aren and Lysa, and their gift is the magic he
        has, every spell but `grow`, which he read from a stone in a glade. The fever is named and dated: the Wasting, the year before Elior was born

## Character Development

### Elior's Ultimate Growth

Elior grows from a simple farmer to a hero who chooses mercy or justice knowing the whole truth:

-   Balance mercy with justice (lieutenants)
-   Trust allies while standing independently (servants)
-   Face painful truths about family (the vault)
-   Decide the fate of a kingdom and a friend (the final choice)

### Companion Arcs Conclusion

-   **Mira:** Confesses the last of what she knew in Act III; she goes through the gate with Elior and holds the way out just inside it while he goes deeper alone.
    She was the Wardens' pupil.
-   **Sir Cedric:** Follows Elior into the Hall of Echoes and waits by the south door. The Knight of Despair
    confesses the framing to his face, and his honour is restored; Cedric forgives him only if Elior also frees the ghostly warriors.
-   **Nyx:** Her refrain is the one Elior says to Malakar, and her light in the hedge says it once more, as the last spoken line before Grandmother's "Welcome home".

### Malakar's Complexity

Malakar is a fallen friend. His corruption began as grief: he could not wait for the world to
heal his friends and reached for time magic. The wound he tore feeds on life, and the power he
found there corrupted him into wanting more. Aren and Lysa became the ward to stop him. The
Phoenix's riddle in Act III names the virtue he failed: patience.

## Spell System Design

Act IV teaches only spells the story needs. The ultimate and combination spells of the earlier
design are cut.

-   **Truth Sight:** from the Mirror Labyrinth
-   **Redemption's Light:** from the Knight of Despair
-   **Heart's Truth:** from the Sorceress of Lies
-   **Forgiveness:** learned in the Redemption ending only
-   **Grow:** granted in the epilogue field if Elior does not have it; the final spell cast in
    the game

## World-Building & Lore Integration

### Malakar's Fortress

The fortress reflects Malakar's mind: orderly defences at the gates, then chaos and grief deeper
in. The rooms follow his fall. It was the Wardens' hall before it was his fortress: the three made
the relics at a workbench under the dome that is now the Throne Chamber, and the Warden sigil shows
through the black stone at the gate arch.

### The Corruption's Source

A temporal wound torn to save his friends, which consumes life energy. It is why Eldoria's land
withers and why Alden is drained. The wound is held shut by the ward that is Elior's parents.

### Kingdom's True History

The relics were made by three friends. The Lifelight Elixir is the three virtues made one:
courage, wisdom and selflessness, the same virtues Malakar's wisdom lacked when time was short.

## Rooms

### 1. Fortress Gates

#### Description

Massive iron gates wreathed in shadow rise before you, carved with writhing forms. Dark energy
pulses from ward stones in the gate frame, and spectral guardians materialise from the shadows.

#### Items

-   Left, middle and right ward stones (the right one keeps the barrier's time a breath late)
-   After the guardians fall: Ward Stone Fragment (optional, nothing needs it), Guardian's Chain
    (protection against the Knight of Despair) and Guardian's Essence

#### Characters

-   Shadow Guardians, Bound Spirits

#### Exits

-   North: Hall of Echoes (once the barrier is down)
-   East: Outer Courtyard (once the barrier is down)

### 2. Outer Courtyard

#### Description

A vast courtyard littered with the remnants of ancient battles, where fortress servants move in
an eerie trance, their eyes glowing.

#### Items

-   Servant's Pendant (from the freed servants)

#### Characters

-   Enslaved Servants, Stone Sentinels, Captain of the Guard (enthralled; he wakes when the servants are free)

#### Exits

-   West: Fortress Gates
-   North: Mirror Labyrinth (after freeing the servants)

### 3. Mirror Labyrinth

#### Description

Countless mirrors reflect distorted versions of you and false paths. The maze cannot be solved
without the echo knowledge of the Hall of Echoes.

#### Spells

-   Truth Sight (learned by solving the maze)

#### Characters

-   Mirror Wraiths, The True Self (optional choice)

#### Exits

-   South: Outer Courtyard

### 4. Hall of Echoes

#### Description

A grand hall of tattered banners where footsteps echo as if accompanied by the ghosts of past
battles. At its centre stands the Knight of Despair in a shredded grey cloak, his back to the
door Elior came in by.

#### Items

-   Banners (`truth_sight` shows the king's gate sigil under the grime)
-   Echo Stone (basic at first; enhanced after the knight's redemption). Held to the ear outside the maze, one voice under the rest says a single word the way a man says a word he has stopped believing in: redemption, the knight's own word. Once the stone is enhanced the voice no longer repeats it; the knight speaks clearly instead.

#### Spells

-   Redemption's Light

#### Characters

-   Knight of Despair (Malakar's cloaked agent from Acts I and II), Ghostly Warriors (optional
    choice)

#### Exits

-   South: Fortress Gates
-   East: Tower of Shadows (after redeeming the knight)

### 5. Tower of Shadows

#### Description

A spiral tower where shadows move independently and whispered lies come from every direction.

#### Usable Items

-   Loyalty Token (must be in the pack for a name to be heard; the whispers say Elior's friends left him, and the stair opens once he has named all three who stayed: `say mira to whispers`, `say cedric to whispers`, `say nyx to whispers`, each answered by that friend's voice through the token; when Nyx is named, her own pendant in the pack is warm too; "grandmother" gets a gentle line and is not wrong)

#### Characters

-   Whispers (answer to `say <name> to whispers`)

#### Exits

-   West: Hall of Echoes
-   Up: Chamber of Whispers

### 6. Chamber of Whispers

#### Description

At the tower's peak the Sorceress of Lies holds court, reality bending around her. The smiling
silver mask on her staff is the mark that was on Elena's curse.

#### Items

-   Her staff and the crystal whispers (`hearts_truth` hears the mask and the single voice)
-   Sorceress's Truth (given when she is understood)

#### Spells

-   Heart's Truth

#### Characters

-   Sorceress of Lies (Malakar's second lieutenant)

#### Exits

-   Down: Tower of Shadows
-   North: Memory Vault (opens after her quest)

### 7. Memory Vault

#### Description

Floating memory orbs show scenes of the past but are fragmented. A faint figure, the Shadow of the
Past, stands among them. When the orbs are restored it speaks with the voice Elior has heard in
his dreams.

#### Usable Items

-   Enhanced Echo Stone (restores the orbs)
-   Sorceress's Truth (shows the Shadow that redemption is possible)

#### Characters

-   Shadow of the Past (the dream voice; Malakar's uncorrupted essence)

#### Exits

-   South: Chamber of Whispers
-   East: The Parents' Vault (a sealed door that answers to the Ancient Amulet)

### 8. The Parents' Vault

#### Description

A quiet chamber behind a door carved with the same pattern as the amulet, and beneath the Warden sigil, worn almost away, a tree under two moons: the crest on Elior's mother's locket. Inside, the memories
of Aren and Lysa hang like lanterns. Nothing in it is threatening; it is the saddest and warmest
room in the fortress.

#### Usable Items

-   Ancient Amulet (opens the door and anchors the memories)

#### Characters

-   Memory Echoes of Aren and Lysa (memories only)

#### Exits

-   West: Memory Vault
-   North: Throne Chamber (opens when the memories have been seen)

### 9. Throne Chamber

#### Description

A vast chamber with a twisted throne of black stone. King Alden hangs in a crystal prison above
a ritual circle, his life draining into a bleeding rift in the air: Malakar's wound in time.
Malakar stands beside it, grey and failing; the wound is killing him too. He looks at the wound,
not at Elior, until the refrain turns him ("For the first time since you came in, he is looking
at you").

#### Usable Items

-   Lifelight Elixir (single use; consumed by the final choice)
-   Ancient Amulet (the anchor; used in every ending, and used on the wound in Justice and Sacrifice)

#### Spells

-   Forgiveness (learned in the Redemption ending)

#### Characters

-   Malakar, King Alden (imprisoned), the Shadow of the Past (speaks once at the climax), the
    parents' voices (only when the wound is closed)

#### Exits

-   South: The Parents' Vault
-   After the ending: the way home to Willowbrook Field

### 10. Willowbrook Field (Epilogue)

#### Description

The field behind Elior's home in Willowbrook, withered since Act I. Grandmother is at the gate.
The air is quiet.

#### Spells

-   Grow (granted here if Elior does not have it)

#### Characters

-   Grandmother, Mira, Sir Cedric, Nyx's light in the hedge (companions who remain close). Nyx cannot speak here, but she takes back her two gifts from Act II if Elior offers them (`give nyx's token to nyx`, `give forest heart crystal to nyx`): the pendant goes into the hedge with the light, the crystal is set among the roots and its lights pass into hers. Optional; nothing gates on it.

#### Exits

-   None. The game ends here.

## Room Map

```
                      [TC] -- (home) -- [WF]
                       |
        [MV] -------- [PV]
         |
        [CW]
         |
        [TS]
         |
        [HE]
         |
        [FG] -- [OC]
                 |
                [ML]
```

Legend:

-   FG = Fortress Gates
-   OC = Outer Courtyard
-   ML = Mirror Labyrinth
-   HE = Hall of Echoes
-   TS = Tower of Shadows (vertical; goes up to CW)
-   CW = Chamber of Whispers
-   MV = Memory Vault
-   PV = The Parents' Vault
-   TC = Throne Chamber
-   WF = Willowbrook Field (epilogue)

Notes:

-   Layout is schematic; the Exits sections are authoritative (Hall of Echoes north of the Fortress
    Gates, Courtyard east of them, Mirror Labyrinth north of the Courtyard, Tower east of the Hall, Chamber of Whispers up
    the Tower, Parents' Vault east of the Memory Vault, Throne Chamber north of the vault)
-   Some connections only open after completing specific quests

## Learnable Spells in Act IV

-   **Bless:** carried from Act I; frees the servants, and cast on King Alden in his crystal slows the grey light for a moment ("It is not enough. He does not wake"), kindly taken once he is freed
-   **Truth Sight:** Mirror Labyrinth; reveals illusions and who is hiding behind them
-   **Redemption's Light:** Knight of Despair; purifies corrupted souls
-   **Heart's Truth:** Sorceress of Lies; reveals true motivations
-   **Forgiveness:** Throne Chamber, Redemption ending only
-   **Grow:** Willowbrook Field; the closing spell

## What Was Cut

The Act IV design was written before the story canon, and the following no longer serve the
story. None of them are implemented yet.

-   **Items:** Throne Key and Ancient Iron Key (the Ancient Amulet replaces both as the key to the Parents' Vault), Time Crystal,
    Mirror Shard, Memory Fragment and the Combined Mirror-Memory Shard, Royal Sigil, Hero's
    Memorial, Crown of Eldoria, Parent's Journal, Restoration Seed, Peace Lily, Hero's Medal, and
    the decorative extras of the old room lists (Battle Standard, Fallen Banner, Knight's Crest,
    Shadow Essence, Whispering Scroll, Light Crystal, Truth Serum, Sorceress's Tears, Memory Orb, Compass of Truth).
-   **Spells:** Dispel Lies, Memory Restoration, Royal Blessing, Parent's Blessing, Triumphant
    Light, and the combination spells Sacrificial Shield and Wisdom's Flame.
-   **Quests:** King Alden's Rescue (merged into The Final Stand).
-   **Rooms:** Throne Chamber Approach (the king is now in the Throne Chamber) and Royal Gardens
    (all endings end at Willowbrook).
-   **Endings:** Crown and Home (the three endings below replace the five).

## The Final Choice and the Three Endings

Elior enters the Throne Chamber knowing the truth. Malakar's offer is true and terrible: the wound
is a wound in time, and if the ward breaks (the amulet pressed to Alden's crown, which holds the
other half) it opens fully and pulls the days back to before the fever. Aren and Lysa wake at the
workbench as they were. The price is the king, every year the kingdom has had since, and Elior
himself, who was born after the tear. He is not lying; he has done the sums. Elior speaks the
refrain to him, which is his refusal:
**"Power follows purpose; purpose follows truth."** At this moment Elior uses the amulet: it opens, the ward unseals, and
the dream voice speaks once more, through the amulet and the failing Malakar: "Be patient where I
was not. Close what I opened, and let them rest."

Then the one choice. The Lifelight Elixir can be used once:

-   **Offer it to heal Malakar's wound.** Redemption.
-   **Break Alden's crystal prison with it.** The wound still stands and Elior must close it:
    either **Justice** (seal it and Malakar with the amulet and the royal bindings) or
    **Sacrifice** (give up his magic to close it).

### Virtue moments and what opens each ending

Virtue moments (see Optional choices) are recorded as three counters shared across all four acts:
**mercy**, **truth** and **selfless**. They never block the golden path.

| Ending         | What it is                                                                           | What the virtue record adds                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Redemption** | Elior offers the elixir and casts forgiveness; the wound is healed. Alden is freed as the drain stops, and Malakar lives, powerless and himself again. | The golden path. Each mercy moment in the game adds a line from Malakar and the knight (no threshold). |
| **Justice**    | Alden is freed; Elior names Malakar's crimes and seals him with the amulet and royal bindings. | Always open. With **2 truth moments** in the game King Alden adds a line ("You named every crime and did not add one"). |
| **Sacrifice**  | Alden is freed; Elior gives his magic to close the wound; Malakar lives, powerless, to answer to the king.                            | Always open. With **2 selfless moments** in the game Aren adds a line to the farewell ("We watched you give, again and again"). |

No ending is ever closed by the virtue record; it only colours the text. Alden is freed in every
ending: by the elixir in Justice and Sacrifice, and by the wound closing in Redemption. What the
choice decides is Malakar's fate and the cost. Once the prison is broken, `say justice to malakar`
or `say sacrifice to malakar` chooses between the two. Commands given out of order are answered
in-world (the refrain before Malakar has spoken makes him laugh, then stop; the elixir or the
amulet before the refrain gets his "Not yet"), and nothing is lost by them.

In every ending the wound is closed, and the parents speak to Elior one last time, then rest in
peace. They are not alive and nothing here hints that they are.

-   **Redemption:** Malakar, healed, is the uncorrupted friend again; he thanks Elior and
    lives on, powerless, beside the closed wound. Elior learns `Forgiveness` and casts it with the elixir.
-   **Justice:** Malakar is sealed away, grieving. King Alden judges and restores order.
-   **Sacrifice:** Elior gives his parents' gift back to close the wound and loses every spell but
    `grow`, the one he did not inherit (read from a stone in the glade, never carried in the ward).
    The kingdom is healed at his cost. Lysa's farewell: "You gave our gift back to close what he
    opened, and kept the one thing that was yours."

### The Epilogue

After any ending Elior walks home. In Willowbrook Field, the withered field from Act I, one line
remembers Act I: if Elior watered the field then, "The field you watered once went grey again after
you left. Grandmother tried."; if not, "Nobody has touched it since you left."
Grandmother is at the gate humming the cradle song ("Your mother's. I didn't think you'd
remember"); told "You knew", she answers for it ("She made me promise, the night she went. I have
not slept a whole night since") and carries the parents' message; Sir Cedric at the fence hears the captain's and the
knight's apologies; Mira takes the Sorceress's to Elena; Nyx is a light in the hedge. Elior casts
`grow` and the field turns green; across the village the chapel bell rings once with no hand on
the rope, the third time (Grandmother: "The first was for her, the night she went. The second was
for you, the morning you left. I do not know who this one is for." Elior does); Nyx says the
refrain once more, and Grandmother says "Welcome home." The game ends there.

## Optional choices

Optional virtue moments; none blocks the golden path, none adds a puzzle. Each records one count
and changes a few lines of dialogue.

| Where                                   | The choice                                                              | Records     |
| --------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| Outer Courtyard, Captain of the Guard   | Give the freed captain the Guardian's Chain so he can walk home through the fortress (`give guardian's chain to captain`); Elior then faces the knight with the Loyalty Token instead | **selfless** |
| Mirror Labyrinth, The True Self         | Tell the reflection the truth about Elior's fear (`say truth to true self`) | **truth**   |
| Hall of Echoes, Ghostly Warriors        | Cast `redemptions_light` on the ghostly warriors and let them rest      | **mercy**   |

Other optional moments gate nothing. The sights and hearts repeat their line each time; the early amulet, the early elixir and the Bargain play once, then a dim line. The Bargain is the only one that changes anything later (Lysa's farewell line):

-   **Truth Sight** on the unmended memory orbs (the cradle by the fire, a Willowbrook cottage and
    its well) and on Malakar (for a breath, a young man mending a toy at a workbench).
-   **Heart's Truth** on the freed servants (they are afraid to go home and find no one waiting)
    and on Malakar before the refrain (the Shadow's voice speaks through his).
-   **In the Throne Chamber, before the refrain:** raising the Ancient Amulet burns Malakar's hand
    ("Not like this.") and holding out the Lifelight Elixir makes him reach for it and stop.
    Neither costs anything. The refrain said before he has spoken makes him laugh and say "Not yet", and he
    makes his offer then.
-   **The Bargain:** after his offer and before the refrain, `give ancient amulet to malakar`
    accepts it. The wound yawns, a vision of Aren and Lysa young at the workbench shows, the
    Shadow says "Not like this. Not by force.", the amulet will not break and Malakar is thrown
    against the throne. Malakar: "You saw. Then you know I was not lying." Lysa then adds a
    line to the farewell in every ending: "We saw you at the workbench with us, for a moment.
    You let it go. That was the bravest thing you did today."

Acts I-III each add their own two or three moments of the same three kinds (defined in their
designs). The endings read the counters across the whole game, as described above.

## Act Completion Requirements

### Main Quest Completion Architecture

#### Phase 1: Fortress Infiltration (All Required)

-   **Shattered Ward Guardians**
-   **The Trapped Servants**
-   **The Maze of Mirrors**

#### Phase 2: Lieutenants and the Truth (All Required)

-   **The Knight of Despair**
-   **The Sorceress of Lies**
-   **The Shadow of the Past**

#### Phase 3: The Vault (Required)

-   **The Parent's Legacy**

#### Final Confrontation

Only after all seven side quests does the Throne Chamber open. "The Final Stand" completes when
Elior chooses an ending.

### Key Story Revelations at Completion

-   Malakar is a fallen friend, not a pure villain: grief first, then the power of the wound
-   The ward lives in Elior; the amulet and King Alden's royal bindings anchor it. Malakar drains
    Alden and hunts the amulet to break the ward, believing that frees his friends
-   The parents are the ward, and rest after one last farewell
-   The dream voice was Malakar's remnant
-   The knight, the sorceress and the cloaked stranger were all Malakar's servants

## Technical Implementation Considerations

### Quest Management System Integration

-   **Prerequisite validation:** quests check their prerequisites before triggering.
-   **Phase management:** Infiltration, Lieutenants, Vault and Final Stand.
-   **Completion validation:** the Throne Chamber opens only when all seven side quests are done.

### Choice Consequence System

-   **Virtue counters:** three counters (mercy, truth, selfless) kept in story flags, incremented
    by virtue moments in all acts.
-   **Ending determination:** the ending is chosen by the final choice and gated by the counters
    above.
-   **Character state:** dialogue reflects the counters (a few lines only).

### Lifelight Elixir Usage

-   **Single use:** consumed by the final choice on Malakar's wound or on Alden's prison.

### Save State Management

-   All quest states, the virtue counters, the ending chosen and spell knowledge are saved. All
    content classes are registered in `ACT4_CLASSES`.

### Testing Requirements

-   **Unit tests** for each room, character, item, quest and spell.
-   **Integration test** `Act4.integration.test.ts` for the golden path and for each ending
    (Redemption, Justice, Sacrifice), with a save/load round-trip through `Game.toSaveData`.
-   **Choice tests** that Justice and Sacrifice are closed without their counters and that
    Redemption is never closed.

## Golden Path (Optimal Solution to Complete Act IV)

The golden path is the Redemption ending and needs no virtue moment. Optional moments are listed
where they would occur. The `examine` and `talk to` steps below that `ACT4_GOLDEN_PATH` leaves out change nothing; every other step is in it.

### Phase 1: Fortress Breach

1. **Fortress Gates:**

    - `examine ward stones` → names the right stone as the one out of time
    - `cast light on right stone` → the barrier falls and the guardians are dispelled
        - Quest completed: "Shattered Ward Guardians"
    - `take guardian's chain`
    - `take guardian's essence`

2. **Outer Courtyard:**

    - `examine servants`
    - `use guardian's essence on servants`
    - `cast bless on servants`
        - Quest completed: "The Trapped Servants"
    - `take servant's pendant` (the freed servants leave it behind)
    - Optional (**selfless**): `give guardian's chain to captain of the guard`
    - `talk to freed servants` → "The mirrors show truth, but only echoes from the halls can reveal
      the full path."

3. **Mirror Labyrinth (first visit):** `examine mirrors`, `use servant's pendant` (partial
   guidance only). Any turn without the Echo Stone returns Elior to the entrance; the Hall of
   Echoes comes first.

4. **Hall of Echoes (first visit):**

    - `examine echoes` → the true pattern for the mirrors
    - `take echo stone`
    - `examine knight of despair` → "Return when you have the truth."

5. **Mirror Labyrinth (second visit):**

    - `west`, `west` (the Echo Stone repeats the route), `use servant's pendant` at the fork
      (the reflection does not follow east), `east`
        - Spell learned: `truth_sight`
        - Quest completed: "The Maze of Mirrors"
    - Optional (**truth**): `say truth to true self`

### Phase 2: The Lieutenants and the Truth

6. **Hall of Echoes (second visit):**

    - `cast truth sight on knight of despair` → the grey cloak and seal are the stranger's from
      Willowbrook and from the Secret Documents
    - `cast truth sight on banners` → the sigil of the king's gate company: the knight served
      Alden before he served Malakar
    - `cast truth sight on echo stone` → under the hall's voices, the knight weeping "Sorry"
    - (all three sights are needed before the word works; each shows once, then a dim line)
    - `use guardian's chain` (or `use loyalty token`, if the chain went to the captain),
      `talk to knight of despair`, `say redemption to knight`
        - Quest completed: "The Knight of Despair"
        - Items obtained: `Knight's Redemption`, `Enhanced Echo Stone`
        - Spell learned: `redemptions_light`
        - The knight confesses: Willowbrook, the amulet, the framing of Cedric
    - Optional (**mercy**): `cast redemption's light on ghostly warriors`

7. **Tower of Shadows:** `say mira to whispers`, `say cedric to whispers`, `say nyx to whispers`
   (each friend answers through the Loyalty Token; the stair opens on the third name), `go up`.

8. **Chamber of Whispers:**

    - `examine staff` → the silver mask, the mark on Elena's curse
    - `talk to sorceress of lies`, `use knight's redemption` (this teaches `hearts_truth`)
    - `cast heart's truth on sorceress` → the lonely woman and the girl sold in a hungry winter
    - `cast heart's truth on staff` → the silver mask, made to be looked at and never looked at
    - `cast heart's truth on whispers` → the whispers are one voice, hers
    - (all three hearts are needed before understanding works; each shows once, then a dim line)
    - `say understanding to sorceress` (or `listen`)
        - Quest completed: "The Sorceress of Lies"
        - Item obtained: `Sorceress's Truth`

9. **Memory Vault:**

    - `examine memory orbs`
    - `use enhanced echo stone with memory orbs`
    - `use sorceress's truth`
    - `talk to shadow of the past` → the dream voice. "Elior. You came."
    - `say patience to shadow` (or `rest`)
        - Quest completed: "The Shadow of the Past"
    - The Shadow: "Take the amulet east. It will open for you."
    - `examine door`, `use ancient amulet on door` → the door opens east

### Phase 3: The Parents' Vault

10. **The Parents' Vault:**

    - (arrive from the Memory Vault, `east`)
    - `examine memories` → Aren, Lysa and Malakar making the relics; the catastrophe; the wound; the
      parents pouring themselves into the ward; baby Elior in Malakar's arms
        - Quest completed: "The Parent's Legacy"
    - The Throne Chamber door opens.

### Phase 4: The Final Stand (Redemption)

11. **Throne Chamber:**

    - `examine prison`, `examine wound`
    - `talk to malakar` → he offers the answers about Elior's family for loyalty
    - `say refrain to malakar` → "Power follows purpose; purpose follows truth." (this is the refusal)
    - `use ancient amulet` → the amulet opens, the ward unseals, and the dream voice speaks
      through it and Malakar: "Close what I opened, and let them rest."
    - (optional: the Bargain, see Optional choices)
    - `use lifelight elixir on malakar`, then `say forgiveness to malakar` → Spell learned: `forgiveness`
      (the pointer: before the elixir is used, the wound names the three roads, forgiveness first; after it,
      Malakar looks up "like a man waiting to be forgiven". If Sir Cedric forgave the knight, both compare it
      with that. "I forgive you" counts; a denial earlier in the same clause does not)
    - `cast forgiveness on wound` → the elixir is consumed
        - Quest completed: "The Final Stand"
        - Ending: Redemption
    - The wound closes; the parents speak to Elior one last time and rest.

12. **Willowbrook Field (Epilogue):**

    - `cast grow` → the field turns green. Game ends.

### Ending variants (not on the golden path)

-   **Justice:** at step 11, instead of the elixir on Malakar: `use lifelight elixir on prison`
    (Alden is freed), `say justice to malakar` (needs 2 truth moments), `use ancient amulet on wound`.
    Malakar is sealed; the parents speak and rest. Epilogue as step 12.
-   **Sacrifice:** at step 11: `use lifelight elixir on prison`, `say sacrifice to malakar` (needs 2 selfless
    moments), `use ancient amulet on wound`. Elior keeps only `grow`. Epilogue as step 12.

## Quest Completion Verification

-   ✅ **Shattered Ward Guardians** (Step 1), **The Trapped Servants** (Step 2), **The Maze of
    Mirrors** (Steps 3-5)
-   ✅ **The Knight of Despair** (Steps 4, 6), **The Sorceress of Lies** (Step 8), **The Shadow of
    the Past** (Step 9)
-   ✅ **The Parent's Legacy** (Step 10)
-   ✅ **The Final Stand** (Step 11), only after all seven side quests

Spells: `truth_sight` (5), `redemptions_light` (6), `hearts_truth` (8), `forgiveness` (11), `grow` (12).

**Items strictly necessary to complete Act IV:**

-   `Guardian's Essence`, `Servant's Pendant`, `Loyalty Token`,
    `Guardian's Chain` (or the Loyalty Token in its place, if the chain was given away),
    `Echo Stone` (Enhanced after the knight), `Knight's Redemption`,
    `Sorceress's Truth`, `Ancient Amulet` (carried from Act I), `Lifelight Elixir` (consumed)
-   Carried but not necessary: `Nyx's Token` and the `Forest Heart Crystal` from Act II. In the Tower the
    pendant is warm when Nyx's name is said; both can be given back to her light in Willowbrook Field.

## Room Visitation Pattern

1. **Fortress Gates** → **Outer Courtyard** → **Mirror Labyrinth** (incomplete)
2. **Outer Courtyard** → **Fortress Gates** → **Hall of Echoes** (echo knowledge)
3. **Hall of Echoes** → **Fortress Gates** → **Outer Courtyard** → **Mirror Labyrinth** (complete)
4. **Mirror Labyrinth** → **Hall of Echoes** (knight)
5. **Hall of Echoes** → **Tower of Shadows** → **Chamber of Whispers** → **Memory Vault**
6. **Memory Vault** → **Parents' Vault** → **Throne Chamber** → **Willowbrook Field**

## Golden Path Item Usage Summary

**The Lifelight Elixir:** a single-use item, consumed by the final choice. It represents the three
virtues made one: it breaks Alden's prison, or heals Malakar's wound.

**The Ancient Amulet:** carried from Act I. It opens the Parents' Vault (Step 10) and is used in
the Throne Chamber (Step 11) as the anchor of the ward.

**Multi-visit dependencies:**

-   **Echo Stone:** basic navigation tool (Step 4) → enhanced memory tool (Step 6) → restores the
    vault orbs (Step 9)
-   **Guardian's Chain:** taken at the gates (Step 1), raised against the knight (Step 6), or given
    to the captain (Step 2) with the Loyalty Token taking its place in the hall
-   **Loyalty Token:** names the friends in the Tower (Step 7); shields against the knight if the
    chain was given away (Step 6)
-   **Servant's Pendant:** servant guidance for the maze (Steps 3, 5)

**Virtue demonstration items:**

-   **Knight's Redemption:** proves mercy's power to the Sorceress (Step 8)
-   **Sorceress's Truth:** proves to the Shadow that redemption is possible (Step 9)

**All items have a use.** Every item in this act has a use in quest progress or conversations. The decorative items of the earlier design are cut.
