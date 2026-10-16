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
    slug: 'like-confetti',
    title: 'Like',
    category: 'surface',
    aspect: '9 / 8',
    card: { bg: '#f2f2f2', ink: '#fc157c', ac: '#bcbcbc' },
    tags: ['Canvas', 'Interface', 'Confetti'],
    blurb: 'A like button whose reaction is confetti that breathes out of the heart and gathers back into it.',
    mechanism:
      'Every curve is a table measured off the reference recording at 30fps, one entry a frame. On press the outline heart is pulled in to 0.75 over four frames on a cubic ease-in. The burst follows: the cluster appears at 0.40 of its spread, reaches 0.82 two frames later, creeps to full by half a second, then is drawn back in, accelerating, and on the very next frame the filled heart is there at 1.53 times its size, settling by multiplying its excess by about 0.55 a frame, with no overshoot below one. The filled heart holds for two seconds and then cuts back to the outline on its own, ready to be pressed again; pressing during the hold cuts back early. The reference bursts a cluster of little characters; here it is confetti, but the burst is still ONE number, the cluster\u2019s spread. Every piece has a home offset from the heart\u2019s centre and sits at home times spread, so the whole cloud breathes out and in as one body, which is why it reads as the heart reacting rather than as particles flying about. The only per-piece motion is spin and flutter, the flutter a cosine on the piece\u2019s height, which is a flat scrap of paper turning in 3D. Nothing starts until it is pressed, and the canvas is only redrawn while something is changing.',
  },
  {
    slug: 'sticker-flip',
    title: 'Flip',
    category: 'print',
    aspect: '9 / 8',
    card: { bg: '#110000', ink: '#ffffff', ac: '#5c2a2a' },
    tags: ['Canvas', 'Stickers', 'Flipbook'],
    blurb: 'A stack of stickers flipped one at a time, on a beat the pointer sets.',
    mechanism:
      'One sticker at a time, centred on a dark ground, and a hard cut to the next. The timing was measured off the reference recording frame by frame: every sticker holds for 25 to 27 frames of a 60fps capture, about 0.42s, and the change has not one in-between frame \u2014 no fade, no scale, no slide. The cut is the whole effect, because a flipbook reads as a beat precisely when nothing eases, and each sticker carries its own tilt, so the sequence jumps about the way a hand-cut stack does without anything actually moving. The pointer sets the beat: its horizontal position picks the hold time on a geometric scale, from a slow leaf-through at the left edge to a riffle at the right, so one mechanism is a slideshow or a flicker depending on where you hold it. The beat is a phase in leaves advanced by one over the hold each second, so changing speed never jumps the book to a different page, and since a flipbook only changes on a cut, the canvas is redrawn only on a cut.',
  },
  {
    slug: 'post-cities',
    title: 'Post',
    category: 'print',
    aspect: '4 / 3',
    card: { bg: '#e9e4d8', ink: '#2b2721', ac: '#a59d8c' },
    tags: ['Canvas', 'Photograph', 'Stamps'],
    blurb: 'An album page of city stamps, real photographs graded into one ink each, that you can pick up and put anywhere.',
    mechanism:
      'Eight stamps, eight cities, and every stamp exactly two colours \u2014 one ink and the paper it is printed on \u2014 which is why the sheet can carry eight hues without turning to mush. The pictures are real photographs of each city, all CC0 or public domain, and the colour grade is what makes them stamps. It throws away every hue the photograph had and keeps all of its light: levels are set from each picture\u2019s own 2nd and 98th percentiles so a hazy shot and a hard one land on the same range, a gentle S-curve gives print contrast, and then luminance alone picks a colour along one ramp, from the ink\u2019s deep shade through the ink itself to the paper. That is what a monochrome print is, and it is why a blue-sky Paris and a sand-coloured Giza come out belonging to the same sheet. The grade runs once per stamp per resize, at the size the stamp is drawn when held, so lifting never blurs it. The interaction is the one thing you do with a loose stamp: pick it up and put it somewhere else. Press on a stamp and it comes up off the sheet \u2014 it grows a little, squares up and its shadow lengthens and softens \u2014 and it goes wherever the pointer takes it, held by the point it was taken at so it never jumps to centre itself. Let go and it settles where it was put, back to its own tilt. Each of those is read from a single damped number per stamp, so there is no lift animation and no settle animation, only a target and a follower. A stamp that has been picked up stays on top of the pile, and nothing on the sheet moves unless it is being moved: no idle motion, no hover motion.',
  },
  {
    slug: 'lamp-nav',
    title: 'Lamp',
    category: 'surface',
    aspect: '3 / 2',
    card: { bg: '#eeeef0', ink: '#101013', ac: '#8e8e94' },
    tags: ['Canvas', 'Interface', 'Light'],
    blurb: 'A navigation bar lit by one travelling lamp, and a horse that runs on the spot when the light finds it.',
    mechanism:
      'A page, a panel inset from its top left with one rounded corner, and a bar at the top of that panel \u2014 the composition is the reference screenshot it was built from. One scalar field drives everything on it. The pointer is a lamp held over the panel, and every mark reads the same inverse-square falloff at its own position \u2014 there is no hover state, no active item, no enter or leave transition and no per-element tween anywhere in the piece. Sampling per mark rather than per element is what makes it worth building: each glyph of a word samples at its own centre, so a word lights letter by letter as the lamp crosses it and the far end is still grey while the near end is full ink, which is a thing a hover state cannot do at any price. The horse is the user\u2019s own artwork for everything above the legs \u2014 head, arched neck, mane, chest, barrel and tail, drawn verbatim \u2014 with jointed legs built underneath it. Two earlier attempts failed in opposite directions: cutting the artwork apart and swinging its frozen legs kept the look but could only scissor, because a gallop is the knee and hock folding the leg away, and a flat outline has no second joint; building the whole animal from stroked limbs galloped but stopped looking like a horse. So only the legs are built, and shaped like legs: three segments each \u2014 upper, cannon and pastern \u2014 heavy at the forearm and thigh, slim below, kinking forward at the fetlock to a squared hoof, with the backward hock on the hind pair. No leg is ever a straight line, not even the one carrying the weight, and a two-segment leg has no fetlock, which is why an earlier standing pose read as four posts. Everything is filled in one colour, legs first and the body over their roots, so no join shows. The figure is lit by the same field and then rasterised to a thirty-row buffer and blown up with smoothing off: rasterising the ANIMATION rather than the artwork is what lets it be pixel art and still run. Unlit marks settle to a grey floor rather than to nothing, which is why the bar still reads as a bar when the light is elsewhere. The horse runs on the spot while the lamp is over it, in a transverse gallop keyed frame by frame from a reference gallop loop rather than computed: absolute angles for each leg segment at eight points of the stride, interpolated linearly so nothing overshoots. The hind pair lands first and close together and the fore pair half a stride later, leaving one moment with nothing on the ground, and the body lifts and pitches through it. Once started the gallop always finishes \u2014 leaving does not stop it mid-air, it stops where the swing is zero, so the cycle\u2019s own end IS the rest pose and the piece needs no settle tween. The lamp is damped toward the pointer, or toward a travelling path when there is none, and because a damped follower converges from wherever it happens to be, a resize and a tab-resume heal themselves instead of drifting.',
  },
  {
    slug: 'plate-develop',
    title: 'Plate',
    category: 'print',
    aspect: '3 / 2',
    card: { bg: '#0c101a', ink: '#e8d8b8', ac: '#7a7468' },
    tags: ['Canvas', 'Photograph', 'Heat'],
    blurb: '1860s photographs held as their own negatives, developed by warmth wherever you linger.',
    mechanism:
      'One photograph and one number per place. The plate is shown as its own negative in cool silver; warmth develops it toward the sepia print, and the frame is just the positive composited over the negative with that development amount as alpha. The two tonings are built so that each colour channel spans the same range in both, and that single identity is what makes the boundary: halfway developed, every pixel comes out the same grey whatever the photograph holds there, so the edge of a developing patch is not a wipe but the one place the picture is absent, and it reads as smoke. Warmth is a coarse field measured in rows of card height, so phone and desktop cards share it. It diffuses and cools every tick, and the pointer lays heat along its whole path so a flick is a stroke rather than dots. Heat becomes development through a threshold that slowly moving smoke noise multiplies rather than offsets, so a cold plate can never bloom on its own. The print comes up fast and sinks back slowly, which is the difference between a material and a cursor mask. Every five seconds the plate changes, and the change is the same heat: a ring of it spreads from one point across the whole card, and each place switches to the next photograph at the instant its development passes one half, the moment it shows no image at all. Nothing ever cuts from one picture to another; the wave develops the incoming photograph in sepia as it passes and leaves it to cool into its own negative. The photographs are 1860s survey plates, all public domain.',
  },
  {
    slug: 'leader-count',
    title: 'Leader',
    category: 'type',
    aspect: '1344 / 620',
    card: { bg: '#3d2bff', ink: '#ffe14d', ac: '#8f7ff0' },
    tags: ['Canvas', 'Film', 'Countdown'],
    blurb: 'Title cards at the head of a reel, each line rushing the lens and overrunning the frame.',
    mechanism:
      'A handful of global ramps and four constants per letter \u2014 no spring, no physics, no blur. The 3D is one cosine: drawing a glyph at a horizontal scale of cos(yaw) IS that glyph turned about its own axis under orthographic projection, and keeping the sign mirrors a letter turned past 90 degrees. The zoom is a sampled table that hangs for its first third, snaps through the middle and overshoots about 3% of the settled size, which is what gives the type mass. The turn lags the drop by a power of 2.5, so a numeral is still turning as it crosses into view rather than finishing its spin above the top edge. Depth scales each glyph\u2019s size but never its position, since scaling symmetric glyph offsets by their own depth walks the word off centre exactly as it arrives. The subject is what justifies the motion rather than decorating it: a title card is meant to arrive, hold just long enough to be read and then overrun the frame, because the next line is already coming. So the sequence runs in order and never shuffles, since a sentence delivered in a random order is not a sentence, and the stock changes on every card, dark ground to light and back, which is the flash of a leader on a screen and the piece\u2019s two colours at once.',
  },
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
    slug: 'transit-stamp',
    title: 'Transit',
    category: 'print',
    aspect: '1344 / 620',
    card: { bg: '#d4142a', ink: '#ffe14d', ac: '#f0736a' },
    tags: ['Canvas', 'Document', 'Stamps'],
    blurb: 'A waybill crossing a customs hall, picking up an impression at every station it stops at.',
    mechanism:
      'One mechanism carries all of it: every visible thing is a line of text on an inked bar walking a breakpoint track, and whenever it moves it stamps its flat silhouette where it just was. Stamps live exactly sixteen frames and vanish all at once \u2014 no fade, no shrink \u2014 which is what makes them read as printed residue rather than motion blur. The silhouette is the rounded bar unioned with the glyphs stroked fat in bar colour, and that union is where the descender drips come from. The subject makes the residue literal: a parcel through a customs hall picks up an impression at every station it stops at, so the trail the mechanism already leaves IS the stack of stamps such a document accumulates, and each bar is the inked block with the paper knocked out of it, which is how a solid rubber stamp actually prints. The choreography is data, not an easing function: four tracks of [frame, x, y], axis-aligned and deliberately stop-start at 20fps on a 10Hz cadence, each entering from a different edge and leaving by a different route. Stamps are recomputed from the tracks every frame rather than accumulated, so the loop seam, a resize and a tab-resume all land on exactly the right residue. Transitions are free: the incoming pass starts twelve frames before the outgoing one ends, and the two sets of trails ARE the colour flood.',
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
