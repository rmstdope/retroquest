/**
 * The hand-written starting prompt of each character's portrait in Content
 * Studio, keyed by the character's class name. Each begins "A face portrait
 * of" and keeps only what shows in a face: looks, expression, age and what is
 * worn near the face. What a character does, says or stands beside is left
 * out. The in-game descriptions are not touched. A character who appears in
 * several acts has one prompt, so the entry is identical in every act's list.
 */

/** Every prompt must begin with these words, so the studio draws a face and not a full figure. */
export const PORTRAIT_PROMPT_START = 'A face portrait of '

/** The portrait prompt of each character class, from every act. */
export const PORTRAIT_PROMPTS: Readonly<Record<string, string>> = {
  // Shared by several acts
  Grandmother:
    'A face portrait of an elderly woman with a lined, kind face, ' +
    'grey hair pinned back, and a guarded, tired look in her eyes.',
  Mira:
    'A face portrait of a village healer in middle age, with a calm, ' +
    'steady gaze that rests on you a moment longer than is comfortable, ' +
    'and a sprig of dried sage tucked behind one ear.',
  Nyx:
    'A face portrait of a young woman with wild hair and green leaves ' +
    'caught in it, a pale, watchful face and bright, curious eyes.',
  SirCedric:
    'A face portrait of a tall knight in his fifties with a weathered, ' +
    'tired face and a steady, watchful stare, a steel mail coif and a ' +
    'dented gorget around his neck.',

  // Act I
  Blacksmith:
    'A face portrait of a broad, bearded village smith, his cheeks ' +
    'flushed from the forge and a smudge of soot on his brow, with ' +
    'a keen, busy look.',
  Deer:
    'A face portrait of a red-brown deer, its dark eyes calm and ' +
    'unafraid, its ears turned toward you, with moss on its muzzle.',
  DreamVoice:
    'A face portrait of a tall dark figure in rain-soaked shadow, ' +
    'with no face you can make out, only a pale blur where a face ' +
    'should be, like smoke.',
  Fisherman:
    'A face portrait of an old man with a sun-creased face and a ' +
    'white stubbled beard, patient eyes, and a battered cloth cap.',
  Merchant:
    'A face portrait of a travelling merchant, lean and hungry-looking, ' +
    'with sharp cheekbones, shrewd tired eyes and a road-worn hat.',
  Priest:
    'A face portrait of a thin, slightly stooped old priest with a ' +
    'gentle, worried face and a bald head, a speck of candle wax on ' +
    'his collar.',
  Patches:
    'A face portrait of a small cat with a patchwork coat of ginger, ' +
    'black and white, and wide green eyes.',
  Shopkeeper:
    'A face portrait of an old storekeeper with a nervous, ' +
    'sideways glance, thinning white hair and wire spectacles.',
  Villager:
    'A face portrait of a plump, cheerful baker’s wife with flour ' +
    'on her cheek, bright gossiping eyes and a headscarf.',

  // Act II
  AncientTreeSpirit:
    'A face portrait of an ancient tree spirit, a face that appears ' +
    'in silver bark: two knots for eyes, a split in the bark for a ' +
    'mouth, with rings of moss growing across it.',
  BarmaidElena:
    'A face portrait of a young woman with grey lips and tired ' +
    'eyes, her pale skin faintly shadowed, her hair tied back.',
  Brenn:
    'A face portrait of a young caravan guard with a wary, ' +
    'startled expression, a dirty bandage across one cheek, and ' +
    'tousled hair.',
  CaravanMasterThorne:
    'A face portrait of a weather-beaten caravan master with ' +
    'road dust in the creases of his skin, squinting eyes and ' +
    'a greying beard.',
  CastleGuardCaptain:
    'A face portrait of a grey-moustached castle guard captain ' +
    'in a polished steel helm, with a stern, watchful face.',
  CourtHerald:
    'A face portrait of a prim court herald with a long, pale ' +
    'face and a careful, sceptical look, in a stiff collar ' +
    'stitched with gold thread.',
  Families:
    'A face portrait of a smiling villager from a close-knit lane, ' +
    'weathered and warm, with a child’s face peeking beside them.',
  ForestHermit:
    'A face portrait of a thin, weathered hermit under a moss-green ' +
    'hood, with sharp wary eyes and charms of bark and braided grass ' +
    'at the throat.',
  ForestSprites:
    'A face portrait of a tiny forest sprite, a mote of light ' +
    'with a small bright face and wings like a split beech-nut husk.',
  GateCaptain:
    'A face portrait of a stern city watch captain in a polished ' +
    'mail coif, with a hard, appraising look.',
  Herald:
    'A face portrait of a thin royal herald with a narrow face, ' +
    'a long nose and a hard, scrutinising stare, in a tabard collar ' +
    'bearing the royal arms.',
  Historians:
    'A face portrait of an elderly scholar with ink-stained fingers ' +
    'raised to thick round spectacles, curious and absent-minded.',
  InnkeeperMarcus:
    'A face portrait of a big, broad-faced innkeeper with a ' +
    'friendly grin that does not reach his anxious eyes, and a ' +
    'stained apron strap at the shoulder.',
  LocalCraftsmen:
    'A face portrait of a skilled craftsman with calloused, ' +
    'focused features, a leather cap and sawdust in his beard.',
  LordCommander:
    'A face portrait of a broad, grey-bearded lord commander in ' +
    'ceremonial armour, with a heavy, weary, dignified look.',
  MasterHealerLyria:
    'A face portrait of a grey-haired woman healer with a ' +
    'steady, kind and tired face and deep lines at the eyes.',
  MasterMerchantAldric:
    'A face portrait of a broad, well-fed merchant in a good ' +
    'coat collar, with a shrewd, appraising stare and a trimmed beard.',
  MountainHermit:
    'A face portrait of a broad old man with a faded royal-blue ' +
    'cloak hood, a scarred weathered face, white beard and ' +
    'a sentry’s watchful eyes.',
  SpectralLibrarian:
    'A face portrait of a ghostly scholar shimmering with soft ' +
    'blue light, translucent and gaunt, with a stern, watchful look.',
  Squires:
    'A face portrait of a young squire, flushed and freckled, ' +
    'with a leather practice cap and a sidelong, whispering look.',
  TownCrier:
    'A face portrait of a red-faced town crier with a loud, open ' +
    'mouth, round cheeks and a feathered cap in Greendale’s colours.',
  TrainingMaster:
    'A face portrait of a grey-haired knight with a rough, ' +
    'weathered face, a scarred chin and a hard, sharp-eyed stare.',
  WaterNymphs:
    'A face portrait of a water nymph, her face and hair made ' +
    'of clear flowing stream water, with pale shifting eyes.',

  // Act III
  AncientDragon:
    'A face portrait of an ancient dragon, its head heavy with ' +
    'dull worn scales, with golden eyes half open and unhurried.',
  AshScholar:
    'A face portrait of a scholar with soot-streaked cheeks, ' +
    'singed eyebrows, tired intelligent eyes and wind-tousled hair.',
  MineOverseer:
    'A face portrait of a mine overseer with a face grey with rock ' +
    'dust, a heavy brow and uneasy eyes looking past you.',
  Miners:
    'A face portrait of a grizzled old miner, his face grey with ' +
    'rock dust, with a deep frown and a lamp-lit stare.',
  Phoenix:
    'A face portrait of a phoenix, its head feathers shading from ' +
    'gold to red, with a sharp beak and calm, unhurried amber eyes.',
  PhoenixGuardian:
    'A face portrait of a masked guardian in a fire-etched ' +
    'mask and hood, only the eyes and lips showing, the lips ' +
    'moving as if counting.',
  PierWarden:
    'A face portrait of an old man with a salt-stiff collar, ' +
    'a seamed, sea-beaten face and pale eyes fixed on the water.',
  SilenceKeeper:
    'A face portrait of a figure in a deep hood, the face in ' +
    'shadow, with a pale chin and calm, still features.',
  TideBornGuardian:
    'A face portrait of a guardian shaped of standing water, ' +
    'a face of clear liquid with ward-sigils drifting in it like weed.',
  Tobin:
    'A face portrait of a boy of about fifteen, thin and pale, ' +
    'with his throat wrapped in a strip of torn shirt and his eyes ' +
    'turned upward and away.',
  WanderingPhantoms:
    'A face portrait of a grey phantom, thin as breath on glass, ' +
    'a faint hollow face with open, whispering lips.',

  // Act IV
  Malakar:
    'A face portrait of a gaunt man in a grey robe, with white ' +
    'hair though not old, hollow cheeks and exhausted, sorrowful eyes.',
  KingAlden:
    'A face portrait of a grey, thin king, aged by captivity, ' +
    'with sunken eyes and a dark, dull crown.',
  Whispers:
    'A face portrait of a whisper made visible: pale mouthless ' +
    'faces in dark mist, features barely forming.',
  ShadowOfThePast:
    'A face portrait of the shadow of a man, thin as smoke, ' +
    'with a blurred face and sorrowful empty eyes.',
  SorceressOfLies:
    'A face portrait of a beautiful woman, a little too perfect, ' +
    'with a smile that never reaches her cold eyes.',
  CaptainOfTheGuard:
    'A face portrait of a royal guard captain with a soot-black ' +
    'tabard collar, open eyes that see nothing, and a slack face.',
  KnightOfDespair:
    'A face portrait of a knight in tarnished armour, his visor ' +
    'down, a shredded grey cloak hood around his helm.',
  GhostlyWarriors:
    'A face portrait of a pale ghostly soldier, translucent ' +
    'and grim, with an old battered helm and hollow eyes.',
  TrueSelf:
    'A face portrait of your own reflection in a plain mirror, ' +
    'a watchful, knowing face, a little different from yours.',
  TrappedServants:
    'A face portrait of a grey, shadowed servant, with downcast ' +
    'eyes, a kitchen cap, and a chain of shadow at the neck.',
}
