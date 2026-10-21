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
    -   **Completion:** Use the Ward Stone Fragment and light magic to dispel the shadow guardians
    -   **Rewards:** Safe passage, Guardian's Essence
    -   **Story Impact:** Courage against Malakar's servants

-   **Name:** The Trapped Servants

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Discover fortress servants enslaved by dark magic
    -   **Prerequisites:** Guardian's Essence (completion of "Shattered Ward Guardians")
    -   **Completion:** Use Guardian's Essence and selfless magic (`bless`) to break the enchantment
    -   **Rewards:** Loyalty Token, Servant's Pendant, knowledge of the fortress layout
    -   **Story Impact:** Courage enables selflessness

-   **Name:** The Maze of Mirrors

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Enter the mirror labyrinth
    -   **Prerequisites:** Servant's Pendant and the Echo Stone from the Hall of Echoes
    -   **Completion:** Combine servant guidance and echo knowledge; solving it teaches `truth_sight`
    -   **Rewards:** The spell `truth_sight`
    -   **Story Impact:** Wisdom combines several sources of knowledge. `truth_sight` lets Elior
        see the Knight of Despair as he really is.

#### Lieutenant Confrontation Phase Quests

-   **Name:** The Knight of Despair

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Encounter the first lieutenant in the Hall of Echoes
    -   **Prerequisites:** Guardian's Chain and `truth_sight` (from the maze)
    -   **Completion:** Wear the Guardian's Chain, then say redemption to the knight (nothing is consumed)
    -   **Rewards:** Knight's Redemption, Enhanced Echo Stone, the spell `redemptions_light`,
        access to the Tower of Shadows
    -   **Who he is:** **Malakar's agent from Acts I and II.** With `truth_sight` Elior sees that
        the shredded grey cloak is the one worn by the cloaked stranger in Willowbrook, and the
        seal on the cloak's clasp is the seal on the Secret Documents that cleared Sir Cedric.
        Sir Cedric, standing beside Elior, recognises the voice. The knight searched Willowbrook for
        the amulet, framed Cedric, and has been in despair since because he no longer believes
        the king can be saved. In his redemption he confesses all three.
    -   **Story Impact:** Mercy triumphs over corruption; closes the loop on Acts I and II

-   **Name:** The Sorceress of Lies

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Face the second lieutenant in the Chamber of Whispers
    -   **Prerequisites:** "The Knight of Despair" completed; Knight's Redemption and Loyalty Token
    -   **Completion:** Use the Knight's Redemption and the Loyalty Token, cast `hearts_truth`, say
        understanding
    -   **Rewards:** Sorceress's Truth, the spell `hearts_truth`, the secret passage to the Memory
        Vault
    -   **Who she is:** **The mark on Elena's curse in Greendale (Act II)** was a spiral of three
        thorns. The same spiral is burned into the Sorceress's staff and into her palm. She cursed
        Elena on Malakar's orders to draw healers away from the king, and she is lonely because
        no one has ever spoken to her without a lie.
    -   **Story Impact:** Understanding pain leads to true victory

-   **Name:** The Shadow of the Past

    -   **Type:** Side Quest (Required)
    -   **Trigger:** Enter the Memory Vault
    -   **Prerequisites:** "The Sorceress of Lies" completed; Enhanced Echo Stone and Sorceress's Truth
    -   **Completion:** Restore the memory orbs with the Enhanced Echo Stone, show the Sorceress's
        Truth to the Shadow, talk to it and say understanding
    -   **Rewards:** The Shadow tells Elior the amulet will open the Parents' Vault, and the vault
        door opens to the amulet
    -   **Who it is:** **The dream voice from the Prologue.** Elior knows the voice at once. The
        Shadow is the uncorrupted remnant of Malakar, asking his friends' son for help. It feels
        familiar because Malakar held baby Elior.
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
        ward is the parents themselves and lives in Elior

## Character Development

### Elior's Ultimate Growth

Elior grows from a simple farmer to a hero who chooses mercy or justice knowing the whole truth:

-   Balance mercy with justice (lieutenants)
-   Trust allies while standing independently (servants)
-   Face painful truths about family (the vault)
-   Decide the fate of a kingdom and a friend (the final choice)

### Companion Arcs Conclusion

-   **Mira:** Confesses the last of what she knew in Act III; she goes through the gate with Elior and holds the way out just inside it with Sir Cedric while he goes deeper alone.
    She was the Wardens' pupil.
-   **Sir Cedric:** Recognises the Knight of Despair as the agent who framed him and chooses
    mercy or not; his honour is restored.
-   **Nyx:** Her refrain is the one Elior says to Malakar.

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
in. The rooms follow his fall.

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

-   Ward Stone Fragment (bypasses the defences)
-   Guardian's Chain (protection against the Knight of Despair)

#### Characters

-   Shadow Guardians, Bound Spirits

#### Exits

-   North: Outer Courtyard (after "Shattered Ward Guardians")
-   East: Hall of Echoes

### 2. Outer Courtyard

#### Description

A vast courtyard littered with the remnants of ancient battles, where fortress servants move in
an eerie trance, their eyes glowing.

#### Items

-   Servant's Pendant (from the freed servants)
-   Healing Stones (used for the optional choice below)

#### Characters

-   Enslaved Servants, Stone Sentinels, Captain of the Guard (corrupted but redeemable; optional
    choice)

#### Exits

-   South: Fortress Gates
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
battles. At its centre stands the Knight of Despair in a shredded grey cloak.

#### Items

-   Echo Stone (basic at first; enhanced after the knight's redemption)

#### Spells

-   Redemption's Light

#### Characters

-   Knight of Despair (Malakar's cloaked agent from Acts I and II), Ghostly Warriors (optional
    choice)

#### Exits

-   West: Fortress Gates
-   East: Tower of Shadows (after redeeming the knight)

### 5. Tower of Shadows

#### Description

A spiral tower where shadows move independently and whispered lies come from every direction.

#### Usable Items

-   Loyalty Token (proves your allies' trust and silences the whispers)

#### Characters

-   Shadow Whispers

#### Exits

-   West: Hall of Echoes
-   Up: Chamber of Whispers

### 6. Chamber of Whispers

#### Description

At the tower's peak the Sorceress of Lies holds court, reality bending around her. The spiral
of three thorns burned into her staff is the mark that was on Elena's curse.

#### Items

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

A quiet chamber behind a door carved with the same pattern as the amulet. Inside, the memories
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
Malakar stands beside it, grey and failing; the wound is killing him too.

#### Usable Items

-   Lifelight Elixir (single use; consumed by the final choice)
-   Ancient Amulet (the anchor; raised in every ending, and used on the wound in Justice and Sacrifice)

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

-   Grandmother, Mira, Sir Cedric, Nyx's light in the hedge (companions who remain close)

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
        [HE] -- [FG]
                 |
                [OC]
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

-   Layout is schematic; the Exits sections are authoritative (Hall of Echoes east of the Fortress
    Gates, Mirror Labyrinth north of the Courtyard, Tower east of the Hall, Chamber of Whispers up
    the Tower, Parents' Vault east of the Memory Vault, Throne Chamber north of the vault)
-   Some connections only open after completing specific quests

## Learnable Spells in Act IV

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

Elior enters the Throne Chamber knowing the truth. Malakar tempts him: join me and I will tell
you everything about your family. Elior refuses and speaks the refrain to him:
**"Power follows purpose; purpose follows truth."** At this moment Elior raises the amulet: it opens, the ward unseals, and
the dream voice speaks once more, through the amulet and the failing Malakar, asking his friend's son to finish
what he could not.

Then the one choice. The Lifelight Elixir can be used once:

-   **Offer it to heal Malakar's wound.** Redemption.
-   **Break Alden's crystal prison with it.** The wound still stands and Elior must close it:
    either **Justice** (seal it and Malakar with the amulet and the royal bindings) or
    **Sacrifice** (give up his magic to close it).

### Virtue moments and what opens each ending

Virtue moments (see Optional choices) are recorded as three counters shared across all four acts:
**mercy**, **truth** and **selfless**. They never block the golden path.

| Ending         | What it is                                                                           | What opens it                                                                                              |
| -------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Redemption** | Elior offers the elixir and casts forgiveness; the wound is healed. Alden is freed as the drain stops, and Malakar lives, powerless and himself again. | Always open: this is the golden path. Each mercy moment in the game adds a line from Malakar and the knight (no threshold). |
| **Justice**    | Alden is freed; Elior names Malakar's crimes and seals him with the amulet and royal bindings. | **2 truth moments** in the game. Act IV has one, so at least one from Acts I-III.                          |
| **Sacrifice**  | Alden is freed; Elior gives his magic to close the wound; Malakar lives, powerless, to answer to the king.                            | **2 selfless moments** in the game. Act IV has one, so at least one from Acts I-III.                       |

Alden is freed in every ending: by the elixir in Justice and Sacrifice, and by the wound closing
in Redemption. What the choice decides is Malakar's fate and the cost. If neither Justice nor
Sacrifice is open, `use lifelight elixir on prison` is refused ("the crystal does not answer
to one who has not yet spoken the truth, or given without asking") and Redemption is the one path
left, so no player is stranded. If the prison is broken and only one of the two is open, the
closed command (`name malakar's crimes` or `give up magic`) is refused with a line that says why.

In every ending the wound is closed, and the parents speak to Elior one last time, then rest in
peace. They are not alive and nothing here hints that they are.

-   **Redemption:** Malakar, healed, is the uncorrupted friend again; he thanks Elior and
    lives on, powerless, beside the closed wound. Elior learns `Forgiveness` and casts it with the elixir.
-   **Justice:** Malakar is sealed away, grieving. King Alden judges and restores order.
-   **Sacrifice:** Elior loses every spell but `grow`, a farmer's spell, which he keeps because it
    is the smallest. The kingdom is healed at his cost.

### The Epilogue

After any ending Elior walks home. In Willowbrook Field, the withered field from Act I, Elior
casts `grow` and it turns green. Grandmother is at the gate. The game ends there.

## Optional choices

Optional virtue moments; none blocks the golden path, none adds a puzzle. Each records one count
and changes a few lines of dialogue.

| Where                                   | The choice                                                              | Records     |
| --------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| Outer Courtyard, Captain of the Guard   | Give him Healing Stones though he can give nothing back                | **selfless** |
| Mirror Labyrinth, The True Self         | Tell the reflection the truth about Elior's fear (`say truth to true self`) | **truth**   |
| Hall of Echoes, Ghostly Warriors        | Cast `redemptions_light` on the ghostly warriors and let them rest      | **mercy**   |

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
where they would occur.

### Phase 1: Fortress Breach

1. **Fortress Gates:**

    - `examine ward stones` → the guardians' anchor points
    - `take ward stone fragment`
    - `use ward stone fragment with barriers`
    - `cast light on ward stones` → dispels the guardians
        - Quest completed: "Shattered Ward Guardians"
        - Item obtained: `Guardian's Essence`
    - `take guardian's chain`

2. **Outer Courtyard:**

    - `examine servants`
    - `use guardian's essence on servants`
    - `cast bless on servants`
        - Quest completed: "The Trapped Servants"
        - Items obtained: `Loyalty Token`, `Servant's Pendant`
    - Optional (**selfless**): `give healing stones to captain of the guard`
    - `talk to freed servants` → "The mirrors show truth, but only echoes from the halls can reveal
      the full path."

3. **Mirror Labyrinth (first visit):** `examine mirrors`, `use servant's pendant` (partial
   guidance only). Need the Hall of Echoes first.

4. **Hall of Echoes (first visit):**

    - `examine echoes` → the true pattern for the mirrors
    - `take echo stone`
    - `examine knight of despair` → "Return when you have the truth."

5. **Mirror Labyrinth (second visit):**

    - `use echo stone`, `solve maze puzzle`
        - Spell learned: `truth_sight`
        - Quest completed: "The Maze of Mirrors"
    - Optional (**truth**): `say truth to true self`

### Phase 2: The Lieutenants and the Truth

6. **Hall of Echoes (second visit):**

    - `cast truth sight on knight of despair` → the grey cloak and seal are the stranger's from
      Willowbrook and from the Secret Documents; Cedric recognises him
    - `use guardian's chain`, `talk to knight of despair`, `say redemption to knight`
        - Quest completed: "The Knight of Despair"
        - Items obtained: `Knight's Redemption`, `Enhanced Echo Stone`
        - Spell learned: `redemptions_light`
        - The knight confesses: Willowbrook, the amulet, the framing of Cedric
    - Optional (**mercy**): `cast redemptions light on ghostly warriors`

7. **Tower of Shadows:** `go up`, `use loyalty token` (silences the whispers).

8. **Chamber of Whispers:**

    - `examine staff` → the spiral of three thorns, the mark on Elena's curse
    - `talk to sorceress of lies`, `use knight's redemption`, `use loyalty token`
    - `cast hearts truth on sorceress`, `say understanding to sorceress`
        - Quest completed: "The Sorceress of Lies"
        - Item obtained: `Sorceress's Truth`
        - Spell learned: `hearts_truth`

9. **Memory Vault:**

    - `examine memory orbs`
    - `use enhanced echo stone with memory orbs`
    - `use sorceress's truth`
    - `talk to shadow of the past` → the dream voice. "Elior. You came."
    - `say understanding to shadow`
        - Quest completed: "The Shadow of the Past"
    - The Shadow: "Take the amulet east. It will open for you."

### Phase 3: The Parents' Vault

10. **The Parents' Vault:**

    - `examine door`
    - `use ancient amulet on door` → the door opens
    - `examine memories` → Aren, Lysa and Malakar making the relics; the catastrophe; the wound; the
      parents pouring themselves into the ward; baby Elior in Malakar's arms
        - Quest completed: "The Parent's Legacy"
    - The Throne Chamber door opens.

### Phase 4: The Final Stand (Redemption)

11. **Throne Chamber:**

    - `examine prison`, `examine wound`
    - `talk to malakar` → he offers the answers about Elior's family for loyalty
    - `refuse malakar's offer`
    - `say refrain to malakar` → "Power follows purpose; purpose follows truth."
    - `raise ancient amulet` → the amulet opens, the ward unseals, and the dream voice speaks
      through it and Malakar: "Finish what I could not."
    - `say forgiveness to malakar` → Spell learned: `forgiveness`
    - `use lifelight elixir on malakar` then `cast forgiveness on wound` → the elixir is consumed
        - Quest completed: "The Final Stand"
        - Ending: Redemption
    - The wound closes; the parents speak to Elior one last time and rest.

12. **Willowbrook Field (Epilogue):**

    - `cast grow` → the field turns green. Game ends.

### Ending variants (not on the golden path)

-   **Justice:** at step 11, instead of the elixir on Malakar: `use lifelight elixir on prison`
    (Alden is freed), `name malakar's crimes` (needs 2 truth moments), `use ancient amulet on wound`.
    Malakar is sealed; the parents speak and rest. Epilogue as step 12.
-   **Sacrifice:** at step 11: `use lifelight elixir on prison`, `give up magic` (needs 2 selfless
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

-   `Ward Stone Fragment`, `Guardian's Chain`, `Guardian's Essence`, `Servant's Pendant`,
    `Loyalty Token`, `Echo Stone` (Enhanced after the knight), `Knight's Redemption`,
    `Sorceress's Truth`, `Ancient Amulet` (carried from Act I), `Lifelight Elixir` (consumed)

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

**The Ancient Amulet:** carried from Act I. It opens the Parents' Vault (Step 10) and is held up in
the Throne Chamber (Step 11) as the anchor of the ward.

**Multi-visit dependencies:**

-   **Echo Stone:** basic navigation tool (Step 4) → enhanced memory tool (Step 6) → restores the
    vault orbs (Step 9)
-   **Guardian's Chain:** taken at the gates (Step 1), worn against the knight (Step 6)
-   **Servant's Pendant:** servant guidance for the maze (Steps 3, 5)

**Virtue demonstration items:**

-   **Knight's Redemption:** proves mercy's power to the Sorceress (Step 8)
-   **Sorceress's Truth:** proves to the Shadow that redemption is possible (Step 9)

**All items have a use.** Every item in this act has a use in quest progress, conversations or an
optional choice (the Healing Stones). The decorative items of the earlier design are cut.
