/**
 * The hand-written picture lines of the belt in Content Studio: one short
 * sentence for every thing that can be carried and every spell, keyed by the
 * picture's id (`beltImageId`: `item-<name>` or `spell-<name>`, one entry for a
 * name wherever it appears). Each line says only what is seen, never what the
 * thing means in the story or what it is used for; a spell's line shows its
 * effect. The in-game descriptions are not used. The shared style the studio
 * paints every entry in is `BELT_STYLE`.
 */

/** The style every thing and spell is painted in, added after the entry's own line. */
export const BELT_STYLE =
  'Painted storybook illustration of a single object from a small medieval ' +
  'fantasy world, soft gouache with visible brush texture, muted natural ' +
  'colours, soft even light, the object alone and centred on a plain warm ' +
  'parchment wash, square composition, no text, lettering or border.'

/** The picture line of each thing that can be carried, by picture id. */
export const THING_PROMPTS: Readonly<Record<string, string>> = {
  'item-ancient-amulet':
    'A worn bronze amulet on a thin chain, a spiral cut into its green-tinged face.',
  'item-ash-fern':
    'A single grey-green fern frond, its tips scorched black as if from a fire.',
  'item-binding-resin':
    'A lump of amber resin, sticky and glossy, with a thread of it hanging down.',
  'item-armor': 'A plain leather jerkin studded with small iron rivets.',
  'item-sword':
    'A plain steel sword with a leather-wrapped grip and a short crosspiece.',
  'item-bread':
    'A round, crusty loaf of brown bread with a split across its top.',
  'item-brass-mirror-segment':
    'A curved shard of brass-framed mirror, its edge jagged and its glass clouded.',
  'item-broken-shovel':
    'A rusty shovel with a snapped wooden handle and a dented blade.',
  'item-bucket': 'A wooden bucket bound with iron hoops and a rope handle.',
  'item-charred-notebook':
    'A small leather notebook, blackened at its edges, its cover curling from fire.',
  'item-city-map':
    'A folded map of a walled city, with streets inked in brown and a red mark near the middle.',
  'item-coin': 'A single round copper coin with a worn, stamped face.',
  'item-coins': 'A single round silver coin with a crowned head stamped on it.',
  'item-cooled-slag':
    'A dull, glassy lump of black slag with a rusty-orange vein through it.',
  'item-crystal-clear-water':
    'A small glass flask of perfectly clear water, stoppered with cork.',
  'item-crystal-focus': 'A pointed clear crystal held in a ring of dark metal.',
  'item-crystal-of-light':
    'A pale crystal the size of a fist, its inside glowing a soft white.',
  'item-dragons-scale':
    'A single large scale, red at its centre and fading to black at its rim.',
  'item-druidic-charm':
    'A small charm of woven twigs and green ribbon, with an oak leaf bound in the middle.',
  'item-dull-knife':
    'A short kitchen knife with a chipped, dull blade and a worn wooden handle.',
  'item-echo-stone':
    'A smooth grey stone with a ring of thin rings carved around it like ripples.',
  'item-egg': 'A single speckled brown hen’s egg.',
  'item-emberwater-canteen':
    'A battered metal canteen with a leather strap, a faint red glow at its mouth.',
  'item-enchanted-acorn':
    'A large golden acorn with a glossy cap and a faint shimmer around it.',
  'item-enhanced-lantern':
    'A brass lantern with a clear glass chimney and a bright steady flame.',
  'item-entry-pass':
    'A stiff card of cream paper with a red wax seal and a ribbon through one corner.',
  'item-faded-photograph':
    'A small, creased photograph gone pale and brown, showing two blurred figures.',
  'item-feather': 'A long white feather with a grey tip.',
  'item-apple': 'A round red apple with a short stalk and a single green leaf.',
  'item-enhanced-echo-stone':
    'A smooth grey stone with bright rings carved around it, glowing a pale blue.',
  'item-extended-magnetic-fishing-rod':
    'A long fishing rod with a red and silver magnet tied on its line and a wooden pole slid out to a greater length.',
  'item-fresh-carrot':
    'A plump orange carrot with a bushy tuft of bright green leaves.',
  'item-magnetic-fishing-rod':
    'A short fishing rod with a red and silver magnet tied on the end of its line.',
  'item-matches': 'A small wooden box of matches, a few spilled beside it.',
  'item-natures-charm':
    'A small charm of woven green vines with a pale flower bound in its centre.',
  'item-phoenix-feather':
    'A long feather shading from deep red to gold, glowing faintly at its tip.',
  'item-room-key':
    'A brass key with a wooden tag tied to it by a leather lace.',
  'item-rope': 'A coil of thick hemp rope, loosely knotted.',
  'item-secret-documents':
    'A small stack of folded papers tied with a black ribbon and stamped with red wax.',
  'item-fish': 'A silvery fish with a round belly, glistening wet.',
  'item-fishing-rod':
    'A long, bending wooden fishing rod with a reel of line and a small hook.',
  'item-forest-heart-crystal':
    'A green crystal shaped like a heart, with a pale light in its middle.',
  'item-forest-survival-kit':
    'A canvas roll tied with cord, a flint, a small pot and a coil of twine poking out.',
  'item-fresh-bread':
    'A golden loaf of bread, still steaming, with a dusting of flour on its crust.',
  'item-guardians-chain':
    'A heavy iron chain with thick links and a broken clasp at one end.',
  'item-guardians-essence':
    'A small bottle of swirling silver mist, sealed with a wax stopper.',
  'item-healing-herbs':
    'A bundle of green herbs tied with string, with small white flowers among them.',
  'item-heat-ward-mix':
    'A small clay jar of reddish paste with a wooden spoon standing in it.',
  'item-horseshoe': 'A heavy iron horseshoe, bent a little at one heel.',
  'item-keepsake-note':
    'A small folded note of cream paper, tied with a thin blue thread.',
  'item-key': 'A small brass key with a round bow and two teeth.',
  'item-knights-redemption':
    'A plain steel sword with a worn leather grip, laid blade down.',
  'item-lantern':
    'A tin lantern with a small door and a ring on top, its candle burnt low.',
  'item-lifelight-elixir':
    'A slender glass vial of glowing golden liquid with a cork stopper.',
  'item-locket': 'A small silver locket on a fine chain, shut tight.',
  'item-loyalty-token':
    'A round bronze token with a stamped shield, worn smooth at its edge.',
  'item-magnet': 'A red and silver horseshoe-shaped magnet.',
  'item-map':
    'A rolled and creased map of a countryside, inked in brown with a few green washes.',
  'item-merchants-flyer':
    'A single printed sheet of yellowed paper, folded once, with a bold border.',
  'item-millstone-fragment':
    'A rough grey wedge of millstone, grooved on one flat side.',
  'item-miners-key':
    'A long, dark iron key with a square bow and a tag of tin tied to it.',
  'item-moon-rune-shards':
    'Three flat pale stone shards laid together, each carved with a half-moon.',
  'item-moonflowers':
    'A small bunch of pale white flowers with wide, open petals.',
  'item-mothers-letter':
    'A folded letter of cream paper sealed with a blob of red wax.',
  'item-mountain-flower':
    'A single blue mountain flower with five narrow petals and a thin stem.',
  'item-nyxs-token': 'A small, dark green leaf-shaped token on a loop of cord.',
  'item-old-oath-scrolls':
    'Two rolled parchment scrolls tied with a faded red ribbon.',
  'item-polished-shell':
    'A smooth, pearly spiral shell with pink inside its opening.',
  'item-prism-lantern':
    'A lantern with a glass prism for its chimney, throwing small bands of coloured light.',
  'item-protective-charm':
    'A small silver disc on a leather cord, with a shield cut into it.',
  'item-quality-rope':
    'A coil of thick, neat rope, tightly wound and tied off with a loop.',
  'item-quiet-charm':
    'A small wooden bell with a plug of wool stuffed in its mouth.',
  'item-rare-flower':
    'A single flower with deep purple petals and gold at its centre.',
  'item-reinforced-braces':
    'A pair of timber braces bound with iron straps at their ends.',
  'item-resonant-chant-rubbings':
    'A sheet of thin paper rubbed black with graphite, showing rows of carved marks.',
  'item-rune-token':
    'A flat grey stone token with a single glowing rune cut into it.',
  'item-rusted-locker-key':
    'A small flat key, thick with orange rust, with a number stamped on its bow.',
  'item-rusty-hoe':
    'A farm hoe with a rusty blade and a splintered wooden handle.',
  'item-rusty-saw': 'A hand saw with a rusty, toothed blade and a wooden grip.',
  'item-sea-sealed-letter':
    'A letter folded small and sealed with a blue-green wax, a salt stain across it.',
  'item-servants-pendant':
    'A small brass pendant in the shape of a key, hung on a plain cord.',
  'item-sharp-knife':
    'A short knife with a bright, sharp blade and a wooden handle.',
  'item-shiny-pebble':
    'A small, smooth, shining pebble, grey with a white stripe.',
  'item-shiny-ring': 'A thin gold ring with a tiny green stone.',
  'item-silver-leaves':
    'Three silver leaves with fine dark veins, laid side by side.',
  'item-sorceresss-truth':
    'A small mirror in a black frame, its glass showing a pale violet glow.',
  'item-squires-diary':
    'A small, worn diary with a leather cover, a strap and a pencil tucked in it.',
  'item-stick':
    'A straight, knobbly wooden stick, bare of its bark at one end.',
  'item-stillwater-phial':
    'A small glass phial of still, dark blue water, with a silver cap.',
  'item-support-straps':
    'Two stout leather straps with iron buckles, coiled together.',
  'item-training-sword':
    'A blunt wooden sword with a leather-wrapped grip and a plain crosspiece.',
  'item-travel-cloak':
    'A heavy, dark green travelling cloak with a brass clasp at the neck, folded over.',
  'item-travelers-journal':
    'A thick leather journal with a clasp, its pages swollen and worn at the edges.',
  'item-vent-stone':
    'A dark red stone, pitted like pumice, with a thin curl of smoke rising from it.',
  'item-walking-stick':
    'A tall, smooth walking stick of pale wood with a curved top.',
  'item-wandering-boots':
    'A pair of worn brown leather boots with muddy soles and loose laces.',
  'item-weathered-coin':
    'A thick old coin, green with age, its stamped face almost worn away.',
  'item-wedge-blocks': 'Three chunky wooden wedges, stacked in a small heap.',
  'item-wild-berries':
    'A small handful of dark red berries with a few green leaves.',
  'item-withered-carrot':
    'A shrunken, wrinkled carrot with a few dry green stalks.',
}

/** The picture line of each spell, by picture id; each shows the spell's effect. */
export const SPELL_PROMPTS: Readonly<Record<string, string>> = {
  'spell-bless':
    'A raised open hand with a ring of soft gold light around the palm.',
  'spell-dispel':
    'A dark swirl of smoke tearing apart into pieces over an open hand.',
  'spell-forest-speech':
    'A green leaf with a small curl of pale light rising from it like a voice.',
  'spell-forgiveness':
    'Two open hands held out together, with a warm white light between them.',
  'spell-greater-heal':
    'A large glowing leaf, bright gold-green, with rays of soft light around it.',
  'spell-grow':
    'A small green seedling in a palm of soil, with a bright new shoot unfurling.',
  'spell-heal': 'A single glowing green leaf held in a soft light.',
  'spell-hearts-truth':
    'A red heart cupped in two hands, with a clear white light in its middle.',
  'spell-light':
    'A small, warm ball of light hovering just above a pair of cupped hands.',
  'spell-mend':
    'A cracked clay cup with a gold seam of light closing across the crack.',
  'spell-nature-sense':
    'An open hand with a green vine curling up from its palm and a small light at the tip.',
  'spell-prophetic-vision':
    'An open eye of pale blue light floating above a still bowl of water.',
  'spell-purify':
    'A cup of clear water with a ring of white light spreading over it.',
  'spell-redemptions-light': 'A steady golden flame held above a cupped hand.',
  'spell-revive':
    'A drooping flower lifting its head, with a warm glow around its petals.',
  'spell-truth-sight':
    'A hand held up to an eye of pale violet light, with a thin beam through its fingers.',
  'spell-unlock':
    'A brass key surrounded by a bright ring of light, with an open padlock beside it.',
}
