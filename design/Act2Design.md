# Act II: Greendale & The Forest Edge

## Narrative Overview

Act II continues Elior's journey as they arrive in Greendale, a bustling city that serves as a crossroads between civilization and the mystical Enchanted Forest. The act focuses on developing magical abilities, uncovering Elior's heritage, and helping Greendale and the forest communities before facing the growing threat.

This act is row II of the red line. Elior arrives believing Malakar is a legend from old books. By the end he knows Malakar is real and is searching for the Willowbrook bloodline, which means Elior. Act I ends with Mira giving Elior the **Ancient Amulet**. Acts share no classes, so Act II's setup places an Act II Ancient Amulet item in Elior's inventory at the start (as Act III does); it is added to the Act II items and does not change `ACT2_GOLDEN_PATH`. The act ends when Nyx's vision is shared with Sir Cedric and Elior has answered him (see below). The threat is shown, not fought: the only fighting is The Knight's Test, a sparring bout.

## Story Beats

These beats ride on the existing conversations, items and quests below; none adds a room, a puzzle or a command to the golden path.

- **The Warden sigil (Cedric's first conversation).** When Elior first talks to Sir Cedric with the Ancient Amulet in his inventory, Cedric stops mid-sentence. The sigil on the amulet is the **Warden sigil of the Wardens of the Dawn**, an order that guarded the kingdom and is half-forgotten. Cedric concludes that the amulet belonged to a Warden and that Elior's family is tied to them; he does not know more, and nobody names Aren, Lysa or any friendship with Malakar (Act III). This is why he takes Elior seriously; he pledges his loyalty once the Secret Documents clear his name. It is a fixed scene on the first talk, not a choice.
- **Alden is missing.** Greendale's castle is half-empty. King Alden vanished one night, the throne room is barred, and the Lord Commander rules in his name. Guards, Heralds and Historians speak of it in low voices; nobody knows where he went. The blight over the land and the king's absence are told as two troubles, not yet one.
- **Cedric's disgrace.** Cedric was on guard the night Alden vanished and was stripped of his knighthood for it. He does not defend himself until the Secret Documents arrive.
- **Cedric was framed.** The Secret Documents recovered from Thorne's caravan show that Malakar's agents bribed the night watch and framed Cedric. They carry the seal of the cloaked stranger seen in Willowbrook, and they name Malakar. The Lord Commander reads them in the Great Hall.
- **The Sorceress of Lies' mark.** Elena's curse carries a silver, mask-shaped sigil on her wrist, first seen when Elior casts `greater_heal` on her. It fades when `dispel` breaks the curse. Elior cannot name it; Act IV's Sorceress of Lies recognises it.
- **The Wardens in the archive.** Echoes of the Past and the Ancient Chronicle name the Wardens of the Dawn and their sigil, and record that agents of Malakar have asked after the Willowbrook bloodline. The Secret Documents then name Malakar himself, and Nyx's vision shows he is hunting Elior.
- **Nyx's vision.** Nyx speaks the refrain "Power follows purpose; purpose follows truth." in her first conversation. `prophetic_vision` then shows Elior a village, a withered field and a robed figure reaching toward him, and the dream voice from the Prologue is heard once more. It is the **Shadow of the Past**, not tied to either parent. Elior shares the vision with Cedric, who says: "Then Malakar is no tale, and it is you he is hunting."

## Quest Management Structure

### Main Quest Chain Architecture

The main quest "The Gathering Storm" can only be completed after every Act II side quest is complete. Greendale entry and forest access have separate progression gates:

**Phase 1: Arrival and Recognition (Greendale)**

- Complete the Greendale quests that resolve in town: "The Knight's Test", "Supplies for the Journey", "Echoes of the Past", "The Healer's Apprentice", and "The Ancient Library".
- The forest route also requires the Hermit's Warning. The Innkeeper's Daughter, The Merchant's Lost Caravan, and Cedric's Lost Honor are cross-phase quests that resolve after forest entry.

**Phase 2: Forest Preparation**

- Knowledge and items from Greendale quests unlock forest access

**Phase 3: Forest Mysteries**

- Forest-based quests build toward the final confrontation with Nyx

## Quests in Act II

### Main Quest

- **Name:** The Gathering Storm

  - **Type:** Main Quest
  - **Trigger:** Arrival in Greendale from Willowbrook
  - **Prerequisites:** Completion of Act I
  - **Dependencies:** All Act II side quests must be complete before the final Prophetic Vision can complete this quest.
  - **Quest Chain Phases:**
    1. **Initial Contact:** Find and speak with Sir Cedric; on the first talk he recognises the Warden sigil on the Ancient Amulet
    2. **Proving Worth:** Complete "The Knight's Test"
    3. **Preparation:** Complete all Greendale side quests (supplies, knowledge, alliances)
    4. **Forest Journey:** Complete all Forest side quests
    5. **Nyx's Gift:** Summon Nyx at the offering altar with the three sacred charms. On the first conversation, Nyx grants Prophetic Vision, Nyx's Token, and the Forest Heart Crystal.
    6. **Conclusion:** After every side quest is complete, cast Prophetic Vision while Sir Cedric is present to share the vision; he then waits, and the quest finishes when Elior answers him (`say truth to cedric`) or talks to him.
  - **Completion:** Cast Prophetic Vision in the same room as Sir Cedric after all side quests are complete, then say truth to him or talk to him.
  - **Completion Reward:** Shares the Prophetic Vision with Sir Cedric and completes The Gathering Storm. Nyx's first-conversation gifts are granted before this final cast.
  - **Story Impact:** Establishes Elior as a recognized hero with growing magical power; Malakar is shown to be real and to be hunting the Willowbrook bloodline

### Side Quests

#### Greendale Quests and Cross-Phase Starts

The five town-resolving quests below must be complete before the forest entrance opens. The Innkeeper's Daughter, The Merchant's Lost Caravan, and Cedric's Lost Honor are offered or advanced in Greendale but resolve after forest entry.

- **Name:** The Knight's Test

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** First meeting with Sir Cedric
  - **Prerequisites:** Access to Castle Courtyard
  - **Dependencies:** None
  - **Completion:** Pass a short sparring bout with Cedric in the courtyard. It is not combat and nothing can be lost. After the sergeant's recognition scene Cedric names three forms (strike, guard, turn) and attacks three times: "High cut!" is met by guard, "Lunge!" by turn, the open chest ("Well?") by strike. The player answers each with `say <form> to sir cedric`; a wrong answer repeats the attack and costs nothing. Alternatively any spell Elior knows, cast on Cedric during the bout, ends it at once and Cedric meets a mage with wary respect. Leaving the courtyard mid-bout abandons it, and Cedric starts over from the first attack.
  - **Rewards:** Cedric's respect and 100 gold coins; the Mountain Hermit, Cedric's old drill sergeant, provides Cedric's own Training Sword before the test
  - **Story Impact:** Establishes trust with a key ally; follows the Warden sigil scene, which is why Cedric will guide Elior

- **Name:** Supplies for the Journey

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** Cedric mentions needing proper equipment for the Enchanted Forest
  - **Prerequisites:** Completion of "The Knight's Test"
  - **Dependencies:** Must have coins and access to Market District
  - **Completion:** Gather essential items from Greendale merchants and townspeople (rope, lantern, forest herbs, etc.)
  - **Rewards:** Forest Survival Kit, Enhanced Lantern, Quality Rope
  - **Story Impact:** Enables safe forest exploration

- **Name:** The Merchant's Lost Caravan

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** Speak with Caravan Master Thorne in Market District
  - **Prerequisites:** Access to Market District
  - **Dependencies:** Learn `forest_speech` from the Ancient Tree Spirit and have Quality Rope from the Market District
  - **Completion:** Cast Forest Speech to locate the caravan, then use Quality Rope with the Ravine to rescue the merchants; return to Thorne for the Secret Documents
  - **Setup line:** Thorne mentions that his guard Brenn fled when the ravine path gave way; Brenn is met in person in the Merchant's Warehouse (`talk to brenn`), with one conversation in three steps: his side of the story, thanks and a hint after the rescue, and a promise once Elior has spoken for him.
  - **Rewards:** Secret Documents from Thorne, which can help restore Cedric's honor
  - **Story Impact:** Establishes reputation as a reliable hero

- **Name:** Echoes of the Past

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** Research Willowbrook history in the Great Hall and Hidden Library
  - **Prerequisites:** Access to Great Hall
  - **Dependencies:** None
  - **Completion:** Piece together historical clues about why Malakar was interested in Willowbrook: the archives name the Wardens of the Dawn and their sigil, and record that agents of Malakar have asked after the Willowbrook bloodline. The clues also tell of King Alden's disappearance and Cedric's disgrace.
  - **Rewards:** Knowledge of the Wardens of the Dawn, and of Elior's heritage
  - **Story Impact:** Reveals crucial background lore: Malakar is real, and he is looking for Elior's bloodline

- **Name:** The Healer's Apprentice

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** Give the Crystal Focus to Master Healer Lyria in Healer's House
  - **Prerequisites:** Access to Residential Quarter
  - **Dependencies:** Must have Crystal Focus from Hidden Library
  - **Completion:** Giving Lyria the Crystal Focus completes the quest and teaches Greater Heal
  - **Rewards:** `greater_heal` spell and Lyria's apprenticeship
  - **Story Impact:** Develops healing abilities essential for later quests

- **Name:** Cedric's Lost Honor

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** Learn that Cedric was once disgraced and stripped of his knighthood
  - **Prerequisites:** Complete "Echoes of the Past" before the quest activates
  - **Dependencies:** Recover the Secret Documents by rescuing Thorne's caravan
  - **Completion:** Help Cedric reclaim his honor by solving the mystery of his past disgrace and clearing his name with evidence. Cedric was on guard the night King Alden vanished; the Secret Documents show that Malakar's agents framed him.
  - **Rewards:** Nature's Charm (third of three sacred charms needed to summon Nyx)
  - **Story Impact:** Strengthens alliance with key character and shows Malakar's agents at work in Greendale

- **Name:** The Innkeeper's Daughter

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** A young girl in Greendale has been cursed by dark magic and needs help
  - **Prerequisites:** Access to The Silver Stag Inn
  - **Dependencies:** Learn `greater_heal` and `dispel`, and obtain Crystal-Clear Water from the Whispering Glade
  - **Completion:** Lyria, not Elena, explains the three steps. Break the curse using a combination of Elior's growing magical abilities and items found throughout Greendale. On the first `greater_heal` Elior sees the curse's silver, mask-shaped mark on Elena's wrist; it fades when `dispel` breaks the curse.
  - **Rewards:** Innkeeper's gratitude, curse-breaking experience, Druidic Charm
  - **Story Impact:** Demonstrates growing magical power, saves innocent life; the mark is the Sorceress of Lies' (recognised in Act IV)

- **Name:** The Ancient Library

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** Discover a hidden library beneath Greendale containing old magical texts
  - **Prerequisites:** Access to Residential Quarter basement
  - **Dependencies:** Learn `mend` to repair the Protective Enchantments
  - **Completion:** Repair the wards, earn the Spectral Librarian's trust, learn `dispel` by using the Ancient Chronicle (which names the Wardens of the Dawn and Malakar's search for the Willowbrook bloodline), and take the Crystal Focus
  - **Order Flexibility:** If the Crystal Focus is given to Lyria before learning `dispel`, acquiring it still counts; the quest completes once `dispel` is learned.
  - **Rewards:** `dispel`, Crystal Focus, and knowledge of Elior's heritage
  - **Story Impact:** Reveals the Wardens of the Dawn and Malakar's search for the Willowbrook bloodline

#### Forest and Cross-Phase Quests

- **Name:** The Hermit's Warning

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** Encounter a mysterious hermit on the outskirts of the Enchanted Forest
  - **Prerequisites:** Access to Forest Transition
  - **Dependencies:** Complete The Knight's Test, Supplies for the Journey, Echoes of the Past, The Healer's Apprentice, and The Ancient Library
  - **Completion:** Speak with the hermit and use the Forest Survival Kit at Forest Transition
  - **Rewards:** Protective Charm (one of three sacred charms needed to summon Nyx) and safety warnings
  - **Story Impact:** Provides essential forest survival knowledge

- **Name:** The Forest Guardian's Riddles

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** Speak to the Forest Sprites at Forest Entrance
  - **Prerequisites:** Forest access; this quest is not a prerequisite for entering
  - **Dependencies:** Cast `nature_sense` in the Whispering Glade to reveal the Water Nymphs, then answer all three riddles
  - **Completion:** Answer the Water Nymphs' three riddles
  - **Rewards:** Access to Crystal-Clear Water and Moonflowers in the Whispering Glade
  - **Story Impact:** Proves worthiness to forest spirits

- **Name:** Whispers in the Wind

  - **Type:** Side Quest (Required for Main Quest)
  - **Trigger:** Give the Enchanted Acorn to the Ancient Tree Spirit
  - **Prerequisites:** Access to Ancient Grove
  - **Dependencies:** Bring both Crystal-Clear Water and Moonflowers from the Whispering Glade back to the spirit
  - **Completion:** Give either item while carrying both; the spirit uses them to restore the grove and open the path to the Heart of the Forest
  - **Rewards:** Access to the Heart of the Forest
  - **Story Impact:** Establishes connection with forest realm

#### Optional Exploration

City orientation is handled through the City Map and movement behavior, not separate quests. The player finds the map at Greendale Gates after the Gate Captain leaves, then uses it in Main Square to navigate the city.

## Character Development

### Major Characters

#### Sir Cedric

- **Personality:** Noble but haunted by past disgrace, honorable warrior seeking redemption
- **Motivations:** Restore his honor, protect Greendale from coming threats, prove his worth
- **Character Arc:** Begins as a disgraced knight, through Elior's help reclaims honor and becomes a trusted ally
- **Dialogue Style:** Formal, military-influenced speech with hints of vulnerability about his past
- **Story Role:** Recognises the Warden sigil on the Ancient Amulet; was on guard the night King Alden vanished and was framed by Malakar's agents; ends the act hearing Nyx's vision.
- **State-Dependent Dialogue:** First recognises the Warden sigil on the amulet and recruits Elior; recognizes combat ability after The Knight's Test; after Cedric's honor is restored, grants Nature's Charm; after Nyx, comments on Elior's prophetic ability.
- **Quest Involvement:** Central to main quest progression, gives multiple side quests
- **Teaching Role:** Combat skills, leadership, strategic thinking

#### Master Healer Lyria

- **Personality:** Wise, nurturing, perceptive about magical potential in others
- **Motivations:** Heal the sick, pass on knowledge to worthy students, protect the innocent
- **Character Arc:** Recognizes Elior's potential, becomes a mentor figure, grows to see Elior as an equal
- **Dialogue Style:** Gentle but authoritative, uses medical metaphors, speaks with confidence about healing
- **State-Dependent Dialogue:** Offers the apprenticeship when Elior brings the Crystal Focus, teaches Greater Heal when it is given, and later acknowledges Elior's progress. Once Elena's curse is known she explains the cure (strengthen, wash with untouched water, unbind) once, then reminds Elior until Elena is cured.
- **Quest Involvement:** "The Healer's Apprentice", "The Innkeeper's Daughter"
- **Teaching Role:** Advanced healing magic, compassion, medical knowledge

#### Nyx (Forest Sprite)

- **Personality:** Ancient, wise, playful yet serious about forest protection
- **Motivations:** Guard forest secrets, test worthy souls, maintain balance between human and natural worlds
- **Character Arc:** Summoned at the offering altar after the three sacred charms are presented; on the first conversation, grants Prophetic Vision, Nyx's Token, and the Forest Heart Crystal.
- **Dialogue Style:** Speaks in riddles and nature metaphors, voice carries weight of ages
- **Story Role:** Speaks the refrain "Power follows purpose; purpose follows truth." in her first conversation; her vision shows the Shadow of the Past.
- **State-Dependent Dialogue:** The first conversation speaks the refrain and grants Nyx's gifts; later conversations provide encouragement.
- **Quest Involvement:** Final phase of main quest, ultimate teacher
- **Teaching Role:** Prophetic magic, understanding of destiny, connection to natural world

#### Innkeeper Marcus & Barmaid Elena

- **Personalities:** Marcus is friendly and business-minded but worried father; Elena is kind but suffering under curse
- **Motivations:** Marcus wants his daughter healed; Elena wants to be free of curse and help others
- **Character Arc:** Family saved by Elior's intervention, become grateful allies
- **Dialogue Style:** Marcus speaks like a concerned father and businessman; Elena's speech shows effects of curse initially
- **Story Role:** Elena's curse carries the Sorceress of Lies' mask-shaped mark.
- **State-Dependent Dialogue:** Elena's dialogue changes as the three-step cure progresses; Marcus grants the Druidic Charm after she is cured.
- **Quest Involvement:** "The Innkeeper's Daughter"
- **Story Impact:** Demonstrates the personal stakes in Elior's growing power

### Minor Characters

#### The Families (Residential Quarter)

- **Role:** Residential Quarter townsfolk who take the Walking Stick; one of them mentions a sick child, which is the setup for the optional selfless moment (the Mountain Flower).

#### Gate Captain & Castle Guards

- **Role:** City protection, information sources
- **Personality Traits:** Professional, loyal to Greendale
- **Dialogue Interactions:** Provide city information, security protocols

#### Master Merchant Aldric & Caravan Master Thorne

- **Role:** Commerce, supply sources; Thorne speaks of Brenn, his guard who fled and sits in the Merchant's Warehouse
- **Personality Traits:** Business-focused, practical
- **Dialogue Interactions:** Trading negotiations, caravan rescue quest

#### Spectral Librarian

- **Role:** Guardian of ancient knowledge
- **Personality Traits:** Ethereal, knowledge-focused, protective of texts
- **Dialogue Interactions:** Tests Elior's worthiness for ancient knowledge

### State-Dependent Dialogue

Act II dialogue is driven by story flags, quest progress, inventory, and character state rather than a separate relationship-level or dialogue-choice system.

- **Sir Cedric:** His responses change after first contact, the combat test, his honor quest, and Nyx's gift.
- **Lyria:** Her offer and follow-up dialogue change after receiving the Crystal Focus and completing the apprenticeship. Once Elena's curse is known she gives the three-step diagnosis (heal, wash with untouched water, unbind) once, then a one-line reminder until Elena is cured.
- **Elena:** Her appearance and dialogue change during the healing, purification, and dispelling steps. She never names the next step: after the heal she says it did not take and that Lyria might know what comes next.
- **Forest Spirits:** The sprites offer the riddles quest; the Ancient Tree Spirit teaches Forest Speech for the Enchanted Acorn; Nature Sense reveals the Water Nymphs.
- **Nyx:** Her first conversation grants her gifts; later conversations use a follow-up response.

## Spell System Design

### Learning Prerequisites and Dependencies

#### Spell Learning Architecture

Spells in Act II follow a logical progression where each spell has specific conditions that must be met before it can be learned. This creates a natural character progression that feels earned rather than arbitrary.

#### Learnable Spells with Prerequisites

- **`mend`**:

  - **Learned From:** Local craftsmen in the Residential Quarter
  - **Prerequisites:** Help the Families in the Residential Quarter with the Walking Stick, then speak with the craftsmen
  - **Conditions:** The craftsmen teach the spell on the first eligible conversation
  - **Used For:** Repair the Hidden Library's Protective Enchantments
  - **Story Integration:** Demonstrates growing practical magic skills

- **`dispel`**:

  - **Learned From:** Study the Ancient Chronicle in the Hidden Library
  - **Prerequisites:** Cast `mend` on the Protective Enchantments, then speak to the Spectral Librarian and use the Ancient Chronicle
  - **Conditions:** The Spectral Librarian must have become friendly after the wards are repaired
  - **Used For:** Break magical barriers and curses, counter enemy magic
  - **Story Integration:** Advanced magical knowledge needed for complex problems

- **`greater_heal`**:

  - **Learned From:** Master Healer Lyria in Healer's House
  - **Prerequisites:** Give Lyria the Crystal Focus from the Hidden Library
  - **Conditions:** Giving her the focus completes "The Healer's Apprentice" and teaches the spell
  - **Used For:** Cure Elena's curse
  - **Story Integration:** Represents growth in both magical skill and empathy for others

- **`nature_sense`**:

  - **Learned From:** Boundary standing stones at Forest Transition
  - **Prerequisites:** Reach Forest Transition; the Mountain Path route opens after Supplies for the Journey
  - **Conditions:** Examine the standing stones to learn it. This can happen before the other town quests and The Hermit's Warning are complete; those quests gate the route from Forest Transition into Forest Entrance.
  - **Used For:** Sense nature in forest areas and reveal the Water Nymphs when cast in Whispering Glade
  - **Story Integration:** Bridge between human and natural magic

- **`forest_speech`**:

  - **Learned From:** Ancient Tree Spirit in Ancient Grove
  - **Prerequisites:** Give the Enchanted Acorn to the Ancient Tree Spirit
  - **Conditions:** The offering teaches the spell and offers "Whispers in the Wind"
  - **Used For:** Communicate with woodland creatures, find lost caravan
  - **Story Integration:** Establishes connection with forest realm

- **`prophetic_vision`**:
  - **Learned From:** Nyx in Heart of the Forest
  - **Prerequisites:** Summon Nyx at the Offering Altar with Druidic Charm, Protective Charm, and Nature's Charm
  - **Conditions:** Nyx teaches it on the first conversation. The first cast completes "The Gathering Storm" only when all side quests are complete and Sir Cedric is present.
  - **Used For:** Share a vision of the coming threat with Sir Cedric
  - **Story Integration:** Completes the Act II main quest and prepares for Act III

### Spell Learning Conditions and Natural Flow

The spell system is designed so that players naturally encounter learning opportunities through story progression:

1. **Practical Magic First:** `mend` is learned from craftsmen after helping the Families
2. **Compassion-Based Magic:** `greater_heal` requires helping others, reinforcing heroic character development
3. **Scholar Magic:** `dispel` comes from study and research, rewarding thorough exploration
4. **Nature Connection:** Examine the standing stones to learn `nature_sense`; offer the Enchanted Acorn to the Ancient Tree Spirit to learn `forest_speech`
5. **Ultimate Vision:** Nyx teaches `prophetic_vision` when summoned with the three sacred charms; its first cast with Sir Cedric completes the main quest only after all side quests are complete

### Integration with Character Interactions

Spell learning follows quest and item state rather than a separate relationship system:

- The craftsmen teach after Elior helps the Families.
- Lyria teaches after receiving the Crystal Focus.
- The librarian permits study after Elior repairs the wards.
- The tree spirit teaches after receiving the Enchanted Acorn.
- Nyx grants Prophetic Vision after being summoned with the three charms.

## World-Building & Lore Integration

### Location Interconnectedness

#### Greendale as a Crossroads

Greendale serves as the bridge between the civilized human world and the mystical forest realm. The city's layout reflects this role:

- **Gates and Walls:** Protective barriers that also symbolize the threshold between known and unknown
- **Castle District:** Represents human authority and order
- **Market District:** Shows economic exchange and cultural mixing
- **Residential Quarter:** Demonstrates community life and hidden knowledge (Ancient Library)
- **Forest Transition:** Gradual shift from human to natural magic

#### The Enchanted Forest Structure

The forest represents increasingly mystical realms:

- **Forest Transition:** Boundary between worlds, marked by ancient standing stones
- **Forest Entrance:** First taste of natural magic, still accessible to humans
- **Ancient Grove:** Sacred gateway requiring respect and proper approach
- **Whispering Glade:** Testing ground for wisdom and environmental harmony
- **Heart of the Forest:** Nyx's domain, where deepest mysteries are revealed

### Historical Context and Lore

#### Greendale's Foundation

- Built as a trading post between mountain communities and forest dwellers
- Ancient pacts with forest spirits allow coexistence
- Castle established to protect trade routes and maintain peace
- Hidden Library contains records of these ancient agreements

#### The Forest's Ancient History

- Predates human settlements by millennia
- Home to spirits and magical beings who remember the world's creation
- Nyx serves as keeper of primordial knowledge and prophecies

#### Connection to Wider World Events

- Malakar is real, and his agents (the cloaked stranger seen in Willowbrook) are searching for the Willowbrook bloodline
- King Alden has vanished; Malakar's agents framed Sir Cedric, who was on guard that night
- The Wardens of the Dawn, whose sigil is on the Ancient Amulet, guarded the kingdom long ago
- The Hidden Library's chronicle, written by the Wardens, warns of Malakar's search for the Willowbrook bloodline
- Forest spirits sense disturbances in magical balance
- Elior's heritage links to ancient magical traditions

### Items and Artifacts with Lore Significance

#### Implemented Artifacts

- **Ancient Amulet:** Placed in Elior's inventory by Act II's setup (Act I gave it to him). Its sigil is the Warden sigil Cedric recognises on the first talk.
- **Ancient Chronicle:** Records regional history, the Wardens of the Dawn and their sigil, and Malakar's search for the Willowbrook bloodline; studying it after the librarian permits access teaches `dispel`.
- **Crystal Focus:** The Spectral Librarian leaves it in the Hidden Library after Elior repairs the wards; Lyria needs it to teach `greater_heal`.
- **Forest Heart Crystal and Nyx's Token:** Gifts from Nyx when first spoken to after the altar ritual.
- **Three Sacred Charms:** The Protective Charm, Druidic Charm, and Nature's Charm are consumed by the Offering Altar to summon Nyx.
- **Secret Documents:** Thorne gives them after the caravan rescue; they show that Malakar's agents (with the cloaked stranger's seal) framed Cedric, and so provide evidence to restore Cedric's honor.

### Exploration Opportunities and Hidden Content

#### Implemented Exploration

- **Hidden Library:** Discovered by searching the Residential Quarter after the quest is offered; its wards, Spectral Librarian, Ancient Chronicle, and Crystal Focus are part of the required path.
- **Forest encounters:** The Standing Stones, Forest Sprites, Ancient Tree Spirit, and Water Nymphs are encountered through the required forest sequence.

## Rooms

This is the implemented Act II room roster and topology. Items and characters marked dynamic appear only after the stated interaction; exits are listed when available, with their gates noted.

| Room | Items and dynamic content | Characters | Exits and gates |
|---|---|---|---|
| Mountain Path | Mountain Flower, Walking Stick, Camp Site; examining the camp reveals the Entry Pass (two fire pits and doubled boot prints hint that it was the grey-cloaked stranger's; his name is scraped off the pass, the seal is whole). The Mountain Hermit, a retired castle sergeant who drilled Sir Cedric, gives Elior Cedric's old Training Sword with a message for him. | Mountain Hermit | North to Greendale Gates; east to Forest Transition after Supplies for the Journey. |
| Greendale Gates | City Map appears after the Gate Captain accepts the Entry Pass and leaves; searching then reveals it. | Gate Captain (notes the scraped name, accepts the seal, then leaves) | South to Mountain Path; north to Main Square after the pass is accepted. |
| Main Square | City Notice Board, Merchant's Flyer | Town Crier | South to Greendale Gates, north to Castle Approach, east to Market District; city navigation is enabled after using the City Map. |
| Market District | Aldric sells Forest Survival Kit, Enhanced Lantern, and Quality Rope. | Master Merchant Aldric, Caravan Master Thorne | West to Main Square, north to The Silver Stag Inn, south to Merchant's Warehouse. |
| The Silver Stag Inn | Room Key and Door; the Room Key is purchased from Marcus. | Innkeeper Marcus, Barmaid Elena | South to Market District; east to Inn Rooms after using the key with the door. |
| Inn Rooms | Twenty Coins; searching reveals the Traveler's Journal, the notebook of the grey-cloaked stranger who last lodged here (Marcus mentions him when Elior rents the room). | None | West to The Silver Stag Inn. |
| Merchant's Warehouse | None | Brenn | North to Market District. |
| Castle Approach | None | Herald, Castle Guard Captain | South to Main Square; west to Castle Courtyard after showing the Entry Pass to the Herald (who does not notice the scraped name). |
| Castle Courtyard | Squire's Diary appears after talking to the Training Master and Squires, then searching. | Sir Cedric, Training Master, Squires | East to Castle Approach, north to Residential Quarter, west to Great Hall. |
| Great Hall | None; archive search is gated by formal presentation to the Court Herald and by showing the Historians the stranger's notebook. | Court Herald, Historians, Lord Commander | East to Castle Courtyard. |
| Residential Quarter | Searching reveals the secret passage after The Ancient Library is offered. | Local Craftsmen, Families | South to Castle Courtyard, north to Healer's House, secret passage to Hidden Library after discovery. |
| Healer's House | None | Master Healer Lyria | South to Residential Quarter. |
| Hidden Library | Ancient Chronicle, Protective Enchantments; Crystal Focus appears after the wards are mended. | Spectral Librarian | Secret passage to Residential Quarter. |
| Forest Transition | Standing Stones; examining them teaches Nature Sense. The Forest Hermit gives the Protective Charm. | Forest Hermit | West to Mountain Path; Mountain Path's east route opens after Supplies for the Journey. East to Forest Entrance only after the five Greendale gate quests and The Hermit's Warning are complete. |
| Forest Entrance | Enchanted Acorn | Forest Sprites | West to Forest Transition; south to Ancient Grove and east to Whispering Glade after using both the Protective Charm and Enhanced Lantern here. |
| Ancient Grove | Silver-Barked Tree; examining it awakens the Ancient Tree Spirit. | Ancient Tree Spirit (appears after examining the tree) | North to Forest Entrance; south to Heart of the Forest after Whispers in the Wind is complete. |
| Whispering Glade | Crystal-Clear Water and Moonflowers appear after all three Water Nymph riddles are answered. | Water Nymphs (appear when Nature Sense is cast here) | West to Forest Entrance. |
| Heart of the Forest | Offering Altar; using the three sacred charms summons Nyx. | Nyx (appears after the altar ritual) | North to Ancient Grove. |

## Room Map

```
                     Hidden Library
                          |
                   (secret passage)
                          |
                   Healer's House
                          |
                   Residential Quarter                                      Merchant's Warehouse
                          |                                                           |
    Great Hall ---- Castle Courtyard ---- Castle Approach ---- Main Square ---- Market District
                                                                      |               |
                                                               Greendale Gates  Silver Stag Inn
                                                                      |               |
                                                                Mountain Path     Inn Rooms
                                                                      |
                                                            Forest Transition
                                                                      |
                                                              Forest Entrance ---- Whispering Glade
                                                                      |
                                                                Ancient Grove
                                                                      |
                                                              Heart of the Forest
```

## Learnable Spells in Act II

- **`mend`**: Learned from local craftsmen in the Residential Quarter (used to repair Hidden Library enchantments)
- **`greater_heal`**: Learned from Master Healer Lyria in the Healer's House (used to cure Elena's curse)
- **`dispel`**: Learned from ancient texts in the Hidden Library (used to break magical barriers and curses)
- **`nature_sense`**: Learned by examining the Standing Stones at Forest Transition (reveals Water Nymphs when cast in Whispering Glade)
- **`forest_speech`**: Learned from the Ancient Tree Spirit in Ancient Grove (used to find lost caravan)
- **`prophetic_vision`**: Learned by speaking to Nyx after summoning her (cast with Cedric present after all side quests, it shares the vision; The Gathering Storm completes when Elior then answers Cedric)

## Optional choices

Optional virtue moments; none blocks the golden path, none adds a puzzle or combat. Each records one count in the same three counters as Acts III and IV (mercy, truth, selfless) and changes a few lines of dialogue.

| Where                                   | The choice                                                                                                   | Records      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------ |
| Residential Quarter, the Families       | Give the Mountain Flower to the sick child the Families mention, gaining nothing (`give mountain flower to families`)   | **selfless** |
| The Silver Stag Inn, Innkeeper Marcus   | After Elena is cured, tell Marcus the curse was set on her on purpose (the mask-shaped mark), instead of letting him believe it was bad luck (`say truth to marcus`) | **truth**    |
| Market District, Caravan Master Thorne  | After the rescue, speak for Brenn, the caravan guard who fled when the ravine path gave way, so Thorne does not turn him out (`say forgive to thorne`) | **mercy**    |

Telling Cedric the voice did not sound like a hunter (`say truth to cedric`, after the vision) is deliberately **not** a virtue moment: it records nothing, so Act II keeps exactly these three and Act IV's totals are unchanged.

The endings read the counters across the whole game, as described in `Act4Design.md`.

## Act Completion Requirements

### Main Quest Completion Architecture

Following the design rule that all side quests must be completed before the main quest can be finished, Act II completion requires:

#### Phase 1: Greendale Mastery (All Required)

1. **The Knight's Test** - Establish trust with Sir Cedric
2. **Supplies for the Journey** - Gather essential equipment
3. **Echoes of the Past** - Uncover family heritage and historical context
4. **The Healer's Apprentice** - Master advanced healing magic
5. **The Ancient Library** - Gain access to ancient magical knowledge

These five completed quests, plus completion of The Hermit's Warning at Forest Transition, are required to open the route into Forest Entrance. The remaining town-started quests are cross-phase and complete later.

#### Phase 2: Forest Integration (All Required)

1. **The Hermit's Warning** - Receive essential forest survival knowledge
2. **The Forest Guardian's Riddles** - Prove wisdom to forest spirits
3. **Whispers in the Wind** - Establish alliance with forest creatures
4. **The Innkeeper's Daughter** - Break Elena's curse with healing, water, and Dispel
5. **The Merchant's Lost Caravan** - Rescue Thorne's caravan and recover the Secret Documents
6. **Cedric's Lost Honor** - Present the recovered evidence to the Lord Commander

#### Phase 3: Spiritual Ascension (Final Test)

1. **Summon Nyx** - Use the three charms at the Offering Altar in Heart of the Forest
2. **Receive Nyx's gifts** - On the first conversation, Nyx grants Prophetic Vision, Nyx's Token, and the Forest Heart Crystal
3. **Complete the main quest** - After all side quests are complete, cast Prophetic Vision while Sir Cedric is in the same room, then answer him (`say truth to cedric`) or talk to him

### Key Story Revelations at Completion

#### Character Development Achievements

- **Elior:** Transformed from village hero to recognized magical practitioner with prophetic abilities
- **Sir Cedric:** Honor restored, becomes trusted ally for future challenges
- **Allies:** Earned support from Lyria, the forest spirits, and Sir Cedric through completed quests

#### Lore and World Understanding

- **Malakar is real:** The red-line row II. Elior no longer thinks of Malakar as a legend from old books; Malakar's agents are searching for the Willowbrook bloodline, which means Elior.
- **The Wardens of the Dawn:** The Warden sigil on the Ancient Amulet ties Elior's family to the old order.
- **King Alden's absence and Cedric's framing:** Alden has vanished, and Malakar's agents framed the knight who was on guard.
- **The Sorceress of Lies' mark:** Seen on Elena's curse; Act IV recognises it.
- **The Shadow of the Past:** The dream voice is heard once more in Nyx's vision.
- **Family Heritage:** Understanding of why Malakar was interested in Willowbrook bloodlines
- **Warden Knowledge:** Comprehension of the Wardens of the Dawn and Malakar's search for the Willowbrook bloodline
- **Magical Mastery:** Command of healing, environmental, and divination magic
- **Political Connections:** Recognition within Greendale's power structure

#### Preparation for Future Challenges

- **Magical Arsenal:** Complete spell collection for diverse challenges
- **Alliance Network:** Supporters across multiple communities and realms
- **Prophetic Insight:** Ability to anticipate and prepare for coming threats
- **Leadership Recognition:** Established reputation as someone capable of great deeds

### Optional Content for Extended Exploration

The following are future-content ideas only; they are not implemented in Act II.

#### Additional Character Interactions

- **Deep Lore Conversations:** Extended dialogue trees with major characters after quest completion
- **Historical Research:** Further investigation into ancient texts and artifacts
- **Environmental Stewardship:** Additional forest spirit encounters and nature-based challenges

#### Extended Spell Practice

- **Spell Combination Techniques:** Learning to combine different magic types
- **Advanced Healing Methods:** More complex medical applications of magical abilities
- **Prophetic Vision Refinement:** Practice with divination magic to improve accuracy

#### Cultural Integration

- **Greendale Citizenship:** Deeper involvement in city life and politics
- **Forest Spirit Ceremonies:** Participation in ancient rituals and seasonal celebrations
- **Merchant Networks:** Expanded trading relationships and economic opportunities

The completion of Act II marks Elior's transformation from a promising young hero to a true magical practitioner with the knowledge, abilities, and alliances needed to face the greater challenges that lie ahead. The act ensures that players have fully engaged with the world, its characters, and its magical systems before proceeding to more complex challenges.

## Technical Implementation

Act II is browser-based TypeScript content under `web/src/act2/`, using the shared engine in `web/src/engine/`. Its Vue UI accesses the engine through `GameController` and `useBridge`; Act classes are loaded as separate chunks.

- **Quests:** `Act2` registers the act's quests. Each quest implements its own trigger and completion checks, using `GameState` story flags, inventory, spell knowledge, and quest state. The Gathering Storm's final completion is additionally gated on every side quest being complete.
- **Interactions and world state:** Characters, items, and rooms own their state-dependent interactions. Story flags, serializable class fields, dynamic NPCs/items, and gated exits represent changes in the world; there is no separate dialogue-choice or relationship-score system.
- **Spells:** Spell acquisition is implemented by the relevant character/item interaction. Spell effects inspect the current room, target, inventory, and story flags as needed.
- **Save compatibility:** Act content classes are registered in `web/src/act2/classes.ts`. Mutable state uses serializable fields and plain objects/arrays; Act II's integration tests cover save/load round-tripping.
- **Tests:** Vitest unit tests live next to the content they cover. `Act2.integration.test.ts` exercises the golden path, quest completion, and save/load behavior; browser end-to-end tests live under `web/e2e/`.

## Golden Path (Optimal Solution to Complete Act II)

The implemented command sequence is `ACT2_GOLDEN_PATH` in `web/src/act2/Act2GoldenPath.ts`. It completes all side quests and intentionally stops before the player performs the final main-quest action. The route and interactions are:

1. **Mountain Path and city entry:** Take the Walking Stick, speak to the Mountain Hermit (Cedric's old sergeant) for Cedric's Training Sword, examine the Camp Site and take the Entry Pass. At Greendale Gates, give the pass to the Gate Captain, speak to the captain, then search for and take the City Map.
2. **Greendale orientation and the castle:** Use the City Map in Main Square, examine the notice board, speak with the Town Crier, and take the Merchant's Flyer. At Castle Approach, show the Entry Pass to the Herald and speak with the Castle Guard Captain. In Castle Courtyard, meet Sir Cedric (on the first talk he recognises the Warden sigil on the Ancient Amulet), use the Training Sword (Cedric recognises the notch he cut in it and hears the sergeant's message, then the sparring bout begins; `say guard`, `say turn` and `say strike` to Sir Cedric answer his three attacks, and the hermit then has an "after" line), and speak with him again to complete The Knight's Test and receive Supplies for the Journey.
3. **Market and inn:** Give the Merchant's Flyer to Aldric, buy the Forest Survival Kit and Enhanced Lantern, and speak with Caravan Master Thorne to start The Merchant's Lost Caravan. At The Silver Stag Inn, speak with Marcus and Elena, buy and use the Room Key, then search Inn Rooms and take the Coins and Traveler's Journal. Return to the Market District and buy Quality Rope to complete Supplies for the Journey.
4. **Archives, community, and healing apprenticeship:** In Great Hall, present the Entry Pass to the Court Herald and give the Traveler's Journal to the Historians (they recognise their own birth rolls in the stranger's copied notes and offer to search with Elior), then search the archives (the Wardens of the Dawn and Malakar's search for the Willowbrook bloodline); afterwards the Historians add that the Willowbrook roll is missing the page for the year Elior was born, where the stranger's notes also stop. In Residential Quarter, give the Walking Stick to the Families and speak with the Local Craftsmen and Families. Speak with Lyria, discover the Hidden Library by searching, and enter through the secret passage. Cast `mend` on the Protective Enchantments, speak with the Spectral Librarian, use the Ancient Chronicle (which names the Wardens of the Dawn), and take the Crystal Focus. Return to Lyria and give her the focus to complete The Healer's Apprentice and learn `greater_heal`.
5. **Forest threshold and riddles:** At Forest Transition, examine the Standing Stones to learn `nature_sense`, speak with the Forest Hermit, and use the Forest Survival Kit. In Forest Entrance, take the Enchanted Acorn, use the Protective Charm and Enhanced Lantern there, and speak with the Forest Sprites. In Ancient Grove, examine the Silver-Barked Tree to awaken its spirit, give it the Acorn, and take the Silver Leaves. In Whispering Glade, cast `nature_sense`, speak with the Water Nymphs, and answer `tree`, `water`, and `ants`; then take the Crystal-Clear Water and Moonflowers. Return to Ancient Grove and give the Moonflowers to the spirit while carrying the water to complete Whispers in the Wind and open the path to the Heart of the Forest. Step back to Forest Entrance, cast `forest_speech` and use Quality Rope with the Ravine to rescue the caravan while still on this first journey.
6. **Resolve cross-phase quests:** Back in town, speak to Thorne for the Secret Documents, then return to the inn and cure Elena in order with `greater_heal` (revealing the Sorceress of Lies' mark on her wrist), Crystal-Clear Water, and `dispel` (the mark fades); speak with Marcus to receive the Druidic Charm. In Castle Courtyard, speak with the Training Master and Squires, search for and read the Squire's Diary. In Great Hall, examine the Secret Documents (Malakar's agents framed Cedric) and give them to the Lord Commander; speak with Sir Cedric to complete his honor quest and receive Nature's Charm.
7. **Summon Nyx and finish the act:** The second forest journey goes straight to the Heart of the Forest, so the golden path takes two forest journeys in all. At Heart of the Forest, use the Druidic Charm with the Offering Altar while carrying the Protective Charm and Nature's Charm, then speak with Nyx, who speaks the refrain and gives `prophetic_vision`, Nyx's Token, and the Forest Heart Crystal. Return to Castle Courtyard and cast Prophetic Vision while Sir Cedric is present; the vision shows the Shadow of the Past and Cedric answers that Malakar is no tale and is hunting Elior (the red line, row II). The cast shares the vision and leaves Cedric waiting; The Gathering Storm completes, and the act ends, on Elior's next exchange with him: `say truth to cedric` (Elior tells him the voice did not sound like a hunter; Cedric: "Then it is worse, not better. A thing that wants you to come to it.") or any `talk to sir cedric`. The cast works only after every side quest is complete.

The optional virtue moments (see Optional choices) add the commands `give mountain flower to families`, `say truth to marcus` and `say forgive to thorne` at the points they name; none is on the golden path.

## Quest Completion Verification

The five quests gating entry into the forest are The Knight's Test, Supplies for the Journey, Echoes of the Past, The Healer's Apprentice, and The Ancient Library. The Hermit's Warning must also be completed at Forest Transition. The remaining side quests are cross-phase: The Forest Guardian's Riddles, Whispers in the Wind, The Innkeeper's Daughter, The Merchant's Lost Caravan, and Cedric's Lost Honor. The final cast of Prophetic Vision is blocked until all eleven side quests are complete and Sir Cedric is in the room.

`ACT2_GOLDEN_PATH` completes those eleven side quests; its integration test deliberately leaves The Gathering Storm for the player to finish. The final steps after the declared route are `cast prophetic vision on sir cedric`, then `say truth to cedric` or `talk to sir cedric`.

**Progression-critical items and spells:** Entry Pass, City Map, Merchant's Flyer, Walking Stick, Coins, Room Key, Traveler's Journal, Training Sword, Forest Survival Kit, Enhanced Lantern, Quality Rope, Crystal Focus, Enchanted Acorn, Crystal-Clear Water, Moonflowers, Secret Documents, Protective Charm, Druidic Charm, Nature's Charm, `mend`, `greater_heal`, `dispel`, `nature_sense`, `forest_speech`, and `prophetic_vision`. The three charms are consumed by the Offering Altar. Nyx's Token and the Forest Heart Crystal are rewards, not prerequisites for the final cast.
