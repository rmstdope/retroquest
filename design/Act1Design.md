# Act I Rooms: Willowbrook & Surroundings

## Quests in Act I

The source code is the single point of truth for this section (`web/src/act1/quests/`, the characters and items that set the flags the quests read, and `GameMap.unfinishedBeforeTheRoad`). Each quest is described by:

- **Trigger:** what starts it.
- **Log:** the journal entries (or checklist) the quest log shows, which the `hint` command reads.
- **Mentioned by:** the characters and items that speak of the quest without advancing it, including the lead the map and the main quest's hint give while the quest is not started yet.
- **Needed to complete:** every interaction that advances it, in order, with the commands that do it.
- **Completion:** the condition that completes it.

Act I has one main quest (_Shadows over Willowbrook_), one checklist quest (_Preparing for the road_) and nine side quests. The act ends only when the map is used on the Road to Greendale, which refuses while any side quest is unstarted or open (see _Shadows over Willowbrook_).

### How the quests depend on each other

- _Hint of magic_ opens the cottage, and its spell (`revive`) starts _Magic for real_.
- _Curiosity killed the cat_ opens the General Store. Its rope jams the mill, whose fragment starts _Oh deer, oh deer_, whose rare flower completes _Magic for real_. Its matches (handed over only once the store is open) complete _Let there be light_.
- _Fishing expedition_ teaches `purify`. The magnet goes on the rod only once `purify` is known, so _Magnet fishing expedition_ waits on it, and on Mira's teaching for `purify` to work on the well.
- _Magic for real_ starts _Preparing for the road_. The locket from _Let there be light_ gives `bless` and the travel cloak, the ring from _Magnet fishing expedition_ buys the boots (or the horseshoe does), and `unlock` and `light` give the map and `grow`.
- _The faded photograph_ and _Know your village_ depend on nothing but the cottage's exits.
- _Shadows over Willowbrook_ ends only once all the others are complete.

---

### Hint of magic

- **Trigger:** Elior wakes from the dream (`woke_from_dream`): `talk to voice`, or saying anything to the voice, in The Dream.
- **Log:** a journal of three entries, added one per step: Elior woke with three words written down and a tune still going, and the `lantern` would show him where → the lantern found his `journal`, with the three words and the rest of the dream in it → Grandmother is at the hearth humming the tune from the dream, and will want to hear about it.
- **Mentioned by:**
  - _Grandmother_, while there is nothing else to say: "light that lantern before you go feeling about in your corner" until the lantern is lit, then "Read me what it says" until the journal is read.
  - _Elior's Cottage_: the exits stay closed until `revive` is learned. Trying to leave, Grandmother stops Elior with what is still undone: the unlit lantern, then the unread journal, then the dream still to tell.
- **Needed to complete:**
  1. `use lantern`: lights it (`lantern_lit`) and reveals Elior's journal. The lit lantern can then be taken.
  2. `use journal`: reads the dream entry (`journal_read_prologue_entry`).
  3. `talk to grandmother`: once the journal is read, she is found humming the cradle tune and stops; Elior tells her the dream and the three words ("Some voices are older than memory"), she tells of his father's journal, and Elior learns `revive`. Talking to her earlier gives only her greeting (the first time) or the nudge above.
- **Completion:** Elior knows `revive`. The cottage's exits (south, east) open. As `revive` is Elior's first spell, _Magic for real_ starts on the same turn.

### Know your village

- **Trigger:** Elior visits a second room after the cottage, which in practice is his first step out of it. The dream is not counted as a room he has visited.
- **Log:** one entry: something pulls at him to walk every lane of Willowbrook.
- **Mentioned by:** no character or item. While it is open, the map refuses with "the tasks you began in the village", and the main quest's hint says something begun is unfinished.
- **Needed to complete:** visiting each of the fifteen rooms of the act once: Elior's Cottage, Vegetable Field, Chicken Coop, Village Square, Mira's Hut, Blacksmith's Forge, General Store, Village Well, Abandoned Shed, Old Mill, Riverbank, Forest Path, Hidden Glade, Village Chapel and Road to Greendale.
- **Completion:** every room but The Dream has been visited.

### Curiosity killed the cat

- **Trigger:** the first of four ways Elior hears of Patches, and the opening entry tells it the way he heard it:
  - talking to Hemlock while the store is shut (`met_hemlock`): "Old Man Hemlock has shut the General Store until his cat, Patches, comes home";
  - examining the `old notice` in the Village Square (`read_hemlock_notice`): the notice's words, the reward and the shed by the well;
  - unlocking the shed door, where her mew is heard, or finding her: the patchwork shape in the shed looked a lot like the cat on the store's counter.
- **Log:** the opening, then, once Patches is in Elior's arms (`patches_found`): "Carry her home to Old Man Hemlock at the General Store."
- **Mentioned by:**
  - _Old notice_ (Village Square): MISSING, last seen near the old well, responds to her name, a small reward.
  - _Hemlock_, while the store is shut: the first talk (she is gone, the store stays shut, last seen near the well, a reward), then "No sign of Patches, then. I put a saucer out every night". Buying is refused the same way. `say patches to hemlock` gives the same scenes, and once she is home, where she is now.
  - _Grandmother_: while Elior carries the shed key, she admits she hid it in the coop rafters, says the shed was his father's workshop and tells him to take the lantern. While he carries Patches, she offers to keep her. Once Patches stays, she is asleep by the hearth. Once Patches is home with Hemlock, "He says you found his Patches. I've not heard him whistle in a year."
  - _Abandoned Shed_: the door's mew, and on a search, "a pair of frightened green eyes watches you from behind the crates" (dark or not).
  - _Patches_ herself: a gift other than the egg or the fish only gets a sniff, "as if she's waiting to be called"; other words to her mean nothing.
  - _The farewell_: Grandmother says Patches has claimed Elior's pillow, or that Hemlock is telling the whole square how Elior found her.
  - Lead while unstarted: "Old Man Hemlock is still waiting for his cat."
- **Needed to complete:**
  1. `use bread with chicken` in the Chicken Coop: the shed key is knocked from the rafter. `take key`.
  2. `use key with door` at the Abandoned Shed: the key is used up, the shed opens and Patches bolts behind the crates. No light is needed for the rest.
  3. Coax her out with `talk to patches`, `say patches to patches`, or `give egg to patches` / `give fish to patches` (Elior keeps the egg or fish). She lets Elior carry her (`patches_found`).
  4. Then one of two endings:
     - **Home to Hemlock** (golden path): `talk to hemlock`, `give patches to hemlock`, `say patches to hemlock` or any `buy` at the General Store. He pays a `coin` (the notice's reward, or "a little something for your trouble" if Elior never heard of it), reopens the store, and Patches curls up by the till (`patches_returned`).
     - **She stays with Grandmother:** in the cottage, while carrying her, `say stay to grandmother` (also `yes` or `keep`). Patches settles by the hearth (`patches_stayed_with_grandmother`). The next time Elior talks to Hemlock, he has heard the news, reopens the store and gives a `rope` and an `apple` instead of the coin (`hemlock_heard_patches_stayed`).
- **Completion:** `patches_returned` or `patches_stayed_with_grandmother`. The second ending completes the quest at once, before Elior visits the store.
- **Saves:** a save made when the hoe still gave a second coin keeps the store open from the start and pays no reward for Patches.

### Fishing expedition

- **Trigger:** the first talk to the fisherman (`talked_to_fisherman`).
- **Log:** "The fisherman at the bend can't fish with his stiff arm, and he would give a good deal for a fresh fish." Once `heal` has mended his arm, a second entry says the arm is mended but he won't cast his own line till tomorrow and would still give a good deal for a fish. If he was healed before the first talk, the log starts at the second entry.
- **Mentioned by:**
  - _Fisherman_: every talk ends on the fresh fish. A second fish is refused ("Two's showing off"), and other gifts get "Won't catch anything with that, lad."
  - _River_: without his lesson, the rod catches nothing: "Perhaps someone could teach you."
  - Lead while unstarted: "the fisherman at the river bend still sits with an empty line".
- **Needed to complete:**
  1. The `fishing rod`, found by searching the Abandoned Shed by light (see _Curiosity killed the cat_).
  2. `talk to fisherman` while carrying the rod: he knows it for Elior's father's and teaches him the basics (`learned_fishing_basics`). Talked to without the rod, he only greets Elior, and a later talk with the rod gives the lesson.
  3. `use fishing rod with river` (or `use fishing rod` at the Riverbank): the river gives one `fish`, and never another.
  4. `give fish to fisherman`: he teaches `purify`, the thing Elior's mother taught him at the bend.
- **Optional:** `cast heal on fisherman` (after Mira's teaching) mends his arm (`healed_fisherman_arm`); if the lesson has not yet been given, he gives it out of gratitude.
- **Completion:** Elior knows `purify`.

### The faded photograph

- **Trigger:** the first `search` in Elior's Cottage finds the `faded photograph` in a drawer (`found_photo`).
- **Log:** a journal that gains one entry per step taken, so the hint names the next one: the photograph and the line on its back in the mother's hand → (examined) seek the truth where the river bends, and Grandmother knew her hand best → (Grandmother asked) the old fisherman at the Riverbank will remember → (fisherman asked) the tin under the `smooth stone` → (dug up) a letter in the mother's hand, not yet read. A step skipped leaves no entry: if Elior goes to the fisherman before Grandmother, her entry never appears, even when he asks her later.
- **Mentioned by:**
  - _Grandmother_: given the photograph before its back is read, she talks of the three of them and Elior's mother half a blur. After she has been asked, her line between other news is "Have you been down to the river yet?" While Elior carries the letter, "Keep that dry." Given the letter, she reads it twice.
  - _Fisherman_: shown the photograph before its back is read: "Turn it over sometime, lad." After he has told of the tin, he points to the stone. Once the letter is found, "I reckon I can stop now." Given the letter, he will not read it.
  - _Mira_: given the photograph, "You were a loud baby." Given the letter, she reads it to the end (and, once Elior carries the amulet, "I kept it. Now you keep it."). Carried into her hut, the letter makes the amulet on its stand glow brighter.
  - Lead while unstarted: "a drawer at home still holds something you have not seen".
- **Needed to complete:**
  1. `search` in Elior's Cottage, then `take faded photograph`.
  2. `examine faded photograph`: reads _Seek the truth where the river bends._ (`read_photo_message`).
  3. _Optional in the code, on the golden path:_ `give faded photograph to grandmother`: her daughter's hand, "They went toward something", and the fisherman at the Riverbank (`talked_to_grandmother_about_photo`).
  4. `give faded photograph to fisherman`: this spot is the bend, and his promise to watch the tin under the smooth stone (`fisherman_told_of_tin`). The photograph stays with Elior.
  5. `search` at the Riverbank (or `take smooth stone`, or `use broken shovel with smooth stone`): the tin, and the `mother's letter` in it (`found_mothers_letter`). Before the fisherman has told of the tin, none of these finds anything.
  6. `take letter`, then `examine letter` (or `use letter`) (`read_mothers_letter`).
- **Completion:** the mother's letter has been read.
- **Reward:** the letter (see _Story Beats_): it names Malakar once, as a friend gone wrong, and says Mira keeps the amulet for Elior.

### Oh deer, oh deer

- **Trigger:** `give millstone fragment to blacksmith` (`deer_can_be_observed`): Borin says the mill's ground is older than the village and tells his grandfather's story of the deer in the Hidden Glade that comes to folk who sit down, rest a while and stop looking for it.
- **Log:** one entry: Borin's grandfather swore by a deer that comes to folk who keep still. Not to hunters. Not to talkers.
- **Mentioned by:**
  - _Hidden Glade_: resting before Borin's story, nothing comes; while the mill's mechanism still runs, "the ground feels thin, as if something far off were drawing on it."
  - _Blacksmith_: once the deer is in the glade, "Saw it, did you? ... My grandfather swore by that deer."
  - _Shadows over Willowbrook_'s hint, while Mira waits for the flower: the mill still drawing on the land → the fragment it gave up → "Borin at the forge knows old stone."
  - _Deer_: `talk to deer` or `examine deer` gives a wordless moment, its gaze on the mossy stone until the glade is lit, then a bow.
  - Lead while unstarted: "Borin at the forge still has a story about the Hidden Glade to tell".
- **Needed to complete:**
  1. The `rope` from Hemlock: bought with the reward coin, or his gift when Patches stays (see _Curiosity killed the cat_).
  2. `use rope with mechanism` in the Old Mill: the gears jam and a compartment opens. `take millstone fragment`.
  3. `give millstone fragment to blacksmith` (the trigger).
  4. `rest` in the Hidden Glade: the deer steps out of the brambles and a `rare flower` opens near the mossy stone.
- **Completion:** a rare flower exists (in the glade or carried), which happens on that rest. Talking to or examining the deer is optional.

### Magnet fishing expedition

- **Trigger:** whichever comes first: `examine well` while the ring still lies in it (`well_examined`, step 5 of the golden path), or assembling the `magnetic fishing rod`.
- **Log:** "Something glints far down in the well, much too deep for hands." → once the magnet is on the rod, "The magnet might reach it, on a long enough rod."
- **Mentioned by:**
  - _Well_: examined or searched, the glint (murky) or the shiny ring at the bottom (purified). The magnet alone would sink and stay sunk; a bare rope comes up wet.
  - _Fishing rod_: with the magnet before `purify` is known, "the rod would catch iron and never a fish. Not yet, then."; with the stick first, the length can come last. The short rods are too short to reach the water.
  - _Extended magnetic fishing rod_: while the well is murky, "You can't see anything to retrieve."
  - Lead while unstarted: "far down in the well, something still glints".
- **Needed to complete:**
  1. The `fishing rod` and `magnet` from the shed, and the `stick` from the Forest Path alcove (`use sharp knife with vines`, which needs the knife Borin sharpened for the hoe's coin).
  2. `use fishing rod with magnet`, which works only once `purify` is known (_Fishing expedition_), then `use magnetic fishing rod with stick`.
  3. `cast purify on well`, which needs the well examined first and Mira's teaching for the spell to work.
  4. `use extended magnetic fishing rod with well`: the rod is used up, and the `shiny ring` and the `rune token` come up (`found_rune_token`).
- **Completion:** the shiny ring exists (carried, or given on), which happens on that catch.

### Let there be light

- **Trigger:** the first talk to the priest (`priest_talked_to`): the founders, their relic, the bell, and he is out of matches; Hemlock keeps a box for him under the counter.
- **Log:** the priest is out of matches and Hemlock keeps a box → once Elior holds the matches, "The candle by the altar in the chapel is still cold."
- **Mentioned by:**
  - _Priest_: "Any luck with those matches?" → with the matches, "The wick has waited long enough." → candle lit, "Look there, child. The light has found something." Given the matches, he hands them back and asks Elior to light it.
  - _Hemlock_: while the store is shut, "They're under the counter, and they'll keep. I'll see to him the day Patches is home." Taking or buying the matches is refused: they are the priest's.
  - _Candle_: the lantern cannot light it (its flame is behind glass). The `light` spell does not reach the dark corner.
  - Lead while unstarted: "the priest in the chapel has not had his say".
- **Needed to complete:**
  1. The store open (_Curiosity killed the cat_, either ending).
  2. `talk to hemlock` after the priest has asked: the `matches`, on the house.
  3. `use candle with matches` in the chapel (or `use candle` holding the matches): the candle lights and the `locket` shows in the dark corner.
- **Completion:** the candle is lit.
- **Follow-on (not part of this quest):** `take locket` teaches `bless` in the priest's scene, and `give locket to grandmother` gives the `travel cloak` (_Preparing for the road_).

### Magic for real

- **Trigger:** Elior knows any spell, which is `revive`, the turn _Hint of magic_ completes. If Mira has already asked for the flower, the log opens at its second entry.
- **Log:** "You know a spell now, but when you reach for it the warmth comes and nothing answers. Grandmother says Mira has a way with herbs, and with other things." → once Mira has asked for the flower (`connect_with_nature`), "Your spells do not answer yet. Mira has sent you for a rare flower from the Hidden Glade." While the flower is carried, the hint says instead that it opened for Elior and Mira will know once she has it.
- **Mentioned by:**
  - _Grandmother_: her first talk sends Elior to Mira.
  - Spells cast before Mira's teaching fail with a hint of the magic to come (for example `cast revive` in the Vegetable Field).
  - _Mira_: before the three signs, "Tell me what you've seen."; after her request, "The flower, Elior. The Hidden Glade."
  - _Grandmother_: given the flower, "Take it where it is wanted, love."
- **Needed to complete:**
  1. The three signs of the main quest: enter the Vegetable Field, `talk to tilda`, `examine well`.
  2. `talk to mira`: Elior tells her of the three signs, she calls the land and the king one wound and asks for the rare flower (`connect_with_nature`).
  3. The `rare flower` (_Oh deer, oh deer_).
  4. `give rare flower to mira`: she teaches `heal`, `unlock` and `light`, and names what the road needs (`magic_fully_unlocked`). The flower can be given before step 2; she then tells of the one wound on the next talk, without the request.
- **Completion:** `magic_fully_unlocked`. From here on spells work.

### Preparing for the road

- **Trigger:** `magic_fully_unlocked` (the rare flower given to Mira).
- **Log:** a checklist, each line ticked while it holds:
  - Warm clothing: the `travel cloak` is carried.
  - Magical protection: Elior has blessed himself (`journey_bless_completed`).
  - Food for the road: any four of the five kinds are carried: bread (`bread` or `fresh bread`), `apple`, `egg`, `fresh carrot`, `wild berries`. The fish does not count.
  - Sturdy footwear: the `wandering boots` are carried.
  - A map to find your way: the `map` is carried.
  - All basic magic learned: all seven spells are known.
- **Mentioned by:**
  - _Mira_: when she takes the flower: "You'll need warmth, protection, food, boots and a map ... go with a blessing on you." Before everything is ready she says "Not yet." and names only the first need still missing (boots, cloak, food, map, spells, blessing, in that order), e.g. "Not yet. I'll not send you out half-dressed. The road is cold at night." When it is ready, she gives the amulet (see below).
  - _Grandmother_: the first talk after Mira's teaching gives a `fresh bread` for the road, which counts as bread; after that, "Packed yet?"
  - _Merchant_: food is refused ("you'll want every bite of that where you're going"), except the fresh bread (the optional _selfless_ choice).
  - _Shadows over Willowbrook_'s hint: Mira keeps the amulet until Elior is ready for the road. The map refuses with "your preparations for the road".
- **Needed to complete:**
  - Travel cloak: `give locket to grandmother` (_Let there be light_).
  - Protection: `cast bless`, or `cast bless on me` (`myself`, `elior`). Blessing someone else does not count.
  - Food: `take egg` (Coop), `take apple` (with Hemlock's rope, either way), `cast revive on withered carrot` then `take carrot` (Field), `cast grow on bush` then `take wild berries` (Forest Path), or Grandmother's fresh bread. Grandmother takes berries she is given into a pie, but the bush grows more.
  - Boots: `give shiny ring to merchant` (golden path), or `give horseshoe to merchant` (the horseshoe from the forge), which keeps the ring (`kept_mothers_ring`).
  - Map: `cast unlock on mysterious box`, then `open mysterious box` (Abandoned Shed).
  - Spells: `revive` (Grandmother), `purify` (Fisherman), `bless` (taking the locket), `heal`, `unlock`, `light` (Mira), `grow` (`cast light` in the Hidden Glade).
- **Completion:** all six lines hold at once. The items must be carried at the moment the quest is checked. Then `talk to mira` hands over the Ancient Amulet; the amulet is not part of the checklist.

### Shadows over Willowbrook (Main Quest)

- **Trigger:** Elior wakes from the dream (`woke_from_dream`).
- **Log:** a journal that opens with the dream ("You woke with three words written down: …let them rest…") and gains one entry per beat, in the order the beats are noticed. The beats before the flower always come before it, so the log never steps backwards:
  1. The Vegetable Field has withered (`investigated_withered_crops`, set on entering the field).
  2. In the square, Tilda has more rumours than bread (`villager_talked_to`, any talk to Tilda).
  3. The village well smells sour, and something glints (`well_examined`).
  4. Mira says the sickness in the fields and the king's feel like one wound (`connect_with_nature`), with her request for the rare flower if she did not have it yet.
  5. The flower opened, Mira taught Elior, and promised the amulet once he is ready (`magic_fully_unlocked`).
  6. The rune token came up from the purified well with the ring: "The well did not sour by itself." (`found_rune_token`).
  7. _Optional:_ a man in a grey cloak at the Old Mill, his back turned (`stranger_seen_at_mill`, the first move into the mill after the token).
  8. _Optional:_ clean water brought the Vegetable Field back to life (`vegetable_field_watered`, `use bucket` in the field with purified well water).
  9. Mira named the token a fouling sigil: someone poisoned the well on purpose, searching Willowbrook for something, or for someone (`mira_named_fouling_sigil`).
  10. _Optional:_ the merchant's news from the capital: King Alden lies ill, the roads are dangerous, crops fail in every valley (`merchant_news_heard`, the first `talk to merchant`).
- **Hint:** the main quest's hint does not read the log. It names the furthest point reached: the fields, the square and the well → Mira, north of the square → the flower (with the mill → fragment → Borin lead while the deer is unknown) → the amulet Mira keeps → the unread rune token → the amulet is Elior's, but a quest is unfinished or a lead untaken → nothing left undone, use the map on the Road to Greendale.
- **Mentioned by:** Tilda (her rumours of the king, the cloaked stranger and the amulet; asking about the well once it runs clean), Hemlock (the stopped caravans), Grandmother, Borin, the priest, the fisherman, the merchant and Mira, who all react to the rune token and the amulet given to them (see the rooms).
- **Needed to complete:**
  1. The three signs and Mira's request (as in _Magic for real_).
  2. The rare flower given to Mira (_Magic for real_).
  3. The ring and rune token fished out of the purified well (_Magnet fishing expedition_).
  4. `give rune token to mira`: the fouling sigil, tied to the mill if the mechanism is jammed. She hands it back.
  5. `talk to mira` once _Preparing for the road_ is complete: the Ancient Amulet, her hint of a secret and the man in the grey cloak who came to her door. If the token is still unread when Elior already carries the amulet, she asks to see it.
  6. `use map` on the Road to Greendale. The map refuses, naming what is left, while any of these holds: the amulet is not carried; the rune token was found but Mira has not read it; _Preparing for the road_ is not complete; any side quest is open; any side quest is unstarted (named by its lead, see each quest). Otherwise the farewell plays (see _Action that completes the act_) and `shadows_over_willowbrook_completed` is set.
- **Completion:** `shadows_over_willowbrook_completed`, which also completes the act. Whether the field was watered travels to Act IV (`Act1.carriedFlags`).

## Rooms
### 0. The Dream

- **Description:** Where the game opens. Dark, with a storm in it: rain against shutters Elior cannot see, thunder that shakes the dark, shadows moving like smoke. A man's hand lifts a child out of the dark and holds it against a shoulder. A slow tune climbs three notes and settles home again. A tall figure without a face whispers Elior's name.
- **Items:** nothing to carry. The shadows, the man (also _hand_) and the child can be examined, each as itself; Elior carries nothing in the dream.
- **Characters:** the voice (answers to voice, figure, shadow, stranger; not to man, who is the dream's own scenery). Talking to it, or saying anything to it, ends the dream: the whisper says "…let them rest…" and his name, and Elior wakes in Elior's Cottage with the tune still going out by the hearth, where Grandmother is humming it. The voice stays in the dream.
- **Exits:** none. Going any way, resting, searching or calling any other name keeps him in the dream with a line of its own. Once he wakes the dream is not on the map, and _Know your village_ does not count it.

### 1. Elior’s Cottage

- **Description:** A modest cottage with a straw roof and a cozy hearth.
- **Items:** Lantern (start), bread (on the table from the start), Elior’s journal (later, revealed by the lantern; the dream entry records a voice that called his name, achingly familiar though Elior cannot place it, and three words he wrote down on waking: "…let them rest…"), travel cloak (later).
- **Spells:** `revive` (learned from Grandmother).
- **Usable Items:** Lantern (lights the cottage; once lit it can be taken and carried, and held lit it lights the dark Abandoned Shed), Elior's journal (read for story), hidden locket (give to Grandmother).
- **Characters:** Grandmother (offers advice, can be spoken to). While Elior carries the shed key she admits she hid it in the coop rafters years ago: the shed was his father's workshop, she never could go in, and it is dark, so he should take the lantern. Her lines follow Elior's journey: the first time he talks to her after Mira's teaching she sees in him "your mother's gift" (she knows the truth, and only hints at it) and bakes him a `fresh bread` for the road, which counts as food; after that she asks after his preparations; once he carries the Ancient Amulet she says "So it's true, then. Come back to me, child." When Elior comes to her with the dream she is humming at the hearth, a slow tune that climbs three notes and settles (the cradle song of Acts III and IV; he knows it and cannot say from where), and stops when she sees his face. Asked whether the voice said anything but his name, he tells her the three words he caught, let them rest; she goes quiet, turns to the bread and says only "Some voices are older than memory." She is guarded and plainly knows more, but never ties the voice to a parent. She tells the journal tale again only when she has nothing newer to say. While Elior carries Patches she offers to keep the cat (`say stay to grandmother`, see _Elior's choices_); once Patches has stayed, she mentions her asleep by the hearth.
- **Exits:** Vegetable Field (south), Village Square (east)

### 2. Vegetable Field

- **Description:** Rows of withered crops under a gray sky. Once watered with purified well water, the description shows green crops and dark, soft earth (story flag `vegetable_field_watered`).
- **Items:** rusty hoe (start), dull knife (start), Withered carrot (start), coin (1st) (later), carrot (later).
- **Spells:** None.
- **Usable Items:** Hoe (uncovers a hidden coin, once), `revive` spell (on `Withered carrot` to transform it into `carrot`), bucket of purified water (optional: `use bucket`, or `use bucket with carrot`, makes the whole field recover; murky water is refused).
- **Characters:** None.
- **Exits:** Elior’s Cottage (north), Village Well (east), Chicken Coop (south)

### 3. Chicken Coop

- **Description:** A small wooden coop with nervous chickens. High on a rafter, out of reach, something glints where no hen could have put it.
- **Items:** egg (start), key (later).
- **Unusable:** feather (start), chicken (start).
- **Spells:** None.
- **Usable Items:** Bread (feed chickens; in the flapping commotion the shed key Grandmother hid long ago is knocked from the rafter).
- **Characters:** None.
- **Exits:** Vegetable Field (north)

### 4. Village Square

- **Description:** The heart of Willowbrook, with an old stone fountain and a notice board.
- **Items:** Bucket (start).
- **Unusable:** old notice (start).
- **Spells:** None.
- **Usable Items:** (None based on Golden Path actions in this room).
- **Characters:** Villager: Tilda, the baker's wife (answers to `villager` and `tilda`). She cycles through the village rumours, among them that King Alden is ill and the roads are no longer safe, that a cloaked stranger was seen asking after "an old amulet, from a family that left" before he took the road to the mill, and that the animals are restless ("Malakar's weather, my mother would have called it, and knocked on wood"); once the well is purified she asks, once, "The water's clean! ... Was that you, Elior? Go on, love, tell me true." (Elior may stay silent, and she decides the spring ran clear by itself; or answer `say truth to tilda` or `say yes to tilda`, accepted for as long as the well stays purified and she has asked, see _Optional choices_); once Elior carries Mira's amulet she knows he is leaving.
- **Exits:** Elior’s Cottage (west), Mira’s Hut (north), General Store (east)

### 5. Mira’s Hut

- **Description:** A fragrant hut filled with herbs and potions.
- **Items:** Ancient Amulet (visible from the start; Mira prevents pickup until journey preparations are complete, then awards it). Examined, it is faintly warm, and glows brighter once Elior carries the founders' locket or his mother's letter into the hut.
- **Unusable:** Healing herb (Mira's stock; cannot be taken).
- **Spells:** `heal`, `unlock`, `light` (learned from Mira).
- **Usable Items:** Rare flower (give to Mira), rune token (give to Mira: she names it a fouling sigil, ties it to the mill if the mechanism is jammed, and hands it back).
- **Characters:** Mira (teaches basic magic, gives quests). When she hands over the amulet she hints at her secret: "I knew your parents better than I have said. Once you are truly ready, I will tell you." She says no more, and tells Elior the cloaked stranger came to her door asking for it.
- **Exits:** Village Square (south)

### 6. Blacksmith’s Forge

- **Description:** A hot, smoky forge with tools and weapons.
- **Items:** sharp knife (later).
- **Items:** Horseshoe (start; can be taken and traded to the Merchant in place of the shiny ring).
- **Spells:** None.
- **Usable Items:** Coin (1st, to get dull knife sharpened), dull knife (to be sharpened), millstone fragment (give to Blacksmith).
- **Characters:** Blacksmith (Borin; can sharpen items, offers advice). Once met, he rotates through the lines that fit Elior's journey, newest first: after Mira's teaching ("Magic, eh? Can't hammer that into shape"), after the deer has been seen ("Saw it, did you? My grandfather swore by that deer"), after the knife was sharpened ("Keep that edge oiled"); with none of these he just welcomes Elior back. Optionally shown the rune token, he names it cold iron "not forged by any honest smith" and hands it back.
- **Exits:** Village Well (west), General Store (north)

### 7. General Store

- **Description:** A cluttered shop with shelves of goods.
- **Items:** Rope (store stock; Hemlock has only the one, so once it is sold or given when Patches stays, he answers "That was my last good rope, lad. There'll be no more till spring." and a coin always stays for Borin), apple (bonus with each purchase), matches (kept for the Priest and not for sale — not among the wares, cannot be bought or taken; gifted after speaking with the Priest), Sword (display stock; 5 coins), Armor (display stock; 10 coins). The Sword and Armor have no use in Act I and cannot be bought with the two coins available in the act (the hoe's and Hemlock's reward).
- **Spells:** None.
- **Usable Items:** Coin (2nd, purchase rope and receive an apple bonus).
- **Characters:** Shopkeeper — Old Man Hemlock (sells goods, shares gossip). On the first talk while the store is shut he does not give his name; he speaks of Patches as a cat Elior has seen on his counter, mentions that the caravans have stopped coming because the king is ill and the roads are unsafe ("Malakar's luck, my father would have called it"), and keeps the store shut until Patches is returned. The caravans line is said once, in whichever scene Elior first meets him in: the shut-store talk, or the reunion (or the news that Patches stays with Grandmother) when Elior first walks in with Patches, as on the golden path; then Patches (his cat) sits on the counter. If Patches stays with Grandmother instead, Hemlock has heard the news, reopens the store and gives Elior a `rope` and an `apple` (no coin), so the act stays completable without the second coin.
- **Save compatibility:** saves made when the hoe still gave a second coin keep the store open, and returning Patches in such a save earns no second coin.
- **Exits:** Village Square (west), Village Chapel (east, along the lane Hemlock watches from his window), Blacksmith’s Forge (south)

### 8. Village Well

- **Description:** An old stone well. Its water is dark, still and sour-smelling until the well is purified, and crystal clear afterwards (the room description follows the well's state). No rope hangs by it.
- **Items:** Shiny ring (later), rune token (later), Well (start).
- **Spells:** None.
- **Usable Items:** Bucket (draws murky, sour-smelling water before the well is purified; clear water after, tipping out murky water already in it), fishing rod + magnet + stick (assemble an extended magnetic fishing rod to retrieve the ring and the rune token after purifying the well), `purify` spell (target the Well item after examining it; the text hints that the parched Vegetable Field could use the clean water).
- **Characters:** None.
- **Exits:** Vegetable Field (west), Blacksmith’s Forge (east), Abandoned Shed (south)

### 9. Abandoned Shed

- **Description:** A rickety shed on the village edge, once the workshop of Elior's father: rusty tools, a long workbench, and little light past the grimy boards.
- **Items:** shed door (start), mysterious box (later), fishing rod (later), magnet (later), map (later).
- **Unusable:** Broken shovel (later).
- **Spells:** None.
- **Usable Items:** Key (on shed door), mysterious box (unlock with spell, open to get the map and the father's note), lit lantern (held, lets the dark shed be searched).
- **Search:** Too dark to rummage until Elior holds the lit lantern (or casts `light` in the shed); then the first search finds the fishing rod and magnet. Patches can be found and coaxed out in the dark: her green eyes shine from behind the crates.
- **Characters:** Patches, Hemlock's missing cat (hides behind the crates once the door is unlocked, until coaxed out).
- **Exits:** Village Well (north), Old Mill (south)

### 10. Old Mill

- **Description:** A creaky windmill with dusty gears, built on an old seat of power. The strange mechanism is the cloaked stranger's device: black iron scored with the same kind of twisted rune as the token in the well, whirring on its own as it drains the power beneath the mill. The description follows its state (whirring, then jammed). Once Elior carries the Ancient Amulet and the mechanism is jammed, the amulet hums in his hand. **The sighting:** the first time Elior walks in after the rune token has come up from the well, a man in a grey cloak stands at the far door with his back to him, knows he is there without a sound, and steps out toward the river without turning; the path is empty. Shown once, on the move only (`stranger_seen_at_mill`); optional and off the golden path.
- **Items:** millstone fragment (later), Mechanism (start).
- **Unusable:** Sack of flour (start).
- **Spells:** None.
- **Usable Items:** Rope (jams the mechanism's gears, which stops its draining whir and opens a hidden compartment).
- **Characters:** None.
- **Exits:** Abandoned Shed (north), Riverbank (east)

### 11. Riverbank

- **Description:** A gentle river flows past the village.
- **Items:** fish (later), River (start), Smooth stone (start, cannot be taken), mother's letter (later).
- **Spells:** `purify` (learned from Fisherman, who learned it from Elior's mother).
- **Usable Items:** Fishing rod (on River to catch a fish), fish (give to fisherman), faded photograph (show to fisherman).
- **Search:** Once the fisherman has told of the tin, searching finds it under the smooth stone; the mother's letter is inside.
- **Characters:** Fisherman (the bend of the river from the photograph is his spot; he was the mother's friend; offers fishing tips, trades a fish for `purify`, tells of the tin when shown the read photograph).
- **Optional:** Cast `heal` on the fisherman to mend his busted arm. He thanks Elior and remembers the mother mending his scrapes the same way. From then on he no longer speaks of a bad arm; if Elior has not yet learned to fish, he teaches him out of gratitude instead. Not needed for any quest.
- **Exits:** Old Mill (west), Forest Path (south)

### 12. Forest Path

- **Description:** A winding path leading into the woods. Beside the path, thick, thorny vines block a small alcove.
- **Items:** Stick (later), wild berries (later), Vines (start), Bush (start), snare (appears once the vines are cleared; optional).
- **Spells:** None.
- **Usable Items:** Sharp knife (on Vines to open the alcove; on the snare, optional), `grow` spell (on bush).
- **Optional:** Once the vines are cleared, a fox kit is caught in a poacher's snare in the alcove. Cutting it free (`use sharp knife with snare`, see _Optional choices_) sends it bolting into the undergrowth; skipping it changes nothing, and the kit stays caught. Not needed for any quest.
- **Characters:** None.
- **Exits:** Riverbank (north), Hidden Glade (south)

### 13. Hidden Glade

- **Description:** A hidden clearing, dim and overgrown under an unnatural darkness, its stone's inscription too deep in shadow to read. Once `light` is cast the darkness lifts and the glade is bathed in golden sunlight.
- **Items:** Rare flower (later).
- **Unusable:** shiny pebble (start).
- **Spells:** `grow` (learned from inscriptions on a stone; the learn text says it does not wake in Elior the way the others did, he reads it off the stone and it feels like his own, which Act IV's Parents' Vault and Sacrifice ending pay off: it is the one spell he did not inherit). Beneath the `grow` inscription the refrain is carved: "Power follows purpose; purpose follows truth." Elior reads it aloud and does not know what it means. If he carries the Ancient Amulet it glows beside the stone.
- **Usable Items:** `light` spell (cast in the glade to illuminate the moss-covered stone).
- **Characters:** Deer (present only when Elior rests in the room after having been informed about the deer; it is Nyx's, as she says in Act II, which Act I never reveals). It never speaks: `talk to deer` or `examine deer` gives a wordless moment, its gaze drifting to the mossy stone, then to Elior, nudging him to `light`; once the glade is lit it bows its head beside the glowing stone.
- **Exits:** Forest Path (north). The glade is a dead end: the only way in and out is the Forest Path.

### 14. Village Chapel

- **Description:** A small stone chapel at the end of the village lane, with stained glass windows. Over the door a shape is cut into the stone, worn almost smooth (the founders' mark the Priest names). A dark corner by the altar swallows the light (the locket is not mentioned until the candle reveals it).
- **Items:** Candle (start), hidden locket (later).
- **Unusable:** prayer book (start).
- **Spells:** `bless` (learned when picking up the hidden locket; the Priest recognizes it).
- **Usable Items:** Candle (use with matches, lights dark corners, reveals a hidden locket), hidden locket (picking it up teaches `bless`; using it opens it to the engraving _From the founders' line, to the next._), `bless` spell (cast on self for protection).
- **Characters:** Priest (offers blessings, shares lore). His first talk tells the story of the founders, their relic and the bell; after that he answers in one short line that follows Elior's progress, the latest milestone winning: blessed by Elior (`cast bless on priest`) → Elior has cast `bless` on himself → Elior carries the locket (he points him to Grandmother) → the locket has gone home → the candle is lit but the locket not yet taken (he points to the corner) → otherwise he asks after the matches.

**The locket's history.** The locket is the founders' relic: an heirloom bearing the founders' crest (a silver tree beneath twin moons) that has passed down Elior's mother's family, from Grandmother to her daughter. The crest is the older form of the Warden sigil (the founders were the first Wardens, which Act I never says); the Priest's tale adds that the mark is cut over the chapel door, nearly weathered away. Elior's mother hid it in the chapel the night she left; that night the chapel bell rang at midnight with no hand on the rope. The Priest knows the legend and recognises the crest of the founders' line; Grandmother recognises it as her daughter's. This quietly sets up Elior's heritage and Act II's bloodline research.
- **Exits:** General Store (west), Road to Greendale (east)

### 15. Road to Greendale

- **Description:** The main road leaving Willowbrook, lined with ancient oaks.
- **Items:** wandering boots (later - from Merchant).
- **Unusable:** Rusty saw (start).
- **Spells:** None.
- **Usable Items:** Shiny ring or horseshoe (trade with Merchant), map (reveals shortcut to Greendale; ends the act with the farewell scene).
- **Characters:** Merchant (sells wares, provides travel advice). He asks for fine jewelry, or failing that an iron horseshoe; he is plainly hungry after two days on the road, and the closed roads have cost him his supplies. He trades one pair of `wandering boots` for either the shiny ring or the forge's horseshoe ("my old mare threw a shoe on the hill road").
- **Exits:** Village Chapel (west)

## Room Map

```
                                [Mira's Hut]
                                     |
            [Elior's Cottage]--[Village Square]--[General Store]--[Village Chapel]--[Road to Greendale]
                    |                                   |
            [Vegetable Field]--[Village Well]--[Blacksmith's Forge]
                    |                 |
            [Chicken Coop]     [Abandoned Shed]
                                      |
                                  [Old Mill]----------[Riverbank]
                                                         |
                                                         |
                                                   [Forest Path]
                                                         |
                                                   [Hidden Glade]
```

## Learnable Spells in Act I

- **`revive`**: Learned from Grandmother in Elior’s Cottage (Step 1). Second, rewarded use: on the Forest Path bush, which greens but bears nothing ("fruit wants something else of you").
- **`purify`**: Learned from the Fisherman at the Riverbank after giving him a fish (Step 12). Elior's mother once taught it to him by the bend. Second, rewarded use: on the river itself, which was never the trouble and "remembers her better than it needs you".
- **`bless`**: Learned when picking up the Hidden Locket in the Village Chapel; the Priest recognizes the relic (Step 17).
- **`heal`**: Learned from Mira in Mira’s Hut after giving her the Rare Flower (Step 18). Optionally cast on the Fisherman to mend his arm. Second, rewarded use: on the snared fox kit, where it says the wire comes first ("mending flesh around iron would be cruelty").
- **`unlock`**: Learned from Mira in Mira’s Hut after giving her the Rare Flower (Step 18). Second, rewarded use: on the Old Mill's mechanism, which has no lock ("never meant to be opened, only to run").
- **`light`**: Learned from Mira in Mira’s Hut after giving her the Rare Flower (Step 18).
- **`grow`**: Learned from inscriptions on a moss-covered stone in the Hidden Glade after casting `light` on it (Step 22). Second, rewarded use: on Mira's healing herb, which crowds its pot ("I will not complain").

## Action that completes the act:

After receiving the Ancient Amulet from Mira, completing the _Preparing for the road_ quest, and completing every other side quest, use the `map` on the Road to Greendale. This unlocks the path to Greendale and triggers the transition to Act II.

**The farewell.** Before the map reveals the path, Grandmother, who has walked out from the village, catches up with Elior on the road. She straightens the travel cloak ("Wear your mother's cloak. She'd want you warm."), says a word about the ring and about Patches that follows Elior's choices, kisses his brow and, for the first time, names his parents: "Aren and Lysa gave that amulet to Mira to keep for you. Someone has come to Willowbrook looking for it, so keep it hidden." She turns for home. Then the chapel bell rings once with no hand on the rope: an omen that closes the rumour of the bell that rang the night Elior's mother left. Only then does the map reveal the hidden path. This is the red-line ending of Act I: the amulet was his parents', and someone has come for it. The scene is kept short, and later beads (the end-of-act revelation of Epic A) may extend it.

## Elior's choices

Two light choices are recorded as Act I story flags, for a later virtue record. Neither blocks the golden path, which keeps the default.

- **The ring.** Examining the shiny ring shows the initials _A & L_ inside the band: it was Elior's mother's wedding ring. Elior can trade it to the Merchant for the boots (golden path) or keep it and trade the forge's horseshoe instead (`kept_mothers_ring`). At the farewell, Grandmother either says the merchant showed her the ring and she would have given it gladly, or is glad he kept it.
- **Patches.** Elior can carry Patches home to Hemlock (golden path, with the coin reward) or, in the cottage, let her stay with Grandmother (`say stay to grandmother`, `patches_stayed_with_grandmother`). Then Hemlock reopens the store, gives a rope and an apple instead of the coin (`hemlock_heard_patches_stayed`), and _Curiosity killed the cat_ still completes. Grandmother mentions Patches by the hearth, and again at the farewell.

## Story Beats

The red-line threads of Act I (see `GameStory.md`, Story Canon and Red Line). All ride on existing talks, examines and gives; none adds a puzzle or changes the golden path. The Wardens, the ward and the parents' fate are not named in Act I, and Malakar only as a byword, save for one line of the mother's letter.

- **The byword.** Willowbrook says Malakar's name the way a village names a bogeyman: Tilda's "Malakar's weather" over the restless animals, Hemlock's "Malakar's luck" over the stopped caravans, both with a knock on wood. Nobody in the village treats him as a living man; only the mother's letter does, in one line. This is the source of the Act II row of the red line, where Elior arrives still half-believing Malakar is a tale from old books, and it is chilling in hindsight: the man the village swears by held Elior as a baby.

- **The ill king.** Tilda says King Alden is ill and the roads are no longer safe; Hemlock adds that the caravans have stopped coming. Mira says the sickness in the land and the king's sickness feel like one wound (in the same talk as the rare flower, step 18): the blight is the first ripple of the same draining magic.
- **The dream voice.** The game opens inside the dream (room 0): the player stands in the storm with the figure whispering Elior's name, and hears the three words when Elior answers it. His journal then records a voice that called his name, achingly familiar but unplaced, and three words he caught at its end: "…let them rest…", the first fragment of the sentence the Shadow of the Past says whole in Act IV. When he tells Grandmother the three words she goes quiet, turns to the bread and says "Some voices are older than memory." She is guarded and plainly knows more. The voice is never tied to a parent.
- **The cradle song.** It is heard first in the dream, three notes climbing and settling home, and is still going when Elior wakes: Grandmother is humming it at the hearth, and stops when she sees his face when he comes to her with the dream; he knows the tune and cannot say from where. It is the tune of the shell and the phantoms in Act III and of the gate in Act IV.
- **The turned back.** The stranger is seen once, at the Old Mill after the token, with his back to Elior, and leaves without turning: the first of the game's turned backs (the amulet's third figure in Act III, the Knight of Despair and Malakar in Act IV).
- **The amulet reacts.** In Mira's hut it is faintly warm and glows brighter once Elior carries the founders' locket or his mother's letter into the room. In his hand it hums at the jammed Old Mill and glows beside the moss-covered stone in the Hidden Glade. It reacts to things tied to his parents and the founders' line, and at the mill to the old power beneath it being freed. The hum and the glow in his hand come only if he goes back to the mill and the glade after step 27; they are optional and off the golden path.
- **The refrain.** "Power follows purpose; purpose follows truth." is carved beneath the `grow` inscription on the moss-covered stone.
- **Mira's hint.** "I knew your parents better than I have said. Once you are truly ready, I will tell you."
- **The cloaked stranger.** Tilda saw him asking after "an old amulet, from a family that left" and he took the road to the mill; Mira says he came to her door. The rune token and the mill's mechanism are his work.
- **The red-line ending.** At the farewell Grandmother names Aren and Lysa and says the amulet was theirs, and that someone has come to Willowbrook looking for it.

## Optional choices

Optional virtue moments; none blocks the golden path, none adds a puzzle or combat. Each records one count in the same three counters as Acts II to IV (mercy, truth, selfless) and changes a few lines of dialogue. The two earlier choices below (the ring, Patches) stay as they are.

| Where                       | The choice                                                                                                                               | Records      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Village Square, Tilda       | When she asks "The water's clean! Was that you?", admit it was Elior's magic instead of letting the credit go to the spring (`say truth to tilda` or `say yes to tilda`) | **truth**    |
| Road to Greendale, Merchant | Give Grandmother's `fresh bread` to the hungry Merchant and ask nothing in return (`give fresh bread to merchant`; the golden path's four food kinds are berries, apple, egg and carrot, so _Food for the road_ is unaffected)                         | **selfless** |
| Forest Path                 | Cut a fox kit free from a poacher's snare with the sharp knife instead of walking past (`use sharp knife with snare`)                     | **mercy**    |

## Golden Path (Optimal Solution to Complete Act I)

0.  **The Dream:**

    - Talk to the voice. _The whisper says the three words and Elior's name, and he wakes in Elior's Cottage with the tune still going out by the hearth. Three words are already slipping; he writes them down._

1.  **Elior’s Cottage:**

    - Use lantern to light up the room. _The lantern illuminates the cottage, revealing Elior’s journal; the bread already lies on the table._
      - Take bread. _Bread is added to inventory._
      - Take lantern. _The lit lantern is added to inventory; it will light the dark Abandoned Shed._
      - Read journal. Opens up new conversion story with Grandmother. _The dream entry records the voice that called for help, achingly familiar but unplaced._
    - Speak to Grandmother for advice. _She is humming the cradle tune at the hearth and stops. Grandmother gives hints about the village and Elior’s destiny, and teaches you the `revive` spell. When Elior tells her the three words the voice said (the same talk, after the journal), she goes quiet and says only "Some voices are older than memory."_
      - Spell Learned: `revive` (can not be used until magic is learned for real)
    - Search the cottage and take the faded photograph.
    - Examine the photograph to read the message on its back, then show it to Grandmother to learn more about Elior's family. _She points him to the old fisherman at the Riverbank, who will remember his mother._
    - **Note:** You cannot leave Elior’s Cottage until you have completed the sub-quest _Hint of magic_ by learning the 'revive' spell from Grandmother.

2.  **Vegetable Field:**

    - Take rusty hoe. _Hoe is added to inventory._
    - Use hoe to uncover hidden coin. _Coin (1st) is added to inventory._
    - Take dull knife. _Dull knife is added to inventory._
    - Attempt to cast `revive` (fails, but hints at magic). _Nothing happens, but Elior feels a strange energy._

3.  **Chicken Coop:**

    - Take egg. _Egg is added to inventory._
    - Use bread to feed chickens, obtain hidden key. _In the commotion the key Grandmother hid long ago is knocked from a high rafter. Bread is removed from inventory, key is added to inventory._

4.  **Village Square:**

    - Take bucket. _Bucket is added to inventory._
    - Speak to villager for rumors. _Tilda, the baker's wife, shares information about the darkness affecting the village: King Alden is said to be ill and the roads are no longer safe, and a cloaked stranger was seen asking after an old amulet._

5.  **Village Well:**

    - Examine the well. _Elior peers into the depths, noticing the stonework and the faint, unsettling shimmer on the water's surface. This observation hints that the well is not as pure as it seems and might need cleansing._
    - Use bucket to draw water from the well. _The water comes up murky, with a sour smell, hinting that the well is not as pure as it seems and might need cleansing._
      - Item used: `bucket` (for observation)

6.  **Blacksmith’s Forge:**

    - Give coin (1st) to Blacksmith to get dull knife sharpened. _Coin (1st) is removed from inventory, dull knife is transformed to sharp knife._
      - Item used: `coin` (1st), `dull knife`
      - Item obtained: `sharp knife`
    - Speak to blacksmith for advice. _Blacksmith gives tips on using tools and mentions strange happenings._

7.  **Abandoned Shed (First Visit):**

    - Use key with shed door. _Key is removed from inventory, shed door is unlocked, revealing the interior. A frightened mew: a small cat bolts behind the crates._
      - Item used: `key` (on `shed door`)
    - Find Mysterious Box. _The box is intricately locked, and the key doesn't fit this lock: it has no keyhole, and its runes do not answer to hands._
    - Talk to Patches (call her by name). _She creeps out and lets Elior carry her; the quest log points him to Hemlock at the General Store._
    - Search shed. _The shed is dark; holding the lit lantern high, Elior finds a fishing rod and a small magnet amidst the clutter. Without a light, it is too dark to rummage._
    - Take fishing rod. _Fishing rod is added to inventory._
    - Take magnet. _Magnet is added to inventory._

7.5. **Visit Mira’s Hut:**

    - Speak to Mira. _Mira greets Elior warmly, offering encouragement and subtle hints about the journey ahead. The Ancient Amulet on its stand is faintly warm. She reminds Elior to seek out the rare flower and to pay attention to the well and the glade, as they may hold secrets vital to his quest._

8.  **General Store:**

    - Speak to the shopkeeper. _Old Man Hemlock is overjoyed to have Patches home: he pays the notice's reward and reopens the store. Patches curls up on the counter. Completes: Curiosity killed the cat._
      - Item obtained: `coin` (2nd)
    - Use coin (2nd) to buy rope. _Coin (2nd) is removed from inventory; rope and a bonus apple are added to inventory._
      - Item used: `coin` (2nd)
      - Items obtained: `rope`, `apple` (purchase bonus)

9.  **Back past the Abandoned Shed:**

    - Walk south through the shed (Patches is no longer there) on the way to the Old Mill.

10. **Old Mill:**

    - Use rope with the strange mechanism. _Elior threads the rope through its gears and they jam; the whirring dies and the hum in the floorboards fades as the device stops drawing on the power beneath the mill. Rope is removed from inventory, a hidden compartment in the mechanism clunks open._
      - Item used: `rope`
    - Take millstone fragment from the compartment. _Millstone fragment is added to inventory._

11. **Return to Blacksmith's Forge:**

    - Give millstone fragment to Blacksmith. _He examines it and nods. 'A fine piece from the Old Mill. They say the mill has secrets older than the village itself. Some folks with a touch of the arcane about them have even whispered tales of a magical deer seen in the Hidden Glade, a place the mill's old energies might be connected to. Be wary if you venture too deep into its workings.' He says plainly how to meet the deer, in his grandfather's words: go to the glade, sit down, rest a while, and stop looking for it._
      - Item used: `millstone fragment`
      - Item obtained: Information (about magical deer in Hidden Glade)

12. **Riverbank:**

    - Speak to fisherman. _Fisherman explains his broken arm prevents him from fishing and, seeing Elior's rod, teaches him the basics of fishing._
    - Use fishing rod with River. _Elior casts the line into the flowing River and catches a plump river fish! Fish is added to inventory._
      - Item used: `fishing rod` (with `River`)
      - Item obtained: `fish`
    - Give fish to fisherman. _The fisherman is grateful. He speaks of strange changes in the river's water lately and teaches him the `purify` spell to cleanse water: "Your mother taught me this, by the bend. I reckon it's yours more than mine."_
      - Item used: `fish`
      - Spells Learned: `purify` (can not be used until magic is learned for real)
    - Give faded photograph to fisherman. _He reads the message on the back: this very spot is the bend. Elior's mother came here near every evening to study the river's old magic, and the night before she went away she hid a tin under the smooth stone and made him promise to watch over it._
      - Item shown: `faded photograph` (it stays with Elior)
    - Search. _Elior tips the smooth stone aside and digs a small tin, sealed with wax, out of the mud. Inside lies the mother's letter._
    - Take letter, then examine letter. _A water-stained fragment in his mother's hand: it warns him not to answer anyone who comes asking after the family, and names the amulet Mira keeps for Elior. Completes: The faded photograph._
      - Item obtained: `mother's letter`

13. **Forest Path:**

    - Use sharp knife with Vines. _Elior uses the sharp knife to cut through the thick vines, clearing the way to a small alcove._
      - Item used: `sharp knife` (with `Vines`)
      - Item removed: `Vines` (from room)
    - Take a sturdy stick from the alcove. _Stick is added to inventory._

14. **Hidden Glade:**

    - Rest in the glade after learning about the deer. _A magical deer appears, and a rare flower blooms near the moss-covered stone._
    - Observe the deer (optional: `talk to deer` or `examine deer`). _The deer does not answer in words; its gaze drifts to the mossy stone... then to Elior, as if waiting for him to bring something to light._
    - Take the rare flower growing near the stone. _Rare flower is added to inventory._

15. **Village Chapel (First Visit - Part 1):**

    - Walk there from the General Store, east along the village lane; the Hidden Glade is a dead end and does not lead to the chapel.
    - Speak to priest. _The priest shares concerns about a growing shadow. He tells the story of the founders: they brought a relic to the valley and hung the chapel bell to watch over it; the relic passed quietly down their line until one night, years ago, it was lost, and the bell rang at midnight with no hand on the rope. He also mentions that he is out of matches. He usually get his matches for free from the general store._

16. **General Store (Visit for Matches):**

    - Speak to Shopkeeper. _Elior mentions the Priest needs matches. The Shopkeeper, happy to help the Priest, gives Elior a box of `matches`._
      - Item obtained: `matches`

17. **Village Chapel (First Visit - Part 2):**

    - Use candle with matches to light a particularly dark corner of the chapel. _The flickering light reveals a small, hidden locket tucked into a crevice._
      - Item used: `candle`
      - Item used: `matches`
    - Take hidden locket. _Hidden locket is added to inventory. As Elior picks up the locket, the Priest, noticing the relic, approaches. He recognizes the founders' crest, which only the founders' line wore: the line of Elior's mother, who prayed alone in the chapel the night she left and must have hidden it there for him. He then teaches Elior the `bless` spell to seek protection._
      - Spell Learned: `bless` (can not be used until magic is learned for real)

18. **Return to Mira’s Hut:**

    - Give rare flower to Mira. \_Mira smiles, saying the flower is a sign of Elior's connection to the natural world. Pleased with Elior's progress and the offering, Mira teaches him the `heal` spell for mending wounds, the `unlock` spell for revealing secrets, and the `light` spell to illuminate darkness. From this point on, the spells learned can actually be used for something as Elior have learned magic for real. On the golden path Elior already carries the locket and his mother's letter, so the amulet on its stand glows brighter as he enters. Her tone then turns practical: "You'll need warmth, protection, food, boots and a map", and all the basic magic the village elders can teach. The Ancient Amulet will be his once he is truly ready. She keeps it to that one line (the scene is told in short beats so it reads well on a phone); the quest log carries the full checklist:\_
      - Warm clothing (`travel cloak`)
      - Magical protection (cast `bless` on himself)
      - Food for the road: any four of five kinds (`bread` or `fresh bread`, `apple`, `egg`, `carrot`, `wild berries`); the checklist shows how many are gathered. The golden path gathers `wild berries`, `apple`, `egg` and `carrot`; Grandmother's `fresh bread` (talk to her after this step) also counts. The `fish` does not: the river gives only one, and it goes to the Fisherman.
      - Sturdy footwear (`wandering boots`)
      - A `map` to find his way
      - All basic magic learned
      - Item used: `rare flower`
      - Spells Learned: `heal`, `unlock`, `light`
      - Quest given: Prepare for the Journey

19. **Return to Abandoned Shed (Second Visit):**

    - Cast `unlock` on the Mysterious Box. _A soft click is heard, and the intricate lock on the box springs open._
      - Spell used: `unlock`
    - Open mysterious box. _Inside, nestled on faded velvet, lies a detailed map of Willowbrook and the surrounding areas, showing landmarks and paths that are not immediately obvious. Beneath it is a folded note in his father's hand: "For when the light comes back to you." The runes fade; the box was sealed so only Elior's magic could open it. The note stays in the box and can be read again by examining it._
      - Item obtained: `map` (ESSENTIAL)

20. **Return to Vegetable Field:**

    - Cast `revive` on the `Withered carrot`. _A faint glow envelops the carrot, and it plumps up, becoming a vibrant orange `carrot`. Elior feels his magical abilities solidify._
      - Spell used: `revive` (on `Withered carrot`)
      - Item transformed: `Withered carrot` becomes `Fresh carrot` (in place)
    - Take `Fresh carrot`. _Fresh carrot is added to inventory._
      - Item obtained: `Fresh carrot`

21. **Return to Village Well:**

    - Use `fishing rod` with `magnet`. _Elior attaches the magnet to the fishing rod, transforming it into a `magnetic fishing rod`._
      - Item used: `magnet` (consumed)
      - Item transformed: `fishing rod` becomes `magnetic fishing rod`
    - Use `magnetic fishing rod` with `stick`. _Elior firmly attaches the stick to the magnetic fishing rod, creating an `extended magnetic fishing rod` with extended reach._
      - Item used: `stick` (consumed)
      - Item transformed: `magnetic fishing rod` becomes `extended magnetic fishing rod`
    - Cast `purify` on the `Well` item. _The water shimmers with a clear light, and a murky film on the surface dissipates. Peering down, Elior spots something metallic gleaming at the bottom._
      - Spell used: `purify`
    - Use `extended magnetic fishing rod` with the well. _Elior carefully lowers the extended magnetic tool into the depths, and it snags a shiny ring! Something else clings to the magnet: a black-iron rune token, colder than the water. Wells do not grow things like this; someone put it there. Shiny ring and rune token are added to inventory._
      - Item used: `extended magnetic fishing rod`
      - Item obtained: `shiny ring`, `rune token`
    - _Optional:_ Use bucket with the well to tip out the murky water and draw clear water, go west and use the bucket in the Vegetable Field. _The soil drinks it in and the whole field recovers; the Shadows over Willowbrook journal records it._

22. **Return to Hidden Glade:**

    - Cast `light` while in the Hidden Glade. _The unnatural darkness lifts and sunlight spills into the glade. The moss-covered stone's faint inscriptions glow into view. Studying them, Elior learns the `grow` spell, a secret of the glade. Carved beneath it: "Power follows purpose; purpose follows truth." He reads it aloud and does not know what it means._
      - Spell used: `light`
      - Spell Learned: `grow`

23. **Return to Forest Path:**

    - Cast `grow` on the bush. _The bush flourishes, producing lots of wild berries, an item that can be picked up._
      - Spell used: `grow`
      - Item obtained: `wild berries`

24. **Return to Elior's Cottage:**

    - Give hidden locket to Grandmother. _Tears well in her eyes as she recognizes it as her daughter's: it came down to Elior's mother from her, and to her from her own mother, all the way back to the founders. She thought her daughter took it with her when she left. For his journey, she gives him a warm `travel cloak` his mother meant for him._
      - Item used: `hidden locket`
      - Item obtained: `travel cloak` (Completes: Warm clothing)

25. **Any room (Prepare for Journey):**

    - Cast `bless`. _A comforting warmth envelops Elior, steeling him for the road ahead._
      - Spell used: `bless` (Completes: Magical protection)

26. **Road to Greendale (Interactions):**

    - (If `shiny ring` was obtained) Give `shiny ring` to Merchant. _The merchant, impressed by the ring\'s quality, offers a sturdy pair of `wandering boots` in trade, mentioning its usefulness on long journeys._
      - Item used: `shiny ring`
      - Item obtained: `wandering boots` (Completes: Sturdy footwear)

27. **Return to Mira's Hut (Final Visit):**

    - Give rune token to Mira. _Mira turns it over and the color drains from her face: it is a fouling sigil, and the well was poisoned on purpose. If the mill mechanism is jammed she recognises the same hand there, drinking the old power. Whoever carried it, perhaps the cloaked stranger, was searching Willowbrook "for something. Or for someone." She hands the token back: keep it close, and keep it hidden._
    - Speak to Mira. _Seeing Elior has fulfilled all the tasks and is fully prepared, Mira looks him over and puts the `ancient amulet` in his hand. "You're ready. Or as ready as anyone gets." Then, more quietly: "I knew your parents better than I have said. Once you are truly ready, I will tell you." She sends him toward Greendale: "Once there, show the amulet to no one lightly. Those who know what it is will find you." This sets up Sir Cedric recognising the amulet in Act II._
      - Item obtained: `ancient amulet` (ESSENTIAL)
      - (Implicitly, all spells learned completes: Learn basic magic; `map` obtained completes: Map; `wild berries` obtained from Forest Path, `apple` from General Store, `egg` from Chicken Coop, and `carrot` from Vegetable Field are four of the five kinds and complete: Food)

28. **Road to Greendale (Departure):**

    - Use `map`. _Grandmother catches up on the road to say goodbye and, in the farewell, names Aren and Lysa and says someone has come for the amulet (the red-line ending), the chapel bell rings once by itself, and the `map` aligns with the landscape, revealing a hidden path that shortens the journey to Greendale. Act I is completed._
      - Item used: `map` (ESSENTIAL)

    **Items strictly necessary to complete Act I:**

    - `Bread` (to get `key`)
    - `Key` (to access Abandoned Shed's interior where Mysterious Box is)
    - `Coin` (1st, to get `dull knife` sharpened)
    - `Dull Knife` (to become `sharp knife`)
    - `Sharp Knife` (to cut vines on Forest Path, opening the alcove with the `stick`)
    - `Candle` (to find `hidden locket` in Village Chapel)
    - `Matches` (to light `candle` in Village Chapel)
    - `Hidden Locket` (picking it up teaches `bless`; giving it to Grandmother obtains the `travel cloak`)
    - `Fishing Rod` (to catch `fish` for the `purify` spell, and to retrieve the `shiny ring`)
    - `Magnet` (to retrieve the `shiny ring` from the well)
    - `Fish` (to give to the Fisherman to learn the `purify` spell)
    - `Faded Photograph` (read, then shown to Grandmother and to the Fisherman, for _The faded photograph_)
    - `Mother's Letter` (found under the smooth stone at the Riverbank; reading it completes _The faded photograph_)
    - `Stick` (to use with `fishing rod` and `magnet` to retrieve the `shiny ring`)
    - `Shiny Ring` (to trade for `wandering boots` with Merchant; the `horseshoe` can be traded instead)
    - `Rare Flower` (to give to Mira to learn spells and get quest)
    - `Apple`
    - `Egg`
    - `Withered carrot` (found in Vegetable Field, transformed by `revive` spell)
    - `Carrot` (obtained by reviving `Withered carrot`, needed for Mira's quest)
    - `Travel Cloak` (from Grandmother)
    - `Wild Berries` (from Forest Path)
    - `Wandering Boots` (from Merchant, obtained by trading `shiny ring`)
    - `Map` (essential item, found in Mysterious Box, opened with `unlock` spell)
    - `Ancient Amulet` (essential item given by Mira after completing her tasks)
    - (Implicitly, all spells: `revive`, `purify`, `bless`, `heal`, `unlock`, `light`, `grow` are necessary)

## Golden Path Item Usage Summary

This list tracks items obtained in the Golden Path and their subsequent uses within Act I:

1.  **`Lantern`** (Available in Elior's Cottage from the start):
    - Used in Step 1 to reveal Elior's journal, then taken lit.
    - Held lit in Step 7 to search the dark Abandoned Shed.
2.  **`Bread`** (Obtained: Step 1, lying on the cottage table from the start):
    - Used in Step 3 to feed chickens and obtain the `key`.
    - Optionally, after Step 18: talking to Grandmother gives a `fresh bread`, which counts as a kind of food for "Food for the road".
3.  **`Faded Photograph`** (Obtained: Step 1):
    - Examined and shown to Grandmother in Step 1.
    - Shown to the Fisherman in Step 12, who tells of the tin under the smooth stone.
4.  **`Elior's Journal`** (Revealed in Step 1):
    - Read in Step 1 to open a further conversation with Grandmother and learn `revive`. The dream entry ends with Elior sure he knew the voice, though he cannot remember from where (the voice stays unplaced; in the journal it called for help, and Grandmother's reaction to it is in _Story Beats_).
5.  **`Rusty Hoe`** (Obtained: Step 2):
    - Used in Step 2 to uncover the first `coin`. Tilling again finds nothing more.
6.  **`Coin` (1st)** (Obtained: Step 2):
    - Used in Step 6 to pay the Blacksmith to sharpen the `dull knife`.
7.  **`Dull Knife`** (Obtained: Step 2):
    - Used in Step 6 by giving it to the Blacksmith to be sharpened into a `sharp knife`.
8.  **`Withered Carrot`** (Available in Vegetable Field from the start):
    - Revived in Step 20 to become `fresh carrot`, then taken into inventory.
9.  **`Egg`** (Obtained: Step 3):
    - Fulfills Mira's quest requirement for "Food for the road" when she checks the preparations in Step 27.
10. **`Key`** (Obtained: Step 3):
    - Used in Step 7 to open the Abandoned Shed door.
11. **`Mysterious Box`** (Found in the Abandoned Shed in Step 7):
    - Unlocked and opened in Step 19 to obtain the `map`.
12. **`Bucket`** (Obtained: Step 4):
    - Used in Step 5 to draw water from the well for observation.
    - Optionally, after Step 21: refilled with clear water from the purified well and used in the Vegetable Field to make the whole field recover.
13. **`Sharp Knife`** (Obtained: Step 6):
    - Used in Step 13 to cut through thick vines on the Forest Path and open the alcove containing the `stick`.
14. **`Coin` (2nd)** (Obtained: Step 8, Hemlock's reward for returning Patches):
    - Used in Step 8 to buy `rope` from the General Store.
15. **`Apple`** (Obtained: Step 8):
    - Fulfills Mira's quest requirement for "Food for the road" when she checks the preparations in Step 27.
16. **`Rope`** (Obtained: Step 8):
    - Used in Step 10 to jam the mechanism in the Old Mill, revealing the `millstone fragment`.
17. **`Fishing Rod`** (Obtained: Step 7):
    - Used in Step 12 to catch a `fish`.
    - Combined with the `magnet` and then the `stick` in Step 21 to create an `extended magnetic fishing rod`, which retrieves the `shiny ring` from the well.
18. **`Magnet`** (Obtained: Step 7):
    - Combined with the `fishing rod` in Step 21 to create a `magnetic fishing rod`.
19. **`Millstone Fragment`** (Obtained: Step 10):
    - Used in Step 11 by giving it to the Blacksmith for information.
20. **`Fish`** (Obtained: Step 12):
    - Used in Step 12 by giving it to the Fisherman to learn the `purify` spell.
21. **`Mother's Letter`** (Obtained: Step 12, by searching the Riverbank once the Fisherman has told of the tin):
    - Read in Step 12 to complete _The faded photograph_.
22. **`Stick`** (Obtained: Step 13):
    - Combined with the `magnetic fishing rod` in Step 21 to create an `extended magnetic fishing rod`.
23. **`Rare Flower`** (Obtained: Step 14):
    - Used in Step 18 by giving it to Mira to learn spells and receive her quest.
24. **`Matches`** (Obtained: Step 16):
    - Used in Step 17 with the `candle` to light a dark corner in the chapel, revealing the `hidden locket`.
25. **`Candle`** (Available in Village Chapel from the start):
    - Used in Step 17 with `matches` to light a dark corner in the chapel, revealing the `hidden locket`.
26. **`Hidden Locket`** (Obtained: Step 17):
    - The founders' heirloom of Elior's mother's line (see Village Chapel). Examining it shows the founders' crest; using it opens it to an engraving.
    - Picking it up in Step 17 prompts the Priest to recognize it and teach the `bless` spell.
    - Used in Step 24 by giving it to Grandmother to receive the `travel cloak`.
27. **`Map`** (Obtained: Step 19):
    - Fulfills Mira's quest requirement for a map when she checks the preparations in Step 27.
    - Used in Step 28 to complete Act I; its use also requires the Ancient Amulet, completion of the _Preparing for the road_ quest, and every other side quest.
28. **`Fresh Carrot`** (Obtained: Step 20, by reviving and taking the `Withered Carrot`):
    - Fulfills Mira's quest requirement for "Food for the road" when she checks the preparations in Step 27.
29. **`Shiny Ring`** (Obtained: Step 21):
    - Examined, it shows the initials _A & L_: Elior's mother's wedding ring.
    - Used in Step 26 by trading it with the Merchant for `wandering boots`, or kept by trading the forge's `horseshoe` instead.
30. **`Rune Token`** (Obtained: Step 21, with the `shiny ring`):
    - Given to Mira in Step 27, who names it a fouling sigil and hands it back.
31. **`Wild Berries`** (Obtained: Step 23, from the `grow` spell):
    - Fulfills Mira's quest requirement for "Food for the road" when she checks the preparations in Step 27.
32. **`Travel Cloak`** (Obtained: Step 24):
    - Fulfills Mira's quest requirement for "Warm clothing" when she checks the preparations in Step 27.
33. **`Wandering Boots`** (Obtained: Step 26):
    - Fulfills Mira's quest requirement for "Sturdy footwear" when she checks the preparations in Step 27.
34. **`Ancient Amulet`** (Obtained: Step 27):
    - Its acquisition is the primary goal of Mira's quest and is required before using the map to complete Act I in Step 28.
