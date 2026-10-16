// Chain — photographs linked edge to edge in a zigzag, waving like bunting.
//
// The layout is the reference frame's own: each photo starts where the last
// one ends, sharing a vertical edge, the pair stepping up or down past each
// other. Where two photos meet is a JOINT, at the middle of the stretch of
// edge they share, and every photo is a rigid link that can only turn about
// its joints. That is the whole model: a chain of rigid links.
//
// The breeze is one wave run along the chain. Each link is turned by
//
//   θ_i = A · sin(phase − 2π·i / N)
//
// and the links are then laid end to end from a fixed joint in the middle,
// so every joint stays a joint however much the links turn — nothing is
// moved separately and nothing can come apart. With exactly one wavelength
// along the chain the turns sum to zero, so the two ends hold their places
// and the ripple runs through the middle, as bunting between two posts does.
//
// The pointer is the wind. Over the chain it pumps one damped "wind"
// number that raises both the wave's speed and its swing; away from it the
// wind drops back to a light breeze. The phase is accumulated rather than
// computed from time, so a change of speed never jumps the chain.
//
// Every length is a fraction of card height.

export const GROUND = '#efefef';   // the frame's ground, sampled
export const GRID = '#e5e5e5';     // its faint grid
export const GRID_CELL = 60 / 345; // one cell, of the chain's own height

// The chain as laid out in the reference, in its own pixels (it is 1272 by
// 345): top-left x, y and the size of each photo. Stand-in photos until the
// real ones are dropped into public/chain/ and listed here.
export const LINKS = [
  { src: '/post/rio.jpg', x: 0, y: 0, w: 105, h: 98 },
  { src: '/plate/iceberg-canyon.jpg', x: 105, y: 79, w: 67, h: 89 },
  { src: '/post/istanbul.jpg', x: 172, y: 152, w: 153, h: 69 },
  { src: '/post/cairo.jpg', x: 325, y: 66, w: 95, h: 120 },
  { src: '/post/london.jpg', x: 420, y: 169, w: 91, h: 128 },
  { src: '/post/paris.jpg', x: 511, y: 80, w: 89, h: 140 },
  { src: '/post/newyork.jpg', x: 600, y: 0, w: 145, h: 107 },
  { src: '/plate/bridal-veil.jpg', x: 745, y: 86, w: 93, h: 127 },
  { src: '/post/tokyo.jpg', x: 838, y: 0, w: 110, h: 150 },
  { src: '/plate/rocky-ford.jpg', x: 948, y: 146, w: 111, h: 136 },
  { src: '/post/sydney.jpg', x: 1059, y: 221, w: 124, h: 102 },
  { src: '/plate/carson-desert.jpg', x: 1183, y: 66, w: 78, h: 166 },
];
export const CHAIN_W = 1261;
export const CHAIN_H = 345;

export const FIT = 1.2;            // the chain spans this much of the card width;
                                   // past 1, its two ends run off the card

// The breeze.
export const SWAY_IDLE = 2.2;      // degrees of turn per link, light breeze
export const SWAY_WIND = 7;        // in full wind
export const SPEED_IDLE = 0.55;    // waves per second, light breeze
export const SPEED_WIND = 2.4;     // in full wind
export const WIND_RISE = 0.25;     // s, half-life of the wind getting up
export const WIND_FALL = 0.9;      // s, half-life of it dying down
export const HOVER_PAD = 0.04;     // slack round the chain that counts as on it
