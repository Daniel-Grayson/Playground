// Serializable metadata for every effect: no components here, so the page can
// import it freely.
//
// `card` is the duotone the effect is drawn in — one ground, one ink, one
// accent between them. The range comes from the eight pairs, not from piling
// hues into a single card.
//
// `aspect` varies per card so the column has rhythm; the width never changes.
//
// `mechanism` is the one-line explanation of how the thing actually works.

export const CATEGORIES = {
  type: 'Typography',
  generative: 'Generative',
};

export const EFFECTS = [
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
    slug: 'ribbon-type',
    title: 'Ribbon type',
    category: 'type',
    aspect: '1344 / 620',
    card: { bg: '#0c211d', ink: '#c9f2dd', ac: '#4fd1a5' },
    tags: ['Canvas', 'Type', '3D'],
    blurb: 'A word twisting through space like a strip of paper caught mid-turn.',
    mechanism:
      'The word is drawn once to an offscreen canvas, then redrawn as vertical slices. Each slice rotates about the horizontal axis running through the word — the ribbon’s spine — on a travelling sine wave, so its projected height becomes cos(angle) and so does the light it catches. No 3D engine: one cosine gives the geometry and the shading at once.',
  },
  {
    slug: 'shatter-type',
    title: 'Shatter type',
    category: 'type',
    aspect: '16 / 9',
    card: { bg: '#15173a', ink: '#ffcf5c', ac: '#ff9f43' },
    tags: ['Canvas', 'Type', 'Physics'],
    blurb: 'Type that breaks into shards under the cursor and crawls back together.',
    mechanism:
      'The word is sampled into a grid of tiles. Each tile stores its home position and gets pushed by an inverse-square force from the pointer, then springs home. The glass look is one clipped drawImage per tile from the source bitmap — the letters are never re-rendered.',
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
  {
    slug: 'confetti-burst',
    title: 'Confetti burst',
    category: 'generative',
    aspect: '3 / 2',
    card: { bg: '#ff4a1c', ink: '#fff3e4', ac: '#ffd0ae' },
    tags: ['Canvas', 'Physics', 'Press'],
    blurb: 'Press anywhere and it throws a handful of paper into the air.',
    mechanism:
      'Gravity alone makes scraps fall like gravel. Three other terms do the work: air drag, stronger across than down so throws lose their sideways speed first; spin; and a drawn width that tracks the cosine of the angle, so each scrap turns edge-on and nearly vanishes twice per rotation. That last one is the flutter, and it is a drawing trick rather than simulated aerodynamics.',
  },
  {
    slug: 'flow-field',
    title: 'Flow field',
    category: 'generative',
    aspect: '1344 / 896',
    card: { bg: '#0b0b0c', ink: '#d9dde6', ac: '#7f8aa3' },
    tags: ['Canvas', 'Noise', 'Particles'],
    blurb: 'Thousands of particles combing through an invisible current.',
    mechanism:
      'A value-noise field is read as an angle at every point, and each particle simply walks in the direction it finds. The trails come from never clearing the canvas — each frame paints a nearly-transparent wash over the last, so old paths decay instead of vanishing.',
  },
  {
    slug: 'dot-ripple',
    title: 'Dot ripple',
    category: 'generative',
    aspect: '4 / 3',
    card: { bg: '#1b3a8f', ink: '#dbe8ff', ac: '#7fa8f0' },
    tags: ['Canvas', 'Grid', 'Wave'],
    blurb: 'A grid of dots that carries your clicks outward as rings.',
    mechanism:
      'Each click pushes a ring onto a small list. Every dot measures its distance to each live ring and takes a displacement from a windowed sine — so the wave has a front and a back instead of ringing forever. Rings expire off the list, which keeps the cost flat however long the page is open.',
  },
  {
    slug: 'orbit-field',
    title: 'Orbit field',
    category: 'generative',
    aspect: '1344 / 820',
    card: { bg: '#f2efe4', ink: '#00a2c4', ac: '#0b6b80' },
    tags: ['Canvas', 'Orbit', 'Depth'],
    blurb: 'Points circling a tilted sphere, dimming as they pass behind it.',
    mechanism:
      'Points are distributed evenly over a sphere with the Fibonacci lattice — golden-angle spacing avoids the clumping at the poles you get from naive random latitude/longitude. Rotate, project, then use z for both radius and alpha so depth comes out of one number.',
  },
];

export const BY_SLUG = Object.fromEntries(EFFECTS.map((e) => [e.slug, e]));
