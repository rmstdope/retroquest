# Requirements

Agreed with the navigator 2026-11-27. Each requirement keeps its ID for ever;
a dropped one is struck, never renumbered.

## Story (STY)

STY-1  A player can play all four acts from start to finish along the golden path,
       each act leading into the next, through to the epilogue.
       Proven by: web/e2e/redLine.spec.ts
STY-2  A player plays by typing commands. A command the game does not understand is
       answered in words and changes nothing.
       Proven by: nothing yet
STY-3  An act's main quest can be finished only when all its side quests are done.
       The journal shows each quest's log as it moves on, and hint gives a nudge in
       the game's own voice.
       Proven by: nothing yet
STY-4  A player learns spells from people and places as the story allows, and can
       cast a spell once it is learned.
       Proven by: nothing yet

## Saving (SAV)

SAV-1  A returning player picks Continue on the title page and is back in the newest
       save, where they left it. New game starts afresh and keeps the saves.
       Proven by: web/e2e/continue.spec.ts
SAV-2  A player can save at any point, into a slot or under a name, and load it back
       exactly as it was. Saves are kept in the browser and survive closing it.
       Proven by: web/e2e/continue.spec.ts
SAV-3  A save made by an older version that can no longer be loaded is shown dimmed
       with its reason and cannot be loaded; trying leaves the game as it was.
       Proven by: web/e2e/oldSaves.spec.ts

## Title and menu (MNU)

MNU-1  The title page shows the picture and the name until a key, click or tap, then
       offers Start — or Continue, New game and Load game to a returning player.
       Proven by: web/e2e/titleWait.spec.ts
MNU-2  During play, Escape or the menu button opens a menu with Save, Load, Settings,
       Help and Quit. A window opened from the menu comes back to it.
       Proven by: web/e2e/menu.spec.ts
MNU-3  Quit asks first, and quitting lands on the title page.
       Proven by: web/e2e/menu.spec.ts
MNU-4  Every menu and window can be worked with the keyboard alone: the arrows move a
       ring the player can see, and Enter picks.
       Proven by: web/e2e/menuKeys.spec.ts

## The picture (PIC)

PIC-1  Each room is shown as its picture, and arriving in a room tells it on the
       picture. A click, Enter or a hold moves the telling on.
       Proven by: web/e2e/arrival.spec.ts
PIC-2  Moving the mouse over the picture marks and names the things in it. The marks
       leave a few seconds after the last move.
       Proven by: web/e2e/areaNames.spec.ts
PIC-3  Pressing a thing or a person in the picture opens a ring of what can be done
       with it, and choosing one does what typing the command would.
       Proven by: web/e2e/pressRing.spec.ts
PIC-4  What the player carries hangs on a belt as pictures. A carried thing can be
       used on a thing or a person from the belt, or by dragging it there.
       Proven by: web/e2e/belt.spec.ts
PIC-5  Quest news and a newly learned spell are told in the middle of the picture,
       one piece at a time.
       Proven by: web/e2e/questNews.spec.ts
PIC-6  A player can open a bigger map and walk from it to a place already visited.
       Proven by: web/e2e/biggerMap.spec.ts

## Reading (RDG)

RDG-1  What people say appears in a speech column with the speaker's name and
       portrait. A line fades once it has been read, without moving the lines still
       showing.
       Proven by: web/e2e/speechColumn.spec.ts
RDG-2  The journal and the quest log open as drawers that nothing from the stage
       covers. A checklist shows what is done fainter than what is left.
       Proven by: web/e2e/storyDrawerCover.spec.ts, web/e2e/checklistFade.spec.ts
RDG-3  A player can choose the text size, a light or dark look (or the device's), and
       less motion. The choices are kept between visits.
       Proven by: nothing yet

## Sound (SND)

SND-1  The story is read aloud wherever a recording exists: a tap hurries it and a
       hold shows the rest. A line with no recording is shown without a voice.
       Proven by: web/e2e/narration.spec.ts
SND-2  Each room plays its music and its sound effects.
       Proven by: web/e2e/sound.spec.ts
SND-3  Music, effects and narration each have a volume in Settings. Volume 0 silences
       that sound, and the volumes are kept between visits.
       Proven by: web/e2e/sound.spec.ts

## Phone and screen sizes (PHN)

PHN-1  On a phone held sideways the game is played on the picture by touch, with no
       typing box.
       Proven by: web/e2e/phoneSideways.spec.ts
PHN-2  A phone held upright shows only a page asking the player to turn it.
       Proven by: web/e2e/phoneSideways.spec.ts
PHN-3  On a phone, a laptop and a wide desktop alike, no control or name covers
       another control or the words being read.
       Proven by: web/e2e/coverUps.spec.ts

## Help and feedback (HLP)

HLP-1  Help, from the menu or by typing help, lists every command the game accepts.
       Proven by: web/e2e/help.spec.ts
HLP-2  During play, F2 or the ✎ button opens a feedback window. A report goes out
       with the save and a picture of the screen, and a send that is refused keeps
       the player's words.
       Proven by: web/e2e/feedback.spec.ts
