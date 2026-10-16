// Plate — a wet-plate photograph that develops wherever it is warm.
//
// Reference: the Red Dead Redemption 2 loading screen, studied frame by frame
// from a screen recording. What it actually does is not a reveal of a second
// picture. It starts as the photograph's own NEGATIVE — cool silver, tones
// flipped, the white cross on a black sky — and the positive spreads across it
// in soft smoky patches until the warm sepia print is all that is left. The
// boundary between the two is a wide grey haze, not a line.
//
// That haze is the mechanism, not a wipe laid on top of it.
//
//   neg(g) = negDark + (1 - g)(negLight - negDark)
//   pos(g) = posDark +      g (posLight - posDark)
//
// Blend them by a development amount d. The sum pos(g) + neg(g) loses its
// dependence on g exactly when both ramps span the same range per channel,
// posLight - posDark = negLight - negDark. With that one identity held, every
// pixel at d = 0.5 is the same colour whatever the photograph says there: the
// picture is not hidden at the boundary, it is absent. That is why the edge of
// a developing patch reads as smoke — it is the one place the plate has no
// image at all. NEG_LIGHT is derived below rather than chosen, so the identity
// cannot drift out of true when a colour is retuned.
//
// So the whole piece is one photograph and one number per place: d. Nothing
// is masked, cut out or crossfaded between two images. In practice d = 0 and
// d = 1 are pre-toned into two canvases and the frame composites the positive
// over the negative with d as its alpha — which is the same linear blend,
// done by the compositor instead of per pixel.
//
// d is driven by heat. A coarse grid, sized in rows of card height so a phone
// card and a desktop card get the same field, diffuses and cools every tick,
// and the pointer lays heat down along its whole path between ticks so a fast
// flick is a stroke rather than a row of dots. Heat becomes development
// through a threshold that a slowly moving smoke noise multiplies — multiplies,
// not adds, so where there is no heat there is no development however the
// noise swings, and the cold plate never blooms on its own. Development rises
// fast and falls slowly: the print comes up as soon as it is warm and lingers
// as it cools, which is what makes it read as a material rather than a cursor
// mask.
//
// The plate changes every CYCLE seconds, and the change is the same heat.
// A ring of it spreads from one point until it has crossed the whole card,
// and each cell switches to the next photograph at the moment its development
// passes 0.5 on the way up — the instant, by the identity above, that the
// cell shows no image at all. So nothing ever cuts from one picture to
// another: the wave develops the incoming photograph in sepia as it passes and
// leaves it to cool into its own negative behind. A cell the ring crosses
// without warming enough (the smoke can starve it) is swapped once the ring is
// well past; that is rare and lands in the soft tail of the wave.
//
// This is the one piece in the vault besides Marble that cannot be a pure
// function of t: its state is the pointer's history. The field lives in grid
// cells rather than pixels, so a resize keeps it; ticks are fixed-step and
// capped per frame, so a tab-resume cools the plate instead of replaying a
// minute of physics.
//
// The photographs are 1860s survey and expedition plates, all public domain;
// each is credited where it is listed below.

export const PLATES = [
  // Timothy H. O'Sullivan, Sand Dunes, Carson Desert, Nevada, 1867.
  // Cleveland Museum of Art 2002.45, CC0.
  '/plate/carson-desert.jpg',
  // Timothy H. O'Sullivan, Iceberg Canyon, Colorado River Looking Above, c. 1871.
  // Cleveland Museum of Art 2002.46, CC0.
  '/plate/iceberg-canyon.jpg',
  // Eadweard J. Muybridge, Valley of the Yosemite, from Rocky Ford, 1872.
  // Cleveland Museum of Art 1990.133, CC0.
  '/plate/rocky-ford.jpg',
  // Carleton E. Watkins, Bridal Veil, Yosemite, 1865-66.
  // Cleveland Museum of Art 1992.12, CC0.
  '/plate/bridal-veil.jpg',
];
// Two tones each way. Sepia print; cool silver negative.
export const POS_DARK = [40, 28, 18];
export const POS_LIGHT = [232, 216, 184];
export const NEG_DARK = [12, 16, 26];
// Derived: equal span per channel is what makes d = 0.5 uniform (see above).
export const NEG_LIGHT = NEG_DARK.map((v, i) => v + POS_LIGHT[i] - POS_DARK[i]);

// Tone curve on the photograph's luminance: albumen prints are contrasty.
export const CONTRAST = 1.1;
export const GRAIN = 0.035;          // ± in luminance, per CSS px
export const VIGNETTE = 0.55;        // how dark the corners of the print go
export const VIGNETTE_WOBBLE = 0.18; // the plate's poured, uneven edge

// The heat field. Rows are fixed; columns follow the card's aspect.
export const GRID_ROWS = 56;
export const TICK_HZ = 60;
export const MAX_TICKS = 6;          // per frame; a resumed tab cools, it does not replay
export const DIFFUSE = 0.18;         // per tick, toward the 4-neighbour mean
export const COOL_HALF = 0.5;        // s, heat half-life

// The pointer's brush, as a fraction of card height.
export const BRUSH_R = 0.13;
export const BRUSH_HEAT = 9;         // per second at the brush centre

// Heat -> development.
export const DEV_LO = 0.18;
export const DEV_HI = 0.62;
export const SMOKE_SCALE = 0.19;     // noise cycles per grid row
export const SMOKE_OCTAVES = 4;
export const SMOKE_DRIFT = 0.12;     // rows per second the smoke moves
export const SMOKE_AMT = 1.25;       // multiplies heat by 1 ± this × the noise
export const RISE_HALF = 0.06;       // s
export const FALL_HALF = 0.35;       // s

// The change of plate.
export const CYCLE = 5;              // s between changes, start to start
export const SWEEP = 1.9;            // s for the ring to cross the whole card
export const RING_W = 0.16;          // ring half-width, fraction of card height
export const RING_HEAT = 6;          // per second at the ring's crest
export const FORCE_LAG = 0.5;        // card heights behind the ring before a cell is swapped regardless

/** Where scene k's ring starts, in 0..1 card units. */
export function originOf(k) {
  const h = (n) => { const s = Math.sin(k * 12.9898 + n * 78.233) * 43758.5453; return s - Math.floor(s); };
  return { x: 0.15 + 0.7 * h(1), y: 0.2 + 0.6 * h(2) };
}
