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
};

export const EFFECTS = [
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
