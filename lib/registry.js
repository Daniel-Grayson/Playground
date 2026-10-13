// Serializable metadata for every effect. No components here, so server
// components and the gallery can import it freely.
//
// `mechanism` is the one-line explanation of how the thing actually works —
// the part worth being able to say out loud in an interview.

export const CATEGORIES = {
  type: 'Typography',
  shader: 'Shaders & image',
  ui: 'Microinteractions',
  generative: 'Generative',
};

export const EFFECTS = [
  {
    slug: 'ribbon-type',
    title: 'Ribbon type',
    category: 'type',
    tags: ['Canvas', 'Type', '3D'],
    blurb: 'A word twisting through space like a strip of paper caught mid-turn.',
    mechanism:
      'The word is drawn once to an offscreen canvas, then redrawn as vertical slices. Each slice rotates about the horizontal axis running through the word — the ribbon\u2019s spine — on a travelling sine wave, so its projected height becomes cos(angle) and so does the light it catches. No 3D engine: one cosine gives the geometry and the shading at once.',
    controls: ['text', 'twist', 'speed', 'slices'],
  },
  {
    slug: 'shatter-type',
    title: 'Shatter type',
    category: 'type',
    tags: ['Canvas', 'Type', 'Physics'],
    blurb: 'Type that breaks into shards under the cursor and crawls back together.',
    mechanism:
      'The word is sampled into a grid of tiles. Each tile stores its home position and gets pushed by an inverse-square force from the pointer, then springs home. The glass look is one clipped drawImage per tile from the source bitmap — the letters are never re-rendered.',
    controls: ['text', 'tiles', 'force', 'springback'],
  },
  {
    slug: 'scramble-type',
    title: 'Scramble type',
    category: 'type',
    tags: ['DOM', 'Type', 'Text'],
    blurb: 'Text that resolves out of noise, one character locking in at a time.',
    mechanism:
      'Every character gets a random reveal frame. Before its turn it shows a glyph from a fixed charset, reseeded a few times a second so it reads as churn rather than static. Pure DOM text, so it stays selectable, searchable, and screen-reader friendly via the untouched aria-label.',
    controls: ['text', 'speed', 'stagger'],
  },
  {
    slug: 'gravity-type',
    title: 'Gravity type',
    category: 'type',
    tags: ['Canvas', 'Type', 'Physics'],
    blurb: 'Letters drop out of the headline and pile up at the bottom of the box.',
    mechanism:
      'Each letter is a box with a position, velocity and spin, integrated semi-implicitly. Collisions resolve against the floor and against other boxes by separating them along the shallowest overlap axis — a stripped-down version of what a real 2D physics engine does, in about forty lines.',
    controls: ['text', 'gravity', 'bounce'],
  },
  {
    slug: 'echo-trail',
    title: 'Echo trail',
    category: 'type',
    tags: ['Canvas', 'Type', 'Motion'],
    blurb: 'A word that smears into dozens of fading copies as you throw it around.',
    mechanism:
      'A ring buffer records the last N pointer positions. The word is stamped once at each one, oldest first, with alpha falling off down the trail. Nothing is blurred and nothing is post-processed — the softness is purely how many translucent copies happen to overlap.',
    controls: ['text', 'echoes', 'falloff'],
  },
  {
    slug: 'halftone',
    title: 'Halftone press',
    category: 'shader',
    tags: ['WebGL2', 'Halftone', 'Print'],
    blurb: 'Live imagery screened into CMYK dots like a newspaper plate.',
    mechanism:
      'Four copies of the source are sampled through grids rotated to the classic print angles (15°, 75°, 0°, 45°). In each grid the fragment measures its distance to the nearest cell centre and compares it to that channel’s ink coverage; under the threshold it prints a dot. Rotating the grids is what stops the four screens forming a moiré.',
    controls: ['scale', 'angle', 'contrast'],
  },
  {
    slug: 'ascii',
    title: 'ASCII engine',
    category: 'shader',
    tags: ['WebGL2', 'ASCII', 'Atlas'],
    blurb: 'Anything on screen re-rendered as a wall of living text.',
    mechanism:
      'A glyph atlas is drawn at runtime to a 2D canvas, ordered from lightest to heaviest ink. The shader averages each cell of the source, maps that brightness to an atlas index, and samples the glyph’s sub-rectangle. One texture lookup per pixel — the character set can change without touching the shader.',
    controls: ['cell', 'charset', 'color'],
  },
  {
    slug: 'dither',
    title: 'Ordered dither',
    category: 'shader',
    tags: ['WebGL2', 'Dither', 'Retro'],
    blurb: 'Smooth gradients crushed to a handful of colours without looking flat.',
    mechanism:
      'An 8×8 Bayer matrix, generated rather than hardcoded, adds a position-dependent offset to each pixel before quantising. The threshold pattern tricks the eye into averaging neighbours back into the missing shades, which is how 2-bit displays faked gradients.',
    controls: ['levels', 'matrix', 'scale'],
  },
  {
    slug: 'displace',
    title: 'Ripple displace',
    category: 'shader',
    tags: ['WebGL2', 'Distortion', 'Pointer'],
    blurb: 'The image bends away from your cursor and splits into colour at the edges.',
    mechanism:
      'The pointer writes a decaying wave into the UV lookup: sample the texture at an offset that falls off with distance and oscillates with time. Sampling red, green and blue at slightly different offsets gives the chromatic fringe, because a real lens cannot focus all three on the same spot either.',
    controls: ['strength', 'radius', 'aberration'],
  },
  {
    slug: 'magnetic-button',
    title: 'Magnetic button',
    category: 'ui',
    tags: ['DOM', 'Spring', 'Hover'],
    blurb: 'A button that leans toward the cursor and springs back when you miss.',
    mechanism:
      'Pointer offset inside a padded hit area drives a critically-damped spring, so it settles without the wobble a plain ease gives you. The label moves further than the body on the same spring, and that tiny parallax is the whole reason it reads as physical.',
    controls: ['pull', 'stiffness', 'parallax'],
  },
  {
    slug: 'squircle',
    title: 'Squircle',
    category: 'ui',
    tags: ['SVG', 'Superellipse', 'Math'],
    blurb: 'The corner Apple uses — curvature that flows instead of kinking.',
    mechanism:
      'A rounded rectangle jumps from zero curvature to constant curvature the instant the arc starts, and the eye catches it. A superellipse |x/a|ⁿ + |y/b|ⁿ = 1 has no such jump. The path is sampled from that equation, so n is a dial: 2 is an ellipse, ~4 is the iOS corner, high n is a rectangle.',
    controls: ['n', 'radius', 'compare'],
  },
  {
    slug: 'cursor-lens',
    title: 'Cursor lens',
    category: 'ui',
    tags: ['Canvas', 'Cursor', 'Lens'],
    blurb: 'A glass disc that follows the pointer and bends whatever is under it.',
    mechanism:
      'The content is drawn to an offscreen canvas, then redrawn inside a circular clip with coordinates pushed outward by a barrel-distortion curve. Inverting the text colour inside the disc is a second pass with a difference blend — which is what makes it read as glass rather than as a zoom.',
    controls: ['size', 'zoom', 'invert'],
  },
  {
    slug: 'morph-tabs',
    title: 'Morph tabs',
    category: 'ui',
    tags: ['DOM', 'Spring', 'Squash'],
    blurb: 'A tab indicator that stretches as it travels and settles with a wobble.',
    mechanism:
      'The pill tracks the target rect on a spring, but its width also takes a term proportional to current velocity. Moving fast makes it long and thin; arriving makes it overshoot and snap back. Squash-and-stretch, borrowed straight from hand animation.',
    controls: ['stiffness', 'stretch', 'damping'],
  },
  {
    slug: 'flow-field',
    title: 'Flow field',
    category: 'generative',
    tags: ['Canvas', 'Noise', 'Particles'],
    blurb: 'Thousands of particles combing through an invisible current.',
    mechanism:
      'A value-noise field is read as an angle at every point, and each particle simply walks in the direction it finds. The trails come from never clearing the canvas — each frame paints a nearly-transparent wash over the last, so old paths decay instead of vanishing.',
    controls: ['count', 'scale', 'speed', 'fade'],
  },
  {
    slug: 'dot-ripple',
    title: 'Dot ripple',
    category: 'generative',
    tags: ['Canvas', 'Grid', 'Wave'],
    blurb: 'A grid of dots that carries your clicks outward as rings.',
    mechanism:
      'Each click pushes a ring onto a small list. Every dot measures its distance to each live ring and takes a displacement from a windowed sine — so the wave has a front and a back instead of ringing forever. Rings expire off the list, which keeps the cost flat however long the page is open.',
    controls: ['spacing', 'speed', 'amplitude'],
  },
  {
    slug: 'mesh-gradient',
    title: 'Mesh gradient',
    category: 'generative',
    tags: ['WebGL2', 'Gradient', 'Noise'],
    blurb: 'Slow-drifting colour fog, the kind that sits behind a hero section.',
    mechanism:
      'Four colour sources orbit on their own slow loops; every fragment blends them by inverse-square distance. Domain-warping the coordinates with noise before the blend is what turns four tidy blobs into something that looks like weather.',
    controls: ['warp', 'speed', 'grain'],
  },
  {
    slug: 'orbit-field',
    title: 'Orbit field',
    category: 'generative',
    tags: ['Canvas', 'Orbit', 'Depth'],
    blurb: 'Points circling a tilted sphere, dimming as they pass behind it.',
    mechanism:
      'Points are distributed evenly over a sphere with the Fibonacci lattice — golden-angle spacing avoids the clumping at the poles you get from naive random latitude/longitude. Rotate, project, then use z for both radius and alpha so depth comes out of one number.',
    controls: ['count', 'speed', 'tilt'],
  },
];

export const BY_SLUG = Object.fromEntries(EFFECTS.map((e) => [e.slug, e]));
