// Serializable metadata for every effect: no components here, so the page can
// import it freely.
//
// `card` is the duotone the effect's chrome is drawn in — one ground, one ink,
// one accent between them. The two Arlan pieces carry their own palettes
// internally and only use the card colours for their border and corners.
//
// `aspect` varies per card so the column has rhythm; the width never changes.
//
// `mechanism` is the one-line explanation of how the thing actually works.

export const CATEGORIES = {
  type: 'Typography',
  surface: 'Surface',
  print: 'Print',
};

export const EFFECTS = [
  {
    slug: 'relief-contour',
    title: 'Relief',
    category: 'surface',
    aspect: '1344 / 620',
    card: { bg: '#0d1b2a', ink: '#ffd34e', ac: '#3f7f93' },
    tags: ['Canvas', 'Contours', 'Field'],
    blurb: 'A landscape with a word hidden at one elevation, found by a rising waterline.',
    mechanism:
      'One fixed field, one travelling level. A height field is built once per scene and drawn once as a topographic contour stack; the only thing that animates in the whole piece is the single elevation currently being lit. Because the field is frozen, the entire map rasterises into an offscreen canvas at boot and the frame cost is one drawImage plus about eight strokes. The word is not drawn anywhere — it IS the contour at one height, and at every other height the same field is landscape, with the terrain tuned loud enough that noise hills crest above the word so the plateau stays camouflaged until its own outline lights. Terrain is gated to zero before the blurred mask reaches the key band, because otherwise the noise wanders the letterform by several pixels and the word comes out melted. Contours are found in a single pass over the grid rather than one pass per level: each cell only tests the levels its own four corners span. The sweep runs four levels past both ends of the stack, so the wrap lands on a frame where nothing at all is lit — and the next word, terrain and palette cut in there.',
  },
  {
    slug: 'loom-damask',
    title: 'Loom',
    category: 'surface',
    aspect: '1344 / 620',
    card: { bg: '#c8402f', ink: '#f2dfa8', ac: '#e0a23c' },
    tags: ['Canvas', 'Weave', 'Damask'],
    blurb: 'A word woven into cloth in the same two threads as the ground.',
    mechanism:
      'Nothing is ever recoloured to make the motif. The whole card is a five-end satin in exactly two threads: warp is on top at crossing (i, j) when (i*2 + j) % 5 is under the float length f. Outside the word f is 4 and the cloth reads as warp colour; inside the word the identical satin runs at f = 1 and the same two threads read as weft colour. The letterform is a change of float length and nothing else. An earlier version flipped the over-under parity of a plain weave instead, and the word was completely invisible — a one-cell phase shift in a checkerboard carries almost no tonal weight, which is exactly why damask is woven by float length and not by parity. The blank frame is a real state of the cloth rather than a trick: f steps 4 to 3 on one side and 1 to 2 on the other, and when both reach 3 the motif is not hidden but absent, which is where the next word is swapped and the palette crossfades. Weave and dye are given opposite cadences on purpose — a loom changes shed discretely and should look it, a dye change should not — and the crossfade is quantised to eighths so its tiles cache, and sized to finish inside the blank.',
  },
  {
    slug: 'press-register',
    title: 'Press',
    category: 'print',
    aspect: '1344 / 620',
    card: { bg: '#f4efe3', ink: '#14121a', ac: '#ff2d87' },
    tags: ['Canvas', 'Print', 'Registration'],
    blurb: 'Four ink plates that lose their registration and find it again.',
    mechanism:
      'The entire animation is four offsets and four small angles. Each scene is a flat composition split across four plates, one ink each, printed onto paper by multiply — so overlaps make their own third and fourth colours for free, because multiply is what ink actually does. Nothing in the artwork ever moves relative to its own plate: what reads as the image tearing into chromatic fringes is the plates walking out of register. Every plate prints its own registration crosses in the same four corners, so they only stack into one mark when the press is true and the frame states its own condition without any chrome. New plate artwork is cut in at peak drift, when the image is already shattered, so there is no frame in which one composition becomes another — the drift the piece already needed is the cover for the swap. Angle matters as much as offset: pure translation reads as a slipped layer, while under a degree of rotation splays the fringes along one edge, which is the difference between two copies and one bad print. Plates are paper-white outside their marks, so an offset plate exposes bare sheet and multiplying white over paper leaves paper — the drift needs no padding, clipping or edge handling at all.',
  },
  {
    slug: 'tumble-blocks',
    title: 'Tumble',
    category: 'surface',
    aspect: '1344 / 620',
    card: { bg: '#120d16', ink: '#f4e3bd', ac: '#d4553a' },
    tags: ['Canvas', 'Op art', 'Tiling'],
    blurb: 'A field of cubes that keeps turning itself inside out behind a travelling wave.',
    mechanism:
      'Not one vertex changes position for the life of the card. The grid is a fixed rhombille — hexagons cut into three rhombi, shaded light, mid and dark so they read as the three faces of a cube seen corner on — and a cell flips by rotating which tone sits on which rhombus. The entire mechanism is tone[(k + g) % 3]. The front carries the palette too: cells behind it are drawn in the next colourway and cells ahead in the current one, so the boundary that already exists to flip the cubes is also the boundary that recolours them, and the recolour is a wipe because the flip was a wipe. Generation is closed form rather than accumulated — a cell\u2019s state is the number of fronts that have passed it, and since fronts are evenly spaced in time that count solves directly from t, so there is no per-cell state, nothing to drift, and a resize or a tab-resume lands on exactly the right frame. The flip is a hard cut on purpose: easing between two tone triples walks a cell through colours that belong to neither reading and it stops being a cube on the way, and a bistable figure is something the eye switches rather than dissolves.',
  },
  {
    slug: 'marble-bath',
    title: 'Marble',
    category: 'print',
    aspect: '1344 / 620',
    card: { bg: '#efe6d2', ink: '#13293d', ac: '#d1495b' },
    tags: ['Canvas', 'Suminagashi', 'Transforms'],
    blurb: 'A marbled sheet being made, and wiped, by the same operation.',
    mechanism:
      'No fluid simulation, no particles, no texture. The picture is a list of closed polylines plus the history of every transform applied after they were laid down, and there are only two transforms, both closed form: a drop sends P to C + (P - C) * sqrt(1 + r^2/|P - C|^2), and a tine drags points along a line with a falloff in perpendicular distance. The drop is area preserving, which is the whole reason this works — dropping again on the same spot turns the previous drop into a ring of equal area rather than covering it, so concentric rings are not drawn, they are what repeated drops leave behind. An early version scattered the drops instead of stacking them and produced nothing but random blobs. Drops at one centre compose by adding r squared, so a growing drop can be animated as a run of small ones and stay exact at every frame — but equal increments grow the radius as sqrt(n), which front-loads badly, so each increment is instead solved from the radius curve either side of it. The sheet clears itself with the same operation that filled it: a drop of clear water at the centre, growing until its disc covers the card, pushing every ring of pigment off the edges. It is given the next scene\u2019s paper colour, so the clear water and the new sheet are the same object and the piece has no transition code. Time is quantised to 30Hz and state is a pure function of the tick, replayed from zero whenever a seek goes backwards, so a resize, a tab-resume and the loop seam are correct rather than merely close.',
  },
  {
    slug: 'moire-type',
    title: 'Moiré type',
    category: 'type',
    aspect: '1 / 1',
    card: { bg: '#f3f1e9', ink: '#141210', ac: '#6b655c' },
    tags: ['Canvas', 'Moiré', 'Type'],
    blurb: 'A word made of nothing but the disagreement between two rulings.',
    mechanism:
      'The word is never drawn. The field is ruled edge to edge with parallel lines, a second ruling is laid inside the letterforms, and the type exists only where the two disagree — there is no ink in the shape of a letter anywhere in the piece. They disagree in angle, spacing and phase at once, because rotation alone reads as a stencil while a period difference is what throws the beat bands across the counters. All three divergences, and each glyph\u2019s own heavy-tailed tilt, scale by one number. That buys the rest: the word comes into existence rather than fading in, and at zero the second ruling IS the first, so the field goes perfectly uniform and the word is absent rather than hidden. That empty frame is where the next word and palette cut in, which is why the piece has no transition code.',
  },
  {
    slug: 'flood-type',
    title: 'Flood type',
    category: 'type',
    aspect: '1344 / 620',
    card: { bg: '#0b3d2e', ink: '#d8ff4f', ac: '#8fd43a' },
    tags: ['Canvas', 'Type', 'Camera'],
    blurb: 'A wordmark falls in, holds, then rushes the camera until it overruns the frame.',
    mechanism:
      'A handful of global ramps and four constants per letter — no spring, no physics, no blur. The 3D is one cosine: drawing a glyph at a horizontal scale of cos(yaw) IS that glyph turned about its own axis under orthographic projection, and keeping the sign mirrors a letter turned past 90 degrees. The zoom is a sampled table that hangs for its first third, snaps through the middle and overshoots about 3% of the settled size, which is what gives the type mass. The turn lags the drop by a power of 2.5, so a letter is still turned as it crosses into view rather than finishing its spin above the top edge. Depth scales each letter’s size but never its position, since scaling symmetric glyph offsets by their own depth walks the word off centre exactly as it arrives.',
  },
  {
    slug: 'stamp-type',
    title: 'Stamp type',
    category: 'type',
    aspect: '1344 / 620',
    card: { bg: '#3f40ff', ink: '#58f683', ac: '#4ac96b' },
    tags: ['Canvas', 'Poster', 'Stamps'],
    blurb: 'Four lines on flat bars hop in, park to be read, then scatter — leaving printed residue.',
    mechanism:
      'One mechanism carries all of it: every visible thing is a line of text on a highlight bar walking a breakpoint track, and whenever it moves it stamps its flat silhouette where it just was. Stamps live exactly sixteen frames and vanish all at once — no fade, no shrink — which is what makes them read as printed residue rather than motion blur. The silhouette is the rounded bar unioned with the glyphs stroked fat in bar colour, and that union is where the descender drips come from. The choreography is data, not an easing function: four tracks of [frame, x, y], axis-aligned and deliberately stop-start at 20fps on a 10Hz cadence. Stamps are recomputed from the tracks every frame rather than accumulated, so the loop seam, a resize and a tab-resume all land on exactly the right residue. Transitions are free: the incoming pass starts twelve frames before the outgoing one ends, and the two sets of trails ARE the colour flood.',
  },
  {
    slug: 'ember-type',
    title: 'Ember type',
    category: 'type',
    aspect: '3 / 2',
    card: { bg: '#111111', ink: '#f5a623', ac: '#b9740f' },
    tags: ['Canvas', 'Fire', 'Type'],
    blurb: 'A word used as fuel: it burns away at the edges and keeps reforming.',
    mechanism:
      "Doom's 1993 fire routine. Heat sits on a coarse grid; every cell copies the one below it, loses a random amount and drifts a column sideways. Run that upward each frame and convection falls out of almost no arithmetic — no particles, no physics. The twist is the seed: rather than a hot strip along the floor, the word's own pixels are pinned at maximum heat, so the letters are the fuel.",
  },
  {
    slug: 'echo-trail',
    title: 'Echo trail',
    category: 'type',
    aspect: '2 / 1',
    card: { bg: '#2a0e3d', ink: '#ff7ad9', ac: '#b457c9' },
    tags: ['Canvas', 'Type', 'Motion'],
    blurb: 'A word that smears into dozens of fading copies as you throw it around.',
    mechanism:
      'A ring buffer records the last N pointer positions. The word is stamped once at each one, oldest first, with alpha falling off down the trail. Nothing is blurred and nothing is post-processed — the softness is purely how many translucent copies happen to overlap.',
  },
];

export const BY_SLUG = Object.fromEntries(EFFECTS.map((e) => [e.slug, e]));
